"""Natural-language -> query conversion (back-compat shim).

The real work now lives in ``services/search/intent.py`` (structured tool-use
extraction). This module preserves the ``convert_natural_language_to_query``
entry point the /convert-query route expects, returning a dict that keeps the
existing frontend fields (query, category, reasoning, suggested_filters) while
adding the full structured ``intent``.
"""
import logging
from typing import Any, Dict

from .search.intent import extract_intent

logger = logging.getLogger(__name__)


async def convert_natural_language_to_query(natural_language: str) -> Dict[str, Any]:
    intent = await extract_intent(natural_language)
    return intent.to_conversion_dict()
