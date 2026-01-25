'use client';

import { BlogMarkdown } from '@/components/blog-markdown';
import { MobileTableOfContents, TableOfContents } from '@/components/table-of-contents';
import { extractHeadings } from '@/lib/blog/headings';
import { useEffect, useMemo, useState } from 'react';

export default function ProjectsPage() {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/blog?type=projects');
        const data = await response.json();
        setContent(data.content);
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadContent();
  }, []);

  // Extract headings from content for table of contents
  const headings = useMemo(() => {
    if (!content) return [];
    return extractHeadings(content);
  }, [content]);

  return (
    <div className="flex h-full relative">
      <div className="mx-auto w-full max-w-4xl overflow-y-auto px-4 py-8 pb-20">
        {/* Mobile table of contents */}
        {!isLoading && content && (
          <MobileTableOfContents headings={headings} />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <BlogMarkdown content={content} />
          </div>
        )}
      </div>

      {/* Desktop fixed table of contents - top right */}
      {!isLoading && content && (
        <TableOfContents headings={headings} />
      )}
    </div>
  );
}
