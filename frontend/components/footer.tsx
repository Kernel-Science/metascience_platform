import Image from "next/image";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="mt-auto w-full border-t border-foreground/15 bg-content1/65 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Image src="/FQXILogo.svg" alt="FQxI" width={86} height={44} />
              <p className="text-xs font-semibold tracking-[0.18em] text-foreground/70">
                METASCIENCE PLATFORM
              </p>
            </div>
            <p className="text-sm text-foreground/78">
              © {new Date().getFullYear()} FQxI Metascience Platform. All
              rights reserved.
            </p>
            <p className="mt-1 text-xs text-foreground/60">
              Developed by Kernel Science SRL.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-foreground/78">
            <Link
              href="/privacy"
              className="hover:text-foreground hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground hover:underline"
            >
              Terms of Service
            </Link>
            <a
              href="https://supabase.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground hover:underline"
            >
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
