"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

import AIInsights from "@/components/charts/AIInsights";
import TimelineChart from "@/components/charts/TimelineChart";
import BarChart from "@/components/charts/BarChart";

interface AnalysisTabProps {
  trendAnalysis: any;
  citationAnalysis: any;
}

// Safely validate and normalize trendAnalysis data
const validateTrendAnalysisData = (data: any) => {
  if (!data) return null;

  try {
    // Ensure data is a plain object
    if (typeof data !== "object" || data === null) return null;

    // Check for required structure
    if (!data.analysis && !data.visualization_data && !data.paper_count) {
      return null;
    }

    return data;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error validating trend analysis data:", e);
    return null;
  }
};

export const AnalysisTab: React.FC<AnalysisTabProps> = ({
  trendAnalysis: rawTrendAnalysis,
}) => {
  // Validate and normalize the data
  const trendAnalysis = validateTrendAnalysisData(rawTrendAnalysis);

  if (!trendAnalysis) {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 mt-20"
        initial={{ opacity: 0, y: 20 }}
      >
        <div className="brand-surface max-w-md mx-auto rounded-3xl p-8">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] p-6">
            <TrendingUp className="h-12 w-12 text-[var(--fqxi-ink-muted)]" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-[var(--fqxi-ink)]">
            No Analysis Available
          </h3>
          <p className="text-[var(--fqxi-ink-muted)]">
            Search for papers and run analysis to see results here.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 mt-20"
      initial={{ opacity: 0, y: 20 }}
    >
      {trendAnalysis && (
        <div className="brand-surface rounded-[1.75rem] p-8">
          <h2 className="mb-6 flex items-center gap-3 text-3xl font-semibold text-[var(--fqxi-ink)]">
            <TrendingUp className="text-[var(--fqxi-ink)]" />
            Trend Analysis Results
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--fqxi-ink)]">
                AI-Powered Insights
              </h3>
              <AIInsights data={trendAnalysis.analysis?.ai_analysis} />
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--fqxi-ink)]">
                Statistical Overview
              </h3>

              {/* Analysis Statistics */}
              {trendAnalysis.analysis && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="rounded-xl border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] p-6">
                    <div>
                      <p className="text-sm font-medium text-[var(--fqxi-ink-muted)]">
                        Total Papers
                      </p>
                      <p className="text-3xl font-semibold text-[var(--fqxi-ink)]">
                        {trendAnalysis.analysis.statistics?.total_papers ||
                          trendAnalysis.paper_count ||
                          0}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] p-6">
                    <div>
                      <p className="text-sm font-medium text-[var(--fqxi-ink-muted)]">
                        Avg Citations
                      </p>
                      <p className="text-3xl font-semibold text-[var(--fqxi-ink)]">
                        {Math.round(
                          trendAnalysis.analysis.statistics?.avg_citations || 0,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] p-6">
                    <div>
                      <p className="text-sm font-medium text-[var(--fqxi-ink-muted)]">
                        Median Citations
                      </p>
                      <p className="text-3xl font-semibold text-[var(--fqxi-ink)]">
                        {trendAnalysis.analysis.statistics?.median_citations ||
                          0}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] p-6">
                    <div>
                      <p className="text-sm font-medium text-[var(--fqxi-ink-muted)]">
                        Max Citations
                      </p>
                      <p className="text-3xl font-semibold text-[var(--fqxi-ink)]">
                        {trendAnalysis.analysis.statistics?.max_citations || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Research Impact Analysis */}
              {trendAnalysis.analysis?.statistics && (
                <div className="mb-6 rounded-xl border border-[var(--fqxi-border)] bg-[var(--fqxi-paper)] p-6">
                  <h4 className="mb-4 text-lg font-semibold text-[var(--fqxi-ink)]">
                    Research Impact Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-lg border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] p-4 text-center">
                      <div className="text-3xl font-semibold text-[var(--fqxi-ink)]">
                        {trendAnalysis.analysis.statistics
                          .highly_cited_papers || 0}
                      </div>
                      <div className="text-sm text-[var(--fqxi-ink-muted)]">
                        High Impact Papers (&gt;100 citations)
                      </div>
                      <div className="mt-1 text-xs text-[var(--fqxi-ink-muted)]">
                        {trendAnalysis.analysis.statistics.total_papers > 0
                          ? `${Math.round(((trendAnalysis.analysis.statistics.highly_cited_papers || 0) / trendAnalysis.analysis.statistics.total_papers) * 100)}% of dataset`
                          : "0% of dataset"}
                      </div>
                    </div>

                    <div className="rounded-lg border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] p-4 text-center">
                      <div className="text-3xl font-semibold text-[var(--fqxi-ink)]">
                        {trendAnalysis.analysis.statistics.recent_papers || 0}
                      </div>
                      <div className="text-sm text-[var(--fqxi-ink-muted)]">
                        Recent Papers (2020+)
                      </div>
                      <div className="mt-1 text-xs text-[var(--fqxi-ink-muted)]">
                        {trendAnalysis.analysis.statistics.total_papers > 0
                          ? `${Math.round(((trendAnalysis.analysis.statistics.recent_papers || 0) / trendAnalysis.analysis.statistics.total_papers) * 100)}% of dataset`
                          : "0% of dataset"}
                      </div>
                    </div>

                    <div className="rounded-lg border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] p-4 text-center">
                      <div className="text-3xl font-semibold text-[var(--fqxi-ink)]">
                        {trendAnalysis.analysis.statistics.total_citations || 0}
                      </div>
                      <div className="text-sm text-[var(--fqxi-ink-muted)]">
                        Total Citations
                      </div>
                      <div className="mt-1 text-xs text-[var(--fqxi-ink-muted)]">
                        Cumulative research impact
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Range Info */}
              {trendAnalysis.analysis?.statistics?.year_range && (
                <div className="mb-4 rounded-lg border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] p-4">
                  <h4 className="mb-2 font-semibold text-[var(--fqxi-ink)]">
                    Temporal Coverage
                  </h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-[var(--fqxi-ink)]">
                        {trendAnalysis.analysis.statistics.year_range.min} -{" "}
                        {trendAnalysis.analysis.statistics.year_range.max}
                      </span>
                      <div className="text-sm text-[var(--fqxi-ink-muted)]">
                        {trendAnalysis.analysis.statistics.year_range.max -
                          trendAnalysis.analysis.statistics.year_range.min +
                          1}{" "}
                        years of research
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-[var(--fqxi-ink)]">
                        {
                          Object.keys(
                            trendAnalysis.analysis.statistics
                              .yearly_distribution || {},
                          ).length
                        }
                      </div>
                      <div className="text-sm text-[var(--fqxi-ink-muted)]">
                        Active years
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts */}
              {trendAnalysis.visualization_data?.timeline && (
                <div className="mb-4">
                  <h4 className="mb-2 text-md font-semibold text-[var(--fqxi-ink)]">
                    Papers and Citations Over Time
                  </h4>
                  <TimelineChart
                    data={trendAnalysis.visualization_data.timeline}
                  />
                </div>
              )}
              {trendAnalysis.visualization_data?.venues && (
                <div className="mb-4">
                  <h4 className="mb-2 text-md font-semibold text-[var(--fqxi-ink)]">
                    Top Venues
                  </h4>
                  <BarChart data={trendAnalysis.visualization_data.venues} />
                </div>
              )}
              {trendAnalysis.visualization_data?.concepts && (
                <div>
                  <h4 className="mb-2 text-md font-semibold text-[var(--fqxi-ink)]">
                    Top Concepts
                  </h4>
                  <BarChart data={trendAnalysis.visualization_data.concepts} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
