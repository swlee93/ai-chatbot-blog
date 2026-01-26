import fs from 'fs/promises';
import { readFileSync } from 'node:fs';
import path from 'path';
import YAML from 'yaml';

const DEFAULT_BLOG_CONFIG = {
  contentDir: 'content',
  sizeThresholdKB: 200,
};

let cachedBlogConfig: typeof DEFAULT_BLOG_CONFIG | null = null;

function loadBlogConfigSync() {
  if (cachedBlogConfig) {
    return cachedBlogConfig;
  }

  try {
    const configPath = path.join(process.cwd(), 'public', 'ai-chatbot-blog.yaml');
    const raw = readFileSync(configPath, 'utf-8');
    const parsed = YAML.parse(raw) as {
      BLOG_CONFIG?: {
        contentDir?: string;
        sizeThresholdKB?: number;
        sizeThresholdBytes?: number;
      };
    };

    const contentDir = parsed?.BLOG_CONFIG?.contentDir?.trim() || DEFAULT_BLOG_CONFIG.contentDir;
    const sizeThresholdKB =
      typeof parsed?.BLOG_CONFIG?.sizeThresholdKB === 'number'
        ? parsed.BLOG_CONFIG.sizeThresholdKB
        : typeof parsed?.BLOG_CONFIG?.sizeThresholdBytes === 'number'
            ? Math.ceil(parsed.BLOG_CONFIG.sizeThresholdBytes / 1024)
            : DEFAULT_BLOG_CONFIG.sizeThresholdKB;

    cachedBlogConfig = {
      contentDir,
      sizeThresholdKB,
    };
    return cachedBlogConfig;
  } catch {
    cachedBlogConfig = DEFAULT_BLOG_CONFIG;
    return cachedBlogConfig;
  }
}

export interface BlogContent {
  combined: string; // All content combined
  files: { [key: string]: string }; // Individual files
  totalSize: number;
}

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectMarkdownFiles(fullPath);
      }
      if (entry.isFile() && entry.name.endsWith('.md')) {
        return [fullPath];
      }
      return [];
    })
  );
  return files.flat();
}

/**
 * Load all blog markdown content from the content directory
 */
export async function loadBlogContent(): Promise<BlogContent> {
  try {
    const blogConfig = loadBlogConfigSync();
    const contentDirPath = path.isAbsolute(blogConfig.contentDir)
      ? blogConfig.contentDir
      : path.join(process.cwd(), blogConfig.contentDir);

    // Read all markdown files in the directory (recursive)
    const mdFiles = (await collectMarkdownFiles(contentDirPath)).sort();
    
    const fileContents: { [key: string]: string } = {};
    let combined = '';
    
    for (const filePath of mdFiles) {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path
        .relative(contentDirPath, filePath)
        .replace(/\.md$/, '');
      const fileName = relativePath.split(path.sep).join('/');
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
    console.error('Error loading blog content:', error);
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
  const blogConfig = loadBlogConfigSync();
  return content.totalSize > blogConfig.sizeThresholdKB * 1024;
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
