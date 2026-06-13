"""INSPIRE-HEP connector — physics-native citations.

INSPIRE is the curated database for high-energy / particle / nuclear /
gravitation / hep-th, run by CERN, DESY, Fermilab, SLAC. Free API, no key.
Its citation data and references are more complete than OpenAlex for these
subfields, which is exactly the FQxI foundational-physics audience.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

from ..schema import SearchIntent, make_paper
from .base import get_with_retry

logger = logging.getLogger(__name__)

INSPIRE_API = "https://inspirehep.net/api/literature"

_FIELDS = ",".join([
    "titles", "authors.full_name", "abstracts", "arxiv_eprints", "dois",
    "citation_count", "earliest_date", "publication_info", "document_type",
    "documents", "control_number",
])


def _term_group(term: str) -> str:
    t = term.replace('"', "").strip()
    return f'(title "{t}" or abstract "{t}")' if t else ""


def build_q(intent: SearchIntent, broaden: bool = False) -> str:
    clauses: List[str] = []
    groups = [g for g in (_term_group(t) for t in intent.keyword_terms()) if g]
    if groups:
        joiner = " or " if broaden else " and "
        joined = joiner.join(groups)
        # Parenthesize a multi-term group so a trailing `and date >= ...` keeps
        # the right precedence (otherwise `g1 or g2 and date` binds the date
        # only to g2 and pre-date papers leak in).
        clauses.append(f"({joined})" if len(groups) > 1 else joined)
    elif intent.canonical_query:
        clauses.append(intent.canonical_query.replace('"', ""))

    if intent.authors:
        authors = " or ".join(f'a "{a}"' for a in intent.authors)
        clauses.append(f"({authors})" if len(intent.authors) > 1 else authors)

    yf, yt = intent.year_from(), intent.year_to()
    if yf:
        clauses.append(f"date >= {yf}")
    if yt:
        clauses.append(f"date <= {yt}")

    q = " and ".join(c for c in clauses if c) or "*"
    for ex in intent.exclude:
        grp = _term_group(ex)
        if grp:
            q += f" and not {grp}"
    return q


def _fmt_author(full_name: str) -> str:
    # INSPIRE stores "Last, First"; present as "First Last".
    if "," in full_name:
        last, first = full_name.split(",", 1)
        return f"{first.strip()} {last.strip()}".strip()
    return full_name.strip()


class InspireConnector:
    name = "INSPIRE-HEP"
    source_id = "inspire"

    def available(self) -> bool:
        return True

    async def search(self, intent: SearchIntent, limit: int) -> List[Dict[str, Any]]:
        papers = await self._run(intent, limit, broaden=False)
        if len(papers) < max(5, limit // 6) and len(intent.keyword_terms()) > 1:
            logger.info("INSPIRE: broadening query (strict found %d)", len(papers))
            more = await self._run(intent, limit, broaden=True)
            seen = {p["id"] for p in papers}
            papers.extend(p for p in more if p["id"] not in seen)
        return papers

    async def _run(self, intent: SearchIntent, limit: int, broaden: bool) -> List[Dict[str, Any]]:
        sort = {"date": "mostrecent", "citations": "mostcited"}.get(intent.sort, "")
        params: Dict[str, Any] = {
            "q": build_q(intent, broaden=broaden),
            "size": min(limit, 200),
            "page": 1,
            "fields": _FIELDS,
        }
        if sort:
            params["sort"] = sort
        logger.info("INSPIRE q: %s (sort=%s)", params["q"], sort or "bestmatch")
        resp = await get_with_retry(INSPIRE_API, params=params)
        if resp is None:
            return []
        try:
            hits = resp.json().get("hits", {}).get("hits", [])
        except Exception as e:  # noqa: BLE001
            logger.error("INSPIRE parse error: %s", e)
            return []
        return [self._parse(h) for h in hits if h.get("metadata", {}).get("titles")]

    @staticmethod
    def _parse(hit: Dict[str, Any]) -> Dict[str, Any]:
        m = hit.get("metadata", {})
        cn = m.get("control_number") or hit.get("id")
        titles = m.get("titles") or [{}]
        abstracts = m.get("abstracts") or [{}]
        eprints = m.get("arxiv_eprints") or [{}]
        arxiv_id = eprints[0].get("value", "") if eprints else ""
        categories = eprints[0].get("categories", []) if eprints else []
        dois = m.get("dois") or []
        doi = dois[0].get("value") if dois else None
        authors = [_fmt_author(a.get("full_name", "")) for a in (m.get("authors") or [])[:20]]
        pub = (m.get("publication_info") or [{}])[0]
        venue = pub.get("journal_title", "") or "INSPIRE-HEP"
        earliest = m.get("earliest_date", "") or ""
        year = int(earliest[:4]) if earliest[:4].isdigit() else 0
        docs = m.get("documents") or []
        pdf_url = docs[0].get("url", "") if docs else (
            f"https://arxiv.org/pdf/{arxiv_id}" if arxiv_id else ""
        )
        return make_paper(
            source="inspire",
            source_name="INSPIRE-HEP",
            title=titles[0].get("title", "Untitled"),
            authors=authors,
            abstract=abstracts[0].get("value", "") if abstracts else "",
            year=year,
            published=earliest,
            doi=doi,
            arxiv_id=arxiv_id,
            paper_id=str(cn) if cn else None,
            citation_count=m.get("citation_count", 0) or 0,
            venue=venue,
            categories=categories,
            url=f"https://inspirehep.net/literature/{cn}" if cn else "",
            pdf_url=pdf_url,
            abs_url=f"https://arxiv.org/abs/{arxiv_id}" if arxiv_id else "",
            is_open_access=True,
        )
