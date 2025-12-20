import google.genai as genai
from google.genai import types
import json
import mimetypes
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import HTTPException
from ..config import GOOGLE_API_KEY
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PaperReviewService:
    """Service for AI-powered paper review using Google Gemini"""

    def __init__(self):
        try:
            logger.info("Initializing PaperReviewService...")
            logger.info(f"Google API Key present: {bool(GOOGLE_API_KEY)}")
            self.client = genai.Client(api_key=GOOGLE_API_KEY)
            self.config_dir = Path(__file__).parent / "config"
            logger.info(f"Config directory: {self.config_dir}")
            logger.info("PaperReviewService initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing PaperReviewService: {str(e)}")
            raise

    def _read_config_file(self, filename: str) -> str:
        """Read content from a configuration file"""
        file_path = self.config_dir / filename
        try:
            logger.info(f"Reading config file: {file_path}")
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                logger.info(f"Successfully read {filename}, length: {len(content)} characters")
                return content
        except FileNotFoundError:
            logger.error(f"Configuration file {filename} not found at {file_path}")
            raise HTTPException(
                status_code=500,
                detail=f"Configuration file {filename} not found"
            )
        except Exception as e:
            logger.error(f"Error reading {filename}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error reading {filename}: {str(e)}"
            )

    def _get_mime_type(self, file_type: Optional[str], file_name: str) -> str:
        """Convert file type to proper MIME type using multiple methods"""
        logger.info(f"Determining MIME type for file: {file_name}, provided type: {file_type}")

        # First try the provided type
        if file_type and file_type != "application/octet-stream":
            logger.info(f"Using provided MIME type: {file_type}")
            return file_type

        # Use Python's mimetypes library for better detection
        detected_type, _ = mimetypes.guess_type(file_name)
        if detected_type:
            logger.info(f"Detected MIME type: {detected_type}")
            return detected_type

        # Fallback based on file extension
        extension = file_name.lower().split('.')[-1]
        mime_map = {
            'pdf': 'application/pdf',
            'tex': 'text/plain',
            'txt': 'text/plain',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'md': 'text/markdown'
        }
        fallback_type = mime_map.get(extension, 'text/plain')
        logger.info(f"Using fallback MIME type for extension '{extension}': {fallback_type}")
        return fallback_type

    def _extract_json_from_response(self, response_text: str) -> Optional[Dict[Any, Any]]:
        """Extract JSON from response text simply, as model is configured for JSON output"""
        try:
            # Try direct parsing first
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback: remove markdown blocks if model ignored the setting
            cleaned = response_text.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r'^```(?:json)?\s*\n', '', cleaned)
                cleaned = re.sub(r'\n```\s*$', '', cleaned)
                try:
                    return json.loads(cleaned)
                except json.JSONDecodeError:
                    pass
        return None

    async def analyze_paper(self, file_content: bytes, file_name: str, content_type: Optional[str] = None) -> Dict[str, Any]:
        """Analyze a paper using Gemini AI and return structured review"""
        try:
            logger.info(f"Starting paper analysis for file: {file_name}")
            logger.info(f"File content size: {len(file_content)} bytes")
            logger.info(f"Content type: {content_type}")

            # Read system and user prompts
            logger.info("Reading configuration files...")
            system_content = self._read_config_file('system.txt')
            user_prompt = self._read_config_file('prompt.txt')

            # Get the most accurate MIME type possible
            mime_type = self._get_mime_type(content_type, file_name)
            logger.info(f"Final MIME type: {mime_type}")

            # Create content with file data and prompt
            logger.info("Sending request to Gemini API...")
            try:
                # Configure generation to output JSON
                generation_config = types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,  # Lower temperature for more consistent JSON output
                )

                response = self.client.models.generate_content(
                    model="gemini-3-flash-preview",
                    contents=[
                        system_content,
                        types.Part.from_bytes(
                            data=file_content,
                            mime_type=mime_type,
                        ),
                        user_prompt
                    ],
                    config=generation_config
                )
                logger.info("Successfully received response from Gemini API")
            except Exception as gemini_error:
                logger.error(f"Gemini API call failed: {str(gemini_error)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Gemini API error: {str(gemini_error)}"
                )

            if not response.text:
                logger.error("Empty response received from Gemini API")
                raise HTTPException(
                    status_code=500,
                    detail="Empty response from Gemini API"
                )

            logger.info(f"Response received, length: {len(response.text)} characters")
            logger.info(f"Response preview: {response.text[:200]}...")

            # Try to extract JSON from response
            json_data = self._extract_json_from_response(response.text)
            if json_data:
                logger.info("Successfully extracted structured JSON data")
            else:
                logger.warning("Could not extract structured JSON data from response")

            result = {
                "success": True,
                "raw_response": response.text,
                "structured_data": json_data,
                "file_name": file_name,
                "mime_type": mime_type
            }

            logger.info("Paper analysis completed successfully")
            return result

        except HTTPException:
            logger.error("HTTPException occurred during paper analysis")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during paper analysis: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error calling Gemini API: {str(e)}"
            )


# Global service instance
logger.info("Creating global paper_review_service instance...")
paper_review_service = PaperReviewService()
