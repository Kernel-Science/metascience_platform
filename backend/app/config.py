import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY not set in environment variables")

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not set in environment variables")

# AI Model Configuration (Current as of Dec 2025)
ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929"  # Claude 4.5 Sonnet

RESEARCH_CATEGORIES = {
    'physics': ['quantum physics', 'condensed matter', 'particle physics', 'astrophysics', 'nuclear physics'],
    'computer_science': ['machine learning', 'artificial intelligence', 'algorithms', 'computer vision', 'nlp'],
    'mathematics': ['pure mathematics', 'applied mathematics', 'statistics', 'optimization', 'number theory'],
    'biology': ['molecular biology', 'genetics', 'bioinformatics', 'neuroscience', 'biochemistry'],
    'chemistry': ['organic chemistry', 'physical chemistry', 'materials science', 'chemical engineering'],
    'engineering': ['electrical engineering', 'mechanical engineering', 'civil engineering', 'biomedical engineering']
}