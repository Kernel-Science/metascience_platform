"use client";

import React from "react";

// Shared chrome for a tool invocation inside a chat message: a labeled card
// that shows an animated status row while the tool runs and the rendered
// result when done.
export const ToolCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  running?: boolean;
  runningLabel?: string;
  error?: string;
  children?: React.ReactNode;
}> = ({ icon, title, running, runningLabel, error, children }) => (
  <div className="my-3 min-w-0 overflow-hidden rounded-2xl border border-[var(--fqxi-border)] bg-[var(--fqxi-surface)]">
    <div className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-[var(--fqxi-ink-muted)]">
      <span className="text-[var(--fqxi-ink)]">{icon}</span>
      <span>{title}</span>
      {running && (
        <span className="ml-auto flex items-center gap-2 text-xs font-normal normal-case tracking-normal">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--fqxi-yellow)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--fqxi-yellow)]" />
          </span>
          {runningLabel || "Working…"}
        </span>
      )}
    </div>
    {error ? (
      <div className="border-t border-[var(--fqxi-border)] px-4 py-3 text-sm text-danger">
        {error}
      </div>
    ) : (
      !running &&
      children && (
        <div className="border-t border-[var(--fqxi-border)] p-4">{children}</div>
      )
    )}
  </div>
);
