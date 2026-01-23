"use client";
import React, { useState, useEffect } from "react";
import Graph from "react-graph-vis";

import "vis-network/styles/vis-network.css";
import { AnalysisOptions } from "./AnalysisOptions";

import { Article } from "@/types";
import { useCitationStore } from "@/lib/citationStore";

// Use local API routes to avoid CORS issues
const API_BASE_URL = "";

interface NetworkGraphProps {
  query: string;
  onNodeSelect: (node?: Article) => void;
  analysisOptions: AnalysisOptions;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setAllNodes: (nodes: Article[]) => void;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  query,
  onNodeSelect,
  analysisOptions,
  loading,
  setLoading,
  setAllNodes,
}) => {
  // Use Zustand store for graph data
  const citationGraph = useCitationStore((state) => state.citationGraph);
  const citationPapers = useCitationStore((state) => state.citationPapers);
  const setCitationGraph = useCitationStore((state) => state.setCitationGraph);
  // Add setters/readers we'll need to persist networks when manually entering DOIs
  const setCitationPapers = useCitationStore(
    (state) => state.setCitationPapers,
  );
  const setPaperId = useCitationStore((state) => state.setPaperId);
  const setPaperTitle = useCitationStore((state) => state.setPaperTitle);
  const storedPaperId = useCitationStore((state) => state.paperId);

  // Use graph from store if available
  const [graph, setGraph] = useState<{ nodes: any[]; edges: any[] }>(
    citationGraph || { nodes: [], edges: [] },
  );
  const [error, setError] = useState<string | null>(null);
  const [allNodesData, setAllNodesData] = useState<Article[]>([]);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const networkRef = React.useRef<any>(null);

  // Ref to track the current fetch operation and prevent concurrent requests
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const lastQueryRef = React.useRef<string>("");
  const lastOptionsRef = React.useRef<AnalysisOptions>(analysisOptions);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Helper to handle fetch errors
    const handleFetchError = async (response: Response) => {
      let errorMsg = `HTTP error! status: ${response.status}`;

      try {
        const errorData = await response.json();

        errorMsg = errorData.error || errorMsg;
      } catch {
        // Ignore JSON parsing errors, use default error message
      }
      setError(errorMsg);
    };

    const fetchCitationNetwork = async (inputQuery: string) => {
      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // If there's no query, but a citationGraph was loaded from history, restore it
      if (!inputQuery.trim()) {
        if (
          citationGraph &&
          citationGraph.nodes &&
          citationGraph.nodes.length > 0
        ) {
          // Restore stored graph and papers instead of clearing them
          setGraph(citationGraph);
          setAllNodesData(citationPapers || []);
          setAllNodes(citationPapers || []);
          setLoading(false);

          return;
        }

        // No query and no stored graph -> clear view
        setGraph({ nodes: [], edges: [] });
        setAllNodesData([]);

        return;
      }

      setLoading(true);
      setError(null);
      setGraph({ nodes: [], edges: [] }); // Clear previous graph
      setAllNodesData([]); // Clear previous node data

      try {
        const { retrieveCited, retrieveCiting } = analysisOptions;

        // Extract DOIs from query (support multiple DOIs, one per line)
        const dois = inputQuery
          .split("\n")
          .map((doi) => doi.trim())
          .filter((doi) => doi);

        if (dois.length === 0) {
          setError("No valid DOIs found in query");

          return;
        }

        // If multiple DOIs, we'll process them all and create a combined network
        if (dois.length === 1) {
          // Single DOI - use existing logic
          const requestBody = {
            doi: dois[0],
            max_references:
              retrieveCited === "all"
                ? 1000
                : retrieveCited === "none"
                  ? 0
                  : parseInt(retrieveCited) || 50,
            max_citations:
              retrieveCiting === "all"
                ? 1000
                : retrieveCiting === "none"
                  ? 0
                  : parseInt(retrieveCiting) || 50,
            data_source:
              analysisOptions.dataSource === "openAlex" ? "oa" : "s2",
          };

          const response = await fetch(`${API_BASE_URL}/api/citation-network`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: abortController.signal,
          });

          if (!response.ok) {
            await handleFetchError(response);

            return;
          }

          const result = await response.json();

          // Handle different response formats:
          // GET endpoint returns data directly, POST endpoint wraps it in {success, data}
          let data;
          if (result.success !== undefined) {
            // POST endpoint format: {success: true, data: {...}}
            if (!result.success) {
              setError(result.error || "Failed to build citation network");

              return;
            }
            data = result.data;
          } else {
            // GET endpoint format: returns data directly
            data = result;
          }

          // If we got no citations/references and we're using OpenAlex, try Semantic Scholar as fallback
          const hasConnections = data.network?.edges?.length > 0;

          if (!hasConnections && requestBody.data_source === "oa") {
            const fallbackRequestBody = {
              ...requestBody,
              data_source: "s2", // Switch to Semantic Scholar
            };

            try {
              const fallbackResponse = await fetch(
                `${API_BASE_URL}/api/citation-network`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(fallbackRequestBody),
                  signal: abortController.signal,
                },
              );

              if (fallbackResponse.ok) {
                const fallbackResult = await fallbackResponse.json();

                if (
                  fallbackResult.success &&
                  fallbackResult.data.network?.edges?.length > 0
                ) {
                  await processNetworkData(fallbackResult.data);

                  return;
                }
              }
            } catch {
              // Fallback to Semantic Scholar failed
            }
          }

          await processNetworkData(data);
        } else {
          // Multiple DOIs - use the GET endpoint that exists in the backend
          const dataSource =
            analysisOptions.dataSource === "openAlex" ? "oa" : "s2";
          const citedParam =
            retrieveCited === "all"
              ? "all"
              : retrieveCited === "none"
                ? "none"
                : "top";
          const citingParam =
            retrieveCiting === "all"
              ? "all"
              : retrieveCiting === "none"
                ? "none"
                : "top";

          // Join DOIs with comma for the path parameter
          const doisPath = dois.join(",");

          const response = await fetch(
            `${API_BASE_URL}/api/local-citation-network/v1/papers/${dataSource}/${encodeURIComponent(doisPath)}?cited=${citedParam}&citing=${citingParam}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              signal: abortController.signal,
            },
          );

          if (!response.ok) {
            await handleFetchError(response);

            return;
          }

          const result = await response.json();

          // Handle different response formats:
          // GET endpoint returns data directly, POST endpoint wraps it in {success, data}
          let data;
          if (result.success !== undefined) {
            // POST endpoint format: {success: true, data: {...}}
            if (!result.success) {
              setError(result.error || "Failed to build citation network");

              return;
            }
            data = result.data;
          } else {
            // GET endpoint format: returns data directly
            data = result;
          }

          await processNetworkData(data);
        }
      } catch (err: any) {
        // Don't set error if request was aborted
        if (err.name === "AbortError") {
          return;
        }
        setError(err.message);
        setGraph({ nodes: [], edges: [] });
        setAllNodesData([]);
      } finally {
        setLoading(false);
      }
    };

    const processNetworkData = async (data: any) => {
      // Handle different response formats between GET and POST endpoints
      let papers, nodes, edges, seedPaperIds;

      if (data.network && data.seed_paper_ids) {
        // POST endpoint format: {papers, network: {nodes, edges}, seed_paper_ids}
        papers = data.papers || [];
        nodes = data.network.nodes || [];
        edges = data.network.edges || [];
        seedPaperIds = data.seed_paper_ids || [];
      } else {
        // GET endpoint format: {nodes, edges, papers, stats} - direct from analyze_network
        papers = data.papers || [];
        nodes = data.nodes || [];
        edges = data.edges || [];
        // For GET endpoint, we need to identify seed papers from the node data
        seedPaperIds =
          nodes
            .filter((node: any) => node.isSeed || node.type === "seed")
            .map((node: any) => node.id) || [];
      }

      // The backend now sends 'papers' for details and 'nodes' for the graph.
      const allPapersData = papers;
      const graphNodes = nodes;
      const graphEdges = edges;

      // Ensure seed_paper_ids is an array and has at least one element
      const validSeedPaperIds =
        Array.isArray(seedPaperIds) && seedPaperIds.length > 0
          ? seedPaperIds
          : [];

      // Convert papers to Article format - use the 'papers' array from the backend
      const articles: Article[] = allPapersData.map((paper: any) => ({
        id: paper.id,
        doi: paper.doi,
        title: paper.title,
        authors: paper.authors
          ? paper.authors.map((author: any) => {
              // Handle different author formats from backend
              if (typeof author === "string") {
                // Simple string format
                return {
                  fullName: author,
                  name: author,
                };
              } else if (author.name) {
                // Object with name field
                const nameParts = author.name.trim().split(" ");

                return {
                  firstName: nameParts.length > 1 ? nameParts[0] : "",
                  lastName:
                    nameParts.length > 1
                      ? nameParts.slice(1).join(" ")
                      : nameParts[0],
                  fullName: author.name,
                  name: author.name,
                };
              } else if (author.FN || author.LN) {
                // Legacy format with FN/LN fields
                return {
                  firstName: author.FN || "",
                  lastName: author.LN || "",
                  fullName: `${author.FN || ""} ${author.LN || ""}`.trim(),
                  orcid: author.orcid,
                  affiliation: author.affil,
                };
              } else {
                // Fallback for unknown format
                return {
                  fullName: "Unknown Author",
                  name: "Unknown Author",
                };
              }
            })
          : [],
        year: paper.year,
        journal: paper.journal || paper.venue,
        abstract: paper.abstract,
        citationCount: paper.citationsCount || paper.citationCount || 0,
        referenceCount: paper.referencesCount || paper.referenceCount || 0,
        type: paper.type,
        source: paper.source,
        isSeed: validSeedPaperIds.includes(paper.id),
      }));

      // Create graph nodes with modern minimal styling - use the 'nodes' array from the network object
      const visualNodes = graphNodes.map((node: any) => {
        const isSeed = node.isSeed;
        const citationCount = node.citationsCount || 0;

        // Modern color scheme with subtle differentiation
        let nodeColor, borderColor;

        if (isSeed) {
          nodeColor = "#6366f1"; // Modern indigo for seed papers
          borderColor = "#4f46e5";
        } else if (node.type === "cited") {
          nodeColor = "#8b5cf6"; // Modern purple for cited papers
          borderColor = "#7c3aed";
        } else if (node.type === "citing") {
          nodeColor = "#06b6d4"; // Modern cyan for citing papers
          borderColor = "#0891b2";
        } else {
          nodeColor = "#10b981"; // Modern emerald for other papers
          borderColor = "#059669";
        }

        // Clean size scaling
        const baseSize = 15;
        const maxSize = 35;
        const size = isSeed
          ? 30
          : Math.min(maxSize, baseSize + Math.sqrt(citationCount + 1) * 2);

        // Create a clean text-only tooltip using the paper data
        let tooltipText = node.title || "Paper"; // Use the pre-formatted title from the backend node

        return {
          id: node.id,
          label:
            node.label && node.label.length > 25
              ? node.label.substring(0, 25) + "..."
              : node.label || node.title?.substring(0, 25) + "..." || "Paper",
          title: tooltipText,
          color: {
            background: nodeColor,
            border: borderColor,
            highlight: {
              background: nodeColor,
              border: "#ffffff",
            },
            hover: {
              background: nodeColor,
              border: "#ffffff",
            },
          },
          shape: "dot",
          size: size,
          font: {
            size: 12,
            color: "#374151",
            face: "system-ui, -apple-system, sans-serif",
            strokeWidth: 2,
            strokeColor: "#ffffff",
          },
          borderWidth: isSeed ? 3 : 2,
          shadow: false, // Disable shadows for better performance
        };
      });

      // Create graph edges with minimal modern styling - use the 'edges' array from the network object
      const visualEdges = graphEdges.map((edge: any, index: number) => {
        const firstSeedId = validSeedPaperIds[0];
        const isCitingEdge = firstSeedId && edge.from === firstSeedId;
        const isCitedEdge = firstSeedId && edge.to === firstSeedId;

        let edgeColor, edgeWidth, edgeDashes;

        if (isCitingEdge) {
          edgeColor = "#8b5cf6"; // Purple for papers cited by seed (references)
          edgeWidth = 0.8;
          edgeDashes = false;
        } else if (isCitedEdge) {
          edgeColor = "#06b6d4"; // Cyan for papers citing seed (citations)
          edgeWidth = 0.8;
          edgeDashes = false;
        } else {
          edgeColor = "#e5e7eb"; // Very light gray for indirect connections
          edgeWidth = 0.3;
          edgeDashes = [2, 4]; // Subtle dashed line for indirect connections
        }

        return {
          id: `edge_${edge.from}_${edge.to}_${index}_${new Date().getTime()}`,
          from: edge.from,
          to: edge.to,
          arrows: { to: false, from: false, middle: false }, // Disable all arrows (must be object with allowed keys)
          color: {
            color: edgeColor,
            highlight: "#6366f1",
            hover: "#6366f1",
            opacity: 0.6, // Reduced opacity for better layering
          },
          width: edgeWidth,
          dashes: edgeDashes,
          smooth: {
            enabled: true,
            type: "cubicBezier", // Less curvy than 'continuous'
            roundness: 0.2, // Subtle curves only
          },
          physics: true,
          shadow: false,
          selectionWidth: 2, // Thicker when selected/hovered
        };
      });

      // Ensure unique nodes (deduplicate by ID)
      const uniqueNodes = [];
      const seenNodeIds = new Set();

      for (const node of visualNodes) {
        if (!seenNodeIds.has(node.id)) {
          seenNodeIds.add(node.id);
          uniqueNodes.push(node);
        }
      }

      // Ensure unique edges (deduplicate by from-to combination)
      const uniqueEdges = [];
      const seenEdgeKeys = new Set();

      for (const edge of visualEdges) {
        const edgeKey = `${edge.from}->${edge.to}`;

        if (!seenEdgeKeys.has(edgeKey)) {
          seenEdgeKeys.add(edgeKey);
          // Assign a truly unique ID based on from, to, and edgeKey only
          uniqueEdges.push({
            ...edge,
            id: `edge_${edge.from}_${edge.to}`,
          });
        }
      }

      setGraph({ nodes: uniqueNodes, edges: uniqueEdges });
      setAllNodesData(articles);
      setAllNodes(articles);
      // Persist the loaded papers into the citation store so other pages/components
      // (and the citation page's save effect) can access them.
      try {
        setCitationPapers(articles);

        // If there's no paperId already stored (i.e. the user manually entered DOIs
        // on the citation page instead of navigating from Search), set the paperId
        // and title using the first seed paper we can find so saveCitationToSupabase
        // in the page's effect will run.
        if (!storedPaperId) {
          const seedId =
            validSeedPaperIds && validSeedPaperIds.length > 0
              ? validSeedPaperIds[0]
              : null;

          let seedPaper = null;

          if (seedId) {
            seedPaper = articles.find((p: any) => p.id === seedId) || null;
          }

          // Fallback: if seedPaper not found but at least one article exists,
          // choose the first article as a seed to allow saving.
          if (!seedPaper && articles.length > 0) {
            seedPaper = articles[0];
          }

          if (seedPaper) {
            setPaperId(seedPaper.id);
            setPaperTitle(seedPaper.title || "");
          }
        }
      } catch {
        // Ignore store write failures; saving is best-effort here
      }
      // Force physics to run and stabilize layout after graph update
      setTimeout(() => {
        if (networkRef.current) {
          networkRef.current.setOptions({ physics: true });
          networkRef.current.stabilize();
        }
      }, 100);

      // Calculate network stats - use the 'papers' array from the backend
      const stats = {
        totalPapers: allPapersData.length,
        totalConnections: visualEdges.length,
        seedPaper: allPapersData.find((p: any) =>
          validSeedPaperIds.includes(p.id),
        ),
        yearRange:
          allPapersData.length > 0
            ? {
                min: Math.min(
                  ...allPapersData
                    .filter((p: any) => p.year)
                    .map((p: Article) => p.year),
                ),
                max: Math.max(
                  ...allPapersData
                    .filter((p: any) => p.year)
                    .map((p: Article) => p.year),
                ),
              }
            : null,
      };

      setNetworkStats(stats);
    };

    // Extract first DOI from query (support for multiple DOIs can be added later)
    // Process the query to get DOIs

    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check if query or options actually changed to avoid unnecessary refetches
    const queryChanged = query !== lastQueryRef.current;
    const optionsChanged =
      JSON.stringify(analysisOptions) !==
      JSON.stringify(lastOptionsRef.current);

    if (!queryChanged && !optionsChanged) {
      return;
    }

    // Update refs to track current values
    lastQueryRef.current = query;
    lastOptionsRef.current = analysisOptions;

    // Debounce the fetch to prevent rapid successive requests
    debounceTimerRef.current = setTimeout(() => {
      if (query.trim()) {
        (async () => {
          try {
            await fetchCitationNetwork(query);
          } catch (err: any) {
            if (err.name !== "AbortError") {
              setError("Error fetching citation network");
            }
          }
        })();
      } else {
        // If no query, let fetchCitationNetwork handle restoring or clearing based on stored graph
        (async () => {
          await fetchCitationNetwork(query);
        })();
      }
    }, 300); // 300ms debounce delay
  }, [query, analysisOptions, setLoading, setAllNodes]);

  // Cleanup: abort any in-flight requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // When graph changes, update Zustand store
  useEffect(() => {
    setCitationGraph(graph);
  }, [graph, setCitationGraph]);

  // Add a key to force remounting the Graph component when query changes
  const graphKey = query + "-" + graph.nodes.length + "-" + graph.edges.length;

  const options = {
    layout: {
      improvedLayout: true,
      randomSeed: 2,
    },
    physics: {
      enabled: true,
      stabilization: {
        enabled: true,
        iterations: 2000,
        updateInterval: 100,
        onlyDynamicEdges: false,
        fit: true,
      },
      barnesHut: {
        theta: 0.5,
        gravitationalConstant: -30000,
        centralGravity: 0.01,
        springLength: 300,
        springConstant: 0.01,
        damping: 0.4,
        avoidOverlap: 1,
      },
      solver: "barnesHut",
      timestep: 0.5,
      adaptiveTimestep: true,
      minVelocity: 0.75,
      maxVelocity: 50,
    },
    nodes: {
      borderWidth: 2,
      borderWidthSelected: 3,
      margin: 10,
      font: {
        color: "#374151",
        size: 12,
        face: "system-ui, -apple-system, sans-serif",
        strokeWidth: 3,
        strokeColor: "#ffffff",
      },
    },
    edges: {
      arrows: {
        to: false,
        from: false,
      },
      color: {
        inherit: false,
        opacity: 0.6,
      },
      width: 0.5,
      selectionWidth: 2.5,
      smooth: {
        enabled: true,
        type: "straightCross",
        roundness: 0.1,
      },
      physics: true,
      shadow: false,
      chosen: {
        // Removed unused property edge to fix ESLint warning
      },
    },
    interaction: {
      hover: true,
      selectConnectedEdges: false, // Don't select all connected edges
      tooltipDelay: 200,
      zoomView: true,
      dragView: true,
      dragNodes: true,
      hideEdgesOnDrag: true,
      hideEdgesOnZoom: false,
      hoverConnectedEdges: true,
    },
  };

  const events = {
    select: (event: any) => {
      const { nodes } = event;

      if (nodes.length > 0) {
        const selectedNodeId = nodes[0];
        const selectedNodeData = allNodesData.find(
          (node) => node.id === selectedNodeId,
        );

        onNodeSelect(selectedNodeData);
      }
    },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-300">
          Building citation network...
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Fetching papers from Semantic Scholar, OpenAlex, and OpenCitations...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">
          Error loading network
        </h3>
        <p className="text-red-600">{error}</p>
        <div className="text-sm text-red-500 mt-2">
          <p>Possible issues:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Backend server not running (check {API_BASE_URL})</li>
            <li>Invalid DOI format</li>
            <li>Paper not found in citation databases</li>
            <li>API rate limiting</li>
          </ul>
        </div>
      </div>
    );
  }

  if (graph.nodes.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No citation network
        </h3>
        <p className="text-gray-500">
          Enter a DOI above to generate a citation network.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {networkStats && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>Papers: {networkStats.totalPapers}</span>
            <span>Connections: {networkStats.totalConnections}</span>
            {networkStats.yearRange && networkStats.yearRange.min && (
              <span>
                Years: {networkStats.yearRange.min}-{networkStats.yearRange.max}
              </span>
            )}
            {networkStats.seedPaper && (
              <span>
                Seed: {networkStats.seedPaper.title.substring(0, 50)}...
              </span>
            )}
          </div>
        </div>
      )}
      <div className="p-4">
        <Graph
          key={graphKey}
          events={events}
          getNetwork={(network: any) => {
            networkRef.current = network;
          }}
          graph={graph}
          options={options}
          style={{ height: "600px" }}
        />
      </div>
    </div>
  );
};

export default NetworkGraph;
