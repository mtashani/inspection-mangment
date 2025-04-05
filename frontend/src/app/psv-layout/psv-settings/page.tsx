'use client';

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RBIConfigForm } from "@/components/psv/rbi-config-form";
import { ServiceRiskForm } from "@/components/psv/service-risk-form";
import { RBIConfiguration, RBILevel, ServiceRiskCategory } from "@/components/psv/types";
import { 
  fetchRBIConfigurations, 
  createRBIConfiguration, 
  updateRBIConfiguration,
  fetchServiceRiskCategories,
  createServiceRiskCategory,
  updateServiceRiskCategory
} from "@/api/rbi";

// No form interface needed as we're using the exported types

export default function PSVSettingsPage() {
  // RBI Configuration State
  const [configs, setConfigs] = useState<RBIConfiguration[]>([]);
  const [activeConfig, setActiveConfig] = useState<RBIConfiguration | null>(null);
  
  // Service Risk Category State
  const [serviceRisks, setServiceRisks] = useState<ServiceRiskCategory[]>([]);
  const [activeServiceRisk, setActiveServiceRisk] = useState<ServiceRiskCategory | null>(null);
  
  // Common State
  const [activeTab, setActiveTab] = useState<"rbi" | "service">("rbi");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load RBI Configurations - without activeConfig dependency
  const loadConfigurations = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching RBI configurations...");
      const data = await fetchRBIConfigurations();
      setConfigs(data);
      
      // We use a function form of setState to safely check without dependencies
      setActiveConfig(current => {
        if (!current && data.length > 0) {
          return data[0];
        }
        return current;
      });
    } catch (error) {
      console.error("Error loading RBI configurations:", error);
      toast({
        variant: "destructive",
        title: "Failed to load configurations",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // Removed activeConfig dependency

  // Load Service Risk Categories - without activeServiceRisk dependency
  const loadServiceRiskCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching service risk categories...");
      const data = await fetchServiceRiskCategories();
      setServiceRisks(data);
      
      // Use function form of setState to safely check without dependencies
      setActiveServiceRisk(current => {
        if (!current && data.length > 0) {
          return data[0];
        }
        return current;
      });
    } catch (error) {
      console.error("Error loading service risk categories:", error);
      toast({
        variant: "destructive",
        title: "Failed to load service risk categories",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // Removed activeServiceRisk dependency

  // Load data only once on initial tab selection
  const [initialLoadDone, setInitialLoadDone] = useState({
    rbi: false,
    service: false
  });

  // Load the appropriate data based on active tab, but only once per tab
  useEffect(() => {
    if (activeTab === "rbi" && !initialLoadDone.rbi) {
      loadConfigurations();
      setInitialLoadDone(prev => ({ ...prev, rbi: true }));
    } else if (activeTab === "service" && !initialLoadDone.service) {
      loadServiceRiskCategories();
      setInitialLoadDone(prev => ({ ...prev, service: true }));
    }
  }, [activeTab, loadConfigurations, loadServiceRiskCategories, initialLoadDone]);

  // Handle RBI Config Form Submit
  const handleConfigSave = async (formData: Omit<RBIConfiguration, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      
      // Ensure level is of type RBILevel
      const level = formData.level as RBILevel;
      if (![1, 2, 3, 4].includes(level)) {
        throw new Error("Invalid RBI level");
      }

      let result;
      // Check if we're activating a configuration that wasn't active before
      const isActivating = formData.active && (!activeConfig?.active);
      
      if (activeConfig?.id) {
        // Update existing configuration
        result = await updateRBIConfiguration(activeConfig.id, formData);
        
        // Show appropriate toast based on whether we're activating this config
        if (isActivating) {
          toast({
            title: "Configuration activated",
            description: `RBI Configuration "${result.name}" has been activated. All other configurations have been deactivated.`
          });
        } else {
          toast({
            title: "Configuration updated",
            description: `RBI Configuration "${result.name}" has been updated successfully.`
          });
        }
      } else {
        // Create new configuration
        result = await createRBIConfiguration({
          ...formData,
          level,
        });
        
        // Show appropriate toast based on whether the new config is active
        if (formData.active) {
          toast({
            title: "Configuration created and activated",
            description: `New RBI Configuration "${result.name}" has been created and activated. All other configurations have been deactivated.`
          });
        } else {
          toast({
            title: "Configuration created",
            description: `New RBI Configuration "${result.name}" has been created successfully.`
          });
        }
      }

      // Reload all configurations to reflect changes in active status
      await loadConfigurations();
      setActiveConfig(result);
    } catch (error) {
      console.error("Error saving RBI configuration:", error);
      toast({
        variant: "destructive",
        title: "Error saving configuration",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Service Risk Form Submit
  const handleServiceRiskSave = async (formData: Omit<ServiceRiskCategory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      
      let result;
      if (activeServiceRisk?.id) {
        // Update existing service risk category
        result = await updateServiceRiskCategory(activeServiceRisk.id, formData);
        toast({
          title: "Service risk updated",
          description: `Service risk "${result.service_type}" has been updated successfully.`
        });
      } else {
        // Create new service risk category
        result = await createServiceRiskCategory(formData);
        toast({
          title: "Service risk created",
          description: `New service risk "${result.service_type}" has been created successfully.`
        });
      }

      await loadServiceRiskCategories();
      setActiveServiceRisk(result);
    } catch (error) {
      console.error("Error saving service risk category:", error);
      toast({
        variant: "destructive",
        title: "Error saving service risk",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConfig = () => {
    setActiveConfig(null);
  };

  const handleNewServiceRisk = () => {
    setActiveServiceRisk(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">PSV Settings</h1>
          <p className="text-muted-foreground">
            Manage RBI configurations and service risk categories
          </p>
        </div>
        <Button onClick={activeTab === "rbi" ? handleNewConfig : handleNewServiceRisk}>
          New {activeTab === "rbi" ? "Configuration" : "Service Risk"}
        </Button>
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
                      ? "border-primary font-bold"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => {
                    console.log("Selecting config:", config);
                    setActiveConfig(config);
                  }}
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
          <div className="grid grid-cols-4 gap-4">
            {/* Service Risk List */}
            <div className="col-span-1 space-y-2">
              {serviceRisks.map((risk) => (
                <Card
                  key={risk.id}
                  className={`cursor-pointer ${
                    activeServiceRisk?.id === risk.id
                      ? "border-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setActiveServiceRisk(risk)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-medium">
                      {risk.service_type}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      CoF Score: {risk.cof_score}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Service Risk Form */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>
                  {activeServiceRisk ? "Edit Service Risk" : "New Service Risk"}
                </CardTitle>
                <CardDescription>
                  Configure service risk categories based on API 581
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceRiskForm
                  initialData={activeServiceRisk ?? undefined}
                  onSubmit={handleServiceRiskSave}
                />
              </CardContent>
            </Card>
          </div>
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