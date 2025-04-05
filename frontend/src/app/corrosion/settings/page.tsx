'use client';

import { useState, useEffect } from "react";
import { 
  fetchSettings, 
  fetchMaterialFactors, 
  fetchSeverityThresholds,
  resetToDefaults
} from "@/api/corrosion-settings";
import { CorrosionMonitoringSettings } from "@/components/corrosion/types";
import { GeneralSettings } from "@/components/corrosion/settings/general-settings";
import { MaterialSettings } from "@/components/corrosion/settings/material-settings";
import { ThresholdSettings } from "@/components/corrosion/settings/threshold-settings";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MaterialData {
  material_name: string;
  base_corrosion_rate: number;
  severity_multiplier: number;
}

interface ThresholdsData {
  corrosion_rate: Record<string, number>;
  pitting_density: Record<string, number>;
  pit_depth: Record<string, number>;
}

export default function SettingsPage() {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<CorrosionMonitoringSettings | null>(null);
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdsData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog open state
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  
  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch all settings
      const settingsData = await fetchSettings();
      setSettings(settingsData);
      
      // Fetch material factors
      const materialsData = await fetchMaterialFactors();
      setMaterials(materialsData);
      
      // Fetch severity thresholds
      const thresholdsData = await fetchSeverityThresholds();
      setThresholds(thresholdsData);
      
      setError(null);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError("Failed to load settings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle resetting to defaults
  const handleResetToDefaults = async () => {
    try {
      setSaving(true);
      
      await resetToDefaults();
      
      toast({
        title: "Success",
        description: "Settings have been reset to defaults.",
      });
      
      // Reload settings after reset
      await loadSettings();
      
      setIsResetDialogOpen(false);
    } catch (err) {
      console.error("Failed to reset settings:", err);
      toast({
        title: "Error",
        description: "Failed to reset settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="outline" className="mb-6" asChild>
          <Link href="/corrosion">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" asChild>
          <Link href="/corrosion">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
        
        <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to Default Settings?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all settings to their default values, including material factors and severity thresholds.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleResetToDefaults}
                disabled={saving}
                className="bg-red-500 hover:bg-red-600"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                  </>
                ) : (
                  "Reset Settings"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Corrosion Monitoring Settings</h1>
        <p className="text-muted-foreground">
          Configure your corrosion monitoring system settings, including materials, thresholds, and inspection frequencies.
        </p>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="thresholds">Severity Thresholds</TabsTrigger>
        </TabsList>
        
        {/* General Settings Tab */}
        <TabsContent value="general">
          <GeneralSettings 
            settings={settings} 
            onSettingsChanged={loadSettings} 
          />
        </TabsContent>
        
        {/* Materials Tab */}
        <TabsContent value="materials">
          <MaterialSettings 
            materials={materials} 
            onMaterialsChanged={loadSettings} 
          />
        </TabsContent>
        
        {/* Thresholds Tab */}
        <TabsContent value="thresholds">
          <ThresholdSettings 
            thresholds={thresholds} 
            onThresholdsChanged={loadSettings} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}