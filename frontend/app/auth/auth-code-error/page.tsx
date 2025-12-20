"use client";

import { Suspense } from "react";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function AuthCodeErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const description = searchParams.get("description");

  const getErrorDetails = () => {
    switch (error) {
      case "access_denied":
        return {
          title: "Access Denied",
          message:
            "You cancelled the authentication process. Please try again if you'd like to sign in.",
        };
      case "exchange_failed":
        return {
          title: "Authentication Failed",
          message:
            description ||
            "Failed to complete authentication. Please try signing in again.",
        };
      case "no_session":
        return {
          title: "Session Error",
          message: "Could not create a session. Please try signing in again.",
        };
      case "missing_code":
        return {
          title: "Invalid Request",
          message:
            "The authentication callback was called without a valid code.",
        };
      default:
        return {
          title: "Authentication Error",
          message:
            description ||
            "There was an error during the authentication process. Please try signing in again.",
        };
    }
  };

  const { title, message } = getErrorDetails();

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-left">
            <p className="text-gray-500 dark:text-gray-400">
              <strong>Error code:</strong> {error}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link href="/auth/login" className="block">
            <Button color="primary" className="w-full">
              Try Again
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="bordered" className="w-full">
              Go to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function AuthCodeError() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCodeErrorContent />
    </Suspense>
  );
}
