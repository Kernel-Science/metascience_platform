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
        className="text-center py-12"
        initial={{ opacity: 0, y: 20 }}
      >
        <div className="max-w-md mx-auto">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Analysis Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <TrendingUp className="mr-3 text-gray-900 dark:text-gray-100" />
            Trend Analysis Results
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                AI-Powered Insights
              </h3>
              <AIInsights data={trendAnalysis.analysis?.ai_analysis} />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Statistical Overview
              </h3>

              {/* Analysis Statistics */}
              {trendAnalysis.analysis && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          Total Papers
                        </p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {trendAnalysis.analysis.statistics?.total_papers ||
                            trendAnalysis.paper_count ||
                            0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          Avg Citations
                        </p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {Math.round(
                            trendAnalysis.analysis.statistics?.avg_citations ||
                              0,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          Median Citations
                        </p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {trendAnalysis.analysis.statistics
                            ?.median_citations || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                          Max Citations
                        </p>
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                          {trendAnalysis.analysis.statistics?.max_citations ||
                            0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Research Impact Analysis */}
              {trendAnalysis.analysis?.statistics && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Research Impact Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-800 dark:text-red-100">
                        {trendAnalysis.analysis.statistics
                          .highly_cited_papers || 0}
                      </div>
                      <div className="text-red-600 dark:text-red-400 text-sm">
                        High Impact Papers (&gt;100 citations)
                      </div>
                      <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                        {trendAnalysis.analysis.statistics.total_papers > 0
                          ? `${Math.round(((trendAnalysis.analysis.statistics.highly_cited_papers || 0) / trendAnalysis.analysis.statistics.total_papers) * 100)}% of dataset`
                          : "0% of dataset"}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-800 dark:text-green-100">
                        {trendAnalysis.analysis.statistics.recent_papers || 0}
                      </div>
                      <div className="text-green-600 dark:text-green-400 text-sm">
                        Recent Papers (2020+)
                      </div>
                      <div className="text-xs text-green-500 dark:text-green-400 mt-1">
                        {trendAnalysis.analysis.statistics.total_papers > 0
                          ? `${Math.round(((trendAnalysis.analysis.statistics.recent_papers || 0) / trendAnalysis.analysis.statistics.total_papers) * 100)}% of dataset`
                          : "0% of dataset"}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-100">
                        {trendAnalysis.analysis.statistics.total_citations || 0}
                      </div>
                      <div className="text-blue-600 dark:text-blue-400 text-sm">
                        Total Citations
                      </div>
                      <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                        Cumulative research impact
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Range Info */}
              {trendAnalysis.analysis?.statistics?.year_range && (
                <div className="bg-indigo-50 dark:bg-indigo-900 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-indigo-800 dark:text-indigo-100 mb-2">
                    Temporal Coverage
                  </h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-indigo-700 dark:text-indigo-200 font-medium">
                        {trendAnalysis.analysis.statistics.year_range.min} -{" "}
                        {trendAnalysis.analysis.statistics.year_range.max}
                      </span>
                      <div className="text-indigo-600 dark:text-indigo-300 text-sm">
                        {trendAnalysis.analysis.statistics.year_range.max -
                          trendAnalysis.analysis.statistics.year_range.min +
                          1}{" "}
                        years of research
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-indigo-700 dark:text-indigo-200 font-medium">
                        {
                          Object.keys(
                            trendAnalysis.analysis.statistics
                              .yearly_distribution || {},
                          ).length
                        }
                      </div>
                      <div className="text-indigo-600 dark:text-indigo-300 text-sm">
                        Active years
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts */}
              {trendAnalysis.visualization_data?.timeline && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Papers and Citations Over Time
                  </h4>
                  <TimelineChart
                    data={trendAnalysis.visualization_data.timeline}
                  />
                </div>
              )}
              {trendAnalysis.visualization_data?.venues && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Top Venues
                  </h4>
                  <BarChart data={trendAnalysis.visualization_data.venues} />
                </div>
              )}
              {trendAnalysis.visualization_data?.concepts && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
