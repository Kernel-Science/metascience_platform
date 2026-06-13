"use client";

import React from "react";
import {
  BarChart3,
  FileSearch,
  FileText,
  GitFork,
  Search,
  TrendingUp,
} from "lucide-react";

import { ToolCard } from "./ToolCard";
import { ChatMarkdown } from "./ChatMarkdown";
import { ChatPaperResults } from "./ChatPaperResults";
import { ChatNetworkGraph } from "./ChatNetworkGraph";
import { ChatTrends } from "./ChatTrends";
import { ChatReview } from "./ChatReview";
import { ChatChart } from "./ChatChart";
import { ChatDocument } from "./ChatDocument";

// Maps a UIMessage part of type `tool-<name>` to its generative UI component.
// `source: "input"` tools render from the model-written spec (charts, docs);
// the rest render from the tool's execute() output.
const TOOL_UI: Record<
  string,
  {
    icon: React.ReactNode;
    title: string;
    runningLabel: string;
    source: "input" | "output";
    Render: React.FC<any>;
  }
> = {
  "tool-search_papers": {
    icon: <Search className="h-4 w-4" />,
    title: "Literature search",
    runningLabel: "Searching OpenAlex, arXiv, INSPIRE, ADS…",
    source: "output",
    Render: ({ data }) => <ChatPaperResults output={data} />,
  },
  "tool-analyze_trends": {
    icon: <TrendingUp className="h-4 w-4" />,
    title: "Trend analysis",
    runningLabel: "Clustering themes + synthesizing…",
    source: "output",
    Render: ({ data }) => <ChatTrends output={data} />,
  },
  "tool-build_citation_network": {
    icon: <GitFork className="h-4 w-4" />,
    title: "Citation network",
    runningLabel: "Building citation graph…",
    source: "output",
    Render: ({ data }) => <ChatNetworkGraph output={data} />,
  },
  "tool-review_paper": {
    icon: <FileSearch className="h-4 w-4" />,
    title: "Paper review",
    runningLabel: "Reading + reviewing the paper (~1 min)…",
    source: "output",
    Render: ({ data }) => <ChatReview output={data} />,
  },
  "tool-create_chart": {
    icon: <BarChart3 className="h-4 w-4" />,
    title: "Chart",
    runningLabel: "Drawing chart…",
    source: "input",
    Render: ({ data }) => <ChatChart input={data} />,
  },
  "tool-create_document": {
    icon: <FileText className="h-4 w-4" />,
    title: "Document",
    runningLabel: "Writing document…",
    source: "input",
    Render: ({ data }) => <ChatDocument input={data} />,
  },
};

export const ChatMessage: React.FC<{ message: any }> = ({ message }) => {
  const isUser = message.role === "user";

  if (isUser) {
    const text = (message.parts || [])
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("\n");

    return (
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div className="flex justify-end">
          <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] px-4 py-2.5 text-[var(--fqxi-ink)]">
            {text}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl px-4 sm:px-6">
      {(message.parts || []).map((part: any, i: number) => {
        if (part.type === "text") {
          return <ChatMarkdown key={i}>{part.text}</ChatMarkdown>;
        }

        const ui = TOOL_UI[part.type];

        if (ui) {
          // Input-sourced tools (charts, docs) can render as soon as the full
          // input has streamed in; output-sourced tools wait for the result.
          const ready =
            ui.source === "input"
              ? part.state === "input-available" || part.state === "output-available"
              : part.state === "output-available";
          const running = !ready && part.state !== "output-error";
          const errored = part.state === "output-error";
          const data = ui.source === "input" ? part.input : part.output;

          return (
            <ToolCard
              key={part.toolCallId || i}
              error={errored ? part.errorText || "Tool failed." : undefined}
              icon={ui.icon}
              running={running}
              runningLabel={ui.runningLabel}
              title={ui.title}
            >
              {ready && <ui.Render data={data} />}
            </ToolCard>
          );
        }

        return null;
      })}
    </div>
  );
};
