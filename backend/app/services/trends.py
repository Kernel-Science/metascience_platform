import json
import asyncio
from typing import List, Dict, Any
from collections import Counter
from datetime import datetime
from anthropic import Anthropic
from ..config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL
import logging

anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedTrendAnalyzer:
    async def _enrich_papers_with_citations(self, papers: List[Dict]) -> List[Dict]:
        """Enrich papers with real citation counts from Semantic Scholar in parallel"""
        import httpx

        async with httpx.AsyncClient(timeout=30.0) as client:
            async def get_citations(idx, paper):
                if paper.get('citationCount', 0) > 0 and paper.get('citation_fetched', False):
                    return paper.copy()

                citation_count = 0
                paper_id = None
                doi = paper.get('doi')
                arxiv_id = paper.get('arxiv_id') or paper.get('id')

                # Helper for fetching from Semantic Scholar
                async def fetch(identifier_type, identifier):
                    nonlocal citation_count, paper_id
                    try:
                        # Add jittered delay to avoid synchronized bursts
                        await asyncio.sleep(0.1 * (idx % 5))
                        url = f"https://api.semanticscholar.org/graph/v1/paper/{identifier_type}:{identifier}"
                        resp = await client.get(url, params={"fields": "citationCount,paperId"})
                        if resp.status_code == 200:
                            data = resp.json()
                            citation_count = data.get('citationCount', 0)
                            paper_id = data.get('paperId')
                            return True
                        elif resp.status_code == 429:
                            await asyncio.sleep(1.0) # Backoff
                    except Exception:
                        pass
                    return False

                # 1. Try DOI
                if doi:
                    if await fetch("DOI", doi):
                        logger.info(f"✅ [{idx+1}] Found {citation_count} citations for DOI {doi}")
                
                # 2. Try ArXiv if DOI failed
                if citation_count == 0 and arxiv_id:
                    if await fetch("ARXIV", arxiv_id):
                        logger.info(f"✅ [{idx+1}] Found {citation_count} citations for ArXiv {arxiv_id}")

                enriched = paper.copy()
                enriched.update({
                    'citationCount': citation_count,
                    'citation_fetched': True,
                    'paperId': paper_id or enriched.get('paperId')
                })
                return enriched

            # Run all enrichments in parallel
            tasks = [get_citations(i, p) for i, p in enumerate(papers)]
            enriched_papers = await asyncio.gather(*tasks)

        total_found = sum(1 for p in enriched_papers if p.get('citationCount', 0) > 0)
        logger.info(f"📊 Successfully enriched {total_found}/{len(papers)} papers with real citation data")
        return enriched_papers

    async def analyze_comprehensive_trends(self, papers: List[Dict]) -> Dict[str, Any]:
        try:
            # Enrich papers with real citation counts first
            logger.info(f"🔍 Enriching {len(papers)} papers with citation data...")
            papers = await self._enrich_papers_with_citations(papers)

            # Build stats
            paper_summaries, authors_list, concepts_list, years, venues, citations = [], [], [], [], [], []
            top = sorted(papers, key=lambda x: x.get('citationCount', 0), reverse=True)[:10]
            for p in top:
                title = (p.get('title') or '').strip()
                abstract = (p.get('abstract') or '').strip()[:300]
                if title and len(title) > 10:
                    paper_summaries.append({
                        "title": title,
                        "abstract": abstract or "No abstract",
                        "year": p.get('year', 0),
                        "authors": p.get('authors', [])[:3],
                        "venue": p.get('venue', ''),
                        "citations": p.get('citationCount', 0),
                        "concepts": p.get('concepts', [])[:3],
                    })

            for p in papers:
                # Extract author names from dict or use string directly
                for a in p.get('authors', []):
                    if isinstance(a, dict):
                        name = a.get('name', '')
                    else:
                        name = str(a) if a else ''
                    if name and name != 'Unknown authors':
                        authors_list.append(name)
                concepts_list.extend([c for c in p.get('concepts', []) if c])
                y = p.get('year', 0)
                if y > 1900:
                    years.append(y)
                v = p.get('venue', '')
                if v and v != 'Unknown Venue':
                    venues.append(v)

                # Extract citation count directly from paper data (same as citation analysis)
                citation_count = p.get('citationCount', 0)
                citations.append(citation_count)

            stats = {
                "total_papers": len(papers),
                "processed_papers": len(paper_summaries),
                "year_range": {"min": min(years or [0]), "max": max(years or [0])},
                "avg_citations": sum(citations) / len(citations) if citations else 0,
                "median_citations": sorted(citations)[len(citations)//2] if citations else 0,
                "max_citations": max(citations) if citations else 0,
                "total_citations": sum(citations),
                "top_authors": Counter(authors_list).most_common(15),
                "top_venues": Counter(venues).most_common(15),
                "top_concepts": Counter(concepts_list).most_common(15),
                "yearly_distribution": dict(Counter(years).most_common()),
                "highly_cited_papers": len([c for c in citations if c > 100]),
                "recent_papers": len([y for y in years if y >= 2020]),
                "papers_with_citations": len([c for c in citations if c > 0]),
                "citation_distribution": {
                    "0_citations": len([c for c in citations if c == 0]),
                    "1_10_citations": len([c for c in citations if 1 <= c <= 10]),
                    "11_50_citations": len([c for c in citations if 11 <= c <= 50]),
                    "51_100_citations": len([c for c in citations if 51 <= c <= 100]),
                    "100_plus_citations": len([c for c in citations if c > 100])
                }
            }

            # AI analysis with Anthropic Claude 4.5 Sonnet
            ai_analysis: Dict[str, Any] = {}
            try:
                prompt = (
                    "Analyze the following papers and statistics and output ONLY valid JSON with keys: "
                    "emerging_trends (array of strings), key_research_themes (array), notable_findings (array), "
                    "research_evolution (string), high_impact_areas (string), future_directions (array).\n\n"
                    f"PAPERS:\n{json.dumps(paper_summaries, ensure_ascii=False)}\n\n"
                    f"STATS:\n{json.dumps({k: (v if k != 'top_authors' and k != 'top_venues' and k != 'top_concepts' else [x[0] for x in v[:5]]) for k, v in stats.items()}, ensure_ascii=False)}\n"
                )
                logger.info(f"Trend analysis prompt: {prompt}")
                def _call():
                    return anthropic_client.messages.create(
                        model=ANTHROPIC_MODEL,
                        max_tokens=1200,
                        temperature=0.1,
                        messages=[{"role": "user", "content": prompt}]
                    )
                resp = await asyncio.to_thread(_call)
                logger.info(f"Anthropic raw response: {resp}")
                text = "".join(b.text for b in resp.content if b.type == "text")
                logger.info(f"Anthropic text block: {text}")

                # Strip markdown code blocks if present
                if text:
                    text = text.strip()
                    if text.startswith("```json"):
                        text = text[7:]  # Remove ```json
                    elif text.startswith("```"):
                        text = text[3:]  # Remove ```
                    if text.endswith("```"):
                        text = text[:-3]  # Remove trailing ```
                    text = text.strip()

                ai_analysis = json.loads(text) if text else {"error": "Empty response"}
            except Exception as e:
                ai_analysis = {
                    "fallback_mode": True,
                    "emerging_trends": [c for c, _ in stats["top_concepts"][:3]],
                    "key_research_themes": [c for c, _ in stats["top_concepts"][:5]],
                    "notable_findings": [
                        f"Most cited paper has {stats['max_citations']} citations",
                        f"Year span {stats['year_range']['min']}-{stats['year_range']['max']}",
                        f"Published across {len(set([v for v, _ in stats['top_venues']]))} top venues"
                    ]
                }

            return {
                "ai_analysis": ai_analysis,
                "statistics": stats,
                "paper_count": len(papers),
                "processed_count": len(paper_summaries),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Trend analysis error: {e}")
            return {"error": str(e)}

trend_analyzer = EnhancedTrendAnalyzer()