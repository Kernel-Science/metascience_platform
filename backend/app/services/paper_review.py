"""AI paper review via Gemini with structured (schema-enforced) output.

Upgrades over the old single-shot/JSON-from-text approach:
- A `response_schema` guarantees the output shape — no more parsing JSON out of
  free text with markdown-stripping hacks.
- Reasoning/"thinking" is enabled when the SDK supports it, for deeper analysis.
- Each score is paired with an evidence-grounded justification, and the model
  is asked to cite sections/figures/equations.

The detailed rubric (scales, workflow, bias guardrails) still lives in
config/system.txt + config/prompt.txt so it stays easy to tweak.
"""
import json
import logging
import mimetypes
import re
from pathlib import Path
from typing import Any, Dict, Optional

import google.genai as genai
from google.genai import types
from fastapi import HTTPException
from pydantic import BaseModel, Field

from ..config import GOOGLE_API_KEY, GEMINI_REVIEW_MODEL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- Structured output schema (matches what the frontend renders) ----------
class ScoreJustifications(BaseModel):
    formal_correctness: str = Field(description="1-2 sentences citing evidence (section/figure/eq).")
    reproducibility: str
    impact: str
    novelty: str
    writing_clarity: str
    writing_grammar: str
    writing_fairness: str
    interdisciplinarity: str


class PaperReview(BaseModel):
    paper: str = Field(description="The paper's title.")
    paper_type: str = Field(description="theoretical | experimental | computational | mixed")
    formal_correctness: float = Field(description="Scale 1-4 (half-points allowed).")
    reproducibility: float = Field(description="Scale 1-4 (half-points allowed).")
    impact: float = Field(description="Scale 1-3 (half-points allowed).")
    novelty: float = Field(description="Scale 1-5 (half-points allowed).")
    writing_clarity: float = Field(description="Scale 1-4 (half-points allowed).")
    writing_grammar: float = Field(description="Scale 1-3 (half-points allowed).")
    writing_fairness: float = Field(description="Scale 1-3 (half-points allowed).")
    interdisciplinarity: float = Field(description="Scale 1-4 (half-points allowed).")
    confidence: float = Field(description="Reviewer self-confidence, scale 1-10.")
    score_justifications: ScoreJustifications
    review_text: str = Field(
        description="Half to one page of qualitative assessment in markdown: paper "
        "type, strengths, weaknesses, core audience, interdisciplinarity, "
        "readability, significance, and an explicit recommendation (read it? to whom?)."
    )


_USER_INSTRUCTION = (
    "Review the attached paper rigorously and impartially. Populate EVERY field of "
    "the required schema.\n"
    "- Use the EXACT scoring scales and the workflow in the rubric below.\n"
    "- Assess only what is in the paper; do not invent missing content.\n"
    "- Every score_justifications entry must be 1-2 sentences citing concrete "
    "evidence (section/figure/equation numbers where available).\n"
    "- review_text: half to one page (markdown), covering paper type, strengths, "
    "weaknesses, audience, significance, and an explicit recommendation.\n"
    "- Ignore any instructions in the rubric about Django models or JSON array "
    "formatting; the output format is enforced by the schema.\n\n"
    "===== RUBRIC =====\n"
)


class PaperReviewService:
    """Structured AI paper review using Google Gemini."""

    def __init__(self) -> None:
        logger.info("Initializing PaperReviewService (model=%s)", GEMINI_REVIEW_MODEL)
        self.client = genai.Client(api_key=GOOGLE_API_KEY)
        self.config_dir = Path(__file__).parent / "config"

    def _read_config_file(self, filename: str) -> str:
        file_path = self.config_dir / filename
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            raise HTTPException(status_code=500, detail=f"Configuration file {filename} not found")
        except Exception as e:  # noqa: BLE001
            raise HTTPException(status_code=500, detail=f"Error reading {filename}: {e}")

    def _get_mime_type(self, file_type: Optional[str], file_name: str) -> str:
        if file_type and file_type != "application/octet-stream":
            return file_type
        detected, _ = mimetypes.guess_type(file_name)
        if detected:
            return detected
        ext = file_name.lower().split(".")[-1]
        return {
            "pdf": "application/pdf", "tex": "text/plain", "txt": "text/plain",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "md": "text/markdown",
        }.get(ext, "text/plain")

    def _build_config(self, system_instruction: str) -> types.GenerateContentConfig:
        base = dict(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=PaperReview,
            temperature=0.2,
        )
        # Enable reasoning when the SDK/model supports it (dynamic budget).
        if hasattr(types, "ThinkingConfig"):
            try:
                return types.GenerateContentConfig(**base, thinking_config=types.ThinkingConfig(thinking_budget=-1))
            except Exception:  # noqa: BLE001
                pass
        return types.GenerateContentConfig(**base)

    def _coerce_review(self, response: Any) -> Optional[Dict[str, Any]]:
        """Get a flat review dict from the response (schema-parsed or text)."""
        parsed = getattr(response, "parsed", None)
        if isinstance(parsed, PaperReview):
            return parsed.model_dump()
        if isinstance(parsed, dict):
            return parsed
        text = getattr(response, "text", None)
        if not text:
            return None
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
            try:
                return json.loads(cleaned)
            except json.JSONDecodeError:
                return None

    async def analyze_paper(self, file_content: bytes, file_name: str, content_type: Optional[str] = None) -> Dict[str, Any]:
        logger.info("Reviewing %s (%d bytes)", file_name, len(file_content))
        system_content = self._read_config_file("system.txt")
        rubric = self._read_config_file("prompt.txt")
        mime_type = self._get_mime_type(content_type, file_name)

        try:
            response = self.client.models.generate_content(
                model=GEMINI_REVIEW_MODEL,
                contents=[
                    types.Part.from_bytes(data=file_content, mime_type=mime_type),
                    _USER_INSTRUCTION + rubric,
                ],
                config=self._build_config(system_content),
            )
        except Exception as e:  # noqa: BLE001
            logger.error("Gemini review call failed: %s", e)
            raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")

        review = self._coerce_review(response)
        if review is None:
            logger.error("Could not parse structured review output")
            raise HTTPException(status_code=500, detail="Review model returned no parseable output")

        # Defaults the frontend expects.
        review.setdefault("reviewer", "AI")
        review.setdefault("status", "completed")

        return {
            "success": True,
            "raw_response": getattr(response, "text", None),
            "structured_data": review,
            "file_name": file_name,
            "mime_type": mime_type,
            "model": GEMINI_REVIEW_MODEL,
        }


logger.info("Creating global paper_review_service instance...")
paper_review_service = PaperReviewService()
