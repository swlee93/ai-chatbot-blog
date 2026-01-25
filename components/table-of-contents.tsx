'use client';

import { useHeadingsObserver } from '@/hooks/use-headings-observer';
import type { Heading } from '@/lib/blog/headings';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const headingIds = headings.map((h) => h.id);
  const activeId = useHeadingsObserver(headingIds);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    
    if (element) {
      // Find the scroll container (parent with overflow-y-auto)
      const scrollContainer = element.closest('.overflow-y-auto');
      
      if (scrollContainer) {
        // Calculate element position relative to the container
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const offset = 100;
        const scrollTop = scrollContainer.scrollTop;
        const targetPosition = scrollTop + (elementRect.top - containerRect.top) - offset;

        scrollContainer.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      } else {
        // Fallback: window scroll
        const offset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav className="fixed top-20 right-8 z-40 hidden xl:block w-64 max-h-[calc(100vh-8rem)] overflow-y-auto bg-background border border-border rounded-lg">
      <div className="sticky top-0 bg-background border-b px-3 py-2.5 flex items-center justify-between">
        <h3 className="text-xs font-medium text-foreground/80">Contents</h3>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={isExpanded ? 'Collapse contents' : 'Expand contents'}
        >
          <ChevronRight className={cn('h-3.5 w-3.5', isExpanded && 'rotate-90')} />
        </button>
      </div>

      {isExpanded && (
        <ul className="p-2 space-y-0.5">
          {headings.map((heading, index) => {
            const isActive = activeId === heading.id;

            return (
              <li key={`heading-${heading.id}-${index}`}>
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => handleClick(e, heading.id)}
                  className={cn(
                    'block px-2 py-1 text-xs rounded',
                    'hover:bg-accent/50',
                    isActive
                      ? 'text-foreground font-medium bg-accent/50'
                      : 'text-muted-foreground'
                  )}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}

export function MobileTableOfContents({ headings }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const headingIds = headings.map((h) => h.id);
  const activeId = useHeadingsObserver(headingIds);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    
    if (element) {
      // Find the scroll container (parent with overflow-y-auto)
      const scrollContainer = element.closest('.overflow-y-auto');
      
      if (scrollContainer) {
        // Calculate element position relative to the container
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const offset = 80;
        const scrollTop = scrollContainer.scrollTop;
        const targetPosition = scrollTop + (elementRect.top - containerRect.top) - offset;

        scrollContainer.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      } else {
        // Fallback: window scroll
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
      setIsOpen(false);
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className="xl:hidden mb-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded border border-border bg-muted/30 hover:bg-muted/50"
      >
        <span className="text-xs font-medium text-foreground/80">Contents</span>
        <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground', isOpen && 'rotate-90')} />
      </button>

      {isOpen && (
        <ul className="mt-2 space-y-0.5 p-2 bg-muted/20 rounded border border-border">
          {headings.map((heading, index) => {
            const isActive = activeId === heading.id;

            return (
              <li key={`heading-${heading.id}-${index}`}>
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => handleClick(e, heading.id)}
                  className={cn(
                    'block px-2 py-1 text-xs rounded no-underline',
                    'hover:bg-accent/50 transition-colors',
                    isActive
                      ? 'text-foreground font-medium bg-accent/50'
                      : 'text-muted-foreground'
                  )}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}