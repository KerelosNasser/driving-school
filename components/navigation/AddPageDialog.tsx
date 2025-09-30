
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: string[];
  onAddPage: (pageId: string) => void;
}

export function AddPageDialog({ open, onOpenChange, pages, onAddPage }: AddPageDialogProps) {
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  const handleAdd = () => {
    if (selectedPage) {
      onAddPage(selectedPage);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an Existing Page to the Navigation</DialogTitle>
          <DialogDescription>
            Select a page to add to the navigation menu.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select onValueChange={setSelectedPage}>
            <SelectTrigger>
              <SelectValue placeholder="Select a page" />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page} value={page}>
                  {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={!selectedPage}>
            Add Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
