import os
from dotenv import load_dotenv

# override=True so the project's .env wins over stale/empty values already
# exported in the shell (e.g. an empty ANTHROPIC_API_KEY) during local dev.
# In production there is no .env file, so platform env vars are untouched.
load_dotenv(override=True)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY not set in environment variables")

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not set in environment variables")

# --- AI model configuration ----------------------------------------------
# Prefer rolling "latest" aliases over pinned dated snapshots so we track the
# newest models without code edits; both are overridable via env.
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")  # latest Sonnet
GEMINI_REVIEW_MODEL = os.environ.get("GEMINI_REVIEW_MODEL", "gemini-flash-latest")

# --- Reviewer3 (external multi-reviewer peer review) ----------------------
# Service-account key for the Reviewer3 internal API (x-api-key header).
# Optional; the Reviewer3 review mode is disabled when absent.
REVIEWER3_API_KEY = os.environ.get("REVIEWER3_API_KEY")
# Reviewer3 user id (usr_...) that owns submitted reviews. Required for
# submissions: our key has review:* permissions but not user:read/user:create,
# so the id must be provisioned out-of-band by the Reviewer3 team.
REVIEWER3_USER_ID = os.environ.get("REVIEWER3_USER_ID")
REVIEWER3_BASE_URL = os.environ.get("REVIEWER3_BASE_URL", "https://reviewer3.com")

# --- Literature source configuration -------------------------------------
# OpenAlex "polite pool": just an email, no signup. Gives far higher rate
# limits and is the recommended way to query OpenAlex politely.
OPENALEX_MAILTO = os.environ.get("OPENALEX_MAILTO")  # e.g. "you@example.org"

# Semantic Scholar API key (free on request). Optional but strongly
# recommended: lifts unauthenticated rate limits dramatically. Accept the
# bare SEMANTIC_SCHOLAR_API name too, since that's easy to mistype.
SEMANTIC_SCHOLAR_API_KEY = (
    os.environ.get("SEMANTIC_SCHOLAR_API_KEY")
    or os.environ.get("SEMANTIC_SCHOLAR_API")
)

# NASA ADS API token (free with an ADS account). Enables the astro/cosmology
# source. Optional; the ADS connector is skipped when absent.
ADS_API_TOKEN = os.environ.get("ADS_API_TOKEN")

# --- Semantic rerank configuration ---------------------------------------
# How candidates are reranked for relevance:
#   "auto"      -> try embeddings (Google), fall back to Anthropic LLM rerank
#   "google"    -> Google embeddings only
#   "anthropic" -> Anthropic LLM rerank only (works without Google billing)
#   "none"      -> disable reranking (source ranking / citation sort)
RERANK_PROVIDER = os.environ.get("RERANK_PROVIDER", "auto").lower()
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "gemini-embedding-001")
# Back-compat: previously toggled via EMBEDDING_PROVIDER=none.
EMBEDDING_PROVIDER = os.environ.get("EMBEDDING_PROVIDER", "google").lower()

# Default number of candidates to over-fetch per source before merge/rerank.
SEARCH_CANDIDATES_PER_SOURCE = int(os.environ.get("SEARCH_CANDIDATES_PER_SOURCE", "120"))

# Weight for the "hybrid" sort (relevance + citation impact blend):
#   score = alpha * relevance_norm + (1 - alpha) * citations_norm
# 1.0 = pure relevance, 0.0 = pure impact. 0.7 = mostly on-topic, impact breaks ties.
RELEVANCE_BLEND_ALPHA = float(os.environ.get("RELEVANCE_BLEND_ALPHA", "0.7"))

RESEARCH_CATEGORIES = {
    'physics': ['quantum physics', 'condensed matter', 'particle physics', 'astrophysics', 'nuclear physics'],
    'computer_science': ['machine learning', 'artificial intelligence', 'algorithms', 'computer vision', 'nlp'],
    'mathematics': ['pure mathematics', 'applied mathematics', 'statistics', 'optimization', 'number theory'],
    'biology': ['molecular biology', 'genetics', 'bioinformatics', 'neuroscience', 'biochemistry'],
    'chemistry': ['organic chemistry', 'physical chemistry', 'materials science', 'chemical engineering'],
    'engineering': ['electrical engineering', 'mechanical engineering', 'civil engineering', 'biomedical engineering']
}