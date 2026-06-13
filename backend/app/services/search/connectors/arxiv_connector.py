"""arXiv connector — the recency specialist (newest physics preprints).

Uses the arXiv Atom API directly so we get real ``submittedDate`` range
filtering and date sorting, instead of fetching relevance-sorted results and
filtering by year afterward (the old bug). Boolean query is built
deterministically from the structured intent.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List

import feedparser

from ..schema import SearchIntent, make_paper
from .base import get_with_retry

logger = logging.getLogger(__name__)

ARXIV_API = "http://export.arxiv.org/api/query"

# Map our coarse field -> arXiv top-level category prefix, used only as a
# fallback when the intent has no specific arxiv_categories.
_FIELD_TO_ARXIV = {
    "physics": None,  # physics spans many archives; don't over-constrain
    "computer_science": "cs",
    "mathematics": "math",
    "biology": "q-bio",
    "chemistry": "physics.chem-ph",
    "engineering": "eess",
}


def _q(term: str) -> str:
    """A title-or-abstract group for one term, phrase-quoted."""
    t = term.replace('"', "").strip()
    if not t:
        return ""
    return f'(ti:"{t}" OR abs:"{t}")'


def build_query(intent: SearchIntent, broaden: bool = False) -> str:
    """Build an arXiv ``search_query`` string from the intent.

    ``broaden=True`` ORs the core terms instead of ANDing them (recall fallback
    when the strict AND query returns too little).
    """
    required = [g for g in (_q(t) for t in intent.keyword_terms()) if g]
    joiner = " OR " if broaden else " AND "
    core = joiner.join(required) if required else ""
    if not core and intent.canonical_query:
        core = f'all:"{intent.canonical_query.replace(chr(34), "")}"'

    clauses: List[str] = []
    if core:
        clauses.append(f"({core})" if len(required) > 1 else core)

    # Categories: explicit list wins; otherwise coarse field fallback.
    cats = list(intent.arxiv_categories)
    if not cats and intent.field:
        fallback = _FIELD_TO_ARXIV.get(intent.field)
        if fallback:
            cats = [fallback]
    if cats:
        clauses.append("(" + " OR ".join(f"cat:{c}" for c in cats) + ")")

    if intent.authors:
        clauses.append("(" + " OR ".join(f'au:"{a}"' for a in intent.authors) + ")")

    # submittedDate range (arXiv needs both bounds present). This MUST live
    # inside the positive group: arXiv parses a trailing `ANDNOT x AND date`
    # as `ANDNOT (x AND date)`, which silently drops the date filter.
    if intent.date_from or intent.date_to:
        lo = (intent.date_from or "1991-01-01").replace("-", "")[:8] + "0000"
        hi = (intent.date_to or datetime.utcnow().strftime("%Y-%m-%d")).replace("-", "")[:8] + "2359"
        clauses.append(f"submittedDate:[{lo} TO {hi}]")

    positive = " AND ".join(clauses) if clauses else "all:*"

    excludes = [g for g in (_q(ex) for ex in intent.exclude) if g]
    if excludes:
        # Parenthesize the positive group so excludes can't capture it.
        query = "(" + positive + ")"
        for grp in excludes:
            query += f" ANDNOT {grp}"
        return query
    return positive


class ArxivConnector:
    name = "arXiv"
    source_id = "arxiv"

    def available(self) -> bool:
        return True

    async def search(self, intent: SearchIntent, limit: int) -> List[Dict[str, Any]]:
        papers = await self._run(intent, limit, broaden=False)
        # Recall fallback: if a strict AND of several terms found little, retry OR.
        if len(papers) < max(5, limit // 6) and len(intent.keyword_terms()) > 1:
            logger.info("arXiv: broadening query (strict found %d)", len(papers))
            more = await self._run(intent, limit, broaden=True)
            seen = {p["id"] for p in papers}
            papers.extend(p for p in more if p["id"] not in seen)
        return papers

    async def _run(self, intent: SearchIntent, limit: int, broaden: bool) -> List[Dict[str, Any]]:
        query = build_query(intent, broaden=broaden)
        sort_by = "submittedDate" if intent.sort == "date" else "relevance"
        params = {
            "search_query": query,
            "start": 0,
            "max_results": min(limit, 200),
            "sortBy": sort_by,
            "sortOrder": "descending",
        }
        logger.info("arXiv query: %s (sort=%s)", query, sort_by)
        resp = await get_with_retry(ARXIV_API, params=params)
        if resp is None:
            return []
        feed = feedparser.parse(resp.text)
        return [self._parse_entry(e) for e in feed.entries if getattr(e, "title", None)]

    @staticmethod
    def _parse_entry(e: Any) -> Dict[str, Any]:
        arxiv_id = ""
        if getattr(e, "id", None):
            # e.id looks like http://arxiv.org/abs/2401.01234v1
            arxiv_id = e.id.rsplit("/abs/", 1)[-1]
        pdf_url = ""
        for link in getattr(e, "links", []) or []:
            if link.get("type") == "application/pdf" or link.get("title") == "pdf":
                pdf_url = link.get("href", "")
        published = getattr(e, "published", "") or ""
        year = 0
        if published[:4].isdigit():
            year = int(published[:4])
        cats = [t.get("term") for t in getattr(e, "tags", []) or [] if t.get("term")]
        doi = getattr(e, "arxiv_doi", None)
        return make_paper(
            source="arxiv",
            source_name="arXiv",
            title=getattr(e, "title", "").replace("\n", " "),
            authors=[a.get("name", "") for a in getattr(e, "authors", []) or []],
            abstract=getattr(e, "summary", "").replace("\n", " "),
            year=year,
            published=published,
            doi=doi,
            arxiv_id=arxiv_id,
            venue=getattr(e, "arxiv_journal_ref", "") or "arXiv (preprint)",
            categories=cats,
            url=getattr(e, "id", ""),
            pdf_url=pdf_url,
            abs_url=getattr(e, "id", ""),
            is_open_access=True,
        )
