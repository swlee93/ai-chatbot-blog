import { auth } from '@/app/(auth)/auth';
import { promises as fs } from 'fs';
import matter from 'gray-matter';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

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
      const files = await fs.readdir(contentDir);
      const mdFiles = files.filter(file => 
        file.endsWith('.md') && !file.startsWith('projects')
      );

      const items = await Promise.all(
        mdFiles.map(async (file) => {
          const filePath = path.join(contentDir, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const { data, content } = matter(fileContent);
          
          return {
            id: file.replace('.md', ''),
            title: data.title || file.replace('.md', ''),
            description: data.description || '',
            tags: data.tags || [],
            icon: data.icon || 'FileText',
            order: data.order || 999,
            private: data.private !== false,
            href: `/blog/context/${file.replace('.md', '')}`,
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
      const filePath = path.join(contentDir, `${type}.md`);
      
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
      
      // Check if content is private and user is not authenticated
      // Treat content as private by default unless private: false is explicitly set
      const isPrivate = data.private !== false;
      const isPreview = isPrivate && !isAuthenticated;

      return NextResponse.json({ 
        metadata: data,
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
