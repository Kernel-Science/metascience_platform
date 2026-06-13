"""Natural language -> SearchIntent via Anthropic tool-use.

Forcing a tool call gives us a guaranteed-shape structured object (no more
parsing JSON out of free text), and crucially separates "understand the
request" from "speak each provider's query syntax". Relative dates are resolved
against today's date, which is the single biggest fix for the old time-frame
filtering failures.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

from anthropic import Anthropic

from app.config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL

from .schema import SearchIntent, today_iso

logger = logging.getLogger(__name__)

_client = Anthropic(api_key=ANTHROPIC_API_KEY)

_TOOL_NAME = "build_search_intent"

_ARXIV_CHEATSHEET = """\
Common arXiv categories (use the exact codes):
- quant-ph: quantum physics / quantum information / quantum computing
- gr-qc: general relativity & quantum cosmology, gravitation
- hep-th: high-energy physics theory (string theory, QFT, holography)
- hep-ph: high-energy phenomenology
- hep-ex / nucl-th / nucl-ex: experimental HEP / nuclear theory / nuclear exp
- astro-ph.CO: cosmology; astro-ph.HE: high-energy astrophysics; astro-ph.GA
- cond-mat.stat-mech, cond-mat.str-el, cond-mat.mes-hall
- physics.hist-ph (foundations/history/philosophy of physics)
- math-ph (mathematical physics)
- cs.LG, cs.AI, stat.ML (machine learning)
"""

_SYSTEM = f"""You are a search-intent compiler for a physics research platform \
(audience: foundational physics — quantum foundations, gravitation/cosmology, \
high-energy theory). Convert the user's natural-language request into a precise, \
structured search intent by calling the {_TOOL_NAME} tool. Do not write prose.

Today's date is {{today}}. Resolve every relative time expression to absolute \
YYYY-MM-DD dates against it:
- "since 2020" -> date_from 2020-01-01
- "in the last 3 years" -> date_from = three years before today
- "between 2018 and 2021" -> date_from 2018-01-01, date_to 2021-12-31
- "2023 papers" -> date_from 2023-01-01, date_to 2023-12-31
- "recent"/"latest"/"newest" -> set sort='date' (and a sensible recent date_from if implied)

Guidance:
- topics: the core concepts, cleaned up (drop filler like "papers about").
- phrases: technical multi-word terms that should match exactly.
- should_include: synonyms/expansions that improve recall (e.g. XAI -> \
explainability, interpretability).
- exclude: anything the user says they do NOT want.
- authors: people named as authors.
- arxiv_categories: set when the subfield is clear, using exact codes below.
- sort: 'citations' for "most cited/influential", 'date' for "recent/latest", \
else 'relevance'.
- min_citations / open_access_only / field: only when clearly implied.
- canonical_query: a short human-readable summary of how you interpreted it.

Be precise. Prefer correctly capturing constraints (dates, authors, categories) \
over adding speculative terms.

{_ARXIV_CHEATSHEET}"""


def _build_tool() -> dict:
    return {
        "name": _TOOL_NAME,
        "description": "Record the structured search intent extracted from the "
        "user's natural-language literature request.",
        "input_schema": SearchIntent.anthropic_tool_schema(),
    }


async def extract_intent(natural_language: str) -> SearchIntent:
    """Extract a SearchIntent. Falls back to a basic intent on any failure."""
    nl = (natural_language or "").strip()
    if not nl:
        return SearchIntent(topics=[], canonical_query="")

    def _call():
        return _client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=1024,
            temperature=0,
            system=_SYSTEM.format(today=today_iso()),
            tools=[_build_tool()],
            tool_choice={"type": "tool", "name": _TOOL_NAME},
            messages=[{"role": "user", "content": nl}],
        )

    try:
        resp = await asyncio.to_thread(_call)
        tool_input: Optional[dict] = None
        for block in resp.content:
            if getattr(block, "type", None) == "tool_use" and block.name == _TOOL_NAME:
                tool_input = block.input
                break
        if not tool_input:
            raise ValueError("model did not return a tool_use block")
        intent = SearchIntent(**tool_input)
        if not intent.canonical_query:
            intent.canonical_query = intent.semantic_text() or nl
        logger.info("Intent extracted: %s", intent.canonical_query)
        return intent
    except Exception as e:  # noqa: BLE001 - never break search on extraction
        logger.error("Intent extraction failed (%s); using fallback", e)
        return SearchIntent(topics=[nl], canonical_query=nl)
