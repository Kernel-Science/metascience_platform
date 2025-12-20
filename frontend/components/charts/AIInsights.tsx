"use client";

import React from "react";
import { Brain, TrendingUp, Users, Calendar } from "lucide-react";

interface AIInsightsProps {
  data?: {
    emerging_trends?: string[];
    key_research_themes?: string[];
    notable_findings?: string[];
    research_evolution?: string;
    high_impact_areas?: string;
    future_directions?: string[];
    fallback_mode?: boolean;
    error?: string;
  };
}

// Validate and sanitize array data
const sanitizeArray = (arr: any): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item) => typeof item === "string" && item.length > 0);
};

// Validate and sanitize string data
const sanitizeString = (str: any): string => {
  if (typeof str === "string") return str;
  return "";
};

const AIInsights: React.FC<AIInsightsProps> = ({ data }) => {
  // Sanitize all incoming data to prevent rendering issues
  const sanitizedData = data
    ? {
        emerging_trends: sanitizeArray(data.emerging_trends),
        key_research_themes: sanitizeArray(data.key_research_themes),
        notable_findings: sanitizeArray(data.notable_findings),
        research_evolution: sanitizeString(data.research_evolution),
        high_impact_areas: sanitizeString(data.high_impact_areas),
        future_directions: sanitizeArray(data.future_directions),
        fallback_mode: data.fallback_mode || false,
        error: data.error || "",
      }
    : null;

  if (!sanitizedData) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Brain className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-300">
            AI Analysis
          </h3>
        </div>
        <p className="text-gray-500 dark:text-gray-300">
          No AI insights available. Run analysis to generate insights.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Brain className="w-5 h-5 text-blue-600 dark:text-blue-300 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          AI-Powered Insights
        </h3>
      </div>

      {sanitizedData.research_evolution && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">
            Research Evolution
          </h4>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {sanitizedData.research_evolution}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {sanitizedData.emerging_trends.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-300 mr-2" />
              <h4 className="font-medium text-gray-800 dark:text-gray-100">
                Emerging Trends
              </h4>
            </div>
            <ul className="space-y-1">
              {sanitizedData.emerging_trends.map((trend, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 dark:text-gray-300 flex items-start"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                  {trend}
                </li>
              ))}
            </ul>
          </div>
        )}

        {sanitizedData.key_research_themes.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-300 mr-2" />
              <h4 className="font-medium text-gray-800 dark:text-gray-100">
                Key Research Themes
              </h4>
            </div>
            <ul className="space-y-1">
              {sanitizedData.key_research_themes.map((theme, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 dark:text-gray-300 flex items-start"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                  {theme}
                </li>
              ))}
            </ul>
          </div>
        )}

        {sanitizedData.notable_findings.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <Users className="w-4 h-4 text-orange-600 dark:text-orange-300 mr-2" />
              <h4 className="font-medium text-gray-800 dark:text-gray-100">
                Notable Findings
              </h4>
            </div>
            <ul className="space-y-1">
              {sanitizedData.notable_findings.map((finding, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 dark:text-gray-300 flex items-start"
                >
                  <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}

        {sanitizedData.high_impact_areas && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">
              High Impact Areas
            </h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {sanitizedData.high_impact_areas}
            </p>
          </div>
        )}

        {sanitizedData.future_directions.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <Brain className="w-4 h-4 text-blue-600 dark:text-blue-300 mr-2" />
              <h4 className="font-medium text-gray-800 dark:text-gray-100">
                Future Directions
              </h4>
            </div>
            <ul className="space-y-1">
              {sanitizedData.future_directions.map((direction, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 dark:text-gray-300 flex items-start"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                  {direction}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
