'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Trash2, Check, BookmarkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterConfig {
  id?: string;
  name: string;
  filterText: string;
  filterStatus: string[];
  filterServices: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface SavedFiltersProps {
  currentFilters: {
    filterText: string;
    filterStatus: string[];
    filterServices: string[];
  };
  onApplyFilter: (filter: FilterConfig) => void;
  className?: string;
}

export function SavedFilters({ currentFilters, onApplyFilter, className }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<FilterConfig[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load saved filters from localStorage on component mount
  useEffect(() => {
    const storedFilters = localStorage.getItem('psv-saved-filters');
    if (storedFilters) {
      try {
        const parsedFilters = JSON.parse(storedFilters);
        if (Array.isArray(parsedFilters)) {
          setSavedFilters(parsedFilters);
        }
      } catch (err) {
        console.error('Error parsing saved filters:', err);
      }
    }
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (savedFilters.length > 0) {
      localStorage.setItem('psv-saved-filters', JSON.stringify(savedFilters));
    }
  }, [savedFilters]);

  // Check if current filters match any saved filter
  useEffect(() => {
    const matchingFilter = savedFilters.find(filter => 
      filter.filterText === currentFilters.filterText &&
      arraysEqual(filter.filterStatus, currentFilters.filterStatus) &&
      arraysEqual(filter.filterServices, currentFilters.filterServices)
    );
    
    setActiveFilter(matchingFilter?.id || null);
  }, [currentFilters, savedFilters]);

  // Helper function to compare arrays
  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

  // Save current filters
  const handleSaveFilter = () => {
    if (!newFilterName.trim()) {
      setErrorMessage('Please enter a filter name');
      return;
    }
    
    // Check for duplicate name
    if (savedFilters.some(f => f.name.toLowerCase() === newFilterName.trim().toLowerCase())) {
      setErrorMessage('A filter with this name already exists');
      return;
    }
    
    const newFilter: FilterConfig = {
      id: `filter_${Date.now()}`,
      name: newFilterName.trim(),
      ...currentFilters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setSavedFilters([...savedFilters, newFilter]);
    setNewFilterName('');
    setIsDialogOpen(false);
    setErrorMessage(null);
  };

  // Delete a saved filter
  const handleDeleteFilter = (id: string) => {
    setSavedFilters(savedFilters.filter(filter => filter.id !== id));
    if (activeFilter === id) {
      setActiveFilter(null);
    }
  };

  // Apply a saved filter
  const handleApplyFilter = (filter: FilterConfig) => {
    onApplyFilter(filter);
    setActiveFilter(filter.id || null);
  };

  const currentFiltersActive = 
    currentFilters.filterText !== '' || 
    currentFilters.filterStatus.length > 0 || 
    currentFilters.filterServices.length > 0;
  
  return (
    <div className={cn("", className)}>
      <div className="flex items-center space-x-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              disabled={!currentFiltersActive}
            >
              <Save className="h-4 w-4" />
              <span>Save Filter</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Current Filter</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-name">Filter Name</Label>
                  <Input 
                    id="filter-name"
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                    placeholder="My Filter"
                    autoFocus
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Filter Details</Label>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    {currentFilters.filterText && (
                      <p><span className="font-medium">Search:</span> {currentFilters.filterText}</p>
                    )}
                    {currentFilters.filterStatus.length > 0 && (
                      <p><span className="font-medium">Status:</span> {currentFilters.filterStatus.join(', ')}</p>
                    )}
                    {currentFilters.filterServices.length > 0 && (
                      <p><span className="font-medium">Services:</span> {currentFilters.filterServices.length} selected</p>
                    )}
                  </div>
                </div>
                
                {errorMessage && (
                  <div className="text-sm text-red-500">{errorMessage}</div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setNewFilterName('');
                setErrorMessage(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveFilter}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={savedFilters.length === 0}
            >
              <BookmarkIcon className="h-4 w-4" />
              <span>Saved Filters</span>
              {savedFilters.length > 0 && (
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {savedFilters.length}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Saved Filters</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {savedFilters.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <p>No saved filters yet</p>
                  <p className="mt-2">Save your current filters to quickly reuse them later</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {savedFilters.map((filter) => (
                    <div 
                      key={filter.id}
                      className={cn(
                        "flex justify-between items-center p-3 rounded-md",
                        activeFilter === filter.id ? "bg-primary/10 border border-primary/20" : "hover:bg-gray-50 border border-transparent"
                      )}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{filter.name}</h4>
                        <div className="text-xs text-gray-500">
                          {filter.filterText && <span className="mr-2">Search: {filter.filterText}</span>}
                          {filter.filterStatus.length > 0 && (
                            <span className="mr-2">Status: {filter.filterStatus.join(', ')}</span>
                          )}
                          {filter.filterServices.length > 0 && (
                            <span>Services: {filter.filterServices.length} selected</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleApplyFilter(filter)}
                          title="Apply filter"
                        >
                          {activeFilter === filter.id ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:text-red-500"
                          onClick={() => handleDeleteFilter(filter.id!)}
                          title="Delete filter"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" className="w-full">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}