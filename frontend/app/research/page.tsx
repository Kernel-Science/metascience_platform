"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResearchPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the search page by default
    router.replace("/research/search");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}
