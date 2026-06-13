"""OpenAlex connector — the backbone.

Broad coverage, stable IDs, native date filtering, and a relevance-ranked
full-text ``search``. This is the workhorse for filtering + dedup; arXiv adds
recency and INSPIRE adds physics-grade citations on top.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List

from app.config import OPENALEX_MAILTO

from ..schema import SearchIntent, make_paper
from .base import get_with_retry

logger = logging.getLogger(__name__)

OPENALEX_API = "https://api.openalex.org/works"


def _reconstruct_abstract(inv_index: Dict[str, List[int]]) -> str:
    if not inv_index:
        return ""
    positions = sorted((pos, word) for word, poses in inv_index.items() for pos in poses)
    return " ".join(word for _, word in positions)


def _extract_arxiv_id(work: Dict[str, Any]) -> str:
    # OpenAlex sometimes carries arXiv in ids/locations; best-effort for dedup.
    for loc in work.get("locations", []) or []:
        url = (loc.get("landing_page_url") or "") + " " + (loc.get("pdf_url") or "")
        m = re.search(r"arxiv\.org/(?:abs|pdf)/(\d{4}\.\d{4,5})", url)
        if m:
            return m.group(1)
    return ""


class OpenAlexConnector:
    name = "OpenAlex"
    source_id = "openalex"

    def available(self) -> bool:
        return True

    def _build_params(self, intent: SearchIntent, limit: int) -> Dict[str, Any]:
        # Relevance text: topics + synonyms + must terms (natural phrase).
        search_text = " ".join(
            intent.topics + intent.should_include + intent.must_include + intent.phrases
        ).strip()
        if not search_text:
            search_text = intent.canonical_query

        filters: List[str] = ["type:article"]
        if intent.date_from:
            filters.append(f"from_publication_date:{intent.date_from}")
        if intent.date_to:
            filters.append(f"to_publication_date:{intent.date_to}")
        if intent.min_citations:
            filters.append(f"cited_by_count:>{max(0, intent.min_citations - 1)}")
        if intent.open_access_only:
            filters.append("is_oa:true")

        params: Dict[str, Any] = {
            "filter": ",".join(filters),
            "per-page": min(limit, 200),
        }
        if search_text:
            params["search"] = search_text

        if intent.sort == "date":
            params["sort"] = "publication_date:desc"
        elif intent.sort == "citations":
            params["sort"] = "cited_by_count:desc"
        elif search_text:
            params["sort"] = "relevance_score:desc"

        if OPENALEX_MAILTO:
            params["mailto"] = OPENALEX_MAILTO
        return params

    async def search(self, intent: SearchIntent, limit: int) -> List[Dict[str, Any]]:
        params = self._build_params(intent, limit)
        logger.info("OpenAlex params: %s", {k: v for k, v in params.items() if k != "mailto"})
        resp = await get_with_retry(OPENALEX_API, params=params)
        if resp is None:
            return []
        try:
            results = resp.json().get("results", [])
        except Exception as e:  # noqa: BLE001
            logger.error("OpenAlex parse error: %s", e)
            return []
        return [self._parse(w) for w in results]

    @staticmethod
    def _parse(w: Dict[str, Any]) -> Dict[str, Any]:
        authors = [
            a["author"].get("display_name", "")
            for a in w.get("authorships", []) or []
            if a.get("author")
        ]
        primary = w.get("primary_location") or {}
        source = primary.get("source") or {}
        best_oa = w.get("best_oa_location") or {}
        concepts = [c.get("display_name", "") for c in (w.get("concepts") or [])[:5]]
        return make_paper(
            source="openalex",
            source_name="OpenAlex",
            title=w.get("display_name") or w.get("title") or "Untitled",
            authors=authors,
            abstract=_reconstruct_abstract(w.get("abstract_inverted_index") or {}),
            year=w.get("publication_year") or 0,
            published=w.get("publication_date") or "",
            doi=w.get("doi"),
            arxiv_id=_extract_arxiv_id(w),
            paper_id=w.get("id"),
            citation_count=w.get("cited_by_count", 0) or 0,
            reference_count=len(w.get("referenced_works", []) or []),
            venue=source.get("display_name") or "",
            categories=concepts,
            url=primary.get("landing_page_url") or w.get("id") or "",
            pdf_url=best_oa.get("pdf_url") or primary.get("pdf_url") or "",
            abs_url=primary.get("landing_page_url") or "",
            is_open_access=bool(w.get("open_access", {}).get("is_oa")),
        )
