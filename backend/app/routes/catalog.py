from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid
import logging

from ..config import RESEARCH_CATEGORIES
from ..store import insert_many
from ..services.research_client import api_client

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/categories")
async def get_research_categories():
    logger.info("Fetching research categories")
    return {"categories": RESEARCH_CATEGORIES}

@router.get("/search")
async def search_papers_enhanced(
    query: str,
    category: str | None = None,
    limit: int = 100,
    source: str = "arxiv",
    min_citations: int = 0,
    year_from: int | None = None,
    year_to: int | None = None,
):
    logger.info(f"Starting enhanced paper search - Query: '{query}', Source: {source}, Category: {category}, Limit: {limit}")
    logger.debug(f"Search filters - Min citations: {min_citations}, Year range: {year_from}-{year_to}")

    try:
        tasks, sources = [], []

        if source in ["all", "arxiv"]:
            logger.info("Adding ArXiv search to tasks")
            tasks.append(api_client.search_arxiv_enhanced(query, category, max_results=limit))
            sources.append('arxiv')

        if source in ["all", "openalex"]:
            logger.info("Adding OpenAlex search to tasks")
            tasks.append(api_client.search_openalex_enhanced(query, per_page=limit))
            sources.append('openalex')

        if source in ["all", "semantic_scholar"]:
            logger.info("Adding Semantic Scholar search to tasks")
            tasks.append(api_client.search_semantic_scholar_with_backoff(query, limit=limit))
            sources.append('semantic_scholar')

        logger.info(f"Executing {len(tasks)} search tasks for sources: {sources}")
        import asyncio
        results = await asyncio.gather(*tasks, return_exceptions=True)

        logger.info(f"Completed all search tasks, processing {len(results)} results")

        arxiv_papers, other_papers = [], []
        for src, res in zip(sources, results):
            if isinstance(res, Exception):
                logger.error(f"Error in {src} search: {res}")
                continue
            elif isinstance(res, list):
                paper_count = len(res)
                logger.info(f"Retrieved {paper_count} papers from {src}")
                (arxiv_papers if src == 'arxiv' else other_papers).extend(res)
            else:
                logger.warning(f"Unexpected result type from {src}: {type(res)}")

        logger.info(f"Total papers before filtering - ArXiv: {len(arxiv_papers)}, Others: {len(other_papers)}")

        def _filter(ps):
            return [
                p for p in ps
                if p.get('citationCount', 0) >= min_citations
                and (not year_from or p.get('year', 0) >= year_from)
                and (not year_to or p.get('year', 0) <= year_to)
            ]

        filtered_arxiv = _filter(arxiv_papers)
        filtered_others = _filter(other_papers)

        logger.info(f"Papers after filtering - ArXiv: {len(filtered_arxiv)}, Others: {len(filtered_others)}")

        filtered_others.sort(key=lambda x: (x.get('citationCount', 0), x.get('year', 0)), reverse=True)
        logger.debug("Sorted non-ArXiv papers by citation count and year")

        all_papers = filtered_arxiv + filtered_others

        logger.info(f"Starting deduplication process for {len(all_papers)} papers")
        unique, seen = [], set()
        for p in all_papers:
            title = (p.get('title', '') or '').lower().strip()
            title = title.replace('on the ', '').replace('a ', '').replace('the ', '')
            if title not in seen and len(title) > 10:
                unique.append(p)
                seen.add(title)

        logger.info(f"After deduplication: {len(unique)} unique papers remain")

        ts = datetime.now().isoformat()
        for i, p in enumerate(unique):
            p['search_query'] = query
            p['retrieved_at'] = ts
            p['_id'] = str(uuid.uuid4())
            p['relevance_rank'] = i + 1

        if unique:
            logger.info(f"Inserting {len(unique)} papers into database")
            await insert_many('papers', unique)
        else:
            logger.warning("No papers to insert into database")

        final_papers = unique[:limit]
        logger.info(f"Returning {len(final_papers)} papers (limited from {len(unique)} total)")

        return {
            "papers": final_papers,
            "total_found": len(unique),
            "sources_used": sources,
            "query": query,
            "filters": {"category": category, "min_citations": min_citations, "year_range": f"{year_from or 'any'}-{year_to or 'any'}"}
        }
    except Exception as e:
        logger.error(f"Enhanced search error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Enhanced search error: {str(e)}")