"""Search orchestration: fan out to sources, merge, dedup, filter, rank.

Every step degrades gracefully — a dead source or a disabled reranker reduces
quality but never breaks the search.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import math
from typing import Any, Dict, List, Optional

from app.config import RELEVANCE_BLEND_ALPHA, SEARCH_CANDIDATES_PER_SOURCE
from app.services.cache import search_results_cache

from .connectors import AdsConnector, ArxivConnector, InspireConnector, OpenAlexConnector
from .connectors.base import Connector
from .enrich import enrich_citations_s2
from .rerank import rerank
from .schema import SearchIntent, candidate_keys

logger = logging.getLogger(__name__)

# Order matters: the first record seen for a work becomes the primary, so we
# list the richest-metadata sources first (citations, DOIs, reconstructed
# abstracts) and let arXiv top it up with arxiv_id / pdf links. ADS is included
# only when ADS_API_TOKEN is set (its .available() returns False otherwise).
_ALL_CONNECTORS: List[Connector] = [
    OpenAlexConnector(),
    InspireConnector(),
    AdsConnector(),
    ArxivConnector(),
]


def _select_connectors(sources: Optional[List[str]]) -> List[Connector]:
    if not sources or "all" in sources:
        return [c for c in _ALL_CONNECTORS if c.available()]
    wanted = set(sources)
    return [c for c in _ALL_CONNECTORS if c.source_id in wanted and c.available()]


def _merge_into(primary: Dict[str, Any], other: Dict[str, Any]) -> None:
    primary["citationCount"] = max(primary.get("citationCount", 0) or 0, other.get("citationCount", 0) or 0)
    primary["referenceCount"] = max(primary.get("referenceCount", 0) or 0, other.get("referenceCount", 0) or 0)
    for k in ("doi", "arxiv_id", "paperId", "pdf_url", "abs_url", "published"):
        if not primary.get(k) and other.get(k):
            primary[k] = other[k]
    if not primary.get("year") and other.get("year"):
        primary["year"] = other["year"]
    o_abs = other.get("abstract", "")
    if o_abs and o_abs != "No abstract available" and len(o_abs) > len(primary.get("abstract", "") or ""):
        primary["abstract"] = o_abs
    cats = list(dict.fromkeys((primary.get("categories") or []) + (other.get("categories") or [])))
    primary["categories"] = cats
    primary["concepts"] = cats[:5]
    srcs = set(primary.get("sources") or [primary.get("source")])
    srcs.add(other.get("source"))
    primary["sources"] = sorted(s for s in srcs if s)


def _dedupe(papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    by_key: Dict[str, int] = {}
    result: List[Dict[str, Any]] = []
    for p in papers:
        keys = candidate_keys(p)
        hit = next((by_key[k] for k in keys if k in by_key), None)
        if hit is None:
            idx = len(result)
            p.setdefault("sources", [p.get("source")] if p.get("source") else [])
            result.append(p)
            for k in keys:
                by_key[k] = idx
        else:
            _merge_into(result[hit], p)
            for k in candidate_keys(result[hit]):
                by_key.setdefault(k, hit)
    return result


def _post_filter(papers: List[Dict[str, Any]], intent: SearchIntent) -> List[Dict[str, Any]]:
    out = papers
    if intent.min_citations:
        out = [p for p in out if (p.get("citationCount", 0) or 0) >= intent.min_citations]
    if intent.open_access_only:
        out = [p for p in out if p.get("isOpenAccess")]
    if intent.exclude:
        terms = [t.lower() for t in intent.exclude if t]
        def blocked(p: Dict[str, Any]) -> bool:
            hay = f"{p.get('title','')} {p.get('abstract','')}".lower()
            return any(t in hay for t in terms)
        out = [p for p in out if not blocked(p)]
    return out


def _sort_without_rerank(papers: List[Dict[str, Any]], intent: SearchIntent) -> List[Dict[str, Any]]:
    if intent.sort == "date":
        return sorted(papers, key=lambda p: (p.get("published") or str(p.get("year") or "")), reverse=True)
    # 'citations', 'hybrid' (with no relevance signal) and the rerank-unavailable
    # 'relevance' fallback all collapse to impact-first ordering.
    return sorted(papers, key=lambda p: (p.get("citationCount", 0) or 0, p.get("year", 0) or 0), reverse=True)


def _blend_relevance_citations(
    papers: List[Dict[str, Any]], alpha: float = RELEVANCE_BLEND_ALPHA
) -> List[Dict[str, Any]]:
    """Re-rank reranked papers by a blend of relevance and citation impact.

    ``score = alpha * relevance_norm + (1 - alpha) * citations_norm`` where both
    components are min-max normalized over the pool (citations log-scaled, since
    they are heavy-tailed). Assumes ``relevance_score`` is already set by rerank;
    if it isn't, relevance contributes nothing and impact drives the order.
    """
    if len(papers) <= 1:
        return papers

    rel = [float(p.get("relevance_score", 0.0) or 0.0) for p in papers]
    cit = [math.log1p(max(0, int(p.get("citationCount", 0) or 0))) for p in papers]
    rmin, rmax = min(rel), max(rel)
    cmin, cmax = min(cit), max(cit)
    rspan = (rmax - rmin) or 1.0
    cspan = (cmax - cmin) or 1.0

    for p, r, c in zip(papers, rel, cit):
        rn = (r - rmin) / rspan
        cn = (c - cmin) / cspan
        p["blend_score"] = round(alpha * rn + (1.0 - alpha) * cn, 4)

    ranked = sorted(papers, key=lambda p: p.get("blend_score", 0.0), reverse=True)
    for i, p in enumerate(ranked):
        p["relevance_rank"] = i + 1
    return ranked


def _intent_signature(intent: SearchIntent, sources: Optional[List[str]]) -> str:
    """Stable key for an intent + source selection (so paging hits the cache)."""
    payload = {**intent.model_dump(), "_sources": sorted(sources) if sources else "all"}
    return hashlib.md5(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


async def _execute(
    intent: SearchIntent,
    sources: Optional[List[str]],
    candidates_per_source: Optional[int],
) -> Dict[str, Any]:
    """Run the full pipeline once, returning the complete ranked list + meta."""
    connectors = _select_connectors(sources)
    per_source = candidates_per_source or SEARCH_CANDIDATES_PER_SOURCE

    tasks = [c.search(intent, per_source) for c in connectors]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    pool: List[Dict[str, Any]] = []
    sources_used: List[str] = []
    errors: Dict[str, str] = {}
    for connector, res in zip(connectors, results):
        if isinstance(res, Exception):
            errors[connector.source_id] = str(res)
            logger.error("Connector %s failed: %s", connector.source_id, res)
            continue
        if res:
            sources_used.append(connector.source_id)
            pool.extend(res)
        logger.info("Connector %s returned %d", connector.source_id, len(res or []))

    merged = _dedupe(pool)
    merged = await enrich_citations_s2(merged)  # backfill missing citation counts (S2)
    filtered = _post_filter(merged, intent)

    reranked = False
    if intent.sort in ("relevance", "hybrid"):
        ranked = await rerank(intent.semantic_text() or intent.canonical_query, filtered)
        reranked = any("relevance_score" in p for p in ranked)
        if not reranked:
            # No relevance signal — degrade to impact-first ordering.
            ranked = _sort_without_rerank(filtered, intent)
        elif intent.sort == "hybrid":
            ranked = _blend_relevance_citations(ranked)
    else:
        ranked = _sort_without_rerank(filtered, intent)

    return {"ranked": ranked, "sources_used": sources_used, "errors": errors, "reranked": reranked}


async def run_search(
    intent: SearchIntent,
    *,
    limit: int = 100,
    offset: int = 0,
    sources: Optional[List[str]] = None,
    candidates_per_source: Optional[int] = None,
) -> Dict[str, Any]:
    """Paginated search. The full ranked list is computed once and cached, so
    subsequent pages ("load more") slice a stable ranking without re-fetching."""
    key = _intent_signature(intent, sources)
    cached = search_results_cache.get(key)
    if cached is None:
        cached = await _execute(intent, sources, candidates_per_source)
        search_results_cache.set(key, cached)

    ranked: List[Dict[str, Any]] = cached["ranked"]
    page = ranked[offset : offset + limit]
    return {
        "papers": page,
        "total_found": len(ranked),
        "returned": len(page),
        "offset": offset,
        "limit": limit,
        "has_more": (offset + limit) < len(ranked),
        "sources_used": cached["sources_used"],
        "errors": cached["errors"],
        "reranked": cached["reranked"],
        "intent": intent.model_dump(),
    }
