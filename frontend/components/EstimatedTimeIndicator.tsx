"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Card, CardBody } from "@heroui/card";

interface EstimatedTimeIndicatorProps {
  isVisible: boolean;
  estimatedSeconds: number;
  analysisType: "trends" | "citations" | "assessment";
}

export const EstimatedTimeIndicator: React.FC<EstimatedTimeIndicatorProps> = ({
  isVisible,
  estimatedSeconds,
  analysisType,
}) => {
  const [displayTime, setDisplayTime] = useState(estimatedSeconds);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDisplayTime((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    setDisplayTime(estimatedSeconds);
  }, [estimatedSeconds, isVisible]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getAnalysisLabel = () => {
    return analysisType === "trends"
      ? "Trend Analysis"
      : analysisType === "citations"
        ? "Citation Network Analysis"
        : "Paper Assessment";
  };

  if (!isVisible) return null;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 shadow-md">
        <CardBody className="py-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {getAnalysisLabel()} in Progress
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Estimated time remaining:{" "}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {formatTime(displayTime)}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  className="w-2 h-2 bg-blue-600 rounded-full"
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  className="w-2 h-2 bg-blue-600 rounded-full"
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  className="w-2 h-2 bg-blue-600 rounded-full"
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};
