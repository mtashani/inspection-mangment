'use client';

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RBIConfigForm } from "@/components/psv/rbi-config-form";
import { RBIConfiguration, RBILevel } from "@/components/psv/types";

// Base type for form data
interface RBIConfigFormData {
  level: RBILevel;
  name: string;
  description?: string;
  active: boolean;
  settings: {
    fixed_interval?: number;
    pop_test_thresholds?: {
      min: number;
      max: number;
    };
    leak_test_thresholds?: {
      min: number;
      max: number;
    };
    parameter_weights?: {
      [key: string]: number;
    };
    risk_matrix?: {
      [key: string]: number[];
    };
    service_risk_categories?: {
      [key: string]: number;
    };
  };
}

export default function PSVSettingsPage() {
  const [configs, setConfigs] = useState<RBIConfiguration[]>([]);
  const [activeConfig, setActiveConfig] = useState<RBIConfiguration | null>(null);
  const [activeTab, setActiveTab] = useState<"rbi" | "service">("rbi");
  const [isLoading, setIsLoading] = useState(true);

  const loadConfigurations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/psv/rbi/config");
      if (!response.ok) throw new Error("Failed to load configurations");
      const data = await response.json();
      setConfigs(data);

      // Set active config to the first one if none selected
      if (!activeConfig && data.length > 0) {
        setActiveConfig(data[0]);
      }
    } catch (error) {
      console.error("Error loading RBI configurations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeConfig]);

  useEffect(() => {
    loadConfigurations();
  }, [loadConfigurations]);

  const handleConfigSave = async (formData: RBIConfigFormData) => {
    try {
      setIsLoading(true);
      const method = activeConfig?.id ? "PUT" : "POST";
      const url = activeConfig?.id
        ? `/api/psv/rbi/config/${activeConfig.id}`
        : "/api/psv/rbi/config";

      // Ensure level is of type RBILevel
      const level = formData.level as RBILevel;
      if (![1, 2, 3, 4].includes(level)) {
        throw new Error("Invalid RBI level");
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          level,
          // Include id if editing existing config
          ...(activeConfig?.id && { id: activeConfig.id }),
        }),
      });

      if (!response.ok) throw new Error("Failed to save configuration");
      await loadConfigurations();
    } catch (error) {
      console.error("Error saving RBI configuration:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConfig = () => {
    setActiveConfig(null);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">PSV Settings</h1>
          <p className="text-muted-foreground">
            Manage RBI configurations and service risk categories
          </p>
        </div>
        <Button onClick={handleNewConfig}>New Configuration</Button>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-4 border-b">
          <button
            className={`px-4 py-2 ${
              activeTab === "rbi"
                ? "border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("rbi")}
          >
            RBI Configuration
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "service"
                ? "border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("service")}
          >
            Service Risk Categories
          </button>
        </div>

        {activeTab === "rbi" && (
          <div className="grid grid-cols-4 gap-4">
            {/* Configuration List */}
            <div className="col-span-1 space-y-2">
              {configs.map((config) => (
                <Card
                  key={config.id}
                  className={`cursor-pointer ${
                    activeConfig?.id === config.id
                      ? "border-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setActiveConfig(config)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-medium">
                      Level {config.level} - {config.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {config.active ? "Active" : "Inactive"}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Configuration Form */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>
                  {activeConfig ? "Edit Configuration" : "New Configuration"}
                </CardTitle>
                <CardDescription>
                  Configure RBI settings and thresholds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RBIConfigForm
                  initialData={activeConfig ?? undefined}
                  onSubmit={handleConfigSave}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "service" && (
          <Card>
            <CardHeader>
              <CardTitle>Service Risk Categories</CardTitle>
              <CardDescription>
                Configure risk categories and consequence scores based on API 581
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Service risk categories configuration will be implemented in the next phase.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      )}
    </div>
  );
}