import React from "react";
import { Accordion, AccordionItem } from "@heroui/accordion";

const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "What is a Local Citation Network?",
      answer:
        "A Local Citation Network is a visualization tool that helps researchers explore the academic literature by showing the citation relationships between papers. Starting with one or more 'seed' papers, it displays the most relevant papers that cite them (citing papers) and papers they cite (cited papers), creating a focused network view of related research.",
    },
    {
      question: "How do I use this tool?",
      answer:
        "Enter one or more DOIs (Digital Object Identifiers) in the search box, select your data source (Semantic Scholar, OpenAlex, or OpenCitations), choose whether to show top cited/citing papers or all, then click analyze. The tool will generate a network visualization where you can click on nodes to see paper details.",
    },
    {
      question: "What are the different node colors?",
      answer:
        "Red nodes are your seed papers (the ones you entered), teal nodes are cited papers (referenced by your seed papers), blue nodes are citing papers (papers that cite your seed papers), and green nodes are other connected papers in the network.",
    },
    {
      question: "What does 'Top Cited' and 'Top Citing' mean?",
      answer:
        "'Top Cited' shows the most important papers that your seed papers reference, ranked by citation count and relevance. 'Top Citing' shows the most important papers that cite your seed papers. This helps focus on the most influential papers rather than showing everything.",
    },
    {
      question: "What data sources are available?",
      answer:
        "We support three major academic databases: Semantic Scholar (s2) - comprehensive computer science and biomedical literature; OpenAlex (oa) - broad coverage across all disciplines; and OpenCitations (oc) - focus on citation data and open access.",
    },
    {
      question: "Why might some papers be missing?",
      answer:
        "Papers might be missing if: 1) They're not indexed in the selected database, 2) DOI lookup fails, 3) Citation data is incomplete, 4) Papers are very recent and not yet processed, or 5) Access restrictions apply. Try using a different data source or checking DOI formatting.",
    },
    {
      question: "How are papers ranked in 'Top' mode?",
      answer:
        "Papers are ranked using multiple factors: citation count (primary), number of connections to your seed papers, recency (recent papers get slight boost), and venue quality. This ensures you see the most relevant and influential papers first.",
    },
    {
      question: "What should I do if the network is too large or small?",
      answer:
        "If the network is too large, switch from 'All' to 'Top' mode to focus on the most important papers. If it's too small, try: 1) Using 'All' mode instead of 'Top', 2) Switching to a different data source, 3) Adding more seed papers, or 4) Checking that your DOIs are correct.",
    },
    {
      question: "How do I interpret the network layout?",
      answer:
        "The network uses force-directed layout where connected papers are drawn closer together. Seed papers (red) are typically central, with cited papers (teal) and citing papers (blue) arranged around them. Edge arrows show citation direction - an arrow from A to B means A cites B.",
    },
    {
      question: "Is this tool free to use?",
      answer:
        "Yes, this tool is free to use. It builds upon open APIs from Semantic Scholar, OpenAlex, and OpenCitations. Please be respectful of rate limits and consider the original LocalCitationNetwork project if you find this useful.",
    },
    {
      question: "How accurate is the citation data?",
      answer:
        "Citation data accuracy depends on the source database. Semantic Scholar and OpenAlex have high accuracy for recent papers but may miss older publications. OpenCitations focuses on open access citations. Cross-checking with multiple sources can improve completeness.",
    },
  ];

  return (
    <div className="space-y-6">
      <Accordion variant="bordered">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            aria-label={faq.question}
            className="mb-2"
            title={faq.question}
          >
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {faq.answer}
            </div>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          Need more help?
        </h3>
        <p className="text-blue-700 dark:text-blue-300">
          This tool is inspired by the original{" "}
          <a
            className="underline hover:text-blue-900 dark:hover:text-blue-100"
            href="https://localcitationnetwork.github.io/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Local Citation Network
          </a>{" "}
          by Tim Woelfle. For additional resources and examples, check out the
          original project.
        </p>
      </div>

      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Legal Information
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          Please review our legal documents to understand how we handle your
          data and the terms of using this service.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            href="/privacy"
          >
            Privacy Policy
          </a>
          <a
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            href="/terms"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
