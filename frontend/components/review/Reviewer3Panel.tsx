"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Spinner } from "@heroui/spinner";
import { AlertCircle, FileUp, Share2, Trash2, Users } from "lucide-react";

import { useReviewStore } from "@/lib/reviewStore";
import { CommentCard, SEVERITY_CHIPS } from "./reviewer3Shared";

// pdf.js touches browser-only APIs at module scope, so the split-view viewer
// must never be part of the server render.
const Reviewer3ReviewViewer = dynamic(
  () => import("./Reviewer3ReviewViewer").then((m) => m.Reviewer3ReviewViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-10">
        <Spinner color="secondary" />
      </div>
    ),
  },
);

const POLL_INTERVAL_MS = 15000;

async function parseReviewer3Response(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: "Invalid JSON response from the Reviewer3 proxy",
      detail: text.slice(0, 500),
    };
  }
}

interface Reviewer3Stage {
  stage_id: string;
  status: string;
}

export function Reviewer3Panel() {
  const {
    reviewer3SessionId,
    reviewer3Status,
    reviewer3Comments,
    reviewer3Error,
    reviewer3ShareUrl,
    reviewer3PdfUrl,
    setReviewer3Status,
    setReviewer3Comments,
    setReviewer3Error,
    setReviewer3ShareUrl,
    setReviewer3PdfUrl,
    clearReviewer3,
    saveReviewer3ToSupabase,
    deleteReviewer3FromSupabase,
  } = useReviewStore();

  const [shareLoading, setShareLoading] = React.useState(false);
  const [shareCopied, setShareCopied] = React.useState(false);
  // Pipeline progress while the review runs; ephemeral, so component state.
  const [stages, setStages] = React.useState<Reviewer3Stage[]>([]);

  // Poll the session while the review is running. Store-backed state means
  // polling resumes if the user navigates away and comes back.
  React.useEffect(() => {
    if (!reviewer3SessionId) return;
    if (reviewer3Status !== "waiting" && reviewer3Status !== "processing")
      return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/review/reviewer3/${reviewer3SessionId}`);
        const data = await parseReviewer3Response(res);

        if (cancelled) return;

        if (!res.ok) {
          setReviewer3Status("error");
          setReviewer3Error(data.detail || data.error || `HTTP ${res.status}`);
          return;
        }

        setStages(data.stages || []);

        if (data.status === "completed") {
          setReviewer3Comments(data.comments || []);
          setReviewer3Status("completed");
          // Persist silently; failures only log (review is already on screen).
          void saveReviewer3ToSupabase();
        } else if (data.status === "error") {
          setReviewer3Status("error");
          setReviewer3Error(
            "Reviewer3 reported a failure while running the review.",
          );
        } else if (data.status) {
          setReviewer3Status(data.status);
        }
      } catch {
        // Transient network error — keep polling.
      }
    };

    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [
    reviewer3SessionId,
    reviewer3Status,
    setReviewer3Status,
    setReviewer3Comments,
    setReviewer3Error,
    saveReviewer3ToSupabase,
  ]);

  if (reviewer3Status === "idle") return null;

  const isRunning =
    reviewer3Status === "waiting" || reviewer3Status === "processing";

  const handleShare = async () => {
    if (!reviewer3SessionId) return;
    setShareLoading(true);
    try {
      const res = await fetch(
        `/api/review/reviewer3/${reviewer3SessionId}/share`,
        { method: "POST" },
      );
      const data = await parseReviewer3Response(res);
      if (res.ok && data.url) {
        setReviewer3ShareUrl(data.url);
        // Keep the stored session row in sync with the new share link.
        void saveReviewer3ToSupabase();
        try {
          await navigator.clipboard.writeText(data.url);
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 3000);
        } catch {
          // Clipboard unavailable — the link is still shown below.
        }
      }
    } finally {
      setShareLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!reviewer3SessionId) {
      clearReviewer3();
      return;
    }
    try {
      await fetch(`/api/review/reviewer3/${reviewer3SessionId}`, {
        method: "DELETE",
      });
      void deleteReviewer3FromSupabase();
    } finally {
      clearReviewer3();
    }
  };

  const severityCounts = reviewer3Comments.reduce<Record<number, number>>(
    (acc, c) => {
      if (c.severity) acc[c.severity] = (acc[c.severity] || 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-secondary/10 to-primary/10">
        <div className="w-full py-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-secondary/15 text-secondary">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Reviewer3 Peer Review
              </h2>
              <Chip color="warning" variant="flat" size="sm">
                BETA
              </Chip>
            </div>

            <div className="flex items-center gap-2">
              {isRunning && (
                <Chip color="primary" variant="flat" size="sm">
                  {reviewer3Status}
                </Chip>
              )}
              {reviewer3Status === "completed" && (
                <>
                  <Button
                    size="sm"
                    variant="flat"
                    color="secondary"
                    isLoading={shareLoading}
                    startContent={
                      !shareLoading && <Share2 className="w-4 h-4" />
                    }
                    onPress={handleShare}
                  >
                    {shareCopied ? "Link copied!" : "Share"}
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    startContent={<Trash2 className="w-4 h-4" />}
                    onPress={handleDelete}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        {isRunning && (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4 justify-center text-muted-foreground">
              <Spinner size="sm" color="secondary" />
              <p className="text-sm">
                Independent reviewers are reading the paper — this usually takes
                5–10 minutes. Results appear here automatically.
              </p>
            </div>
            {stages.length > 0 &&
              (() => {
                const done = stages.filter(
                  (s) => s.status === "completed",
                ).length;
                const running = stages
                  .filter((s) => s.status !== "completed")
                  .map((s) => s.stage_id.replace(/-/g, " "));
                return (
                  <div className="max-w-md mx-auto space-y-1.5">
                    <Progress
                      aria-label="Review pipeline progress"
                      color="secondary"
                      size="sm"
                      value={(done / stages.length) * 100}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      {done}/{stages.length} steps done
                      {running.length > 0 && (
                        <> — running: {running.join(", ")}</>
                      )}
                    </p>
                  </div>
                );
              })()}
          </div>
        )}

        {reviewer3Status === "error" && (
          <div className="flex items-start gap-3 py-4 text-danger">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Reviewer3 review failed</p>
              <p className="text-sm text-danger/80">{reviewer3Error}</p>
            </div>
          </div>
        )}

        {reviewer3Status === "completed" && (
          <div className="space-y-4">
            {reviewer3ShareUrl && (
              <p className="text-xs text-muted-foreground break-all">
                Share link (password included):{" "}
                <a
                  className="text-primary underline"
                  href={reviewer3ShareUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {reviewer3ShareUrl}
                </a>
              </p>
            )}

            {reviewer3Comments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                The review completed without any comments.
              </p>
            ) : reviewer3PdfUrl ? (
              <Reviewer3ReviewViewer
                comments={reviewer3Comments}
                pdfUrl={reviewer3PdfUrl}
              />
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  {([1, 2, 3, 4] as const).map(
                    (sev) =>
                      severityCounts[sev] > 0 && (
                        <Chip
                          key={sev}
                          size="sm"
                          color={SEVERITY_CHIPS[sev].color}
                          variant="flat"
                        >
                          {severityCounts[sev]} {SEVERITY_CHIPS[sev].label}
                        </Chip>
                      ),
                  )}
                  {/* The PDF object URL does not survive a page refresh;
                      re-attaching the paper restores the split view. */}
                  <label className="ml-auto" htmlFor="r3AttachPdf">
                    <input
                      accept=".pdf,application/pdf"
                      className="hidden"
                      id="r3AttachPdf"
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setReviewer3PdfUrl(URL.createObjectURL(file));
                      }}
                    />
                    <Button
                      as="span"
                      color="secondary"
                      size="sm"
                      startContent={<FileUp className="w-4 h-4" />}
                      variant="flat"
                    >
                      Attach PDF to view inline
                    </Button>
                  </label>
                </div>
                <div className="space-y-3">
                  {reviewer3Comments.map((comment, i) => (
                    <CommentCard
                      key={`${comment.reviewer_id}-${i}`}
                      comment={comment}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
