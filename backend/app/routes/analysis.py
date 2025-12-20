from fastapi import APIRouter, HTTPException, Response
from typing import Dict, Any
from datetime import datetime
import uuid
import json
import logging

logger = logging.getLogger(__name__)

from ..store import insert_one, count_documents, find_recent, aggregate
from ..services.trends import trend_analyzer
from ..services.citations import citation_analyzer
from ..services.visualization import visualization_generator
from ..services.research_client import api_client

router = APIRouter()

@router.post("/analyze/trends")
async def analyze_trends(request: Dict[str, Any]):
    """Basic trends analysis endpoint that frontend expects"""
    papers = request.get('papers', [])
    if not papers:
        raise HTTPException(status_code=400, detail="No papers provided")

    analysis = await trend_analyzer.analyze_comprehensive_trends(papers)
    viz = visualization_generator.generate_trend_charts(papers)
    analysis_id = str(uuid.uuid4())

    doc = {
        '_id': analysis_id,
        'type': 'trend_analysis',
        'analysis': analysis,
        'visualization_data': viz,
        'paper_count': len(papers),
        'timestamp': datetime.now().isoformat()
    }
    await insert_one('analysis', doc)

    return {
        "analysis_id": analysis_id,
        "analysis": analysis,
        "visualization_data": viz,
        "paper_count": len(papers)
    }

@router.post("/analyze/citations")
async def analyze_citations(request: Dict[str, Any]):
    """Basic citations analysis endpoint that frontend expects"""
    papers = request.get('papers', [])
    dois = request.get('dois', [])

    # If DOIs are provided, fetch the papers with citation data
    if dois:
        data_source = request.get('data_source', 's2')
        source_map = {"s2": "semantic_scholar", "oa": "openalex", "oc": "opencitations"}
        source = source_map.get(data_source, "semantic_scholar")

        fetched_papers = []
        for doi in dois:
            paper = await api_client.get_paper_by_doi(doi, source=source)
            if not paper and source != "semantic_scholar":
                paper = await api_client.get_paper_by_doi(doi, source="semantic_scholar")
            if not paper:
                paper = await api_client.get_paper_by_doi(doi, source="openalex")

            if paper:
                # Fetch references and citations to enrich the data
                paper_id = paper.get('paperId') or paper.get('id')
                if paper_id:
                    max_references = request.get('max_references', 50)
                    max_citations = request.get('max_citations', 50)

                    if max_references > 0:
                        refs_data = await api_client.fetch_paper_references(paper_id, source=source)
                        references = refs_data.get('references', [])
                        fetched_papers.extend(references[:max_references])

                    if max_citations > 0:
                        cits_data = await api_client.fetch_paper_citations(paper_id, source=source)
                        citations = cits_data.get('citations', [])
                        fetched_papers.extend(citations[:max_citations])

                fetched_papers.append(paper)

        # Use fetched papers if we got any
        if fetched_papers:
            papers = fetched_papers
    elif papers:
        # If no DOIs but papers are provided, try to enrich them with citation data
        # by using their IDs or DOIs from the paper objects themselves
        max_references = request.get('max_references', 50)
        max_citations = request.get('max_citations', 50)
        data_source = request.get('data_source', 's2')
        source_map = {"s2": "semantic_scholar", "oa": "openalex", "oc": "opencitations"}
        source = source_map.get(data_source, "semantic_scholar")

        enriched_papers = []

        # Try to fetch citation data for papers that have DOI or paperId
        for paper in papers[:10]:  # Limit to first 10 to avoid timeout
            paper_doi = paper.get('doi')
            paper_id = paper.get('paperId') or paper.get('id')

            if paper_doi and (max_references > 0 or max_citations > 0):
                # Fetch full paper data with citations
                try:
                    full_paper = await api_client.get_paper_by_doi(paper_doi, source=source)
                    if full_paper:
                        paper_id = full_paper.get('paperId') or full_paper.get('id')
                        if paper_id:
                            if max_references > 0:
                                refs_data = await api_client.fetch_paper_references(paper_id, source=source)
                                references = refs_data.get('references', [])
                                enriched_papers.extend(references[:max_references])

                            if max_citations > 0:
                                cits_data = await api_client.fetch_paper_citations(paper_id, source=source)
                                citations = cits_data.get('citations', [])
                                enriched_papers.extend(citations[:max_citations])

                        enriched_papers.append(full_paper)
                    else:
                        # If we couldn't fetch, keep original paper
                        enriched_papers.append(paper)
                except Exception as e:
                    logger.error(f"Error fetching paper {paper_doi}: {e}")
                    enriched_papers.append(paper)
            elif paper_id and (max_references > 0 or max_citations > 0):
                # Try using the paper ID directly
                try:
                    if max_references > 0:
                        refs_data = await api_client.fetch_paper_references(paper_id, source=source)
                        references = refs_data.get('references', [])
                        enriched_papers.extend(references[:max_references])

                    if max_citations > 0:
                        cits_data = await api_client.fetch_paper_citations(paper_id, source=source)
                        citations = cits_data.get('citations', [])
                        enriched_papers.extend(citations[:max_citations])

                    enriched_papers.append(paper)
                except Exception as e:
                    logger.error(f"Error fetching citations for paper {paper_id}: {e}")
                    enriched_papers.append(paper)
            else:
                # No DOI or ID, just keep the original paper
                enriched_papers.append(paper)

        # Add remaining papers that we didn't try to enrich
        enriched_papers.extend(papers[10:])
        papers = enriched_papers

    if not papers:
        raise HTTPException(status_code=400, detail="No papers provided or found")

    analysis = citation_analyzer.analyze_advanced_citation_patterns(papers)
    network = visualization_generator.generate_network_data(papers)
    analysis_id = str(uuid.uuid4())

    doc = {
        '_id': analysis_id,
        'type': 'citation_analysis',
        'analysis': analysis,
        'network_data': network,
        'paper_count': len(papers),
        'timestamp': datetime.now().isoformat()
    }
    await insert_one('analysis', doc)

    return {
        "analysis_id": analysis_id,
        "analysis": analysis,
        "network_data": network,
        "paper_count": len(papers)
    }

@router.post("/analyze/trends-advanced")
async def analyze_trends_advanced(request: Dict[str, Any]):
    papers = request.get('papers', [])
    if not papers:
        raise HTTPException(status_code=400, detail="No papers provided")
    analysis = await trend_analyzer.analyze_comprehensive_trends(papers)
    viz = visualization_generator.generate_trend_charts(papers)
    analysis_id = str(uuid.uuid4())
    doc = {
        '_id': analysis_id,
        'type': 'advanced_trend_analysis',
        'analysis': analysis,
        'visualization_data': viz,
        'paper_count': len(papers),
        'timestamp': datetime.now().isoformat()
    }
    await insert_one('analysis', doc)
    return {"analysis_id": analysis_id, "analysis": analysis, "visualization_data": viz, "paper_count": len(papers)}

@router.post("/analyze/citations-advanced")
async def analyze_citations_advanced(request: Dict[str, Any]):
    papers = request.get('papers', [])
    if not papers:
        raise HTTPException(status_code=400, detail="No papers provided")
    analysis = citation_analyzer.analyze_advanced_citation_patterns(papers)
    network = visualization_generator.generate_network_data(papers)
    analysis_id = str(uuid.uuid4())
    doc = {
        '_id': analysis_id,
        'type': 'advanced_citation_analysis',
        'analysis': analysis,
        'network_data': network,
        'paper_count': len(papers),
        'timestamp': datetime.now().isoformat()
    }
    await insert_one('analysis', doc)
    return {"analysis_id": analysis_id, "analysis": analysis, "network_data": network, "paper_count": len(papers)}

@router.post("/export/report")
async def export_analysis_report(request: Dict[str, Any]):
    analysis_ids = request.get('analysis_ids', [])
    fmt = request.get('format', 'json')
    analyses = await find_recent('analysis', 1000, 'timestamp')
    analyses = [a for a in analyses if a.get('_id') in analysis_ids]

    if fmt == 'json':
        report = {
            "report_generated_at": datetime.now().isoformat(),
            "total_analyses": len(analyses),
            "analyses": analyses
        }
        json_data = json.dumps(report, indent=2, default=str)
        return Response(content=json_data, media_type="application/json",
                        headers={"Content-Disposition": "attachment; filename=analysis_report.json"})
    return {"format": fmt, "message": f"Export in {fmt} format is not yet supported.", "analyses_count": len(analyses), "download_ready": False}

@router.get("/analytics/dashboard")
async def get_dashboard_analytics():
    try:
        total_papers = await count_documents('papers')
        total_analyses = await count_documents('analysis')
        recent_searches = await find_recent('papers', 10, 'retrieved_at')
        recent_analyses = await find_recent('analysis', 10, 'timestamp')
        query_pipeline = [
            {"$match": {"search_query": {"$ne": None}}},
            {"$group": {"_id": "$search_query", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        popular_queries = await aggregate('papers', query_pipeline)
        analysis_type_pipeline = [
            {"$group": {"_id": "$type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        analysis_types = await aggregate('analysis', analysis_type_pipeline)
        return {
            "overview": {
                "total_papers": total_papers,
                "total_analyses": total_analyses,
                "recent_activity": len(recent_searches) + len(recent_analyses)
            },
            "recent_searches": [{"query": p.get("search_query", ""), "timestamp": p.get("retrieved_at", ""), "source": p.get("source", "")} for p in recent_searches],
            "popular_queries": [{"query": i.get("_id", ""), "count": i.get("count", 0)} for i in popular_queries if i.get("_id")],
            "analysis_types": [{"type": i.get("_id", ""), "count": i.get("count", 0)} for i in analysis_types if i.get("_id")]
        }
    except Exception as e:
        logger.error(f"Dashboard analytics error: {e}")
        return {"overview": {"total_papers": 0, "total_analyses": 0, "recent_activity": 0}, "recent_searches": [], "popular_queries": [], "analysis_types": []}

@router.get("/recent-analyses")
async def get_recent_analyses(limit: int = 20):
    try:
        analyses = await find_recent('analysis', limit, 'timestamp')
        # If using bson ObjectId, convert here (omitted to avoid hard dependency)
        for a in analyses:
            if '_id' in a and not isinstance(a['_id'], str):
                a['_id'] = str(a['_id'])
        return {"analyses": analyses}
    except Exception as e:
        logger.error(f"Recent analyses error: {e}")
        return {"analyses": []}