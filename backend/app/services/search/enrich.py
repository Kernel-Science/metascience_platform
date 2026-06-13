"""Semantic Scholar citation enrichment for search results.

OpenAlex/INSPIRE/ADS supply citation counts for most papers, but brand-new
arXiv-only papers (not yet indexed elsewhere) come back with 0. When an S2 key
is configured we backfill those via one batched S2 call (cheap, cached). Pure
enhancement: no-op without a key or on any failure.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List

from app.config import SEMANTIC_SCHOLAR_API_KEY
from app.services.cache import s2_cache

from .connectors.base import get_client

logger = logging.getLogger(__name__)

S2_BATCH = "https://api.semanticscholar.org/graph/v1/paper/batch"
_MAX_IDS = 300


def _s2_id(p: Dict[str, Any]) -> str:
    if p.get("doi"):
        return f"DOI:{p['doi']}"
    if p.get("arxiv_id"):
        return f"ARXIV:{re.sub(r'v\\d+$', '', str(p['arxiv_id']))}"
    return ""


def _apply(papers: List[Dict[str, Any]], count: int) -> None:
    for p in papers:
        if count and count > (p.get("citationCount", 0) or 0):
            p["citationCount"] = count
            p["citationsCount"] = count


async def enrich_citations_s2(papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not SEMANTIC_SCHOLAR_API_KEY:
        return papers

    # Group papers missing a citation count by their S2 id.
    by_id: Dict[str, List[Dict[str, Any]]] = {}
    for p in papers:
        if (p.get("citationCount", 0) or 0) > 0:
            continue
        sid = _s2_id(p)
        if sid:
            by_id.setdefault(sid, []).append(p)
    if not by_id:
        return papers

    ids = list(by_id)[:_MAX_IDS]
    misses: List[str] = []
    for sid in ids:
        cached = s2_cache.get(sid)
        if cached is not None:
            _apply(by_id[sid], cached)
        else:
            misses.append(sid)

    if misses:
        client = get_client()
        headers = {"x-api-key": SEMANTIC_SCHOLAR_API_KEY}
        for i in range(0, len(misses), 200):  # S2 batch caps at 500; stay modest
            chunk = misses[i : i + 200]
            try:
                r = await client.post(S2_BATCH, params={"fields": "citationCount"}, json={"ids": chunk}, headers=headers)
                if r.status_code != 200:
                    logger.warning("S2 batch enrich -> %s", r.status_code)
                    continue
                for sid, item in zip(chunk, r.json()):
                    cc = (item or {}).get("citationCount") if item else None
                    s2_cache.set(sid, cc or 0)
                    if cc:
                        _apply(by_id[sid], cc)
            except Exception as e:  # noqa: BLE001
                logger.warning("S2 batch enrich failed (%s)", str(e)[:120])

    return papers
