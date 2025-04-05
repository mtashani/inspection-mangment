'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  confirmationText?: string;
}

export function DeleteConfirmationDialog({
  isOpen,
  setIsOpen,
  title,
  description,
  onConfirm,
  isDeleting,
  confirmationText = "delete"
}: DeleteConfirmationDialogProps) {
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInputText("");
      setError(null);
    }
  }, [isOpen]);
  
  const handleConfirm = async () => {
    if (inputText.toLowerCase() !== confirmationText.toLowerCase()) {
      setError(`Please type "${confirmationText}" to confirm deletion`);
      return;
    }
    
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm font-medium">
            Type <span className="font-bold">{confirmationText}</span> to confirm deletion:
          </p>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type "${confirmationText}" here`}
            className="w-full"
            autoComplete="off"
          />
          
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={isDeleting || inputText.toLowerCase() !== confirmationText.toLowerCase()}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}