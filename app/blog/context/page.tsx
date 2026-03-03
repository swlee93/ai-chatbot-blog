"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  ChevronRight,
  Code,
  FileText,
  Folder,
  Grid3X3,
  Lightbulb,
  Lock,
  Search,
  ThumbsUp,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

interface FolderNode {
  name: string;
  path: string;
  children: Map<string, FolderNode>;
  items: ContextItem[];
}

type SortOption =
  | "order"
  | "title-asc"
  | "title-desc"
  | "hits-desc"
  | "hits-asc";

type ViewMode = "grid" | "folder";

export default function ContextPage() {
  const [items, setItems] = useState<ContextItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContextItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("hits-desc");
  const [fileStats, setFileStats] = useState<Map<string, number>>(new Map());
  const [viewMode, setViewMode] = useState<ViewMode>("folder");
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  // Categorize hit count into groups (top 33%, middle 33%, bottom 33%)
  const getHitGroup = (hitCount: number): 0 | 1 | 2 | 3 => {
    if (hitCount === 0) return 0;

    const allCounts = Array.from(fileStats.values())
      .filter((c) => c > 0)
      .sort((a, b) => b - a);
    if (allCounts.length === 0) return 1;

    const topThreshold = allCounts[Math.floor(allCounts.length * 0.33)] || 1;
    const midThreshold = allCounts[Math.floor(allCounts.length * 0.66)] || 1;

    if (hitCount >= topThreshold) return 3;
    if (hitCount >= midThreshold) return 2;
    return 1;
  };

  // Build folder tree from items
  const folderTree = useMemo(() => {
    const root: FolderNode = {
      name: "root",
      path: "",
      children: new Map(),
      items: [],
    };

    filteredItems.forEach((item) => {
      const parts = item.id.split("__");
      let current = root;

      // Navigate/create folder structure
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const pathSoFar = parts.slice(0, i + 1).join("__");

        if (!current.children.has(part)) {
          current.children.set(part, {
            name: part,
            path: pathSoFar,
            children: new Map(),
            items: [],
          });
        }
        current = current.children.get(part)!;
      }

      // Add item to current folder
      current.items.push(item);
    });

    return root;
  }, [filteredItems]);

  // Get current folder based on path
  const getCurrentFolder = (): FolderNode => {
    let current = folderTree;
    for (const segment of currentPath) {
      const child = current.children.get(segment);
      if (child) {
        current = child;
      } else {
        break;
      }
    }
    return current;
  };

  // Recursively count all items in a folder and its subfolders
  const countAllItems = (folder: FolderNode): number => {
    let count = folder.items.length;
    for (const child of folder.children.values()) {
      count += countAllItems(child);
    }
    return count;
  };

  // Recursively sum all hits in a folder and its subfolders
  const sumAllHits = (folder: FolderNode): number => {
    let total = folder.items.reduce(
      (sum, item) => sum + (fileStats.get(item.id) || 0),
      0,
    );
    for (const child of folder.children.values()) {
      total += sumAllHits(child);
    }
    return total;
  };

  useEffect(() => {
    async function loadContextItems() {
      try {
        const [itemsResponse, statsResponse] = await Promise.all([
          fetch("/api/blog?type=list"),
          fetch("/api/blog/stats"),
        ]);

        const data = await itemsResponse.json();
        setItems(data.items);
        setFilteredItems(data.items);
        setIsAuthenticated(data.isAuthenticated);

        // Extract unique tags
        const tagsSet = new Set<string>();
        data.items.forEach((item: ContextItem) => {
          item.tags.forEach((tag) => tagsSet.add(tag));
        });
        setAllTags(Array.from(tagsSet).sort());

        // Load hit statistics
        const statsData = await statsResponse.json();
        const statsMap = new Map<string, number>();

        statsData?.stats?.forEach((stat: FileStats) => {
          const relativePath = stat.filePath
            .replace(/^content\//, "")
            .replace(/\.md$/, "");
          const slug = relativePath.split("/").join("__");
          statsMap.set(slug, (statsMap.get(slug) || 0) + stat.hitCount);
        });

        setFileStats(statsMap);

        // Set default view mode based on item count
        // Use folder view for large collections (30+ items)
        if (data.items.length >= 30) {
          setViewMode("folder");
        } else {
          setViewMode("grid");
        }
      } catch (error) {
        console.error("Failed to load context items:", error);
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
          item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          (item.content && item.content.toLowerCase().includes(query))
        );
      });
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((item) => {
        return selectedTags.every((tag) => item.tags.includes(tag));
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "hits-desc": {
          const aHits = fileStats.get(a.id) || 0;
          const bHits = fileStats.get(b.id) || 0;
          return bHits - aHits;
        }
        case "hits-asc": {
          const aHits = fileStats.get(a.id) || 0;
          const bHits = fileStats.get(b.id) || 0;
          return aHits - bHits;
        }
        case "order":
        default:
          return a.order - b.order;
      }
    });

    setFilteredItems(sorted);
  }, [searchQuery, selectedTags, items, sortBy, fileStats]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const formatFolderName = (name: string): string => {
    return name
      .replace(/[_-]+/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const renderItemCard = (item: ContextItem, compact = false) => {
    const Icon = iconMap[item.icon as keyof typeof iconMap] || FileText;
    const hitCount = fileStats.get(item.id) || 0;

    if (compact) {
      return (
        <Link
          key={item.id}
          href={item.href}
          className="group flex items-center gap-3 p-3 rounded-lg bg-card border hover:bg-accent transition-colors"
        >
          <Icon className="size-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{item.title}</h4>
            {item.description && (
              <p className="text-xs text-muted-foreground truncate">
                {item.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(() => {
              const group = getHitGroup(hitCount);
              if (group === 0) return null;
              return (
                <div className="flex items-center">
                  {Array.from({ length: group }).map((_, i) => (
                    <ThumbsUp
                      key={i}
                      className={`size-3 ${
                        i === 0
                          ? "text-primary fill-primary"
                          : "text-primary fill-white stroke-primary"
                      }`}
                      style={{
                        marginLeft: i > 0 ? "-6px" : "0",
                        zIndex: group - i,
                        strokeWidth: i > 0 ? "1.5px" : undefined,
                      }}
                    />
                  ))}
                </div>
              );
            })()}
            {item.private && !isAuthenticated && (
              <Lock className="size-3 text-muted-foreground" />
            )}
          </div>
        </Link>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        className="group relative block p-6 rounded-2xl bg-card border hover:bg-accent transition-colors"
      >
        <div className="absolute top-5 right-5 flex items-center gap-2">
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
                        ? "text-primary fill-primary"
                        : "text-primary fill-white stroke-primary"
                    }`}
                    style={{
                      marginLeft: i > 0 ? "-8px" : "0",
                      zIndex: group - i,
                      strokeWidth: i > 0 ? "1.5px" : undefined,
                    }}
                  />
                ))}
              </div>
            );
          })()}
          {item.private && !isAuthenticated && (
            <div className="p-1.5 rounded-full bg-muted">
              <Lock className="size-3.5 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="mb-5">
          <Icon className="size-6 text-foreground mb-4" />
          <h3 className="font-semibold text-xl mb-2.5">{item.title}</h3>
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
  };

  const renderFolderView = () => {
    const currentFolder = getCurrentFolder();
    const folders = Array.from(currentFolder.children.values());
    const folderItems = currentFolder.items;

    return (
      <div className="space-y-4">
        {/* Breadcrumb */}
        {currentPath.length > 0 && (
          <div className="flex items-center gap-2 text-sm mb-6">
            <button
              onClick={() => setCurrentPath([])}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Root
            </button>
            {currentPath.map((segment, idx) => (
              <div key={segment} className="flex items-center gap-2">
                <ChevronRight className="size-4 text-muted-foreground" />
                <button
                  onClick={() => setCurrentPath(currentPath.slice(0, idx + 1))}
                  className={
                    idx === currentPath.length - 1
                      ? "font-medium"
                      : "text-muted-foreground hover:text-foreground transition-colors"
                  }
                >
                  {formatFolderName(segment)}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Folders */}
        {folders.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {folders.map((folder) => {
              const itemCount = countAllItems(folder);
              const totalHits = sumAllHits(folder);

              return (
                <button
                  key={folder.path}
                  onClick={() => setCurrentPath([...currentPath, folder.name])}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border hover:bg-accent transition-colors text-left"
                >
                  <Folder className="size-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {formatFolderName(folder.name)}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {itemCount} items
                      {totalHits > 0 && ` · ${totalHits} refs`}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        )}

        {/* Files in current folder */}
        {folderItems.length > 0 && (
          <div className="space-y-2">
            {folderItems.map((item) => renderItemCard(item, true))}
          </div>
        )}

        {folders.length === 0 && folderItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No items in this folder
          </div>
        )}
      </div>
    );
  };

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
        {filteredItems.map((item) => renderItemCard(item))}
      </div>
    );
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
        <div className="mb-8">
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

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border bg-background p-1">
                <button
                  onClick={() => {
                    setViewMode("grid");
                    setCurrentPath([]);
                  }}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Grid view"
                >
                  <Grid3X3 className="size-4" />
                </button>
                <button
                  onClick={() => setViewMode("folder")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "folder"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Folder view"
                >
                  <Folder className="size-4" />
                </button>
              </div>

              {/* Sort dropdown */}
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
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

          {/* Tag Filter - only show in grid view */}
          {viewMode === "grid" && allTags.length > 0 && (
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
                        ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
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

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <span>{filteredItems.length} documents</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No contexts found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          <>
            {viewMode === "grid" && renderGridView()}
            {viewMode === "folder" && renderFolderView()}
          </>
        )}
      </div>
    </div>
  );
}
