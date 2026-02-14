import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";
import { FeedbackProvider } from "@/components/feedback/FeedbackProvider";
import { Footer } from "@/components/footer";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCFCF7" },
    { media: "(prefers-color-scheme: dark)", color: "#1D1D1B" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <title>FQxI Metascience Platform</title>
      </head>
      <body
        className={clsx(
          "min-h-screen font-sans antialiased text-foreground",
          fontSans.variable,
        )}
      >
        <Providers
          themeProps={{
            attribute: "class",
            defaultTheme: "light",
            enableSystem: false,
          }}
        >
          <FeedbackProvider>
            <div className="relative flex flex-col min-h-screen">
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </FeedbackProvider>
        </Providers>
      </body>
    </html>
  );
}
