'use client';

import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

interface BlogMarkdownProps {
  content: string;
  className?: string;
}

export function BlogMarkdown({
  content,
  className,
}: BlogMarkdownProps) {
  return (
    <div
      className={cn(
        'prose prose-zinc dark:prose-invert max-w-none',
        // Custom styling for blog content
        'prose-headings:font-bold prose-headings:tracking-tight',
        'prose-h1:text-3xl prose-h1:mb-4',
        'prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:pb-2',
        'prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3',
        'prose-p:text-muted-foreground prose-p:leading-7',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        // Heading anchor link styling (rehype-autolink-headings)
        'prose-headings:no-underline hover:prose-headings:no-underline',
        '[&_h1_a]:no-underline [&_h2_a]:no-underline [&_h3_a]:no-underline',
        '[&_h1_a]:text-inherit [&_h2_a]:text-inherit [&_h3_a]:text-inherit',
        'prose-strong:text-foreground prose-strong:font-semibold',
        'prose-ul:my-4 prose-li:my-2',
        'prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono',
        'prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900 prose-pre:text-foreground prose-pre:border prose-pre:border-border',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          rehypeHighlight,
        ]}
        components={{
          // Custom link to handle external links
          a: ({ node, href, children, ...props }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            );
          },
          // Custom code block styling
          code: ({ node, className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-muted text-sm" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={cn('block', className)} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
