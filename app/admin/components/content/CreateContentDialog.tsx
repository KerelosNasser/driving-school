'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SiteContent } from '@/lib/types';
import { toast } from "sonner"

interface CreateContentDialogProps {
  createContent: (newItem: Omit<SiteContent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  sections: string[];
}

export function CreateContentDialog({ createContent, sections }: CreateContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    content_key: '',
    title: '',
    description: '',
    page_section: '',
    content_type: 'text',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await createContent({
        ...newItem,
        content_value: null,
        content_json: null,
        file_path: null,
        file_url: null,
        alt_text: null,
        is_draft: true,
        is_active: true,
      });
      setOpen(false);
      toast({ title: 'Success', description: 'Content item created.' });
      setNewItem({
        content_key: '',
        title: '',
        description: '',
        page_section: '',
        content_type: 'text',
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create content item.' });
      console.error("Failed to create content item", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add New Content</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Content Item</DialogTitle>
            <DialogDescription>
              Add a new content entry. You can add the value after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input id="title" name="title" value={newItem.title} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content_key" className="text-right">Content Key</Label>
              <Input id="content_key" name="content_key" value={newItem.content_key} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Input id="description" name="description" value={newItem.description} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="page_section" className="text-right">Section</Label>
              <Select onValueChange={(value) => handleSelectChange('page_section', value)} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content_type" className="text-right">Content Type</Label>
              <Select onValueChange={(value) => handleSelectChange('content_type', value)} defaultValue="text" required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Content'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}