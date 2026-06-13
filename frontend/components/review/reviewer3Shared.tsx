"use client";

// Pieces shared by Reviewer3Panel and Reviewer3ReviewViewer. Kept free of
// react-pdf imports so the panel can stay SSR-safe while the viewer is
// loaded with next/dynamic ssr:false.

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { MapPin, SearchX } from "lucide-react";

import { Reviewer3Comment } from "@/lib/reviewStore";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";

export type ChipColor = "danger" | "warning" | "secondary" | "default";

export const SEVERITY_CHIPS: Record<
  number,
  { label: string; color: ChipColor }
> = {
  1: { label: "Critical", color: "danger" },
  2: { label: "Major", color: "warning" },
  3: { label: "Minor", color: "secondary" },
  4: { label: "Editorial", color: "default" },
};

interface CommentCardProps {
  comment: Reviewer3Comment;
  /** Selected in the viewer (highlighted in the PDF). */
  active?: boolean;
  /**
   * Whether the cited passage was located in the PDF:
   * true = found, false = searched but not found, undefined = no citation
   * or no PDF to search.
   */
  located?: boolean;
  onSelect?: () => void;
}

export function CommentCard({
  comment,
  active = false,
  located,
  onSelect,
}: CommentCardProps) {
  const severity = comment.severity ? SEVERITY_CHIPS[comment.severity] : null;

  return (
    <Card
      className={`bg-content2 ${active ? "ring-2 ring-secondary" : ""}`}
      isPressable={!!onSelect}
      onPress={onSelect}
    >
      <CardBody className="p-4 space-y-2 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          {severity && (
            <Chip size="sm" color={severity.color} variant="flat">
              {severity.label}
            </Chip>
          )}
          <Chip size="sm" variant="flat">
            {comment.reviewer_id}
          </Chip>
          {located === true && (
            <span className="flex items-center gap-1 text-xs text-secondary">
              <MapPin className="w-3 h-3" /> in paper
            </span>
          )}
          {located === false && (
            <span
              className="flex items-center gap-1 text-xs text-muted-foreground"
              title="The cited passage could not be located in the PDF text"
            >
              <SearchX className="w-3 h-3" /> not located
            </span>
          )}
        </div>
        {comment.title && (
          <h4 className="font-medium text-foreground">{comment.title}</h4>
        )}
        <div className="text-sm text-foreground/80 [&_.chat-md]:text-sm [&_.chat-md]:leading-relaxed">
          <ChatMarkdown>{comment.comment}</ChatMarkdown>
        </div>
        {comment.cited_text && (
          <blockquote className="border-l-2 border-primary/40 pl-3 text-xs italic text-muted-foreground">
            <ChatMarkdown>{`"${comment.cited_text}"`}</ChatMarkdown>
          </blockquote>
        )}
      </CardBody>
    </Card>
  );
}
