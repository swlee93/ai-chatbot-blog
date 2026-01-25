'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Briefcase, Code, FileText, Lightbulb, Lock, LogOut, Search, ThumbsUp, User, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const iconMap = {
  User,
  Briefcase,
  FileText,
  Code,
  Lightbulb,
  Lock,
};

interface ContextItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  icon: string;
  order: number;
  private?: boolean;
  href: string;
  content?: string;
}

interface FileStats {
  filePath: string;
  hitCount: number;
}

type SortOption = 'order' | 'title-asc' | 'title-desc' | 'hits-desc' | 'hits-asc';

export default function ContextPage() {
  const [items, setItems] = useState<ContextItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContextItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('hits-desc');
  const [fileStats, setFileStats] = useState<Map<string, number>>(new Map());

  // Categorize hit count into groups (top 33%, middle 33%, bottom 33%)
  const getHitGroup = (hitCount: number): 0 | 1 | 2 | 3 => {
    if (hitCount === 0) return 0;
    
    const allCounts = Array.from(fileStats.values()).filter(c => c > 0).sort((a, b) => b - a);
    if (allCounts.length === 0) return 1;
    
    const topThreshold = allCounts[Math.floor(allCounts.length * 0.33)] || 1;
    const midThreshold = allCounts[Math.floor(allCounts.length * 0.66)] || 1;
    
    if (hitCount >= topThreshold) return 3;
    if (hitCount >= midThreshold) return 2;
    return 1;
  };

  useEffect(() => {
    async function loadContextItems() {
      try {
        const [itemsResponse, statsResponse] = await Promise.all([
          fetch('/api/blog?type=list&lang=ko'),
          fetch('/api/blog/stats?lang=ko'),
        ]);
        
        const data = await itemsResponse.json();
        setItems(data.items);
        setFilteredItems(data.items);
        setIsAuthenticated(data.isAuthenticated);
        
        // Extract unique tags
        const tagsSet = new Set<string>();
        data.items.forEach((item: ContextItem) => {
          item.tags.forEach(tag => tagsSet.add(tag));
        });
        setAllTags(Array.from(tagsSet).sort());
        
        // Load hit statistics - simple filename matching
        const statsData = await statsResponse.json();
        const statsMap = new Map<string, number>();
        
        console.log('📊 Client - Raw stats:', statsData.stats);
        console.log('📊 Client - Items:', data.items.map((i: ContextItem) => i.id));
        
        statsData?.stats?.forEach((stat: FileStats) => {
          // Extract filename: "content/ko/profile.md" -> "profile"
          const fileName = stat.filePath.split('/').pop()?.replace('.md', '') || '';
          console.log(`📊 Mapping: ${stat.filePath} -> ${fileName} (${stat.hitCount} hits)`);
          statsMap.set(fileName, (statsMap.get(fileName) || 0) + stat.hitCount);
        });
        
        console.log('📊 Final statsMap:', Array.from(statsMap.entries()));
        setFileStats(statsMap);
      } catch (error) {
        console.error('Failed to load context items:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadContextItems();
  }, []);

  useEffect(() => {
    let filtered = items;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags.some(tag => tag.toLowerCase().includes(query)) ||
          (item.content && item.content.toLowerCase().includes(query))
        );
      });
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((item) => {
        return selectedTags.every(tag => item.tags.includes(tag));
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'hits-desc': {
          const aHits = fileStats.get(a.id) || 0;
          const bHits = fileStats.get(b.id) || 0;
          return bHits - aHits;
        }
        case 'hits-asc': {
          const aHits = fileStats.get(a.id) || 0;
          const bHits = fileStats.get(b.id) || 0;
          return aHits - bHits;
        }
        case 'order':
        default:
          return a.order - b.order;
      }
    });

    setFilteredItems(sorted);
  }, [searchQuery, selectedTags, items, sortBy, fileStats]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSignOut = async () => {
    try {
      // Call the NextAuth signout endpoint and redirect
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/auth/signout';
      
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfToken';
      csrfInput.value = await fetch('/api/auth/csrf').then(r => r.json()).then(d => d.csrfToken);
      
      const redirectInput = document.createElement('input');
      redirectInput.type = 'hidden';
      redirectInput.name = 'callbackUrl';
      redirectInput.value = '/';
      
      form.appendChild(csrfInput);
      form.appendChild(redirectInput);
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="p-4">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-y-auto bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto w-full max-w-6xl p-8 sm:p-12 pb-24">
        <div className="mb-12">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                
                <input
                  type="text"
                  placeholder="Search by title, description, tags, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border bg-background/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />  
              </div>
            </div>
            
            {/* Sort dropdown */}
            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Default order</SelectItem>
                  <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  <SelectItem value="hits-desc">Most referenced</SelectItem>
                  <SelectItem value="hits-asc">Least referenced</SelectItem>
                </SelectContent>
              </Select>
              
              {!isAuthenticated ? (
                <div className="flex gap-3">
                  <Link
                    href="/login"
                    className="px-5 py-2.5 rounded-full text-sm font-medium bg-muted/50 backdrop-blur-xl hover:bg-muted transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2.5 rounded-full text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
                  >
                    Create account
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="flex-1 flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all
                        ${isSelected 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }
                      `}
                    >
                      {tag}
                      {isSelected && <X className="size-3" />}
                    </button>
                  );
                })}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="px-3 py-1.5 text-xs font-medium rounded-full text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No contexts found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
            {filteredItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] || FileText;
            const hitCount = fileStats.get(item.id) || 0;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group relative block p-6 rounded-2xl bg-card border hover:bg-accent transition-colors"
              >
                <div className="absolute top-5 right-5 flex items-center gap-2">
                  {/* Hit count indicator - thumbs up icons */}
                  {(() => {
                    const group = getHitGroup(hitCount);
                    if (group === 0) return null;
                    
                    return (
                      <div className="flex items-center">
                        {Array.from({ length: group }).map((_, i) => (
                          <ThumbsUp
                            key={i}
                            className={`size-4 ${
                              i === 0 
                                ? 'text-primary fill-primary' 
                                : 'text-primary fill-white stroke-primary'
                            }`}
                            style={{
                              marginLeft: i > 0 ? '-8px' : '0',
                              zIndex: group - i,
                              strokeWidth: i > 0 ? '1.5px' : undefined,
                            }}
                          />
                        ))}
                      </div>
                    );
                  })()}
                  
                  {/* Lock icon for private content */}
                  {item.private && !isAuthenticated && (
                    <div className="p-1.5 rounded-full bg-muted">
                      <Lock className="size-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="mb-5">
                  <Icon className="size-6 text-foreground mb-4" />
                  <h3 className="font-semibold text-xl mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
