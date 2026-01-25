import fs from 'fs/promises';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const SIZE_THRESHOLD = 50 * 1024; // 50KB in bytes - lowered to use RAG more often

export interface BlogContent {
  combined: string; // All content combined
  files: { [key: string]: string }; // Individual files
  totalSize: number;
}

export type Language = 'ko' | 'en';

/**
 * Detect language from user query or default to Korean
 */
export function detectLanguage(query?: string): Language {
  if (!query) return 'ko';
  
  const lowerQuery = query.toLowerCase();
  
  // Check for explicit language requests
  if (lowerQuery.includes('in english') || lowerQuery.includes('english please')) {
    return 'en';
  }
  
  if (lowerQuery.includes('korean') || lowerQuery.includes('hangul')) {
    return 'ko';
  }
  
  // Check if query is primarily in English (simple heuristic)
  const englishChars = (query.match(/[a-zA-Z]/g) || []).length;
  const koreanChars = (query.match(/[\uac00-\ud7a3]/g) || []).length;
  
  // If English characters dominate, use English
  if (englishChars > koreanChars && englishChars > query.length * 0.3) {
    return 'en';
  }
  
  return 'ko'; // Default to Korean
}

/**
 * Load all blog markdown content from the content directory
 */
export async function loadBlogContent(language: Language = 'ko'): Promise<BlogContent> {
  try {
    const langDir = path.join(CONTENT_DIR, language);
    
    // Read all markdown files in the directory
    const files = await fs.readdir(langDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    const fileContents: { [key: string]: string } = {};
    let combined = '';
    
    for (const file of mdFiles) {
      const content = await fs.readFile(path.join(langDir, file), 'utf-8');
      const fileName = file.replace('.md', '');
      fileContents[fileName] = content;
      combined += `\n\n---\n\n${content}`;
    }

    const totalSize = Buffer.byteLength(combined, 'utf-8');

    return {
      combined: combined.trim(),
      files: fileContents,
      totalSize,
    };
  } catch (error) {
    console.error(`Error loading blog content for language ${language}:`, error);
    // Fallback to default language or empty content
    if (language !== 'ko') {
      return loadBlogContent('ko');
    }
    return {
      combined: '# Blog\n\nContent coming soon...',
      files: {},
      totalSize: 0,
    };
  }
}

/**
 * Check if content size exceeds RAG threshold
 */
export function shouldUseRAG(content: BlogContent): boolean {
  return content.totalSize > SIZE_THRESHOLD;
}

/**
 * Build a combined blog context string for AI prompts
 */
export function buildBlogPrompt(content: BlogContent): string {
  return `
# Blog Author Information

You are an AI assistant representing the blog author. Use the following information to answer questions about their background, experience, projects, and skills.

## Blog Content

${content.combined}

---

When answering questions:
- Be conversational and natural, speaking in first person as if you are the blog author
- Reference specific projects, experiences, and skills from the content above
- If asked about technologies or experiences not mentioned, politely indicate they are not in the blog
- Suggest related projects or skills that might be of interest to the visitor
- For technical questions, provide detailed answers drawing from the project descriptions
`;
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get file size in KB
 */
export function formatSize(bytes: number): string {
  return (bytes / 1024).toFixed(2) + ' KB';
}
