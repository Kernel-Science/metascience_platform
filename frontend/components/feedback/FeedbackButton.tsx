"use client";

import React from "react";
import { Button } from "@heroui/button";

import { MessageCircle } from "lucide-react";

import { useFeedbackStore } from "@/lib/feedbackStore";

interface FeedbackButtonProps {
  tabName: "search" | "analysis" | "review" | "citation" | "methods";
  variant?:
    | "solid"
    | "bordered"
    | "light"
    | "flat"
    | "faded"
    | "shadow"
    | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FeedbackButton({
  tabName,
  variant = "bordered",
  size = "sm",
  className = "",
}: FeedbackButtonProps) {
  const openModal = useFeedbackStore((state) => state.openModal);

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      <Button
        className="backdrop-blur-md bg-background/80 border border-divider shadow-lg hover:bg-content1 transition-all"
        size={size}
        startContent={<MessageCircle className="w-4 h-4" />}
        variant={variant}
        onPress={() => openModal(tabName)}
      >
        Feedback
      </Button>
    </div>
  );
}
