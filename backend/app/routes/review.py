from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Dict, Any
from ..services.paper_review import paper_review_service
from ..services.reviewer3 import reviewer3_service, Reviewer3Error
from ..config import GEMINI_REVIEW_MODEL
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/review/upload")
async def review_paper_upload(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Upload and review a paper file (PDF, LaTeX, text, etc.)
    Returns structured review data with scores and analysis
    """
    try:
        logger.info(f"Received file upload request: {file.filename}")
        logger.info(f"File content type: {file.content_type}")
        logger.info(f"File size: {file.size if hasattr(file, 'size') else 'unknown'}")

        # Validate file type
        allowed_extensions = {'pdf', 'tex', 'txt', 'docx', 'md'}
        file_extension = file.filename.split('.')[-1].lower() if file.filename else ''
        logger.info(f"File extension: {file_extension}")

        if file_extension not in allowed_extensions:
            logger.warning(f"File type '{file_extension}' not supported")
            raise HTTPException(
                status_code=400,
                detail=f"File type '{file_extension}' not supported. Allowed types: {', '.join(allowed_extensions)}"
            )

        # Read file content
        logger.info("Reading file content...")
        file_content = await file.read()
        logger.info(f"File content read successfully, size: {len(file_content)} bytes")

        if not file_content:
            logger.warning("Empty file provided")
            raise HTTPException(
                status_code=400,
                detail="Empty file provided"
            )

        # Analyze the paper
        logger.info("Starting paper analysis...")
        result = await paper_review_service.analyze_paper(
            file_content=file_content,
            file_name=file.filename,
            content_type=file.content_type
        )

        logger.info("Paper analysis completed successfully")
        return result

    except HTTPException as http_exc:
        logger.error(f"HTTP Exception in upload endpoint: {http_exc.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in upload endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )

# --- Reviewer3: external multi-reviewer peer review -----------------------
# Async flow: upload returns a session_id immediately; the client polls the
# GET endpoint until status is "completed" (comments populated) or "error".

@router.post("/review/reviewer3/upload")
async def reviewer3_upload(
    file: UploadFile = File(...),
    review_mode: str = Form("author"),
) -> Dict[str, Any]:
    """
    Submit a PDF to Reviewer3 for multi-reviewer peer review (fire-and-forget).
    Returns the session_id to poll for status and comments.
    """
    file_extension = file.filename.split('.')[-1].lower() if file.filename else ''
    if file_extension != 'pdf':
        raise HTTPException(
            status_code=400,
            detail="Reviewer3 only accepts PDF files"
        )

    file_content = await file.read()
    if not file_content:
        raise HTTPException(status_code=400, detail="Empty file provided")

    try:
        logger.info(f"Submitting {file.filename} to Reviewer3 (mode={review_mode})")
        result = await reviewer3_service.submit_review(
            file_content=file_content,
            filename=file.filename or "paper.pdf",
            title=(file.filename or "paper.pdf").rsplit('.', 1)[0],
            review_mode=review_mode,
        )
        return {"success": True, "status": "waiting", **result}
    except Reviewer3Error as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.get("/review/reviewer3/{session_id}")
async def reviewer3_status(session_id: str) -> Dict[str, Any]:
    """
    Poll a Reviewer3 session: status (waiting/processing/completed/error)
    plus ranked comments once completed.
    """
    try:
        return await reviewer3_service.get_review(session_id)
    except Reviewer3Error as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.delete("/review/reviewer3/{session_id}")
async def reviewer3_delete(session_id: str) -> Dict[str, Any]:
    """Permanently delete a Reviewer3 session and its data."""
    try:
        return await reviewer3_service.delete_review(session_id)
    except Reviewer3Error as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.post("/review/reviewer3/{session_id}/share")
async def reviewer3_share(session_id: str) -> Dict[str, Any]:
    """Generate (or rotate) a password-protected share URL for a session."""
    try:
        return await reviewer3_service.create_share_link(session_id)
    except Reviewer3Error as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.get("/review/config")
async def get_review_config() -> Dict[str, str]:
    """
    Get the current system prompt and user prompt used for paper reviews
    """
    try:
        logger.info("Retrieving review configuration...")
        service = paper_review_service
        system_content = service._read_config_file('system.txt')
        prompt_content = service._read_config_file('prompt.txt')
        logger.info("Review configuration retrieved successfully")

        return {
            "system_prompt": system_content,
            "user_prompt": prompt_content
        }
    except Exception as e:
        logger.error(f"Error reading configuration: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error reading configuration: {str(e)}"
        )

@router.get("/review/health")
async def review_health_check() -> Dict[str, Any]:
    """
    Health check endpoint for the review service
    """
    try:
        logger.info("Performing health check...")
        # Try to read config files to ensure they exist
        service = paper_review_service
        service._read_config_file('system.txt')
        service._read_config_file('prompt.txt')
        logger.info("Health check passed")

        return {
            "status": "healthy",
            "service": "paper_review",
            "model": GEMINI_REVIEW_MODEL,
            "reviewer3": {
                "configured": reviewer3_service.is_configured,
                "missing": reviewer3_service.missing_config,
            },
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "paper_review",
            "error": str(e)
        }
