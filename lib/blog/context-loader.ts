import {
  buildBlogPrompt,
  detectLanguage,
  loadBlogContent,
  shouldUseRAG,
} from './content';
import {
  buildContextFromSearchResults,
  isRAGAvailable,
  semanticSearch,
} from './semantic-search';

type BlogSource = {
  filePath: string;
  title?: string;
  section?: string;
};

/**
 * Smart context loader that decides whether to use full context or RAG
 * based on content size and availability. Also detects language from query.
 *
 * @returns Object containing context string and source files used
 */
export async function getSmartContext(
  userQuery: string
): Promise<{ context: string; sources: BlogSource[] }> {
  console.time('blog-context-load');

  try {
    // Detect language from user query
    const language = detectLanguage(userQuery);
    console.log(`🌐 Detected language: ${language}`);

    // Load blog content in the detected language
    const content = await loadBlogContent(language);

    // Check if content should use RAG
    const needsRAG = shouldUseRAG(content);

    if (!needsRAG) {
      // Content is small enough - use full context (no sources tracked)
      console.log('📄 Using full blog context (< 50KB)');
      console.timeEnd('blog-context-load');
      return {
        context: buildBlogPrompt(content),
        sources: [],
      };
    }

    // Content is large - try to use RAG if available
    const ragAvailable = await isRAGAvailable();

    if (ragAvailable) {
      console.log('🔍 Using RAG semantic search');

      // Perform semantic search with 20% minimum similarity
      const searchResults = await semanticSearch(userQuery, 5, 0.2);

      if (searchResults.length > 0) {
        const avgSimilarity =
          searchResults.reduce((sum, r) => sum + r.similarity, 0) /
          searchResults.length;
        console.log(
          `✅ Found ${searchResults.length} relevant chunks (avg similarity: ${(avgSimilarity * 100).toFixed(1)}%)`
        );

        const sources = searchResults.map((result) => ({
          filePath: result.metadata.filePath,
          title: result.metadata.title,
          section: result.metadata.section,
        }));

        // If average similarity is low, add a note for the AI to ask clarifying questions
        if (avgSimilarity < 0.35) {
          console.log('⚠️  Low similarity detected - AI should ask clarifying questions');
          const contextWithNote = buildContextFromSearchResults(searchResults);
          console.timeEnd('blog-context-load');
          return {
            context: `${contextWithNote}\n\n---\n\n**NOTE TO AI**: The search results have relatively low similarity scores (avg: ${(avgSimilarity * 100).toFixed(1)}%). Consider asking the user clarifying questions to better understand what specific information they're looking for, or provide a more general response based on the available context.`,
            sources,
          };
        }

        console.timeEnd('blog-context-load');
        return {
          context: buildContextFromSearchResults(searchResults),
          sources,
        };
      }

      // No results found - AI should ask for clarification
      console.log('❌ No relevant content found - returning guidance for AI');
      console.timeEnd('blog-context-load');
      return {
        context: `**NO RELEVANT CONTEXT FOUND**\n\nThe semantic search did not find any blog content relevant to the query: "${userQuery}"\n\nPlease ask the user clarifying questions to better understand what information they're looking for. For example:\n- Could you rephrase or provide more specific details?\n- What aspect of the blog are you most interested in?\n- Are you looking for specific projects, skills, or experiences?`,
        sources: [],
      };
    }

    // Fallback: RAG not available, use full context with warning
    console.warn(
      '⚠️  Large content but RAG unavailable - using full context (may be slow)'
    );
    console.log('💡 Run `npm run rag:sync` to enable semantic search');
    console.timeEnd('blog-context-load');
    return {
      context: buildBlogPrompt(content),
      sources: [],
    };
  } catch (error) {
    console.error('❌ Error loading blog context:', error);
    console.timeEnd('blog-context-load');
    return {
      context: '',
      sources: [],
    }; // Return empty context on error
  }
}

/**
 * Check if a user query is blog-related
 */
export function isBlogQuery(query: string): boolean {
  const blogKeywords = [
    'blog',
    'portfolio',
    'project',
    'projects',
    'experience',
    'career',
    'skills',
    'skill',
    'background',
    'work',
    'education',
    'training',
    'resume',
    'cv',
    'about',
    'technology',
    'tech',
    'react',
    'python',
    'node',
    'typescript',
    'developer',
    'engineer',
    'sangwoo',
    'mayi',
    'whatap',
    'you',
    'your',
    'yourself',
  ];

  const lowerQuery = query.toLowerCase();
  return blogKeywords.some((keyword) => lowerQuery.includes(keyword));
}
