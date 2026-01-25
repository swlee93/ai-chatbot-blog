/**
 * Heading extraction and processing utilities
 *
 * Purpose: Extract headings from markdown content and transform them
 * into data required for table-of-contents generation.
 */

export interface Heading {
  id: string;
  text: string;
  level: number;
}

/**
 * Parse markdown text and extract a list of headings.
 *
 * @param markdown - Markdown text
 * @returns Array of heading data (h2 only)
 */
export function extractHeadings(markdown: string): Heading[] {
  const headingRegex = /^(#{2})\s+(.+)$/gm;
  const headings: Heading[] = [];
  
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);
    
    headings.push({ id, text, level });
  }
  
  return headings;
}

/**
 * Convert text to a URL-safe slug.
 * Follows GitHub markdown anchor conventions.
 *
 * @param text - Text to convert
 * @returns URL-safe slug
 *
 * @example
 * slugify("Overview") // "overview"
 * slugify("Problem Context") // "problem-context"
 * slugify("Decision Matrix: Which approach to choose?") // "decision-matrix-which-approach-to-choose"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Convert whitespace and separators to hyphens
    .replace(/[\s_]+/g, '-')
    // Collapse repeated hyphens
    .replace(/-+/g, '-')
    // Keep only lowercase letters, numbers, and hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}
