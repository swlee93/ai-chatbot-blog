"use client";

import { BackButton } from "@/components/back-button";
import { BlogMarkdown } from "@/components/blog-markdown";
import {
  MobileTableOfContents,
  TableOfContents,
} from "@/components/table-of-contents";
import { extractHeadings } from "@/lib/blog/headings";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ContextDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [errorType, setErrorType] = useState<"404" | "403" | "general" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true);
      setError("");
      setErrorType(null);
      try {
        const response = await fetch(`/api/blog?type=${slug}&lang=ko`);

        if (response.status === 404) {
          const data = await response.json();
          setError(data.error);
          setErrorType("404");
        } else if (response.status === 403) {
          const data = await response.json();
          setError(data.error);
          setErrorType("403");
        } else if (response.ok) {
          const data = await response.json();
          setContent(data.content);
          setIsPreview(Boolean(data.isPreview));
        } else {
          setError("Failed to load content");
          setErrorType("general");
        }
      } catch (error) {
        console.error("Failed to load content:", error);
        setError("Failed to load content");
        setErrorType("general");
      } finally {
        setIsLoading(false);
      }
    }
    loadContent();
  }, [slug]);


  // Extract headings from content for table of contents
  const headings = useMemo(() => {
    if (!content) return [];
    return extractHeadings(content);
  }, [content]);

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 pb-20">
          <div className="mb-8">
            <BackButton />
          </div>

          {/* Mobile table of contents */}
          {!isLoading && !error && (
            <MobileTableOfContents headings={headings} />
          )}

          {isLoading ? (
            <div className="p-4">Loading...</div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-6 py-12">
              {errorType === "404" ? (
                <>
                  <div className="p-6 rounded-full bg-muted">
                    <svg
                      className="w-16 h-16 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">
                      Content not found
                    </h2>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Link
                      href="/blog/context"
                      className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium inline-block"
                    >
                      Back to context
                    </Link>
                  </div>
                </>
              ) : errorType === "403" ? (
                <>
                  <div className="p-6 rounded-full bg-primary/10">
                    <svg
                      className="w-16 h-16 text-primary"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="flex gap-3 justify-center">
                      <Link
                        href="/login"
                        className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/register"
                        className="px-6 py-2 rounded-lg border hover:bg-accent transition-colors font-medium"
                      >
                        Create account
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-6 rounded-full bg-destructive/10">
                    <svg
                      className="w-16 h-16 text-destructive"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Error</h2>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Link
                      href="/blog/context"
                      className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium inline-block"
                    >
                      Back to context
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {isPreview ? (
                <div className="relative">
                  <div className="relative max-h-[60vh] overflow-hidden">
                    <BlogMarkdown content={content} />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-background/60 to-background" />
                  </div>
                  <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border bg-muted/30 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Sign in to view the full content.
                    </p>
                    <div className="flex gap-3">
                      <Link
                        href="/login"
                        className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/register"
                        className="px-6 py-2 rounded-lg border hover:bg-accent transition-colors font-medium"
                      >
                        Create account
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <BlogMarkdown content={content} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop fixed table of contents - top right */}
      {!isLoading && !error && <TableOfContents headings={headings} />}
    </div>
  );
}
