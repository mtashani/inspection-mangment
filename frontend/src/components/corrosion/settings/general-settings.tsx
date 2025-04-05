'use client';

import { useState } from "react";
import { 
  updateRbiLevel,
  updateInspectionFrequency
} from "@/api/corrosion-settings";
import { CorrosionMonitoringSettings } from "@/components/corrosion/types";
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
import { Loader2, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface GeneralSettingsProps {
  settings: CorrosionMonitoringSettings | null;
  onSettingsChanged: () => void;
}

export function GeneralSettings({ settings, onSettingsChanged }: GeneralSettingsProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [rbiLevel, setRbiLevel] = useState(settings?.rbi_level || 2);
  const [inspectionFrequency, setInspectionFrequency] = useState({
    high_risk: settings?.inspection_frequency.high_risk || 90,
    medium_risk: settings?.inspection_frequency.medium_risk || 180,
    low_risk: settings?.inspection_frequency.low_risk || 365
  });

  // Update local state when props change
  if (settings && settings.rbi_level !== rbiLevel) {
    setRbiLevel(settings.rbi_level);
  }

  if (settings && (
    settings.inspection_frequency.high_risk !== inspectionFrequency.high_risk ||
    settings.inspection_frequency.medium_risk !== inspectionFrequency.medium_risk ||
    settings.inspection_frequency.low_risk !== inspectionFrequency.low_risk
  )) {
    setInspectionFrequency(settings.inspection_frequency);
  }
  
  // Handle RBI level change
  const handleRbiLevelChange = async () => {
    try {
      setSaving(true);
      await updateRbiLevel(rbiLevel);
      
      toast({
        title: "Success",
        description: "RBI level updated successfully.",
      });
      
      onSettingsChanged();
    } catch (err) {
      console.error("Failed to update RBI level:", err);
      toast({
        title: "Error",
        description: "Failed to update RBI level. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle inspection frequency change
  const handleInspectionFrequencyChange = async () => {
    try {
      setSaving(true);
      await updateInspectionFrequency(inspectionFrequency);
      
      toast({
        title: "Success",
        description: "Inspection frequencies updated successfully.",
      });
      
      onSettingsChanged();
    } catch (err) {
      console.error("Failed to update inspection frequencies:", err);
      toast({
        title: "Error",
        description: "Failed to update inspection frequencies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>RBI Level</CardTitle>
          <CardDescription>
            Set the Risk-Based Inspection level for corrosion monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((level) => (
                <div key={level} className="flex items-start space-x-2">
                  <input
                    type="radio"
                    id={`level-${level}`}
                    name="rbi-level"
                    value={level}
                    checked={rbiLevel === level}
                    onChange={() => setRbiLevel(level)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <label htmlFor={`level-${level}`} className="font-medium">
                      Level {level}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {level === 1 && "Basic monitoring with minimal inspections"}
                      {level === 2 && "Standard monitoring with regular inspections"}
                      {level === 3 && "Enhanced monitoring with frequent inspections"}
                      {level === 4 && "Comprehensive monitoring with extensive analysis"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleRbiLevelChange}
            disabled={saving || Boolean(settings && settings.rbi_level === rbiLevel)}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save RBI Level"
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div>
              <CardTitle>Inspection Frequencies</CardTitle>
              <CardDescription>
                Configure the inspection intervals for different risk categories (in days)
              </CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground ml-2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="high-risk">High Risk Systems (days)</Label>
              <Input
                id="high-risk"
                type="number"
                min="1"
                value={inspectionFrequency.high_risk}
                onChange={(e) => setInspectionFrequency({
                  ...inspectionFrequency,
                  high_risk: parseInt(e.target.value)
                })}
              />
              <p className="text-sm text-muted-foreground">
                Recommended: 60-90 days
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="medium-risk">Medium Risk Systems (days)</Label>
              <Input
                id="medium-risk"
                type="number"
                min="1"
                value={inspectionFrequency.medium_risk}
                onChange={(e) => setInspectionFrequency({
                  ...inspectionFrequency,
                  medium_risk: parseInt(e.target.value)
                })}
              />
              <p className="text-sm text-muted-foreground">
                Recommended: 120-180 days
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="low-risk">Low Risk Systems (days)</Label>
              <Input
                id="low-risk"
                type="number"
                min="1"
                value={inspectionFrequency.low_risk}
                onChange={(e) => setInspectionFrequency({
                  ...inspectionFrequency,
                  low_risk: parseInt(e.target.value)
                })}
              />
              <p className="text-sm text-muted-foreground">
                Recommended: 240-365 days
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleInspectionFrequencyChange}
            disabled={saving || Boolean(
              settings &&
              settings.inspection_frequency.high_risk === inspectionFrequency.high_risk &&
              settings.inspection_frequency.medium_risk === inspectionFrequency.medium_risk &&
              settings.inspection_frequency.low_risk === inspectionFrequency.low_risk
            )}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Inspection Frequencies"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}