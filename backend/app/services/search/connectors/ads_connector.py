"""NASA ADS connector — astrophysics / cosmology / gravitation.

ADS (the Astrophysics Data System) is the field-native database for astro and a
strong source for gravitation/cosmology — complementary to OpenAlex (breadth),
arXiv (recency) and INSPIRE (HEP). Requires a free API token (ADS_API_TOKEN);
the connector is simply skipped when the token is absent.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List

from app.config import ADS_API_TOKEN

from ..schema import SearchIntent, make_paper
from .base import get_with_retry

logger = logging.getLogger(__name__)

ADS_API = "https://api.adsabs.harvard.edu/v1/search/query"
_FIELDS = "bibcode,title,author,abstract,year,pubdate,citation_count,doi,identifier,bibstem,pub"


def _group(term: str) -> str:
    t = term.replace('"', "").strip()
    return f'abs:"{t}"' if t else ""


def build_q(intent: SearchIntent, broaden: bool = False) -> str:
    groups = [g for g in (_group(t) for t in intent.keyword_terms()) if g]
    joiner = " OR " if broaden else " AND "
    core = joiner.join(groups) if groups else (intent.canonical_query.replace('"', "") or "*")
    q = f"({core})" if len(groups) > 1 else core

    if intent.authors:
        authors = " OR ".join(f'author:"{a}"' for a in intent.authors)
        q += f" AND ({authors})" if len(intent.authors) > 1 else f" AND {authors}"

    yf, yt = intent.year_from(), intent.year_to()
    if yf and yt:
        q += f" AND year:{yf}-{yt}"
    elif yf:
        q += f" AND pubdate:[{yf}-01 TO 9999-12]"
    elif yt:
        q += f" AND pubdate:[0000-01 TO {yt}-12]"

    for ex in intent.exclude:
        g = _group(ex)
        if g:
            q += f" -{g}"
    return q


class AdsConnector:
    name = "NASA ADS"
    source_id = "ads"

    def available(self) -> bool:
        return bool(ADS_API_TOKEN)

    async def search(self, intent: SearchIntent, limit: int) -> List[Dict[str, Any]]:
        papers = await self._run(intent, limit, broaden=False)
        if len(papers) < max(5, limit // 6) and len(intent.keyword_terms()) > 1:
            more = await self._run(intent, limit, broaden=True)
            seen = {p["id"] for p in papers}
            papers.extend(p for p in more if p["id"] not in seen)
        return papers

    async def _run(self, intent: SearchIntent, limit: int, broaden: bool) -> List[Dict[str, Any]]:
        sort = {"date": "date desc", "citations": "citation_count desc"}.get(intent.sort, "score desc")
        params = {"q": build_q(intent, broaden=broaden), "fl": _FIELDS, "rows": min(limit, 200), "sort": sort}
        logger.info("ADS q: %s (sort=%s)", params["q"], sort)
        resp = await get_with_retry(ADS_API, params=params, headers={"Authorization": f"Bearer {ADS_API_TOKEN}"})
        if resp is None:
            return []
        try:
            docs = resp.json().get("response", {}).get("docs", [])
        except Exception as e:  # noqa: BLE001
            logger.error("ADS parse error: %s", e)
            return []
        return [self._parse(d) for d in docs if d.get("title")]

    @staticmethod
    def _parse(d: Dict[str, Any]) -> Dict[str, Any]:
        bibcode = d.get("bibcode", "")
        title = (d.get("title") or ["Untitled"])[0]
        authors = d.get("author", []) or []  # "Last, First"
        names = []
        for a in authors[:20]:
            names.append(f"{a.split(',')[1].strip()} {a.split(',')[0].strip()}" if "," in a else a)
        doi = (d.get("doi") or [None])[0]
        arxiv_id = ""
        for ident in d.get("identifier", []) or []:
            m = re.search(r"arXiv:(\d{4}\.\d{4,5})", ident, re.I) or re.match(r"(\d{4}\.\d{4,5})$", ident)
            if m:
                arxiv_id = m.group(1)
                break
        venue = d.get("pub") or (d.get("bibstem") or [""])[0] or "NASA ADS"
        return make_paper(
            source="ads",
            source_name="NASA ADS",
            title=title,
            authors=names,
            abstract=d.get("abstract", "") or "",
            year=int(d["year"]) if str(d.get("year", "")).isdigit() else 0,
            published=d.get("pubdate", "") or "",
            doi=doi,
            arxiv_id=arxiv_id,
            paper_id=bibcode or None,
            citation_count=d.get("citation_count", 0) or 0,
            venue=venue,
            url=f"https://ui.adsabs.harvard.edu/abs/{bibcode}" if bibcode else "",
            pdf_url=f"https://arxiv.org/pdf/{arxiv_id}" if arxiv_id else "",
            abs_url=f"https://ui.adsabs.harvard.edu/abs/{bibcode}" if bibcode else "",
            is_open_access=bool(arxiv_id),
        )
