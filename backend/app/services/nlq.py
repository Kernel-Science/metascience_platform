import json
import asyncio
import logging
from typing import Dict, Any
from anthropic import Anthropic
from ..config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

SYSTEM_PROMPT = """You are an expert academic research assistant. Your task is to convert natural language requests into effective search queries for academic databases like ArXiv.

Return ONLY a valid JSON object with the following keys:
- "query": A focused search query. You CAN use OR operators to combine synonyms or related terms (e.g., "interpretability OR explainable"). For author searches, use the format 'author:"First Last"'.
- "category": (string or null) One of: 'physics', 'computer_science', 'mathematics', 'biology', 'chemistry', 'engineering'.
- "reasoning": (string) A brief explanation of the query choice.
- "suggested_filters": (object) An object with suggested filters like sort_by, date_range, etc.

Examples:
- User: "ai interpretability papers" → query: "interpretability OR explainable OR XAI"
- User: "machine learning papers" → query: "machine learning"
- User: "papers by John Smith" → query: "author:\"John Smith\""
- User: "quantum computing or quantum algorithms" → query: "quantum computing OR quantum algorithms"

Use OR operators when the user asks for multiple related concepts or when synonyms would improve results.
"""

async def convert_natural_language_to_query(natural_language: str) -> Dict[str, Any]:
    try:
        logger.info(f"NLQ prompt: {natural_language}")
        def _call():
            return anthropic_client.messages.create(
                model=ANTHROPIC_MODEL,
                max_tokens=400,
                temperature=0.1,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": natural_language}]
            )
        resp = await asyncio.to_thread(_call)
        logger.info(f"Anthropic raw response: {resp}")
        # Anthropic returns a list of content blocks; we expect a single text block
        text = "".join(block.text for block in resp.content if block.type == "text")
        logger.info(f"Anthropic text block: {text}")
        try:
            # Strip markdown code blocks if present
            text = text.strip()
            if text.startswith("```json"):
                text = text[7:]  # Remove ```json
            elif text.startswith("```"):
                text = text[3:]  # Remove ```
            if text.endswith("```"):
                text = text[:-3]  # Remove trailing ```
            text = text.strip()

            result = json.loads(text)
            if not result.get("query"):
                result["query"] = natural_language
            return result
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            return {
                "query": natural_language,
                "category": None,
                "reasoning": "Failed to parse model JSON output",
                "suggested_filters": {}
            }
    except Exception as e:
        logger.error(f"NLQ error: {e}")
        return {
            "query": natural_language,
            "category": None,
            "reasoning": f"Error processing request: {str(e)}",
            "suggested_filters": {}
        }