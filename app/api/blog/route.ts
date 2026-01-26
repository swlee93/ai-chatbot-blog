import { auth } from '@/app/(auth)/auth';
import { promises as fs } from 'fs';
import matter from 'gray-matter';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const DIRECTORY_TAG_DELIMITER = '__';

async function getMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return getMarkdownFiles(fullPath);
      }
      if (entry.isFile() && entry.name.endsWith('.md')) {
        return [fullPath];
      }
      return [];
    })
  );
  return files.flat();
}

function normalizeTagSegment(segment: string): string {
  const cleaned = segment.replace(/[_-]+/g, ' ').trim();
  if (!cleaned) return segment;
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function tagsFromPath(relativePath: string): string[] {
  const dir = path.dirname(relativePath);
  if (dir === '.' || dir === path.sep) return [];
  return dir
    .split(path.sep)
    .filter(Boolean)
    .map(normalizeTagSegment);
}

function normalizeTags(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((tag) => String(tag));
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function slugFromRelativePath(relativePath: string): string {
  return relativePath
    .replace(/\.md$/i, '')
    .split(path.sep)
    .join(DIRECTORY_TAG_DELIMITER);
}

function relativePathFromSlug(slug: string): string {
  return slug.split(DIRECTORY_TAG_DELIMITER).join(path.sep);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type'); // 'list' or specific slug

  try {
    const contentDir = path.join(process.cwd(), 'content');
    
    let session = null;
    let isAuthenticated = false;
    
    try {
      session = await auth();
      // Only regular users are considered authenticated (not guests)
      isAuthenticated = !!session && session.user?.type === 'regular';
    } catch (authError) {
      console.error('Auth error:', authError);
      // Continue without authentication
    }

    // Get list of all context items
    if (type === 'list') {
      const mdFiles = await getMarkdownFiles(contentDir);

      const items = await Promise.all(
        mdFiles.map(async (filePath) => {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const { data, content } = matter(fileContent);
          const relativePath = path.relative(contentDir, filePath);
          const slug = slugFromRelativePath(relativePath);
          const derivedTags = tagsFromPath(relativePath);
          const explicitTags = normalizeTags(data.tags);
          const tags = Array.from(new Set([...derivedTags, ...explicitTags]));
          
          return {
            id: slug,
            title: data.title || slug,
            description: data.description || '',
            tags,
            icon: data.icon || 'FileText',
            order: data.order || 999,
            private: data.private !== false,
            href: `/blog/context/${encodeURIComponent(slug)}`,
            content: content,
          };
        })
      );

      // Sort by order (show all items including private ones)
      items.sort((a, b) => a.order - b.order);

      return NextResponse.json({ items, isAuthenticated });
    }

    // Get specific item content
    if (type) {
      const relativePath = relativePathFromSlug(type);
      const filePath = path.join(contentDir, `${relativePath}.md`);
      
      try {
        await fs.access(filePath);
      } catch {
        return NextResponse.json(
          { error: 'Content not found' },
          { status: 404 }
        );
      }
      
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const { data, content } = matter(fileContent);
      const derivedTags = tagsFromPath(relativePath);
      const explicitTags = normalizeTags(data.tags);
      const tags = Array.from(new Set([...derivedTags, ...explicitTags]));
      
      // Check if content is private and user is not authenticated
      // Treat content as private by default unless private: false is explicitly set
      const isPrivate = data.private !== false;
      const isPreview = isPrivate && !isAuthenticated;

      return NextResponse.json({ 
        metadata: data,
        tags,
        content,
        isPrivate,
        isPreview,
        isAuthenticated,
      });
    }

    return NextResponse.json(
      { error: 'Type parameter required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error loading blog content:', error);
    return NextResponse.json(
      { error: 'Failed to load content' },
      { status: 500 }
    );
  }
}
