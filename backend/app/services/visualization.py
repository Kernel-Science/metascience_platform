from typing import List, Dict, Any
from collections import defaultdict, Counter

class VisualizationDataGenerator:
    def generate_network_data(self, papers: List[Dict]) -> Dict[str, Any]:
        author_stats = defaultdict(lambda: {"papers": 0, "citations": 0, "collaborators": set()})
        for p in papers:
            authors = p.get('authors', [])
            cits = p.get('citationCount', 0)
            # Extract author names from dict or use string directly
            author_names = []
            for a in authors:
                if isinstance(a, dict):
                    name = a.get('name', '')
                else:
                    name = str(a) if a else ''
                if name and name != 'Unknown authors':
                    author_names.append(name)

            for name in author_names:
                author_stats[name]["papers"] += 1
                author_stats[name]["citations"] += cits
                author_stats[name]["collaborators"].update(x for x in author_names if x != name)

        nodes = [{
            "id": a, "name": a, "papers": s["papers"], "citations": s["citations"],
            "collaborators": len(s["collaborators"]), "size": min(50, s["papers"] * 5 + 10)
        } for a, s in author_stats.items()][:50]

        collab_pairs = set()
        for p in papers:
            authors = p.get('authors', [])
            # Extract and clean author names efficiently
            author_names = [
                (a.get('name', '') if isinstance(a, dict) else str(a))
                for a in authors
                if a and (a.get('name') if isinstance(a, dict) else str(a)) != 'Unknown authors'
            ]

            # Use itertools for cleaner pair generation if needed, but manual loop is fine here
            # since we've already cleaned the list. Limit the number of pairs per paper
            # to avoid explosion if a paper has hundreds of authors.
            paper_authors = author_names[:10]  # Limit to first 10 authors for collaboration graph
            for i in range(len(paper_authors)):
                for j in range(i + 1, len(paper_authors)):
                    pair = tuple(sorted([paper_authors[i], paper_authors[j]]))
                    collab_pairs.add(pair)

        links = [{"source": s, "target": t, "weight": 1} for s, t in list(collab_pairs)[:100]]

        return {
            "nodes": nodes,
            "links": links,
            "stats": {
                "total_authors": len(nodes),
                "total_collaborations": len(links),
                "most_collaborative": max(author_stats, key=lambda x: len(author_stats[x]["collaborators"])) if author_stats else None
            }
        }

    def generate_trend_charts(self, papers: List[Dict]) -> Dict[str, Any]:
        yearly = defaultdict(lambda: {"papers": 0, "citations": 0})
        venue_data = defaultdict(int)
        concept_data = defaultdict(int)

        for p in papers:
            y = p.get('year')
            cits = p.get('citationCount', 0)
            v = p.get('venue', 'Unknown')
            concepts = p.get('concepts', [])
            if y and y > 1900:
                yearly[y]["papers"] += 1
                yearly[y]["citations"] += cits
            if v and v != 'Unknown Venue':
                venue_data[v] += 1
            for c in concepts:
                if c:
                    concept_data[c] += 1

        years = sorted(yearly.keys())
        timeline = [{"year": y, "papers": yearly[y]["papers"], "citations": yearly[y]["citations"]} for y in years]
        top_venues = [{"name": v, "count": c} for v, c in Counter(venue_data).most_common(10)]
        top_concepts = [{"name": c, "count": n} for c, n in Counter(concept_data).most_common(15)]

        return {
            "timeline": timeline,
            "venues": top_venues,
            "concepts": top_concepts,
            "summary": {
                "year_span": f"{min(years)}-{max(years)}" if years else "Unknown",
                "total_venues": len(venue_data),
                "total_concepts": len(concept_data)
            }
        }

visualization_generator = VisualizationDataGenerator()