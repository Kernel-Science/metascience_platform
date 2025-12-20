"""
Core citation network analysis logic ported from LocalCitationNetwork.github.io
This implements the sophisticated algorithms for processing citation networks.
"""

import logging
from collections import defaultdict
from typing import Dict, List, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class CitationNetworkAnalyzer:
    def __init__(self):
        self.papers = {}
        self.edges = []
        self.seed_ids = set()
        self.cited_ids = set()
        self.citing_ids = set()
        # OPTIMIZATION: Pre-computed connection counts for O(1) lookup
        self.cited_connections = {}
        self.citing_connections = {}

    def normalize_id(self, paper_id: str) -> str:
        """Normalize paper ID for consistent comparison"""
        if not paper_id:
            return ""
        return str(paper_id).lower().strip()

    def extract_doi(self, paper: Dict[str, Any]) -> str:
        """Extract DOI from paper data with fallback to other IDs"""
        # Try DOI first
        doi = paper.get('doi') or paper.get('DOI')
        if doi:
            return self.normalize_id(doi)

        # Fallback to other identifiers
        for id_field in ['id', 'paperId', 'openalex_id', 'semantic_scholar_id']:
            if paper.get(id_field):
                return self.normalize_id(paper[id_field])

        return ""

    def deduplicate_papers(self, papers_list: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """
        Deduplicate papers based on DOI and other identifiers
        Optimized version without expensive title similarity matching
        """
        deduplicated = {}

        for paper in papers_list:
            paper_id = self.extract_doi(paper)
            if not paper_id:
                continue

            # Check if we already have this paper
            if paper_id in deduplicated:
                # Merge data (keep most complete version)
                existing = deduplicated[paper_id]
                merged = self.merge_paper_data(existing, paper)
                deduplicated[paper_id] = merged
            else:
                deduplicated[paper_id] = paper

        return deduplicated


    def merge_paper_data(self, paper1: Dict[str, Any], paper2: Dict[str, Any]) -> Dict[str, Any]:
        """Merge two paper records, keeping the most complete data"""
        merged = paper1.copy()

        # Merge fields, preferring non-empty values
        for key, value in paper2.items():
            if key not in merged or not merged[key]:
                merged[key] = value
            elif key in ['references', 'citations'] and isinstance(value, list):
                # Merge reference/citation lists
                existing_ids = {self.extract_doi(ref) for ref in merged.get(key, [])}
                for ref in value:
                    ref_id = self.extract_doi(ref)
                    if ref_id and ref_id not in existing_ids:
                        merged.setdefault(key, []).append(ref)
                        existing_ids.add(ref_id)

        return merged

    def calculate_top_papers(self, papers: Dict[str, Dict[str, Any]],
                           paper_type: str, limit: int = 20) -> List[str]:
        """
        Calculate top cited or citing papers based on citation counts and connections
        Similar to the original's topCited/topCiting calculation
        """
        if paper_type not in ['cited', 'citing']:
            return []

        # Filter papers by type
        target_ids = self.cited_ids if paper_type == 'cited' else self.citing_ids
        if not target_ids:
            return list(papers.keys())[:limit]

        candidates = {pid: papers[pid] for pid in target_ids if pid in papers}

        # Calculate scores
        scored_papers = []
        for paper_id, paper in candidates.items():
            score = self.calculate_paper_score(paper_id, paper, paper_type)
            scored_papers.append((paper_id, score))

        # Sort by score and return top papers
        scored_papers.sort(key=lambda x: x[1], reverse=True)
        return [pid for pid, _ in scored_papers[:limit]]

    def calculate_paper_score(self, paper_id: str, paper: Dict[str, Any],
                            paper_type: str) -> float:
        """
        Calculate relevance score for a paper based on multiple factors
        """
        score = 0.0

        # Citation count (primary factor)
        citation_count = paper.get('citationCount', 0) or 0
        score += citation_count * 1.0

        # Connection count to seed papers
        connections = self.count_connections_to_seeds(paper_id, paper_type)
        score += connections * 10.0  # Weight connections highly

        # Recency bonus (papers from recent years get slight boost)
        year = paper.get('year')
        if year and isinstance(year, (int, str)):
            try:
                year_int = int(year)
                current_year = datetime.now().year
                if current_year - year_int <= 5:  # Recent papers
                    score += 2.0
            except (ValueError, TypeError):
                pass

        # Venue quality (if available)
        if paper.get('venue') and 'journal' in str(paper.get('venue', '')).lower():
            score += 1.0

        return score

    def count_connections_to_seeds(self, paper_id: str, paper_type: str) -> int:
        """Count how many seed papers this paper is connected to - O(1) lookup"""
        if paper_type == 'cited':
            return self.cited_connections.get(paper_id, 0)
        else:  # citing
            return self.citing_connections.get(paper_id, 0)

    def _precompute_connection_counts(self):
        """Build index of connections for O(1) lookup instead of O(n) loop"""
        self.cited_connections = defaultdict(int)
        self.citing_connections = defaultdict(int)

        for edge in self.edges:
            # For cited papers: count edges FROM seed papers TO this paper
            if edge['from'] in self.seed_ids:
                self.cited_connections[edge['to']] += 1
            # For citing papers: count edges FROM this paper TO seed papers
            if edge['to'] in self.seed_ids:
                self.citing_connections[edge['from']] += 1

    def assign_node_groups(self, papers: Dict[str, Dict[str, Any]],
                          top_cited: List[str], top_citing: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Assign visual groups to nodes for network visualization
        """
        for paper_id, paper in papers.items():
            if paper_id in self.seed_ids:
                paper['group'] = 'seed'
                paper['color'] = '#ff6b6b'
            elif paper_id in top_cited:
                paper['group'] = 'cited'
                paper['color'] = '#4ecdc4'
            elif paper_id in top_citing:
                paper['group'] = 'citing'
                paper['color'] = '#45b7d1'
            else:
                paper['group'] = 'other'
                paper['color'] = '#96ceb4'

            # Create label for visualization
            title = paper.get('title', 'Untitled')
            year = paper.get('year', '')
            authors = paper.get('authors', [])

            # Short label for node
            short_title = title[:50] + '...' if len(title) > 50 else title
            paper['label'] = f"{short_title}\n({year})"

            # Detailed title for hover
            author_names = []
            if isinstance(authors, list):
                for author in authors[:3]:  # First 3 authors
                    if isinstance(author, dict):
                        name = author.get('name', '')
                    else:
                        name = str(author)
                    if name:
                        author_names.append(name)

            author_str = ', '.join(author_names)
            if len(authors) > 3:
                author_str += ' et al.'

            paper['hover_title'] = f"{title}\n{author_str}\n{year}\nCitations: {paper.get('citationCount', 'N/A')}"

        return papers

    def filter_edges(self, papers: Dict[str, Dict[str, Any]]) -> List[Dict[str, str]]:
        """Filter edges to only include connections between papers in our network"""
        filtered_edges = []

        # Get the actual node IDs from the papers
        paper_node_ids = set()
        for paper_key, paper_data in papers.items():
            node_id = paper_data.get('id', paper_key)
            paper_node_ids.add(node_id)

        logger.debug(f"Filtering edges for {len(paper_node_ids)} papers")

        for edge in self.edges:
            if edge['from'] in paper_node_ids and edge['to'] in paper_node_ids:
                filtered_edges.append(edge)

        logger.info(f"Filtered {len(filtered_edges)} edges from {len(self.edges)} total edges")
        return filtered_edges

    def build_reference_citation_relationships(self, papers: Dict[str, Dict[str, Any]],
                                             references: List[Dict[str, Any]],
                                             citations: List[Dict[str, Any]]):
        """
        Build citation relationships between all papers in the network.
        Optimized with set-based edge deduplication.
        """
        edge_set = set()  # Use set for O(1) duplicate detection
        all_paper_ids = set(papers.keys())

        # Create a map of all known paper IDs to their primary ID
        id_map = {}
        for primary_id, paper_data in papers.items():
            id_map[primary_id] = primary_id
            # Map other potential IDs to this primary ID
            for id_field in ['paperId', 'id', 'doi']:
                if paper_data.get(id_field):
                    id_map[self.normalize_id(paper_data[id_field])] = primary_id

        # 1. Create edges from seed papers to their references
        for seed_paper_id in self.seed_ids:
            if seed_paper_id not in papers:
                continue
            from_node_id = papers[seed_paper_id].get('id', seed_paper_id)

            for ref in references:
                ref_id = self.extract_doi(ref)
                if ref_id in all_paper_ids:
                    to_node_id = papers[ref_id].get('id', ref_id)
                    edge_set.add((from_node_id, to_node_id))

        # 2. Create edges from citing papers to the seed papers
        for cit in citations:
            cit_id = self.extract_doi(cit)
            if cit_id not in papers:
                continue
            from_node_id = papers[cit_id].get('id', cit_id)

            for seed_paper_id in self.seed_ids:
                if seed_paper_id in papers:
                    to_node_id = papers[seed_paper_id].get('id', seed_paper_id)
                    edge_set.add((from_node_id, to_node_id))

        # 3. Create edges between all other papers based on their reference lists
        for paper_id, paper_data in papers.items():
            if 'references' in paper_data and paper_data['references']:
                from_node_id = paper_data.get('id', paper_id)
                for ref in paper_data['references']:
                    ref_primary_id = id_map.get(self.extract_doi(ref))
                    if ref_primary_id and ref_primary_id in all_paper_ids:
                        to_node_id = papers[ref_primary_id].get('id', ref_primary_id)
                        # Avoid self-loops
                        if from_node_id != to_node_id:
                            edge_set.add((from_node_id, to_node_id))

        # Convert set to list of dicts
        self.edges = [{'from': f, 'to': t} for f, t in edge_set]

        # OPTIMIZATION: Pre-compute connection counts for fast lookups
        self._precompute_connection_counts()


    def analyze_network(self, seed_papers: List[Dict[str, Any]],
                       references: List[Dict[str, Any]],
                       citations: List[Dict[str, Any]],
                       cited_option: str = 'top',
                       citing_option: str = 'top') -> Dict[str, Any]:
        """
        Main analysis function that processes the citation network
        """
        # Reset state
        self.papers = {}
        self.edges = []
        self.seed_ids = set()
        self.cited_ids = set()
        self.citing_ids = set()

        # Process all papers and deduplicate
        all_papers_list = seed_papers + references + citations
        self.papers = self.deduplicate_papers(all_papers_list)

        # Identify paper types
        for paper in seed_papers:
            paper_id = self.extract_doi(paper)
            if paper_id:
                self.seed_ids.add(paper_id)

        for paper in references:
            paper_id = self.extract_doi(paper)
            if paper_id and paper_id not in self.seed_ids:
                self.cited_ids.add(paper_id)

        for paper in citations:
            paper_id = self.extract_doi(paper)
            if paper_id and paper_id not in self.seed_ids:
                self.citing_ids.add(paper_id)

        # Build citation relationships - this is crucial!
        self.build_reference_citation_relationships(self.papers, references, citations)

        # Calculate top papers
        top_cited = []
        top_citing = []

        if cited_option == 'top':
            top_cited = self.calculate_top_papers(self.papers, 'cited', 20)
        elif cited_option == 'all':
            top_cited = list(self.cited_ids)

        if citing_option == 'top':
            top_citing = self.calculate_top_papers(self.papers, 'citing', 20)
        elif citing_option == 'all':
            top_citing = list(self.citing_ids)

        # When both are 'none', we should only show the seed papers.
        # Otherwise, we show the seeds plus the selected cited/citing papers.
        if cited_option == 'none' and citing_option == 'none':
            final_paper_ids = set(self.seed_ids)
        else:
            final_paper_ids = set(self.seed_ids) | set(top_cited) | set(top_citing)

        final_papers = {pid: paper for pid, paper in self.papers.items()
                        if pid in final_paper_ids}

        # Assign groups and prepare for visualization
        final_nodes = self.create_graph_nodes(final_papers, top_cited, top_citing)

        # Filter edges
        final_edges = self.filter_edges(final_papers)

        return {
            'nodes': final_nodes,
            'edges': final_edges,
            'stats': {
                'total_papers': len(final_papers),
                'seed_papers': len(self.seed_ids),
                'cited_papers': len(top_cited),
                'citing_papers': len(top_citing),
                'total_edges': len(final_edges)
            },
            'papers': list(final_papers.values()) # Also return raw paper data
        }

    def create_graph_nodes(self, papers: Dict[str, Dict[str, Any]],
                           top_cited: List[str], top_citing: List[str]) -> List[Dict[str, Any]]:
        """Create node objects for graph visualization."""
        nodes = []
        for paper_id, paper in papers.items():
            is_seed = paper_id in self.seed_ids

            # Determine node type and color
            node_type = 'other'
            if is_seed:
                node_type = 'seed'
            elif paper_id in top_cited:
                node_type = 'cited'
            elif paper_id in top_citing:
                node_type = 'citing'

            # Create a clean text-only tooltip using the paper data
            tooltip_parts = [paper.get('title', 'Paper')]
            if paper.get('year') or paper.get('venue'):
                year_venue = []
                if paper.get('year'): year_venue.append(str(paper.get('year')))
                if paper.get('venue'): year_venue.append(str(paper.get('venue')))
                tooltip_parts.append(" • ".join(year_venue))

            citation_count = paper.get('citationCount', 0)
            if citation_count > 0:
                tooltip_parts.append(f"📊 {citation_count} citations")

            authors = paper.get('authors', [])
            if authors:
                author_names = []
                for author in authors[:2]:
                    if isinstance(author, dict) and author.get('name'):
                        author_names.append(author['name'])
                    elif isinstance(author, str):
                        author_names.append(author)

                if author_names:
                    author_str = ", ".join(author_names)
                    if len(authors) > 2:
                        author_str += ' et al.'
                    tooltip_parts.append(f"👤 {author_str}")

            node = {
                'id': paper_id,  # Use the deduplicated paper_id as the node ID
                'label': paper.get('title', 'Untitled')[:25] + '...',
                'title': "\n".join(tooltip_parts),
                'isSeed': is_seed,
                'type': node_type,
                'citationsCount': citation_count,
                'year': paper.get('year'),
                'journal': paper.get('venue')
            }
            nodes.append(node)
        return nodes
