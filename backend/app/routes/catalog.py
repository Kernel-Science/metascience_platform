from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
import logging

from ..config import RESEARCH_CATEGORIES
from ..store import insert_many
from ..services.search.schema import SearchIntent
from ..services.search.orchestrator import run_search

router = APIRouter()
logger = logging.getLogger(__name__)

# Frontend "source" values -> connector source ids. semantic_scholar has no
# dedicated connector yet, so it falls through to the full multi-source set.
_SOURCE_MAP = {"arxiv": "arxiv", "openalex": "openalex", "inspire": "inspire", "ads": "ads"}


@router.get("/categories")
async def get_research_categories():
    logger.info("Fetching research categories")
    return {"categories": RESEARCH_CATEGORIES}


async def _persist(papers: List[Dict[str, Any]], query: str) -> None:
    """Tag + store papers (best effort; never fails the request)."""
    if not papers:
        return
    ts = datetime.now().isoformat()
    for i, p in enumerate(papers):
        p["search_query"] = query
        p["retrieved_at"] = ts
        p.setdefault("_id", str(uuid.uuid4()))
        p["relevance_rank"] = p.get("relevance_rank", i + 1)
    try:
        await insert_many("papers", papers)
    except Exception as e:  # noqa: BLE001
        logger.warning("persist failed: %s", e)


def _response(query: str, result: Dict[str, Any], filters: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "papers": result["papers"],
        "total_found": result["total_found"],
        "returned": result["returned"],
        "offset": result.get("offset", 0),
        "has_more": result.get("has_more", False),
        "sources_used": result["sources_used"],
        "reranked": result["reranked"],
        "errors": result["errors"],
        "query": query,
        "filters": filters,
        "intent": result["intent"],
    }


@router.get("/search")
async def search_papers(
    query: str,
    category: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    source: str = "all",
    min_citations: int = 0,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
):
    """Back-compat search: builds a basic intent from flat params and runs the
    full multi-source + dedup + rerank pipeline. The advanced path is POST.
    `offset` pages through the cached ranking ("load more")."""
    intent = SearchIntent(
        topics=[query] if query else [],
        canonical_query=query,
        field=category if category in RESEARCH_CATEGORIES else None,
        date_from=f"{year_from}-01-01" if year_from else None,
        date_to=f"{year_to}-12-31" if year_to else None,
        min_citations=min_citations or None,
        sort="relevance",
    )
    sources = None if source in (None, "", "all") else [_SOURCE_MAP.get(source, source)]
    try:
        result = await run_search(intent, limit=limit, offset=offset, sources=sources)
    except Exception as e:  # noqa: BLE001
        logger.error("Search failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

    if offset == 0:
        await _persist(result["papers"], query)
    return _response(
        query,
        result,
        {
            "category": category,
            "min_citations": min_citations,
            "year_range": f"{year_from or 'any'}-{year_to or 'any'}",
            "source": source,
        },
    )


@router.post("/search")
async def search_papers_advanced(request: Dict[str, Any]):
    """Advanced search: accepts a full structured ``intent`` so precise queries
    (boolean terms, authors, arXiv categories, dates, sort) survive end-to-end.

    Body: {"intent": {...SearchIntent...}, "limit": int, "sources": [ids]}.
    Falls back to a flat ``query`` field if no intent is supplied.
    """
    intent_data = request.get("intent")
    try:
        if intent_data:
            intent = SearchIntent(**intent_data)
        else:
            q = (request.get("query") or "").strip()
            intent = SearchIntent(topics=[q] if q else [], canonical_query=q)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Invalid intent: {str(e)}")

    limit = int(request.get("limit", 100))
    offset = int(request.get("offset", 0))
    sources = request.get("sources") or None
    if isinstance(sources, list):
        sources = [_SOURCE_MAP.get(s, s) for s in sources]

    try:
        result = await run_search(intent, limit=limit, offset=offset, sources=sources)
    except Exception as e:  # noqa: BLE001
        logger.error("Advanced search failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

    query = intent.canonical_query or intent.semantic_text()
    if offset == 0:
        await _persist(result["papers"], query)
    return _response(
        query,
        result,
        {
            "category": intent.field,
            "min_citations": intent.min_citations or 0,
            "year_range": f"{intent.year_from() or 'any'}-{intent.year_to() or 'any'}",
            "sort": intent.sort,
            "arxiv_categories": intent.arxiv_categories,
        },
    )
