"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { RadioGroup, Radio } from "@heroui/radio";
import { Card, CardBody } from "@heroui/card";

import { Star, MessageCircle, Send } from "lucide-react";

import { useFeedbackStore } from "@/lib/feedbackStore";

interface FeedbackModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  tabName: "search" | "analysis" | "review" | "citation" | "methods";
}

export function FeedbackModal({
  isOpen,
  onCloseAction,
  tabName,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [feedbackType, setFeedbackType] = useState<string>("general");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { submitFeedback } = useFeedbackStore();

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmit = async () => {
    if (!message.trim() || rating === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({
        tab_name: tabName,
        rating,
        feedback_type: feedbackType,
        message: message.trim(),
      });

      // Reset form
      setRating(0);
      setFeedbackType("general");
      setMessage("");
      onCloseAction();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setFeedbackType("general");
    setMessage("");
    onCloseAction();
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        backdrop: "backdrop-blur-sm",
        base: "backdrop-blur-md bg-background/80 border border-divider",
        header: "border-b border-divider",
        body: "py-4",
        footer: "border-t border-divider",
      }}
      isOpen={isOpen}
      size="md"
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="text-foreground">Share Your Feedback</span>
          </div>
          <p className="text-sm text-foreground-500 font-normal">
            Help us improve your experience
          </p>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Rating Section */}
            <Card className="backdrop-blur-sm bg-content1/50 border border-divider">
              <CardBody className="p-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">
                    How would you rate your experience?
                  </h4>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        className="p-0 min-w-8 h-8"
                        isIconOnly
                        variant="light"
                        onPress={() => handleStarClick(star)}
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            star <= rating
                              ? "fill-warning text-warning"
                              : "text-foreground-400 hover:text-warning"
                          }`}
                        />
                      </Button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-xs text-foreground-500">
                      {rating === 1 && "Poor"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Very Good"}
                      {rating === 5 && "Excellent"}
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Feedback Type */}
            <Card className="backdrop-blur-sm bg-content1/50 border border-divider">
              <CardBody className="p-4">
                <RadioGroup
                  classNames={{
                    label: "text-sm font-medium text-foreground",
                  }}
                  label="What type of feedback is this?"
                  value={feedbackType}
                  onValueChange={setFeedbackType}
                >
                  <Radio
                    classNames={{ label: "text-foreground-600" }}
                    value="general"
                  >
                    General Feedback
                  </Radio>
                  <Radio
                    classNames={{ label: "text-foreground-600" }}
                    value="bug"
                  >
                    Bug Report
                  </Radio>
                  <Radio
                    classNames={{ label: "text-foreground-600" }}
                    value="feature"
                  >
                    Feature Request
                  </Radio>
                  <Radio
                    classNames={{ label: "text-foreground-600" }}
                    value="improvement"
                  >
                    Improvement Suggestion
                  </Radio>
                </RadioGroup>
              </CardBody>
            </Card>

            {/* Message */}
            <Card className="backdrop-blur-sm bg-content1/50 border border-divider">
              <CardBody className="p-4">
                <Textarea
                  classNames={{
                    label: "text-sm font-medium text-foreground",
                    input: "bg-transparent text-foreground",
                    inputWrapper:
                      "bg-content2/50 border border-divider backdrop-blur-sm",
                  }}
                  label="Your Feedback"
                  maxRows={6}
                  minRows={3}
                  placeholder="Tell us about your experience..."
                  value={message}
                  onValueChange={setMessage}
                />
              </CardBody>
            </Card>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            className="text-foreground-600"
            variant="light"
            onPress={handleClose}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            isDisabled={!message.trim() || rating === 0}
            isLoading={isSubmitting}
            startContent={
              !isSubmitting ? <Send className="w-4 h-4" /> : undefined
            }
            onPress={handleSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
