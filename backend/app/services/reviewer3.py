"""Client for the Reviewer3 manuscript-review API (https://reviewer3.com).

Reviewer3 runs a panel of LLM reviewers over an uploaded PDF and returns
ranked, severity-tiered comments. The flow is asynchronous:

    POST /api/internal/review              -> sessionId (fire-and-forget)
    GET  /api/internal/review/{sessionId}  -> status: waiting | processing |
                                              completed | error; `comments`
                                              populated once completed

Auth is a service-account key sent in the `x-api-key` header. Submissions
must also name the Reviewer3 user (REVIEWER3_USER_ID) that owns the review;
our key has review:create/read/delete + share:write but NOT user:read or
user:create, so that id has to be provisioned out-of-band by the Reviewer3
team. Without it the service reports itself unconfigured.
"""

import asyncio
import logging
from typing import Any, Dict, Optional

import httpx

from ..config import REVIEWER3_API_KEY, REVIEWER3_BASE_URL, REVIEWER3_USER_ID

logger = logging.getLogger(__name__)

# Reviewer3 severity tiers (1 is most severe).
SEVERITY_LABELS = {1: "critical", 2: "major", 3: "minor", 4: "editorial"}

REVIEW_MODES = {"author", "journal"}

# Submission returns a session id near-instantly (~1s) when healthy; it only
# covers the upload + extraction kickoff, not the review itself. Cap it well
# above the healthy latency but low enough that an upstream hang fails fast and
# the user can retry, rather than stalling for minutes. Polling is cheap.
SUBMIT_TIMEOUT_S = 90.0
POLL_TIMEOUT_S = 30.0

# --- Resilience: retry transient upstream failures with backoff ------------
# Connection never reached the server (or the request was never sent), so a
# retry can never duplicate work — safe even for non-idempotent submissions.
_CONNECT_ERRORS = (httpx.ConnectError, httpx.ConnectTimeout, httpx.PoolTimeout)
# The request may have been delivered; only retry these when the caller says
# the operation is idempotent (GET/DELETE/share), never for a submission that
# could otherwise create a duplicate (quota-charged) review.
_INFLIGHT_ERRORS = (
    httpx.ReadTimeout,
    httpx.ReadError,
    httpx.WriteError,
    httpx.RemoteProtocolError,
)
# Transient upstream statuses (Google Frontend / gateway hiccups, rate limits).
RETRYABLE_STATUS = {429, 502, 503, 504}
MAX_ATTEMPTS = 3
BACKOFF_BASE_S = 0.5


class Reviewer3Error(Exception):
    """Reviewer3 API failure with the upstream HTTP status preserved."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def _error_message(response: httpx.Response) -> str:
    """Pull the {error, details?} body Reviewer3 returns; fall back to text."""
    try:
        body = response.json()
        msg = body.get("error") or str(body)
        if body.get("details"):
            msg = f"{msg}: {body['details']}"
        return msg
    except Exception:
        return response.text[:300] or f"HTTP {response.status_code}"


def _unreachable_message(exc: Exception) -> str:
    """Human-readable message for a transport-level failure reaching Reviewer3.

    httpx timeout exceptions stringify to empty, which previously produced the
    bare, confusing 'Could not reach Reviewer3: '. Name the timeout explicitly
    and steer the user toward a retry.
    """
    if isinstance(exc, httpx.TimeoutException):
        return (
            "Reviewer3 did not respond in time (request timed out). This is "
            "usually transient — please try again."
        )
    detail = str(exc).strip()
    return f"Could not reach Reviewer3: {detail}" if detail else "Could not reach Reviewer3"


def _parse_json_body(response: httpx.Response, *, context: str) -> Dict[str, Any]:
    """Parse Reviewer3 JSON responses or raise a clear service error."""
    try:
        return response.json()
    except ValueError:
        body_text = response.text[:1000]
        logger.error(
            "Reviewer3 returned a non-JSON response while %s: %s",
            context,
            body_text,
        )
        raise Reviewer3Error(
            f"Reviewer3 returned an unexpected response while {context}",
            502,
        )


class Reviewer3Service:
    def __init__(self) -> None:
        self.api_key = REVIEWER3_API_KEY
        self.user_id = REVIEWER3_USER_ID
        self.base_url = REVIEWER3_BASE_URL.rstrip("/")

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.user_id)

    @property
    def missing_config(self) -> Optional[str]:
        """Human-readable reason the service is unavailable, or None."""
        if not self.api_key:
            return "REVIEWER3_API_KEY is not set"
        if not self.user_id:
            return (
                "REVIEWER3_USER_ID is not set (the usr_... id must be "
                "provisioned by the Reviewer3 team)"
            )
        return None

    def _headers(self) -> Dict[str, str]:
        return {"x-api-key": self.api_key or ""}

    def _ensure_configured(self, for_submission: bool = False) -> None:
        # Reads/deletes/shares only need the key; submissions also need the
        # owning user id.
        reason = self.missing_config if for_submission else (
            "REVIEWER3_API_KEY is not set" if not self.api_key else None
        )
        if reason:
            raise Reviewer3Error(f"Reviewer3 is not configured: {reason}", 503)

    async def _request(
        self,
        method: str,
        path: str,
        *,
        timeout: float = POLL_TIMEOUT_S,
        idempotent: bool = True,
        **kwargs: Any,
    ) -> httpx.Response:
        """Call the Reviewer3 API, retrying transient failures with backoff.

        ``idempotent`` must be False for operations that must not be repeated
        on a partial failure (a submission could otherwise create a duplicate,
        quota-charged review). For those, only pre-flight connection failures —
        which provably never reached the server — are retried.
        """
        self._ensure_configured()
        url = f"{self.base_url}{path}"

        for attempt in range(MAX_ATTEMPTS):
            is_last = attempt == MAX_ATTEMPTS - 1
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.request(
                        method, url, headers=self._headers(), **kwargs
                    )
            except _CONNECT_ERRORS as exc:
                # Never reached the server — always safe to retry.
                if is_last:
                    logger.error(f"Reviewer3 unreachable: {method} {path}: {exc!r}")
                    raise Reviewer3Error(_unreachable_message(exc), 502)
                await self._backoff(attempt, method, path, f"connect error: {exc!r}")
                continue
            except _INFLIGHT_ERRORS as exc:
                if idempotent and not is_last:
                    await self._backoff(attempt, method, path, f"transport error: {exc!r}")
                    continue
                logger.error(f"Reviewer3 request failed: {method} {path}: {exc!r}")
                raise Reviewer3Error(_unreachable_message(exc), 502)
            except httpx.HTTPError as exc:
                logger.error(f"Reviewer3 request failed: {method} {path}: {exc!r}")
                raise Reviewer3Error(_unreachable_message(exc), 502)

            if (
                response.status_code in RETRYABLE_STATUS
                and idempotent
                and not is_last
            ):
                await self._backoff(
                    attempt, method, path, f"HTTP {response.status_code}"
                )
                continue

            if response.status_code >= 400:
                message = _error_message(response)
                logger.error(
                    f"Reviewer3 error {response.status_code} on {method} {path}: {message}"
                )
                # Pass 4xx through (auth, ownership, validation); mask 5xx as 502.
                status = response.status_code if response.status_code < 500 else 502
                raise Reviewer3Error(message, status)
            return response

        # Unreachable: the loop either returns or raises on the final attempt.
        raise Reviewer3Error("Could not reach Reviewer3", 502)

    @staticmethod
    async def _backoff(attempt: int, method: str, path: str, reason: str) -> None:
        delay = BACKOFF_BASE_S * (2 ** attempt)
        logger.warning(
            f"Reviewer3 {method} {path} retry {attempt + 1}/{MAX_ATTEMPTS} "
            f"in {delay:.1f}s ({reason})"
        )
        await asyncio.sleep(delay)

    async def submit_review(
        self,
        file_content: bytes,
        filename: str,
        title: Optional[str] = None,
        review_mode: str = "author",
    ) -> Dict[str, Any]:
        """Upload a PDF and start review orchestration. Returns the session id."""
        self._ensure_configured(for_submission=True)
        if review_mode not in REVIEW_MODES:
            raise Reviewer3Error(
                f"reviewMode must be one of {sorted(REVIEW_MODES)}", 400
            )

        data = {
            "userId": self.user_id,
            "filename": filename,
            "reviewMode": review_mode,
        }
        if title:
            data["title"] = title

        response = await self._request(
            "POST",
            "/api/internal/review",
            timeout=SUBMIT_TIMEOUT_S,
            # A submission charges quota and creates a session; only retry it on
            # pre-flight connection failures, never after the request was sent.
            idempotent=False,
            files={"file": (filename, file_content, "application/pdf")},
            data=data,
        )
        body = _parse_json_body(response, context="submitting the review")
        logger.info(f"Reviewer3 session created: {body.get('sessionId')}")
        return {"session_id": body.get("sessionId"), "review_mode": review_mode}

    async def get_review(self, session_id: str) -> Dict[str, Any]:
        """Poll a review session; comments are populated once status=completed."""
        response = await self._request(
            "GET", f"/api/internal/review/{session_id}"
        )
        body = _parse_json_body(response, context="polling the review status")
        session = body.get("session") or {}
        comments = [
            {
                "reviewer_id": c.get("reviewerId"),
                "title": c.get("title"),
                "comment": c.get("comment"),
                "cited_text": c.get("citedText"),
                "severity": c.get("severity"),
                "severity_label": SEVERITY_LABELS.get(c.get("severity")),
                "rank": c.get("rank"),
            }
            for c in body.get("comments") or []
        ]
        comments.sort(key=lambda c: (c["rank"] is None, c["rank"]))
        # Undocumented but present: per-stage pipeline progress (pdf-extraction,
        # reviewer1..3, proof-verifier, comment-post-processor, ...).
        stages = [
            {"stage_id": s.get("stageId"), "status": s.get("status")}
            for s in body.get("stages") or []
        ]
        return {
            "session_id": session.get("id", session_id),
            "title": session.get("title"),
            "review_mode": session.get("reviewMode"),
            "created_at": session.get("createdAt"),
            "status": body.get("status"),
            "stages": stages,
            "comments": comments,
        }

    async def delete_review(self, session_id: str) -> Dict[str, Any]:
        await self._request("DELETE", f"/api/internal/review/{session_id}")
        return {"success": True}

    async def create_share_link(self, session_id: str) -> Dict[str, Any]:
        """Generate (or rotate) the password-protected share URL for a session."""
        response = await self._request(
            "POST", f"/api/internal/review/{session_id}/share"
        )
        body = _parse_json_body(response, context="creating the share link")
        return {"url": body.get("url")}


reviewer3_service = Reviewer3Service()
