"use client";

import React from "react";

import { FeedbackModal } from "./FeedbackModal";

import { useFeedbackStore } from "@/lib/feedbackStore";

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { isModalOpen, currentTab, closeModal } = useFeedbackStore();

  return (
    <>
      {children}
      {currentTab && (
        <FeedbackModal
          isOpen={isModalOpen}
          tabName={currentTab}
          onCloseAction={closeModal}
        />
      )}
    </>
  );
}
