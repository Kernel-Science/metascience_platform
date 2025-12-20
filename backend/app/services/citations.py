from collections import defaultdict, Counter
import logging

logger = logging.getLogger(__name__)

class SophisticatedCitationAnalyzer:
    def analyze_advanced_citation_patterns(self, papers: List[Dict]) -> Dict[str, Any]:
        try:
            author_papers = defaultdict(list)
            author_citations = defaultdict(int)
            collaboration = defaultdict(lambda: defaultdict(int))
            citation_timeline = defaultdict(list)

            # Calculate comprehensive stats
            total_papers = len(papers)
            all_citations = []
            years = []
            venues = []
            concepts = []
            yearly_dist = defaultdict(int)

            for p in papers:
                authors = p.get('authors', [])
                cits = p.get('citationCount', 0) or 0
                all_citations.append(cits)
                y = p.get('year') or 0  # Handle None values from API

                # Collect year data
                if y and y > 1900:
                    years.append(y)
                    yearly_dist[y] += 1

                # Collect venue data
                venue = p.get('venue', '')
                if venue and venue != 'Unknown Venue':
                    venues.append(venue)

                # Collect concepts/keywords
                paper_concepts = p.get('concepts', []) or p.get('fieldsOfStudy', [])
                if isinstance(paper_concepts, list):
                    for concept in paper_concepts:
                        if isinstance(concept, dict):
                            concept_name = concept.get('name', '')
                        else:
                            concept_name = str(concept)
                        if concept_name:
                            concepts.append(concept_name)

                # Process authors
                author_list = []
                if isinstance(authors, list):
                    for author in authors:
                        if isinstance(author, dict):
                            author_name = author.get('name', '')
                        else:
                            author_name = str(author)
                        if author_name and author_name != 'Unknown authors':
                            author_list.append(author_name)

                for a in author_list:
                    author_papers[a].append({'title': p.get('title', ''), 'citations': cits, 'year': y, 'venue': p.get('venue', '')})
                    author_citations[a] += cits
                    citation_timeline[a].append((y, cits))

                for i, a1 in enumerate(author_list):
                    for j, a2 in enumerate(author_list):
                        if i != j:
                            collaboration[a1][a2] += 1

            # Calculate citation statistics
            total_citations = sum(all_citations)
            avg_citations = total_citations / total_papers if total_papers else 0
            sorted_citations = sorted(all_citations)
            median_citations = sorted_citations[len(sorted_citations)//2] if sorted_citations else 0
            max_citations = max(all_citations) if all_citations else 0

            # Citation distribution
            citation_distribution = {
                "0_citations": len([c for c in all_citations if c == 0]),
                "1_10_citations": len([c for c in all_citations if 1 <= c <= 10]),
                "11_50_citations": len([c for c in all_citations if 11 <= c <= 50]),
                "51_100_citations": len([c for c in all_citations if 51 <= c <= 100]),
                "100_plus_citations": len([c for c in all_citations if c > 100])
            }

            papers_with_citations = len([c for c in all_citations if c > 0])
            highly_cited_papers = len([c for c in all_citations if c > 100])

            # Year statistics
            from datetime import datetime
            current_year = datetime.now().year
            recent_papers = len([y for y in years if y >= 2020])
            year_range = {"min": min(years), "max": max(years)} if years else {"min": 0, "max": 0}

            # Top authors and venues
            top_authors_list = [author for author, _ in Counter(author_citations).most_common(5)]
            top_venues_list = [venue for venue, _ in Counter(venues).most_common(5)]
            top_concepts_list = [concept for concept, _ in Counter(concepts).most_common(10)]

            # Citation farms detection
            farms = []
            for author, paps in author_papers.items():
                if len(paps) >= 3:
                    total_cits = sum(p['citations'] for p in paps)
                    avg_cits = total_cits / len(paps)
                    if avg_cits > 50 and total_cits > 200:
                        collabs = collaboration.get(author, {})
                        freq_collabs = [k for k, v in collabs.items() if v >= 2]
                        if len(freq_collabs) >= 2:
                            farms.append({
                                "type": "high_velocity_cluster",
                                "primary_author": author,
                                "paper_count": len(paps),
                                "total_citations": total_cits,
                                "avg_citations": round(avg_cits, 2),
                                "collaborators": freq_collabs[:5],
                                "risk_score": min(100, int((avg_cits / 10) + (len(freq_collabs) * 5)))
                            })

            for a1, collabs1 in collaboration.items():
                if len(collabs1) >= 3:
                    interconnected = []
                    for a2, count in collabs1.items():
                        if count >= 2:
                            collabs2 = collaboration.get(a2, {})
                            mutual = set(collabs1) & set(collabs2)
                            if len(mutual) >= 2:
                                interconnected.append(a2)
                    if len(interconnected) >= 2:
                        group = [a1] + interconnected[:4]
                        farms.append({"type": "circular_citation_network", "authors": group, "risk_score": len(group) * 15})

            for a, timeline in citation_timeline.items():
                if len(timeline) >= 3:
                    # Filter out entries with invalid years (None or 0) before sorting
                    valid_timeline = [(y, c) for y, c in timeline if y and y > 1900]
                    if not valid_timeline:
                        continue
                    valid_timeline.sort(key=lambda x: x[0])
                    by_year = defaultdict(int)
                    for y, c in valid_timeline:
                        by_year[y] += c
                    if len(by_year) >= 2:
                        vals = list(by_year.values())
                        mx, avg = max(vals), sum(vals)/len(vals)
                        if mx > avg * 3 and mx > 100:
                            peak_year = max(by_year, key=by_year.get)
                            farms.append({
                                "type": "temporal_citation_spike",
                                "author": a,
                                "max_citations_year": peak_year,
                                "spike_magnitude": round(mx / avg, 2),
                                "risk_score": min(100, int((mx / avg) * 10))
                            })

            farms = sorted(farms, key=lambda x: x.get('risk_score', 0), reverse=True)[:10]

            total_authors = len(collaboration)
            total_connections = sum(len(c) for c in collaboration.values())
            avg_connections = total_connections / total_authors if total_authors else 0
            density = total_connections / (total_authors * (total_authors - 1)) if total_authors > 1 else 0
            hubs = sorted([(a, len(c)) for a, c in collaboration.items()], key=lambda x: x[1], reverse=True)[:5]
            network_metrics = {
                "total_connections": total_connections,
                "avg_connections_per_author": round(avg_connections, 2),
                "network_density": round(density, 4),
                "top_hubs": hubs
            }

            yearly_citations = defaultdict(int)
            yearly_papers = defaultdict(int)
            for timeline in citation_timeline.values():
                for y, c in timeline:
                    if y and y > 1900:
                        yearly_citations[y] += c
                        yearly_papers[y] += 1
            timeline_years = sorted(yearly_citations.keys())
            citation_trend = [yearly_citations[y] for y in timeline_years]
            temporal_patterns = {
                "year_range": f"{min(timeline_years)}-{max(timeline_years)}" if timeline_years else "Unknown",
                "total_years": len(timeline_years),
                "peak_citation_year": max(yearly_citations, key=yearly_citations.get) if yearly_citations else None,
                "citation_growth": "increasing" if len(citation_trend) > 1 and citation_trend[-1] > citation_trend[0] else "stable",
                "yearly_breakdown": {str(y): {"citations": yearly_citations[y], "papers": yearly_papers[y]} for y in timeline_years[-5:]}
            }

            return {
                "total_papers": total_papers,
                "processed_papers": total_papers,
                "total_authors": len(author_papers),
                "total_citations": total_citations,
                "avg_citations": round(avg_citations, 2),
                "median_citations": median_citations,
                "max_citations": max_citations,
                "papers_with_citations": papers_with_citations,
                "highly_cited_papers": highly_cited_papers,
                "recent_papers": recent_papers,
                "year_range": year_range,
                "yearly_distribution": dict(sorted(yearly_dist.items(), key=lambda x: x[1], reverse=True)),
                "citation_distribution": citation_distribution,
                "top_authors": top_authors_list,
                "top_venues": top_venues_list,
                "top_concepts": top_concepts_list,
                "citation_farms": farms,
                "network_metrics": network_metrics,
                "temporal_patterns": temporal_patterns,
                "collaboration_strength": len([k for k, v in collaboration.items() if len(v) > 2])
            }
        except Exception as e:
            logger.exception(f"Citation analysis error: {e}")
            return {"error": str(e)}

citation_analyzer = SophisticatedCitationAnalyzer()