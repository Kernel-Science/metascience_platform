from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..services.research_client import api_client, arxiv
from ..services.nlq import convert_natural_language_to_query

router = APIRouter()

@router.get("/test-arxiv")
async def test_arxiv_search(query: str = "quantum computing"):
    try:
        if not arxiv:
            return {"error": "arxiv package not imported", "arxiv_working": False}
        results = await api_client.search_arxiv_enhanced(query, max_results=5)
        return {
            "query": query,
            "results_count": len(results),
            "results": results[:3] if results else [],
            "arxiv_working": len(results) > 0,
            "sample_result": results[0] if results else None
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc(), "arxiv_working": False}

@router.post("/convert-query")
async def convert_natural_language_query(request: Dict[str, Any]):
    try:
        natural_language = (request.get('natural_language') or '').strip()
        if not natural_language:
            raise HTTPException(status_code=400, detail="Natural language description is required")
        result = await convert_natural_language_to_query(natural_language)
        return {"success": True, "conversion": result, "original_input": natural_language}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")