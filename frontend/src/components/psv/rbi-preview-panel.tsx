'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { fetchPSVs } from "@/api/psv";
import { previewRBIChanges } from "@/api/rbi";
import { PSV, RBIConfiguration } from "./types";

interface RBIPreviewPanelProps {
  configData: Omit<RBIConfiguration, 'id' | 'created_at' | 'updated_at'>;
  onDismiss: () => void;
}

export function RBIPreviewPanel({ configData, onDismiss }: RBIPreviewPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [psvs, setPSVs] = useState<PSV[]>([]);
  const [previewData, setPreviewData] = useState<{
    [key: string]: { current: Date | null; new: Date | null };
  }>({});

  // Fetch a sample of PSVs to test the config against
  useEffect(() => {
    async function loadPSVs() {
      try {
        setIsLoading(true);
        const data = await fetchPSVs({ limit: 5 }); // Just get a few PSVs for the preview
        setPSVs(data);
      } catch (err) {
        console.error("Error loading PSVs for preview:", err);
        setError("Failed to load PSVs for preview");
      } finally {
        setIsLoading(false);
      }
    }

    loadPSVs();
  }, []);

  // Calculate preview data when PSVs load
  useEffect(() => {
    async function calculatePreview() {
      if (psvs.length === 0) return;
      
      try {
        setIsLoading(true);
        const tagNumbers = psvs.map(psv => psv.tag_number);
        const preview = await previewRBIChanges(tagNumbers, configData);
        setPreviewData(preview);
      } catch (err) {
        console.error("Error calculating preview:", err);
        setError("Failed to calculate preview data");
      } finally {
        setIsLoading(false);
      }
    }

    calculatePreview();
  }, [psvs, configData]);

  // Function to format dates or show placeholder
  const formatDate = (date: Date | null) => {
    return date ? format(date, "PP") : "N/A";
  };

  // Calculate if configuration causes major changes
  const hasMajorChanges = () => {
    let count = 0;
    for (const key in previewData) {
      const { current, new: newDate } = previewData[key];
      if (current && newDate) {
        const currentTime = current.getTime();
        const newTime = newDate.getTime();
        const diffInDays = Math.abs(newTime - currentTime) / (1000 * 60 * 60 * 24);
        if (diffInDays > 30) count++; // If more than 30 days difference
      }
    }
    return count > Math.floor(Object.keys(previewData).length / 2); // If more than half PSVs have major changes
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Calculating preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-md bg-red-50">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle size={16} />
          <p className="font-medium">Error generating preview</p>
        </div>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <div className="flex justify-end">
          <Button onClick={onDismiss} variant="outline">
            Close Preview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-md bg-slate-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">RBI Configuration Impact Preview</h3>
        {hasMajorChanges() && (
          <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-md">
            Major Schedule Changes
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        This preview shows how the new configuration will affect calibration schedules for a sample of PSVs.
      </p>
      
      <div className="space-y-3">
        {psvs.map(psv => {
          const dateData = previewData[psv.tag_number] || { current: null, new: null };
          const currentDate = dateData.current;
          const newDate = dateData.new;
          
          let changeClass = "text-muted-foreground";
          
          // Calculate change impact 
          if (currentDate && newDate) {
            const diffInDays = Math.floor((newDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffInDays > 30) {
              changeClass = "text-green-600 font-medium";
            } else if (diffInDays < -30) {
              changeClass = "text-red-600 font-medium";
            } else {
              changeClass = "text-amber-600";
            }
          }
          
          return (
            <Card key={psv.tag_number} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{psv.tag_number}</h4>
                  <p className="text-xs text-muted-foreground">{psv.service || "Unknown service"}</p>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-sm">{formatDate(currentDate)}</div>
                  <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                  <div className={`text-sm ${changeClass}`}>{formatDate(newDate)}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button onClick={onDismiss} variant="outline">
          Close Preview
        </Button>
        <Button onClick={onDismiss} variant="default">
          Continue with Changes
        </Button>
      </div>
    </div>
  );
}