import type { Metadata } from "next";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Footer } from "@/components/Layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "KnowledgeSync - Collaborative Workspace",
  description: "A Notion-inspired local-first collaborative knowledge workspace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <ErrorBoundary>
          <Providers>
            <div className="flex flex-1 flex-col">{children}</div>
            <Footer />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
