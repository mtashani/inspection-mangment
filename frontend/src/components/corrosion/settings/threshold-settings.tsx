'use client';

import { useState } from "react";
import { updateSeverityThresholds } from "@/api/corrosion-settings";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ThresholdsData {
  corrosion_rate: Record<string, number>;
  pitting_density: Record<string, number>;
  pit_depth: Record<string, number>;
}

interface ThresholdSettingsProps {
  thresholds: ThresholdsData | null;
  onThresholdsChanged: () => void;
}

export function ThresholdSettings({ thresholds, onThresholdsChanged }: ThresholdSettingsProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [thresholdValues, setThresholdValues] = useState<ThresholdsData | null>(thresholds);

  // Update local state when props change
  if (thresholds !== null && JSON.stringify(thresholds) !== JSON.stringify(thresholdValues)) {
    setThresholdValues(thresholds);
  }

  // Handle updating thresholds
  const handleUpdateThresholds = async () => {
    if (!thresholdValues) return;
    
    try {
      setSaving(true);
      await updateSeverityThresholds(thresholdValues);
      
      toast({
        title: "Success",
        description: "Severity thresholds updated successfully.",
      });
      
      onThresholdsChanged();
    } catch (err) {
      console.error("Failed to update thresholds:", err);
      toast({
        title: "Error",
        description: "Failed to update thresholds. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Helper to update threshold values
  const updateThresholdValue = (
    category: keyof ThresholdsData,
    level: string,
    value: number
  ) => {
    if (!thresholdValues) return;
    
    setThresholdValues({
      ...thresholdValues,
      [category]: {
        ...thresholdValues[category],
        [level]: value
      }
    });
  };

  if (!thresholdValues) {
    return (
      <div className="text-center py-6">
        No threshold data available
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Corrosion Rate Thresholds (mm/year)</CardTitle>
          <CardDescription>
            Configure the thresholds for determining severity levels based on corrosion rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(thresholdValues.corrosion_rate).map(([level, value]) => (
              <div key={level} className="space-y-2">
                <Label htmlFor={`rate-${level}`}>
                  {level.replace('level', 'Level ')}
                </Label>
                <Input
                  id={`rate-${level}`}
                  type="number"
                  step="0.001"
                  min="0"
                  value={value}
                  onChange={(e) => updateThresholdValue(
                    'corrosion_rate',
                    level,
                    parseFloat(e.target.value)
                  )}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Pitting Density Thresholds (pits/cm²)</CardTitle>
          <CardDescription>
            Configure the thresholds for determining severity based on pitting density
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(thresholdValues.pitting_density).map(([level, value]) => (
              <div key={level} className="space-y-2">
                <Label htmlFor={`pitting-${level}`}>
                  {level.replace('level', 'Level ')}
                </Label>
                <Input
                  id={`pitting-${level}`}
                  type="number"
                  step="0.1"
                  min="0"
                  value={value}
                  onChange={(e) => updateThresholdValue(
                    'pitting_density',
                    level,
                    parseFloat(e.target.value)
                  )}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Pit Depth Thresholds (mm)</CardTitle>
          <CardDescription>
            Configure the thresholds for determining severity based on maximum pit depth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(thresholdValues.pit_depth).map(([level, value]) => (
              <div key={level} className="space-y-2">
                <Label htmlFor={`depth-${level}`}>
                  {level.replace('level', 'Level ')}
                </Label>
                <Input
                  id={`depth-${level}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={value}
                  onChange={(e) => updateThresholdValue(
                    'pit_depth',
                    level,
                    parseFloat(e.target.value)
                  )}
                />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpdateThresholds} 
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving Thresholds...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save All Thresholds
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}