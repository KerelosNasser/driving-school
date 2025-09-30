
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePage: (title: string, slug: string) => void;
}

export function NewPageDialog({ open, onOpenChange, onCreatePage }: NewPageDialogProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');

  const handleCreate = async () => {
    await onCreatePage(title, slug);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Page</DialogTitle>
          <DialogDescription>
            Enter a title and a URL slug for your new page.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="slug" className="text-right">
              Slug
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate}>Create Page</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
