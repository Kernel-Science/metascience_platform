import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-divider mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} Metascience Platform. All rights
              reserved.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Developed with ❤️ by Kernel Science SRL
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline"
            >
              Terms of Service
            </Link>
            <a
              href="https://supabase.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline"
            >
              Security
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-divider">
          <p className="text-xs text-center text-gray-500 dark:text-gray-500">
            This service uses data from external APIs. We do not sell or share
            your personal information.
          </p>
        </div>
      </div>
    </footer>
  );
};
