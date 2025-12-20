// Utility function to join class names conditionally

// Simple error handler for user-visible errors
export function notifyError(message: string) {
  if (typeof window !== "undefined" && window.alert) {
    window.alert(message);
  }
  // Optionally, extend with external logging/reporting here
}
