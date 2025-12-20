"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle } from "lucide-react";

interface MessageProps {
  error: string;
  success: string;
  onClearMessagesAction: () => void;
}

export const Message: React.FC<MessageProps> = ({
  error,
  success,
  onClearMessagesAction,
}) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className="backdrop-blur-md bg-red-500/90 text-white border border-red-400/30 rounded-full px-4 py-3 shadow-lg shadow-red-500/25 max-w-sm"
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium flex-1">{error}</p>
              <button
                className="text-white/80 hover:text-white transition-colors"
                onClick={onClearMessagesAction}
                aria-label="Close message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            key="success"
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className="backdrop-blur-md bg-green-500/90 text-white border border-green-400/30 rounded-full px-4 py-3 shadow-lg shadow-green-500/25 max-w-sm"
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium flex-1">{success}</p>
              <button
                className="text-white/80 hover:text-white transition-colors"
                onClick={onClearMessagesAction}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
