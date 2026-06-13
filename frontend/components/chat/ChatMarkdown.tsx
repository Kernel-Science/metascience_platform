"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import "katex/dist/katex.min.css";

// Single markdown renderer for all chat prose: GFM tables/lists + LaTeX math
// ($...$ / $$...$$) via KaTeX. Styled by the global .chat-md rules.
export const ChatMarkdown: React.FC<{ children: string }> = ({ children }) => (
  <div className="chat-md">
    <ReactMarkdown
      components={{
        table: ({ children: t }) => (
          <div className="chat-md-table">
            <table>{t}</table>
          </div>
        ),
        a: ({ children: c, href }) => (
          <a href={href} rel="noopener noreferrer" target="_blank">
            {c}
          </a>
        ),
      }}
      rehypePlugins={[rehypeKatex]}
      remarkPlugins={[remarkGfm, remarkMath]}
    >
      {children}
    </ReactMarkdown>
  </div>
);
