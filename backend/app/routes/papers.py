from fastapi import APIRouter, HTTPException
from typing import Any, Dict, List
from ..services.research_client import api_client
from ..store import find_recent, update_many

router = APIRouter()

@router.get("/test-doi/{doi:path}")
async def test_doi_lookup(doi: str, source: str = "semantic_scholar"):
    try:
        paper = await api_client.get_paper_by_doi(doi, source=source)
        return {"doi": doi, "source": source, "found": bool(paper), "paper": paper if paper else None}
    except Exception as e:
        return {"doi": doi, "source": source, "found": False, "error": str(e)}

@router.get("/paper/{paper_id}/details")
async def get_paper_details(paper_id: str):
    try:
        paper = await api_client.get_paper_by_doi(paper_id, source="semantic_scholar")
        if not paper:
            paper = await api_client.get_paper_by_doi(paper_id, source="openalex")
        if paper:
            return {"paper": paper, "success": True}
        raise HTTPException(status_code=404, detail=f"Paper with ID '{paper_id}' not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving paper details: {str(e)}")

@router.post("/update-citations")
async def update_citations_batch(request: Dict[str, Any]):
    """Update citation counts for a batch of papers"""
    try:
        papers = request.get('papers', [])
        if not papers:
            # If no papers provided, get recent papers from database
            papers = await find_recent('papers', 50)

        if not papers:
            raise HTTPException(status_code=400, detail="No papers found to update")

        updated_papers = await api_client.batch_update_citations(papers)

        # Update papers in database if they have _id field
        papers_to_update = [p for p in updated_papers if p.get('_id')]
        if papers_to_update:
            await update_many('papers', papers_to_update)

        # Calculate enhanced statistics
        total_citations = sum(p.get('citationCount', 0) for p in updated_papers)
        papers_with_citations = len([p for p in updated_papers if p.get('citationCount', 0) > 0])
        avg_citations = total_citations / len(updated_papers) if updated_papers else 0
        max_citations = max((p.get('citationCount', 0) for p in updated_papers), default=0)

        # Citation distribution
        citation_ranges = {
            "0_citations": len([p for p in updated_papers if p.get('citationCount', 0) == 0]),
            "1_10_citations": len([p for p in updated_papers if 1 <= p.get('citationCount', 0) <= 10]),
            "11_50_citations": len([p for p in updated_papers if 11 <= p.get('citationCount', 0) <= 50]),
            "51_100_citations": len([p for p in updated_papers if 51 <= p.get('citationCount', 0) <= 100]),
            "100_plus_citations": len([p for p in updated_papers if p.get('citationCount', 0) > 100])
        }

        return {
            "success": True,
            "papers_processed": len(updated_papers),
            "papers_with_citations": papers_with_citations,
            "total_citations": total_citations,
            "avg_citations": round(avg_citations, 2),
            "max_citations": max_citations,
            "citation_distribution": citation_ranges,
            "updated_papers": updated_papers[:10]  # Return first 10 as sample
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Citation update failed: {str(e)}")

@router.get("/stats/enhanced")
async def get_enhanced_stats():
    """Get enhanced statistics from recent papers"""
    try:
        papers = await find_recent('papers', 100)
        if not papers:
            return {"error": "No papers found"}

        # Calculate comprehensive statistics
        total_papers = len(papers)
        total_citations = sum(p.get('citationCount', 0) for p in papers)
        papers_with_citations = len([p for p in papers if p.get('citationCount', 0) > 0])
        avg_citations = total_citations / total_papers if total_papers else 0
        max_citations = max((p.get('citationCount', 0) for p in papers), default=0)

        # Year distribution
        years = [p.get('year', 0) for p in papers if p.get('year', 0) > 1900]
        year_range = {"min": min(years), "max": max(years)} if years else {"min": 0, "max": 0}

        # Citation distribution
        citation_dist = {
            "0_citations": len([p for p in papers if p.get('citationCount', 0) == 0]),
            "1_10_citations": len([p for p in papers if 1 <= p.get('citationCount', 0) <= 10]),
            "11_50_citations": len([p for p in papers if 11 <= p.get('citationCount', 0) <= 50]),
            "51_100_citations": len([p for p in papers if 51 <= p.get('citationCount', 0) <= 100]),
            "100_plus_citations": len([p for p in papers if p.get('citationCount', 0) > 100])
        }

        # Author and venue analysis
        from collections import Counter
        all_authors = []
        venues = []
        for p in papers:
            authors = p.get('authors', [])
            if isinstance(authors, list):
                for author in authors:
                    if isinstance(author, dict):
                        name = author.get('name', '')
                    else:
                        name = str(author)
                    if name and name != 'Unknown authors':
                        all_authors.append(name)
            venue = p.get('venue', '')
            if venue and venue != 'Unknown Venue':
                venues.append(venue)

        top_authors = dict(Counter(all_authors).most_common(10))
        top_venues = dict(Counter(venues).most_common(10))

        return {
            "total_papers": total_papers,
            "total_citations": total_citations,
            "papers_with_citations": papers_with_citations,
            "avg_citations": round(avg_citations, 2),
            "max_citations": max_citations,
            "year_range": year_range,
            "citation_distribution": citation_dist,
            "top_authors": top_authors,
            "top_venues": top_venues,
            "citation_health": {
                "percentage_with_citations": round((papers_with_citations / total_papers) * 100, 1) if total_papers else 0,
                "highly_cited_papers": len([p for p in papers if p.get('citationCount', 0) > 100]),
                "recent_papers": len([p for p in papers if p.get('year', 0) >= 2020])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats calculation failed: {str(e)}")
