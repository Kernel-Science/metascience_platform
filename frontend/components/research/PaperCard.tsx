"use client";

import React from "react";
import { Button } from "@heroui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { Article } from "@/types";
import { useReviewStore } from "@/lib/reviewStore";

interface PaperCardProps {
  paper: Article;
  index: number;
}

const getSourceColor = (source: string) => {
  const colors: Record<string, string> = {
    arxiv: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
    openalex:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
    semantic_scholar:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  };

  return (
    colors[source] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
  );
};

const formatAuthors = (
  authors:
    | Array<{
        firstName?: string;
        lastName?: string;
        fullName?: string;
        name?: string;
        orcid?: string;
        affiliation?: string;
      }>
    | string[]
    | string,
) => {
  if (!authors || (Array.isArray(authors) && authors.length === 0))
    return "Unknown authors";
  if (!Array.isArray(authors)) return authors;

  const validAuthors = authors.filter(
    (author) => author && author !== "Unknown authors",
  );

  if (validAuthors.length === 0) return "Unknown authors";

  const authorNames = validAuthors.slice(0, 3).map((author) => {
    if (typeof author === "object" && author !== null) {
      return (
        author.name ||
        author.fullName ||
        (author.firstName && author.lastName
          ? `${author.firstName} ${author.lastName}`
          : "") ||
        "Unknown"
      );
    }

    return author;
  });

  return authorNames.join(", ") + (validAuthors.length > 3 ? " et al." : "");
};

export const PaperCard: React.FC<PaperCardProps> = ({ paper, index }) => {
  const router = useRouter();
  const setPdfUrl = useReviewStore((state) => state.setPdfUrl);
  const setPaperTitle = useReviewStore((state) => state.setPaperTitle);
  const clearReview = useReviewStore((state) => state.clearReview);

  const getPaperUrl = () => {
    const urlSources = [
      (paper as any).pdf_url,
      (paper as any).abs_url,
      (paper as any).url,
      (paper as any).paperUrl,
      (paper as any).pdfUrl,
      (paper as any).externalUrls?.paperUrl,
      (paper as any).externalUrls?.url,
    ];

    for (const urlSource of urlSources) {
      if (urlSource && typeof urlSource === "string" && urlSource.trim()) {
        return urlSource;
      }
    }

    if ((paper as any).arxiv_id) {
      return `https://arxiv.org/abs/${(paper as any).arxiv_id}`;
    }

    if (paper.doi && paper.doi.trim()) {
      return `https://doi.org/${paper.doi}`;
    }

    return null;
  };

  const handleReviewPaper = () => {
    const pdfUrl = getPaperUrl();

    if (pdfUrl) {
      clearReview(); // Clear any previous review data
      setPdfUrl(pdfUrl); // Set the PDF URL in the store
      setPaperTitle(paper.title || ""); // Set the paper title in the store
      router.push("/review"); // Navigate to the review page
    }
  };

  const paperUrl = getPaperUrl();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 rounded-full flex items-center justify-center font-semibold text-sm">
          {index}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
            {paper.title || "Untitled"}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`px-2 py-1 text-xs rounded-full ${getSourceColor(paper.source || "")}`}
            >
              {(paper as any).source_name || paper.source}
            </span>

            {paper.year && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {paper.year}
              </span>
            )}

            {(paper.citationCount ?? 0) > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                {paper.citationCount} citations
              </span>
            )}
          </div>

          {paper.authors && paper.authors.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium">Authors:</span>{" "}
              {formatAuthors(paper.authors)}
            </p>
          )}

          {(paper as any).venue && (paper as any).venue !== "Unknown Venue" && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium">Venue:</span> {(paper as any).venue}
            </p>
          )}

          {paper.abstract && paper.abstract !== "No abstract available" && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {paper.abstract}
            </p>
          )}

          <div className="flex justify-between items-center">
            <div className="flex space-x-4 text-xs text-gray-500">
              {(paper as any).concepts &&
                (paper as any).concepts.length > 0 && (
                  <span>
                    Topics: {(paper as any).concepts.slice(0, 3).join(", ")}
                  </span>
                )}
            </div>

            {paperUrl && (
              <div className="flex gap-2">
                <Button
                  as="a"
                  color="primary"
                  href={paperUrl}
                  rel="noopener noreferrer"
                  size="sm"
                  target="_blank"
                  variant="solid"
                >
                  View Paper
                </Button>
                <Button
                  color="secondary"
                  size="sm"
                  variant="solid"
                  onClick={handleReviewPaper}
                >
                  Assess Paper
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
