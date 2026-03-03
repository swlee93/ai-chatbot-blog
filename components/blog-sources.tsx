"use client";

import type { BlogSource } from "@/lib/types";
import { FileText } from "lucide-react";
import Link from "next/link";

interface BlogSourcesProps {
  sources: BlogSource[];
}

export function BlogSources({ sources }: BlogSourcesProps) {
  if (!sources || sources.length === 0) return null;

  // Remove duplicates by filePath
  const uniqueSources = sources.filter(
    (source, index, self) =>
      index === self.findIndex((s) => s.filePath === source.filePath)
  );

  // Convert filePath to context page URL
  // e.g., "content/metrics-meta/foo.md" -> "/blog/context/metrics-meta__foo"
  const getContextUrl = (filePath: string) => {
    const relativePath = filePath
      .replace(/^content\//, "")
      .replace(/\.md$/, "");
    const slug = relativePath.split("/").join("__");
    return `/blog/context/${encodeURIComponent(slug)}`;
  };

  // Get filename from path
  const getFileName = (filePath: string) => {
    const parts = filePath.split("/");
    const filename = parts[parts.length - 1].replace(/\.md$/, "");
    return filename
      .replace(/[_-]+/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <FileText className="size-3" />
        참조:
      </span>
      {uniqueSources.map((source, index) => (
        <Link
          key={`${source.filePath}-${index}`}
          href={getContextUrl(source.filePath)}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 hover:bg-muted/80 transition-colors"
        >
          {getFileName(source.filePath)}
        </Link>
      ))}
    </div>
  );
}
