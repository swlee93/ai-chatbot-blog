import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';
import type { BlogContent } from './content';

export interface ContentChunk {
  content: string;
  metadata: {
    filePath: string;
    section: string;
    title?: string;
    fileTitle?: string;
    fileDescription?: string;
  };
}

/**
 * Extract frontmatter from markdown content
 */
function extractFrontmatter(markdown: string): {
  title?: string;
  description?: string;
  content: string;
} {
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!frontmatterMatch) {
    return { content: markdown };
  }
  
  const frontmatter = frontmatterMatch[1];
  const content = frontmatterMatch[2];
  
  const titleMatch = frontmatter.match(/^title:\s*["'](.+)["']/m);
  const descriptionMatch = frontmatter.match(/^description:\s*["'](.+)["']/m);
  
  return {
    title: titleMatch?.[1],
    description: descriptionMatch?.[1],
    content,
  };
}

/**
 * Split markdown content by headers (## and ###)
 * This creates semantic chunks that maintain context
 */
export function chunkByMarkdownHeaders(
  markdown: string,
  filePath: string
): ContentChunk[] {
  // Extract frontmatter first
  const { title: fileTitle, description: fileDescription, content } = extractFrontmatter(markdown);
  
  // Split by ## and ### headers while keeping the header with content
  const chunks: ContentChunk[] = [];
  const lines = content.split('\n');
  
  let currentChunk = '';
  let currentTitle = '';
  let chunkStarted = false;

  for (const line of lines) {
    // Check if line is a header (## or ###)
    const headerMatch = line.match(/^(#{2,3})\s+(.+)$/);
    
    if (headerMatch) {
      // Save previous chunk if it has content
      if (currentChunk.trim().length > 100) {
        // Prepend file title and description as context
        const contextPrefix = [
          fileTitle ? `File: ${fileTitle}` : '',
          fileDescription ? `Description: ${fileDescription}` : '',
        ].filter(Boolean).join('\n') + '\n\n';
        
        chunks.push({
          content: contextPrefix + currentChunk.trim(),
          metadata: {
            filePath,
            section: extractSection(currentChunk),
            title: currentTitle || undefined,
            fileTitle,
            fileDescription,
          },
        });
      }
      
      // Start new chunk
      currentChunk = line + '\n';
      currentTitle = headerMatch[2];
      chunkStarted = true;
    } else {
      // Add line to current chunk
      if (chunkStarted) {
        currentChunk += line + '\n';
      }
    }
  }

  // Add the last chunk
  if (currentChunk.trim().length > 100) {
    const contextPrefix = [
      fileTitle ? `File: ${fileTitle}` : '',
      fileDescription ? `Description: ${fileDescription}` : '',
    ].filter(Boolean).join('\n') + '\n\n';
    
    chunks.push({
      content: contextPrefix + currentChunk.trim(),
      metadata: {
        filePath,
        section: extractSection(currentChunk),
        title: currentTitle || undefined,
        fileTitle,
        fileDescription,
      },
    });
  }

  return chunks;
}

/**
 * Extract section name from chunk content
 */
function extractSection(content: string): string {
  const firstLine = content.split('\n')[0];
  const match = firstLine.match(/^#{1,3}\s+(.+)$/);
  return match ? match[1] : 'content';
}

/**
 * Chunk entire blog content
 */
export function chunkBlogContent(content: BlogContent): ContentChunk[] {
  const chunks: ContentChunk[] = [];

  // Chunk all markdown files dynamically
  for (const [fileName, fileContent] of Object.entries(content.files)) {
    chunks.push(
      ...chunkByMarkdownHeaders(fileContent, `content/${fileName}.md`),
    );
  }

  return chunks;
}

/**
 * Generate embeddings for content chunks using OpenAI
 */
export async function generateEmbeddings(
  chunks: ContentChunk[]
): Promise<Array<{ chunk: ContentChunk; embedding: number[] }>> {
  try {
    const { embeddings } = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values: chunks.map((chunk) => chunk.content),
    });

    return chunks.map((chunk, index) => ({
      chunk,
      embedding: Array.from(embeddings[index]),
    }));
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

/**
 * Calculate content statistics
 */
export function getChunkStats(chunks: ContentChunk[]) {
  const totalChars = chunks.reduce((sum, c) => sum + c.content.length, 0);
  const avgChunkSize = totalChars / chunks.length;
  const estimatedTokens = Math.ceil(totalChars / 4); // Rough estimate

  return {
    totalChunks: chunks.length,
    totalCharacters: totalChars,
    averageChunkSize: Math.round(avgChunkSize),
    estimatedTokens,
    sizeKB: (totalChars / 1024).toFixed(2),
  };
}
