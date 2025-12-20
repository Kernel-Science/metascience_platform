from fastapi import APIRouter, HTTPException
import asyncio
router = APIRouter()
from ..services.research_client import api_client
from ..services.citation_network_core import CitationNetworkAnalyzer

SOURCE_MAP = {"s2": "semantic_scholar", "oa": "openalex", "oc": "opencitations"}

@router.get("/local-citation-network/v1/papers/{data_source}/{dois:path}")
async def get_citation_network(data_source: str, dois: str, cited: str = 'top', citing: str = 'top'):
    try:
        if data_source not in SOURCE_MAP:
            raise HTTPException(status_code=400, detail=f"Unsupported data source '{data_source}'. Supported: {list(SOURCE_MAP.keys())}")
        api_source = SOURCE_MAP[data_source]
        doi_list = [d.strip() for d in dois.split(',')]
        analyzer = CitationNetworkAnalyzer()

        seed_papers, references, citations = [], [], []
        if api_source == "opencitations":
            seed_papers = await api_client.open_citations_wrapper(doi_list)
        else:
            for doi in doi_list:
                paper = await api_client.get_paper_by_doi(doi, source=api_source)
                if paper:
                    seed_papers.append(paper)
                    paper_id = paper.get('paperId') or paper.get('id')
                    if cited != 'none':
                        ref_data = await api_client.fetch_paper_references(paper_id, source=api_source)
                        references.extend(ref_data.get('references', []))
                    if citing != 'none':
                        cit_data = await api_client.fetch_paper_citations(paper_id, source=api_source)
                        citations.extend(cit_data.get('citations', []))

        if not seed_papers:
            raise HTTPException(status_code=404, detail=f"No papers found for DOIs: {', '.join(doi_list)}")

        network = analyzer.analyze_network(seed_papers=seed_papers, references=references, citations=citations, cited_option=cited, citing_option=citing)
        return network
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Citation network generation error: {str(e)}")

@router.post("/citation-network")
async def post_citation_network(request: dict):
    try:
        doi = request.get('doi')
        if not doi:
            raise HTTPException(status_code=400, detail="DOI is required")
        max_references = request.get('max_references', 50)
        max_citations = request.get('max_citations', 50)
        data_source = request.get('data_source', 's2')
        source = SOURCE_MAP.get(data_source, "semantic_scholar")

        cited = 'none' if max_references == 0 else 'all' if max_references >= 1000 else 'top'
        citing = 'none' if max_citations == 0 else 'all' if max_citations >= 1000 else 'top'

        paper = await api_client.get_paper_by_doi(doi, source=source) or \
                await api_client.get_paper_by_doi(doi, source='semantic_scholar') or \
                await api_client.get_paper_by_doi(doi, source='openalex')

        if not paper:
            raise HTTPException(status_code=404, detail=f"Paper with DOI {doi} not found")

        paper_id = paper.get('paperId') or paper.get('id')
        if source == 'openalex' and paper_id and paper_id.startswith('https://openalex.org/'):
            paper_id = paper_id.replace('https://openalex.org/', '')

        refs = (await api_client.fetch_paper_references(paper_id, source=source)).get('references', [])
        cits = (await api_client.fetch_paper_citations(paper_id, source=source)).get('citations', [])

        analyzer = CitationNetworkAnalyzer()
        network_result = analyzer.analyze_network(seed_papers=[paper], references=refs, citations=cits, cited_option=cited, citing_option=citing)

        seed_paper_id = paper.get('paperId') or paper.get('id')
        return {
            'success': True,
            'data': {
                'papers': network_result.get('nodes', []),
                'network': {'nodes': network_result.get('nodes', []), 'edges': network_result.get('edges', [])},
                'seed_paper_ids': [seed_paper_id],
                'stats': network_result.get('stats', {})
            }
        }
    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        return {'success': False, 'error': str(e)}

@router.post("/citation-network-multiple")
async def post_citation_network_multiple(request: dict):
    try:
        dois = request.get('dois')
        if not dois or not isinstance(dois, list):
            raise HTTPException(status_code=400, detail="DOIs list is required")
        valid_dois = [d.strip() for d in dois if d and d.strip()]
        if not valid_dois:
            raise HTTPException(status_code=400, detail="At least one valid DOI is required")

        max_references = request.get('max_references', 25)
        max_citations = request.get('max_citations', 25)
        data_source = request.get('data_source', 's2')
        source = SOURCE_MAP.get(data_source, 'semantic_scholar')

        cited = 'none' if max_references == 0 else 'all' if max_references >= 1000 else 'top'
        citing = 'none' if max_citations == 0 else 'all' if max_citations >= 1000 else 'top'

        # OPTIMIZATION: Parallel paper fetching with fallback sources
        async def fetch_paper_with_fallback(doi):
            paper = await api_client.get_paper_by_doi(doi, source=source)
            if not paper:
                paper = await api_client.get_paper_by_doi(doi, source='semantic_scholar')
            if not paper:
                paper = await api_client.get_paper_by_doi(doi, source='openalex')
            return (doi, paper)

        paper_tasks = [fetch_paper_with_fallback(doi) for doi in valid_dois]
        paper_results = await asyncio.gather(*paper_tasks, return_exceptions=True)

        seed_papers, failed_dois = [], []
        for doi, result in paper_results:
            if isinstance(result, Exception):
                failed_dois.append(doi)
            elif result[1]:  # paper exists
                seed_papers.append(result[1])
            else:
                failed_dois.append(doi)

        if not seed_papers:
            raise HTTPException(status_code=404, detail=f"No papers found for provided DOIs")

        # OPTIMIZATION: Parallel references and citations fetching
        async def fetch_refs_cits(paper):
            pid = paper.get('paperId') or paper.get('id')
            if not pid:
                return ([], [], pid)

            src = source
            if src == 'openalex' and isinstance(pid, str) and pid.startswith('https://openalex.org/'):
                pid = pid.replace('https://openalex.org/', '')

            refs_result = await api_client.fetch_paper_references(pid, source=src)
            cits_result = await api_client.fetch_paper_citations(pid, source=src)

            refs = refs_result.get('references', [])
            cits = cits_result.get('citations', [])

            # OpenAlex fallback to S2 if empty
            if len(refs) == 0 and len(cits) == 0 and src == 'openalex' and paper.get('doi'):
                sp = await api_client.get_paper_by_doi(paper['doi'], source='semantic_scholar')
                if sp and sp.get('paperId'):
                    s2id = sp['paperId']
                    refs_result = await api_client.fetch_paper_references(s2id, source='semantic_scholar')
                    cits_result = await api_client.fetch_paper_citations(s2id, source='semantic_scholar')
                    refs = refs_result.get('references', [])
                    cits = cits_result.get('citations', [])

            return (refs[:max_references], cits[:max_citations], pid)

        fetch_tasks = [fetch_refs_cits(paper) for paper in seed_papers]
        fetch_results = await asyncio.gather(*fetch_tasks, return_exceptions=True)

        all_refs, all_cits, seed_ids = [], [], []
        for result in fetch_results:
            if not isinstance(result, Exception):
                refs, cits, pid = result
                all_refs.extend(refs)
                all_cits.extend(cits)
                if pid:
                    seed_ids.append(pid)

        # deduplicate
        def uniq(items):
            seen, res = set(), []
            for x in items:
                xid = x.get('doi') or x.get('id') or x.get('paperId')
                if xid and xid not in seen:
                    seen.add(xid); res.append(x)
            return res

        unique_refs = uniq(all_refs)
        unique_cits = uniq(all_cits)

        analyzer = CitationNetworkAnalyzer()
        network = analyzer.analyze_network(seed_papers=seed_papers, references=unique_refs, citations=unique_cits, cited_option=cited, citing_option=citing)

        return {
            'success': True,
            'data': {
                'papers': network.get('nodes', []),
                'network': {'nodes': network.get('nodes', []), 'edges': network.get('edges', [])},
                'seed_paper_ids': seed_ids,
                'stats': {
                    'total_papers': len(network.get('nodes', [])),
                    'total_connections': len(network.get('edges', [])),
                    'seed_papers_found': len(seed_papers),
                    'seed_papers_requested': len(valid_dois),
                    'failed_dois': failed_dois
                }
            },
            'message': f'Combined citation network generated successfully for {len(seed_papers)}/{len(valid_dois)} papers'
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")