import httpx
import asyncio
import sys
import hashlib
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
from typing import List, Dict, Any, Union
from app.core.exceptions import safe_execution


try:
    import arxiv
    logger.info("arxiv package is installed successfully")
except ImportError as e:
    logger.error(f"arxiv package import failed: {e}")
    arxiv = None

class AdvancedResearchAPIClient:
    def __init__(self):
        self.httpx_client = httpx.AsyncClient(timeout=30.0)  # Reduced from 60s
        # OPTIMIZATION: In-memory cache with TTL
        self._cache = {}
        self._cache_ttl = 3600  # 1 hour TTL

    def _get_cache_key(self, *args) -> str:
        """Generate cache key from arguments"""
        return hashlib.md5(str(args).encode()).hexdigest()

    def _get_from_cache(self, key: str):
        """Get value from cache if not expired"""
        if key in self._cache:
            data, timestamp = self._cache[key]
            if datetime.now().timestamp() - timestamp < self._cache_ttl:
                return data
            # Expired - remove from cache
            del self._cache[key]
        return None

    def _set_cache(self, key: str, data):
        """Store value in cache with timestamp"""
        self._cache[key] = (data, datetime.now().timestamp())

    @safe_execution("look up citation count", default_val=0)
    async def _get_citation_count_for_arxiv(self, arxiv_id: str, title: str) -> int:
        """Fetch citation count for an ArXiv paper using Semantic Scholar API"""
        try:
            # Increase rate limiting to avoid API throttling
            await asyncio.sleep(0.5)  # Increased from 0.1s

            # First try by ArXiv ID
            url = f"https://api.semanticscholar.org/graph/v1/paper/ARXIV:{arxiv_id}"
            params = {"fields": "citationCount"}

            try:
                r = await self.httpx_client.get(url, params=params)
                if r.status_code == 200:
                    data = r.json()
                    citation_count = data.get('citationCount', 0)
                    if citation_count > 0:
                        logger.info(f"Found {citation_count} citations for {arxiv_id}")
                        return citation_count
                elif r.status_code == 429:
                    logger.warning(f"Rate limited for {arxiv_id}, waiting longer...")
                    await asyncio.sleep(2.0)
                else:
                    logger.warning(f"ArXiv ID lookup failed for {arxiv_id}: {r.status_code}")
            except Exception as e:
                logger.error(f"ArXiv ID lookup error for {arxiv_id}: {e}")

            # If ArXiv ID doesn't work, try by title search with longer delay
            await asyncio.sleep(0.5)
            search_url = "https://api.semanticscholar.org/graph/v1/paper/search"
            # Clean and truncate title for better search
            clean_title = title.replace('\n', ' ').strip()[:100]
            search_params = {"query": clean_title, "limit": 3, "fields": "citationCount,title,arxivId"}

            try:
                search_r = await self.httpx_client.get(search_url, params=search_params)
                if search_r.status_code == 200:
                    search_data = search_r.json()
                    results = search_data.get("data", [])

                    for result in results:
                        result_title = result.get('title', '').lower()
                        result_arxiv = result.get('arxivId', '')

                        # Match by ArXiv ID or title similarity
                        if (result_arxiv == arxiv_id or
                            (len(result_title) > 20 and
                             (clean_title.lower()[:50] in result_title or
                              result_title[:50] in clean_title.lower()))):
                            citation_count = result.get('citationCount', 0)
                            if citation_count > 0:
                                logger.info(f"Found {citation_count} citations via title search for {arxiv_id}")
                            return citation_count
                elif search_r.status_code == 429:
                    logger.warning(f"Rate limited on title search for {arxiv_id}")
                    await asyncio.sleep(2.0)
                else:
                    logger.warning(f"Title search failed for {arxiv_id}: {search_r.status_code}")
            except Exception as e:
                logger.error(f"Title search error for {arxiv_id}: {e}")

        except Exception as e:
            logger.error(f"Citation lookup failed for {arxiv_id}: {e}")

        return 0

    @safe_execution("search enhanced arxiv", default_val=[])
    async def search_arxiv_enhanced(self, query: str, category: str | None = None, max_results: int= 0) -> List[Dict]:
        if not arxiv:
            return []
        try:
            # If query is in 'author:"Name"' format, convert to arxiv format 'au:"Name"'
            if query.strip().startswith("author:"):
                author_name = query.split(":", 1)[1].strip().strip('"')
                q = f'au:"{author_name}"'
            else:
                category_map = {
                    'physics': 'physics',
                    'computer_science': 'cs',
                    'mathematics': 'math',
                    'biology': 'q-bio',
                    'chemistry': 'physics.chem-ph',
                    'engineering': 'eess',
                    'medicine': 'q-bio',  # Medical papers often in q-bio
                    'biomedical': 'q-bio'
                }
                if category:
                    arxiv_cat = category_map.get(category, category)
                    
                    # Smart category selection for interdisciplinary topics
                    # NOTE: ArXiv requires space (not AND) between category and query for OR operators to work
                    if "quantum" in query.lower() and arxiv_cat in ["cs", "physics"]:
                        q = f"(cat:cs OR cat:quant-ph) {query}"
                    elif "machine learning" in query.lower() and "cancer" in query.lower():
                        # Cancer detection with ML spans multiple categories
                        q = f"(cat:cs OR cat:q-bio OR cat:eess.IV) {query}"
                    elif "machine learning" in query.lower() and arxiv_cat == "cs":
                        # ML papers can be in cs.LG, cs.AI, stat.ML
                        q = f"(cat:cs.LG OR cat:cs.AI OR cat:stat.ML) {query}"
                    elif category == "biology" or "cancer" in query.lower() or "medical" in query.lower():
                        # Biological/medical topics
                        q = f"(cat:q-bio OR cat:physics.med-ph) {query}"
                    else:
                        q = f"cat:{arxiv_cat} {query}"
                else:
                    # No category specified - search broadly
                    # NOTE: ArXiv requires space (not AND) between category and query for OR operators to work
                    if "quantum" in query.lower():
                        q = f"(cat:quant-ph OR cat:cs.ET OR cat:physics.atom-ph) {query}"
                    elif "machine learning" in query.lower():
                        q = f"(cat:cs.LG OR cat:cs.AI OR cat:stat.ML) {query}"
                    elif any(term in query.lower() for term in ["cancer", "medical", "disease", "diagnosis"]):
                        q = f"(cat:q-bio OR cat:physics.med-ph OR cat:cs.CV) {query}"
                    else:
                        q = query

            # Add logging to debug category issues
            logger.info(f"ArXiv query constructed: {q}")

            search = arxiv.Search(
                query=q,
                max_results=max_results,
                sort_by=arxiv.SortCriterion.Relevance,
                sort_order=arxiv.SortOrder.Descending
            )
            client = arxiv.Client()
            papers = []
            for result in client.results(search):
                doi = getattr(result, "doi", None)
                if not doi and getattr(result, "journal_ref", None):
                    doi = self._extract_doi_from_text(result.journal_ref)
                if not doi and getattr(result, "comment", None):
                    doi = self._extract_doi_from_text(result.comment)

                arxiv_id = result.get_short_id()

                # FAST MODE: Don't fetch citations during search, return papers immediately
                # Citations will be estimated or fetched later in background
                estimated_citations = self._estimate_citations(result)

                papers.append({
                    'id': arxiv_id,
                    'arxiv_id': arxiv_id,
                    'doi': doi,
                    'title': result.title,
                    'authors': [a.name for a in result.authors],
                    'abstract': result.summary,
                    'published': result.published.isoformat() if result.published else '',
                    'updated': result.updated.isoformat() if result.updated else '',
                    'categories': result.categories,
                    'pdf_url': result.pdf_url,
                    'abs_url': result.entry_id,
                    'journal_ref': getattr(result, 'journal_ref', None),
                    'comment': getattr(result, 'comment', None),
                    'source': 'arxiv',
                    'source_name': 'ArXiv',
                    'venue': result.journal_ref if getattr(result, 'journal_ref', None) else 'ArXiv Preprints',
                    'year': result.published.year if result.published else 0,
                    'citationCount': estimated_citations,  # Use estimation instead of API calls
                    'isOpenAccess': True,
                    'fieldsOfStudy': result.categories,
                    'publicationTypes': ['Preprint'] if not getattr(result, 'journal_ref', None) else ['Article', 'Preprint'],
                    'citation_fetched': False,  # Mark as estimated
                })
            return papers
        except Exception as e:
            logger.error(f"ArXiv error: {e}")
            return []

    def _extract_doi_from_text(self, text: str | None) -> str | None:
        if not text:
            return None
        import re
        patterns = [
            r'10\.\d{4,9}/[-._;()/:\w]+',
            r'https?://doi\.org/10\.\d{4,9}/[-._;()/:\w]+',
            r'(?:doi:|DOI:)\s*10\.\d{4,9}/[-._;()/:\w]+',
        ]
        for p in patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m:
                doi = m.group()
                return re.sub(r'^(doi:|DOI:|https?://doi\.org/)', '', doi, flags=re.IGNORECASE).strip()
        return None

    def _estimate_citations(self, result) -> int:
        """Fast citation estimation based on paper characteristics"""
        try:
            import datetime

            # Base score
            score = 0

            # Age factor (older papers tend to have more citations)
            if result.published:
                age_years = (datetime.datetime.now() - result.published).days / 365.25
                if age_years > 5:
                    score += min(int(age_years * 2), 20)
                elif age_years > 2:
                    score += int(age_years * 5)

            # Journal publication boost
            if hasattr(result, 'journal_ref') and result.journal_ref:
                score += 15
                # High-impact journal indicators
                journal_ref = result.journal_ref.lower()
                if any(term in journal_ref for term in ['nature', 'science', 'cell', 'nejm', 'lancet']):
                    score += 50
                elif any(term in journal_ref for term in ['ieee', 'acm', 'pnas', 'jama']):
                    score += 25

            # Field-based estimation
            categories = getattr(result, 'categories', [])
            if categories:
                cat_str = ' '.join(categories).lower()
                # ML/AI papers tend to get more citations
                if any(term in cat_str for term in ['cs.lg', 'cs.ai', 'stat.ml']):
                    score += 10
                # Medical/bio papers
                elif any(term in cat_str for term in ['q-bio', 'physics.med-ph']):
                    score += 8
                # Physics papers
                elif 'physics' in cat_str:
                    score += 5

            # Title analysis for trendy topics
            title_lower = result.title.lower()
            if any(term in title_lower for term in ['deep learning', 'neural network', 'transformer', 'covid', 'cancer']):
                score += 10

            return max(0, score)

        except Exception:
            return 0

    @safe_execution("search enhanced openalex", default_val=[])
    async def search_openalex_enhanced(self, query: str, per_page: int = 20) -> List[Dict]:
        try:
            url = "https://api.openalex.org/works"
            params = {"search": query, "per-page": per_page, "sort": "publication_date:desc", "filter": "type:article"}
            r = await self.httpx_client.get(url, params=params)
            if r.status_code == 200:
                return self._parse_openalex(r.json().get("results", []))
        except Exception as e:
            logger.error(f"OpenAlex error: {e}")
        return []

    @safe_execution("search semantic scholar", default_val=[])
    async def search_semantic_scholar_with_backoff(self, query: str, limit: int = 10) -> List[Dict]:
        try:
            await asyncio.sleep(1.5)
            url = "https://api.semanticscholar.org/graph/v1/paper/search"
            params = {"query": query, "limit": limit,
                      "fields": "paperId,title,authors,year,citationCount,referenceCount,abstract,venue,fieldsOfStudy"}
            r = await self.httpx_client.get(url, params=params)
            if r.status_code == 200:
                return self._parse_s2(r.json().get("data", []))
        except Exception as e:
            logger.error(f"S2 error: {e}")
        return []

    async def fetch_paper_citations(self, paper_id: str, source: str = "semantic_scholar") -> Dict[str, Any]:
        # OPTIMIZATION: Check cache first
        cache_key = self._get_cache_key('cits', paper_id, source)
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached

        result = {"citations": [], "total": 0}
        try:
            if source == "semantic_scholar":
                url = f"https://api.semanticscholar.org/graph/v1/paper/{paper_id}/citations"
                params = {"fields": "paperId,title,authors,year,citationCount,abstract,venue", "limit": 50}
                r = await self.httpx_client.get(url, params=params)
                if r.status_code == 200:
                    data = r.json()
                    result = {"citations": [d.get("citingPaper", {}) for d in data.get("data", [])],
                            "total": len(data.get("data", []))}
            elif source == "openalex":
                work_id = paper_id.replace('https://openalex.org/', '') if paper_id.startswith('https://openalex.org/') else paper_id
                meta = await self.httpx_client.get(
                    f"https://api.openalex.org/works/{work_id}",
                    params={"select": "cited_by_api_url,cited_by_count"}
                )
                if meta.status_code == 200:
                    j = meta.json()
                    url = j.get("cited_by_api_url")
                    if url and j.get("cited_by_count", 0) > 0:
                        cr = await self.httpx_client.get(f"{url}?per-page=50")
                        if cr.status_code == 200:
                            res = cr.json().get("results", [])
                            result = {"citations": self._parse_openalex(res), "total": len(res)}
        except Exception as e:
            logger.error(f"Citations fetch error: {e}")

        # Cache the result
        self._set_cache(cache_key, result)
        return result

    async def fetch_paper_references(self, paper_id: str, source: str = "semantic_scholar") -> Dict[str, Any]:
        # OPTIMIZATION: Check cache first
        cache_key = self._get_cache_key('refs', paper_id, source)
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached

        result = {"references": [], "count": 0}
        if source == "semantic_scholar":
            url = f"https://api.semanticscholar.org/graph/v1/paper/{paper_id}/references"
            params = {"fields": "paperId,title,authors,year,journal,venue", "limit": 1000}
            r = await self.httpx_client.get(url, params=params)
            if r.status_code == 200:
                data = r.json()
                refs = data.get("data") or []
                result = {"references": [d.get("citedPaper", {}) for d in refs], "count": len(refs)}

        # Cache the result
        self._set_cache(cache_key, result)
        return result

    async def get_paper_by_doi(self, doi: str, source: str = "semantic_scholar") -> Dict[str, Any]:
        # OPTIMIZATION: Check cache first
        cache_key = self._get_cache_key('doi', doi, source)
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached

        clean = self._clean_doi(doi)
        result = {}
        try:
            if source == "semantic_scholar":
                url = f"https://api.semanticscholar.org/graph/v1/paper/DOI:{clean}"
                params = {"fields": "paperId,title,authors,year,citationCount,referenceCount,abstract,venue,fieldsOfStudy,url"}
                r = await self.httpx_client.get(url, params=params)
                if r.status_code == 200:
                    data = r.json()
                    if data and data.get("paperId"):
                        result = self._parse_s2([data])[0]
            elif source == "openalex":
                url = f"https://api.openalex.org/works/doi:{clean}"
                r = await self.httpx_client.get(url)
                if r.status_code == 200:
                    result = self._parse_openalex([r.json()])[0]
        except Exception as e:
            logger.error(f"DOI fetch error: {e}")

        # Cache the result (even if empty to avoid repeated failed lookups)
        self._set_cache(cache_key, result)
        return result

    def _clean_doi(self, doi: str) -> str:
        d = doi.strip()
        for prefix in ("https://doi.org/", "http://doi.org/", "doi:"):
            if d.lower().startswith(prefix):
                return d[len(prefix):]
        return d

    def _parse_openalex(self, results: List[Dict]) -> List[Dict]:
        papers: List[Dict] = []
        for item in results:
            try:
                authors = [a['author'].get('display_name', 'Unknown') for a in item.get('authorships', []) if a.get('author')]
                venue = item.get('primary_location', {}).get('source', {}).get('display_name', 'Unknown Venue')
                abstract = ""
                if 'abstract_inverted_index' in item:
                    inv = item['abstract_inverted_index']
                    word_positions = sorted((pos, word) for word, poses in inv.items() for pos in poses)
                    abstract = ' '.join(word for _, word in word_positions) or "Abstract not available"
                concepts = [c.get('display_name', '') for c in item.get('concepts', [])[:5]]
                papers.append({
                    'id': item.get('id', ''),
                    'title': item.get('display_name', 'Untitled'),
                    'authors': authors or ['Unknown authors'],
                    'abstract': abstract,
                    'year': item.get('publication_year', 0),
                    'published': item.get('publication_date', ''),
                    'citationCount': item.get('cited_by_count', 0),
                    'venue': venue,
                    'source': 'openalex',
                    'source_name': 'OpenAlex',
                    'concepts': concepts,
                    'type': item.get('type', 'article'),
                    'doi': item.get('doi', ''),
                    'url': item.get('id', '')
                })
            except:
                continue
        return papers

    def _parse_s2(self, results: List[Dict]) -> List[Dict]:
        papers: List[Dict] = []
        for item in results:
            try:
                authors = [a.get('name', 'Unknown') for a in item.get('authors', [])]
                papers.append({
                    'id': item.get('paperId') or item.get('doi'),
                    'paperId': item.get('paperId'),
                    'doi': item.get('doi'),
                    'title': item.get('title', 'Untitled'),
                    'authors': [{'name': name} for name in authors] or [{'name': 'Unknown authors'}],
                    'abstract': item.get('abstract', 'No abstract available'),
                    'year': item.get('year', 0),
                    'citationCount': item.get('citationCount', 0),
                    'referenceCount': item.get('referenceCount', 0),
                    'venue': item.get('venue', 'Unknown Venue'),
                    'source': 'semantic_scholar',
                    'source_name': 'Semantic Scholar',
                    'fieldsOfStudy': item.get('fieldsOfStudy', []),
                    'url': f"https://www.semanticscholar.org/paper/{item.get('paperId', '')}"
                })
            except:
                continue
        return papers

    async def open_citations_wrapper(self, ids: List[str]) -> List[Dict]:
        try:
            url = "https://opencitations.net/index/api/v1/metadata"
            payload = ', '.join(ids)
            headers = {'Content-Type': 'text/plain'}
            r = await self.httpx_client.post(url, content=payload, headers=headers)
            if r.status_code == 200:
                return self._parse_open_citations_response(r.json())
        except Exception as e:
            logger.error(f"OpenCitations error: {e}")
        return []

    def _parse_open_citations_response(self, results: List[Dict]) -> List[Dict]:
        papers: List[Dict] = []
        for item in results:
            try:
                authors = []
                if item.get('author'):
                    for author_str in item['author'].split('; '):
                        parts = author_str.split(', ')
                        authors.append({'name': f"{parts[1]} {parts[0]}"} if len(parts) == 2 else {'name': author_str})
                papers.append({
                    'id': item.get('doi'),
                    'doi': item.get('doi'),
                    'title': item.get('title', 'Untitled'),
                    'authors': authors,
                    'year': int(item.get('year')) if item.get('year') else 0,
                    'venue': item.get('source_title', 'Unknown Venue'),
                    'source': 'opencitations',
                    'source_name': 'OpenCitations',
                    'citationCount': 0
                })
            except:
                continue
        return papers

    async def batch_update_citations(self, papers: List[Dict]) -> List[Dict]:
        """Update citation counts for a batch of papers in parallel"""
        print(f"🔄 Starting batch citation update for {len(papers)} papers...")

        async def update_paper(idx, paper):
            try:
                arxiv_id = paper.get('arxiv_id') or paper.get('id')
                title = paper.get('title', '')
                paper_updated = paper.copy()

                # Add some spread to requests
                await asyncio.sleep(0.1 * (idx % 10))

                if arxiv_id and paper.get('source') == 'arxiv':
                    new_count = await self._get_citation_count_for_arxiv(arxiv_id, title)
                    paper_updated['citationCount'] = new_count
                elif paper.get('paperId') and paper.get('source') == 'semantic_scholar':
                    url = f"https://api.semanticscholar.org/graph/v1/paper/{paper['paperId']}"
                    r = await self.httpx_client.get(url, params={"fields": "citationCount"})
                    if r.status_code == 200:
                        paper_updated['citationCount'] = r.json().get('citationCount', 0)

                return paper_updated
            except Exception as e:
                logger.error(f"Error updating paper {idx+1}: {e}")
                return paper

        tasks = [update_paper(i, p) for i, p in enumerate(papers)]
        updated_papers = await asyncio.gather(*tasks)

        # Statistics
        total_cits = sum(p.get('citationCount', 0) for p in updated_papers)
        count_with_cits = len([p for p in updated_papers if p.get('citationCount', 0) > 0])

        logger.info(f"Batch update complete: {count_with_cits} papers with citations, {total_cits} total.")
        return updated_papers

api_client = AdvancedResearchAPIClient()