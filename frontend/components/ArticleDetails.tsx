"use client";
import React from "react";

import { Article } from "@/types";

interface ArticleDetailsProps {
  article: Article | null;
}

const ArticleDetails: React.FC<ArticleDetailsProps> = ({ article }) => {
  if (!article) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg
            className="mx-auto h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-300 text-sm">
          Select a node from the network to see paper details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2 leading-tight">
          {article.title}
        </h3>
        {article.authors && article.authors.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Authors:</span>{" "}
            {article.authors
              .map(
                (author: any) =>
                  author.fullName ||
                  (author.firstName && author.lastName
                    ? `${author.firstName} ${author.lastName}`
                    : "") ||
                  author.name ||
                  "Unknown Author",
              )
              .filter((name) => name.trim())
              .join(", ")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {article.year && (
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Year:
            </span>
            <p className="text-gray-600 dark:text-gray-300">{article.year}</p>
          </div>
        )}
        {article.journal && (
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Journal:
            </span>
            <p className="text-gray-600 dark:text-gray-400">
              {article.journal}
            </p>
          </div>
        )}
        {article.citationCount !== undefined && (
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Citations:
            </span>
            <p className="text-gray-600 dark:text-gray-400">
              {article.citationCount}
            </p>
          </div>
        )}
        {article.referenceCount !== undefined && (
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              References:
            </span>
            <p className="text-gray-600 dark:text-gray-400">
              {article.referenceCount}
            </p>
          </div>
        )}
      </div>

      {article.abstract && (
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">
            Abstract:
          </span>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {article.abstract}
          </p>
        </div>
      )}

      {article.doi && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
              DOI:
            </span>
            <a
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm underline"
              href={`https://doi.org/${article.doi}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {article.doi}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleDetails;
