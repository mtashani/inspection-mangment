"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Command, ArrowUp, ArrowDown, CornerDownLeft, X, Clock, Star, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// Navigation item interface
export interface NavigationItem {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon?: LucideIcon;
  category?: string;
  keywords?: string[];
  badge?: {
    text: string;
    variant: 'default' | 'success' | 'warning' | 'error' | 'info';
  };
  recent?: boolean;
  favorite?: boolean;
}

// Search result interface
interface SearchResult extends NavigationItem {
  score: number;
  matchedKeywords: string[];
}

interface NavigationSearchProps {
  items: NavigationItem[];
  onNavigate: (item: NavigationItem) => void;
  placeholder?: string;
  className?: string;
  showShortcut?: boolean;
  maxResults?: number;
  recentItems?: NavigationItem[];
  favoriteItems?: NavigationItem[];
  onToggleFavorite?: (item: NavigationItem) => void;
}

export function NavigationSearch({
  items,
  onNavigate,
  placeholder = "Search navigation...",
  className,
  showShortcut = true,
  maxResults = 8,
  recentItems = [],
  favoriteItems = [],
  onToggleFavorite
}: NavigationSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fuzzy search function
  const fuzzySearch = (searchQuery: string, items: NavigationItem[]): SearchResult[] => {
    if (!searchQuery.trim()) {
      // Show recent and favorite items when no query
      const combined = [
        ...favoriteItems.map(item => ({ ...item, score: 100, matchedKeywords: [] })),
        ...recentItems.filter(item => !favoriteItems.find(fav => fav.id === item.id))
          .map(item => ({ ...item, score: 90, matchedKeywords: [] }))
      ];
      return combined.slice(0, maxResults);
    }

    const query = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    items.forEach(item => {
      let score = 0;
      const matchedKeywords: string[] = [];

      // Title match (highest priority)
      if (item.title.toLowerCase().includes(query)) {
        score += item.title.toLowerCase().startsWith(query) ? 100 : 80;
        matchedKeywords.push('title');
      }

      // Description match
      if (item.description?.toLowerCase().includes(query)) {
        score += 60;
        matchedKeywords.push('description');
      }

      // Category match
      if (item.category?.toLowerCase().includes(query)) {
        score += 50;
        matchedKeywords.push('category');
      }

      // Keywords match
      item.keywords?.forEach(keyword => {
        if (keyword.toLowerCase().includes(query)) {
          score += 40;
          matchedKeywords.push(keyword);
        }
      });

      // Boost for favorites and recent items
      if (favoriteItems.find(fav => fav.id === item.id)) {
        score += 20;
      }
      if (recentItems.find(recent => recent.id === item.id)) {
        score += 10;
      }

      if (score > 0) {
        searchResults.push({
          ...item,
          score,
          matchedKeywords
        });
      }
    });

    return searchResults
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  };

  // Update search results
  useEffect(() => {
    const searchResults = fuzzySearch(query, items);
    setResults(searchResults);
    setSelectedIndex(0);
  }, [query, items, favoriteItems, recentItems, maxResults]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }

      // Navigation within search results
      if (isOpen) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
            break;
          case 'Enter':
            e.preventDefault();
            if (results[selectedIndex]) {
              handleItemSelect(results[selectedIndex]);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && isOpen) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex, isOpen]);

  const handleItemSelect = (item: NavigationItem) => {
    onNavigate(item);
    setIsOpen(false);
    setQuery('');
  };

  const handleToggleFavorite = (e: React.MouseEvent, item: NavigationItem) => {
    e.stopPropagation();
    onToggleFavorite?.(item);
  };

  const getBadgeColor = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'bg-[var(--color-success-light)] text-[var(--color-success-dark)]';
      case 'warning':
        return 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]';
      case 'error':
        return 'bg-[var(--color-error-light)] text-[var(--color-error-dark)]';
      case 'info':
        return 'bg-[var(--color-info-light)] text-[var(--color-info-dark)]';
      default:
        return 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]';
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-[var(--color-primary-200)] text-[var(--color-primary-800)] px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <>
      {/* Search Trigger */}
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal text-[var(--color-text-secondary)]",
          "hover:bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)]",
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="flex-1">{placeholder}</span>
        {showShortcut && (
          <div className="flex items-center gap-1 text-xs">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
        )}
      </Button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50">
          <Card className="w-full max-w-2xl mx-4 shadow-2xl border-[var(--color-border-primary)]">
            <div className="p-4 border-b border-[var(--color-border-primary)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="pl-10 pr-4 border-none focus:ring-0 text-base"
                  autoFocus
                />
              </div>
            </div>

            <CardContent className="p-0 max-h-96 overflow-y-auto">
              {results.length > 0 ? (
                <div ref={resultsRef} className="py-2">
                  {results.map((item, index) => {
                    const Icon = item.icon;
                    const isFavorite = favoriteItems.find(fav => fav.id === item.id);
                    const isRecent = recentItems.find(recent => recent.id === item.id);
                    
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                          "hover:bg-[var(--color-bg-secondary)]",
                          index === selectedIndex && "bg-[var(--color-primary-50)] border-r-2 border-[var(--color-primary-600)]"
                        )}
                        onClick={() => handleItemSelect(item)}
                      >
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          {Icon ? (
                            <Icon className="w-5 h-5 text-[var(--color-primary-600)]" />
                          ) : (
                            <Hash className="w-5 h-5 text-[var(--color-text-secondary)]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                              {highlightMatch(item.title, query)}
                            </h4>
                            
                            {/* Badges */}
                            <div className="flex items-center gap-1">
                              {isRecent && (
                                <Clock className="w-3 h-3 text-[var(--color-text-secondary)]" />
                              )}
                              {item.badge && (
                                <span className={cn(
                                  "px-1.5 py-0.5 text-xs font-medium rounded",
                                  getBadgeColor(item.badge.variant)
                                )}>
                                  {item.badge.text}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {item.description && (
                            <p className="text-xs text-[var(--color-text-secondary)] truncate mt-1">
                              {highlightMatch(item.description, query)}
                            </p>
                          )}
                          
                          {item.category && (
                            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                              in {highlightMatch(item.category, query)}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {onToggleFavorite && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => handleToggleFavorite(e, item)}
                            >
                              <Star className={cn(
                                "w-3 h-3",
                                isFavorite ? "fill-[var(--color-warning-main)] text-[var(--color-warning-main)]" : "text-[var(--color-text-secondary)]"
                              )} />
                            </Button>
                          )}
                          
                          {index === selectedIndex && (
                            <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                              <CornerDownLeft className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Search className="w-8 h-8 text-[var(--color-text-secondary)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {query ? 'No results found' : 'Start typing to search...'}
                  </p>
                </div>
              )}
            </CardContent>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    <ArrowDown className="w-3 h-3" />
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CornerDownLeft className="w-3 h-3" />
                    <span>Select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <X className="w-3 h-3" />
                    <span>Close</span>
                  </div>
                </div>
                <div>
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

// Hook for managing navigation search state
export function useNavigationSearch() {
  const [recentItems, setRecentItems] = useState<NavigationItem[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<NavigationItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedRecent = localStorage.getItem('navigation-recent');
    const savedFavorites = localStorage.getItem('navigation-favorites');
    
    if (savedRecent) {
      try {
        setRecentItems(JSON.parse(savedRecent));
      } catch (e) {
        console.error('Failed to parse recent items:', e);
      }
    }
    
    if (savedFavorites) {
      try {
        setFavoriteItems(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to parse favorite items:', e);
      }
    }
  }, []);

  const addRecentItem = (item: NavigationItem) => {
    setRecentItems(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      const updated = [item, ...filtered].slice(0, 10); // Keep only 10 recent items
      localStorage.setItem('navigation-recent', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleFavorite = (item: NavigationItem) => {
    setFavoriteItems(prev => {
      const isFavorite = prev.find(i => i.id === item.id);
      const updated = isFavorite 
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item];
      localStorage.setItem('navigation-favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecent = () => {
    setRecentItems([]);
    localStorage.removeItem('navigation-recent');
  };

  const clearFavorites = () => {
    setFavoriteItems([]);
    localStorage.removeItem('navigation-favorites');
  };

  return {
    recentItems,
    favoriteItems,
    addRecentItem,
    toggleFavorite,
    clearRecent,
    clearFavorites
  };
}