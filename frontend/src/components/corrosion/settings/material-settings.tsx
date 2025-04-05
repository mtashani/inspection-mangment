'use client';

import { useState } from "react";
import { updateMaterialFactors } from "@/api/corrosion-settings";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MaterialData {
  material_name: string;
  base_corrosion_rate: number;
  severity_multiplier: number;
}

interface MaterialSettingsProps {
  materials: MaterialData[];
  onMaterialsChanged: () => void;
}

export function MaterialSettings({ materials, onMaterialsChanged }: MaterialSettingsProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Edit material dialog state
  const [editingMaterial, setEditingMaterial] = useState<MaterialData | null>(null);
  
  const [newMaterial, setNewMaterial] = useState({
    material_name: "",
    base_corrosion_rate: 0.1,
    severity_multiplier: 1.0
  });

  // Dialog open state
  const [isNewMaterialDialogOpen, setIsNewMaterialDialogOpen] = useState(false);
  const [isEditMaterialDialogOpen, setIsEditMaterialDialogOpen] = useState(false);
  
  // Handle adding a new material
  const handleAddMaterial = async () => {
    if (!newMaterial.material_name) {
      toast({
        title: "Error",
        description: "Material name is required.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if material already exists
    if (materials.some(m => m.material_name === newMaterial.material_name)) {
      toast({
        title: "Error",
        description: "A material with this name already exists.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Add the new material to the list and update
      const updatedMaterials = [...materials, newMaterial];
      await updateMaterialFactors(updatedMaterials);
      
      // Reset form
      setNewMaterial({
        material_name: "",
        base_corrosion_rate: 0.1,
        severity_multiplier: 1.0
      });
      
      setIsNewMaterialDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Material added successfully.",
      });
      
      onMaterialsChanged();
    } catch (err) {
      console.error("Failed to add material:", err);
      toast({
        title: "Error",
        description: "Failed to add material. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle updating a material
  const handleUpdateMaterial = async () => {
    if (!editingMaterial) return;
    
    try {
      setSaving(true);
      
      // Update the material in the list
      const updatedMaterials = materials.map(m =>
        m.material_name === editingMaterial.material_name ? editingMaterial : m
      );
      
      await updateMaterialFactors(updatedMaterials);
      
      // Update local state
      setEditingMaterial(null);
      setIsEditMaterialDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Material updated successfully.",
      });
      
      onMaterialsChanged();
    } catch (err) {
      console.error("Failed to update material:", err);
      toast({
        title: "Error",
        description: "Failed to update material. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle deleting a material
  const handleDeleteMaterial = async (materialName: string) => {
    try {
      setSaving(true);
      
      // Remove the material from the list and update
      const updatedMaterials = materials.filter(m => m.material_name !== materialName);
      await updateMaterialFactors(updatedMaterials);
      
      toast({
        title: "Success",
        description: "Material deleted successfully.",
      });
      
      onMaterialsChanged();
    } catch (err) {
      console.error("Failed to delete material:", err);
      toast({
        title: "Error",
        description: "Failed to delete material. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Material Correction Factors</CardTitle>
            <CardDescription>
              Configure correction factors for different materials used in coupons
            </CardDescription>
          </div>
          
          <Dialog open={isNewMaterialDialogOpen} onOpenChange={setIsNewMaterialDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
                <DialogDescription>
                  Add a new material with its correction factors
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="material-name">Material Name</Label>
                  <Input
                    id="material-name"
                    placeholder="e.g., Carbon Steel, SS316"
                    value={newMaterial.material_name}
                    onChange={(e) => setNewMaterial({
                      ...newMaterial,
                      material_name: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="base-rate">Base Corrosion Rate (mm/year)</Label>
                  <Input
                    id="base-rate"
                    type="number"
                    step="0.001"
                    min="0"
                    value={newMaterial.base_corrosion_rate}
                    onChange={(e) => setNewMaterial({
                      ...newMaterial,
                      base_corrosion_rate: parseFloat(e.target.value)
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    The typical corrosion rate for this material
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="severity-multiplier">Severity Multiplier</Label>
                  <Input
                    id="severity-multiplier"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newMaterial.severity_multiplier}
                    onChange={(e) => setNewMaterial({
                      ...newMaterial,
                      severity_multiplier: parseFloat(e.target.value)
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Factor that adjusts severity based on material criticality
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewMaterialDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMaterial} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                    </>
                  ) : (
                    "Add Material"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Base Rate (mm/year)</TableHead>
              <TableHead className="text-right">Severity Multiplier</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No materials configured
                </TableCell>
              </TableRow>
            ) : (
              materials.map((material) => (
                <TableRow key={material.material_name}>
                  <TableCell className="font-medium">{material.material_name}</TableCell>
                  <TableCell className="text-right">{material.base_corrosion_rate}</TableCell>
                  <TableCell className="text-right">{material.severity_multiplier}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog 
                        open={isEditMaterialDialogOpen && editingMaterial?.material_name === material.material_name}
                        onOpenChange={(open) => {
                          setIsEditMaterialDialogOpen(open);
                          if (!open) setEditingMaterial(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingMaterial(material)}
                          >
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Material</DialogTitle>
                            <DialogDescription>
                              Update the correction factors for {editingMaterial?.material_name}
                            </DialogDescription>
                          </DialogHeader>
                          {editingMaterial && (
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-base-rate">Base Corrosion Rate (mm/year)</Label>
                                <Input
                                  id="edit-base-rate"
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={editingMaterial.base_corrosion_rate}
                                  onChange={(e) => setEditingMaterial({
                                    ...editingMaterial,
                                    base_corrosion_rate: parseFloat(e.target.value)
                                  })}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="edit-severity-multiplier">Severity Multiplier</Label>
                                <Input
                                  id="edit-severity-multiplier"
                                  type="number"
                                  step="0.1"
                                  min="0.1"
                                  value={editingMaterial.severity_multiplier}
                                  onChange={(e) => setEditingMaterial({
                                    ...editingMaterial,
                                    severity_multiplier: parseFloat(e.target.value)
                                  })}
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {
                              setIsEditMaterialDialogOpen(false);
                              setEditingMaterial(null);
                            }}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateMaterial} disabled={saving}>
                              {saving ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                </>
                              ) : (
                                "Save Changes"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteMaterial(material.material_name)}
                        disabled={saving}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}