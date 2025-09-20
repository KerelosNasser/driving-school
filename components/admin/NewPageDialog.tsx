'use client';

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useEditMode } from '@/contexts/editModeContext';
import type { NewPageData } from '@/lib/realtime/types';

interface NewPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPageCreated?: (pageId: string) => void;
}

interface PageTemplate {
  id: string;
  name: string;
  description: string;
  preview?: string;
}

const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'basic',
    name: 'Basic Page',
    description: 'Simple page with header, content area, and footer',
  },
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Marketing-focused page with hero section and call-to-action',
  },
  {
    id: 'service',
    name: 'Service Page',
    description: 'Service description with features and pricing',
  },
  {
    id: 'contact',
    name: 'Contact Page',
    description: 'Contact form with location and business information',
  },
  {
    id: 'about',
    name: 'About Page',
    description: 'Company information and team showcase',
  },
];

interface FormData {
  title: string;
  urlSlug: string;
  template: string;
  navigationOrder: number;
  isVisible: boolean;
}

interface FormErrors {
  title?: string;
  urlSlug?: string;
  template?: string;
}

interface CreationStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}

export function NewPageDialog({ open, onOpenChange, onPageCreated }: NewPageDialogProps) {
  const { createPage, isAdmin } = useEditMode();
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    urlSlug: '',
    template: 'basic',
    navigationOrder: 0,
    isVisible: true,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  
  const [creationSteps] = useState<CreationStep[]>([
    { id: 'validate', name: 'Validating data', description: 'Checking form inputs', completed: false },
    { id: 'create', name: 'Creating page', description: 'Setting up page structure', completed: false },
    { id: 'navigation', name: 'Adding to navigation', description: 'Updating site navigation', completed: false },
    { id: 'sync', name: 'Syncing changes', description: 'Broadcasting to other editors', completed: false },
  ]);

  // Auto-generate URL slug from title
  const generateSlug = useCallback((title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }, []);

  // Handle title change and auto-generate slug
  const handleTitleChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      urlSlug: prev.urlSlug === '' || prev.urlSlug === generateSlug(prev.title) 
        ? generateSlug(value) 
        : prev.urlSlug
    }));
    
    // Clear title error when user starts typing
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: undefined }));
    }
  }, [generateSlug, errors.title]);

  // Handle URL slug change
  const handleSlugChange = useCallback((value: string) => {
    const cleanSlug = generateSlug(value);
    setFormData(prev => ({ ...prev, urlSlug: cleanSlug }));
    
    // Clear slug error when user starts typing
    if (errors.urlSlug) {
      setErrors(prev => ({ ...prev, urlSlug: undefined }));
    }
  }, [generateSlug, errors.urlSlug]);

  // Validate form data
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Page title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Page title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Page title must be less than 100 characters';
    }
    
    if (!formData.urlSlug.trim()) {
      newErrors.urlSlug = 'URL slug is required';
    } else if (formData.urlSlug.length < 2) {
      newErrors.urlSlug = 'URL slug must be at least 2 characters';
    } else if (!/^[a-z0-9-]+$/.test(formData.urlSlug)) {
      newErrors.urlSlug = 'URL slug can only contain lowercase letters, numbers, and hyphens';
    } else if (formData.urlSlug.startsWith('-') || formData.urlSlug.endsWith('-')) {
      newErrors.urlSlug = 'URL slug cannot start or end with a hyphen';
    }
    
    if (!formData.template) {
      newErrors.template = 'Please select a page template';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Update creation progress
  const updateProgress = useCallback((stepId: string, completed: boolean) => {
    setCurrentStep(stepId);
    const stepIndex = creationSteps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      const progress = ((stepIndex + (completed ? 1 : 0.5)) / creationSteps.length) * 100;
      setCreationProgress(progress);
    }
  }, [creationSteps]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error('You need admin privileges to create pages');
      return;
    }
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before continuing');
      return;
    }
    
    setIsCreating(true);
    setCreationProgress(0);
    
    try {
      // Step 1: Validate data
      updateProgress('validate', false);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate validation time
      updateProgress('validate', true);
      
      // Step 2: Create page
      updateProgress('create', false);
      const pageData: NewPageData = {
        title: formData.title.trim(),
        urlSlug: formData.urlSlug.trim(),
        template: formData.template,
        navigationOrder: formData.navigationOrder,
        isVisible: formData.isVisible,
      };
      
      const pageId = await createPage(pageData);
      updateProgress('create', true);
      
      // Step 3: Navigation (handled by createPage)
      updateProgress('navigation', false);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate navigation update
      updateProgress('navigation', true);
      
      // Step 4: Sync changes (handled by real-time system)
      updateProgress('sync', false);
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate sync
      updateProgress('sync', true);
      
      setCreationProgress(100);
      
      toast.success(`Page "${formData.title}" created successfully!`);
      
      // Reset form
      setFormData({
        title: '',
        urlSlug: '',
        template: 'basic',
        navigationOrder: 0,
        isVisible: true,
      });
      setErrors({});
      
      // Close dialog and notify parent
      onOpenChange(false);
      onPageCreated?.(pageId);
      
    } catch (error) {
      console.error('Failed to create page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create page';
      toast.error(`Page creation failed: ${errorMessage}`);
    } finally {
      setIsCreating(false);
      setCreationProgress(0);
      setCurrentStep('');
    }
  }, [isAdmin, validateForm, formData, createPage, updateProgress, onOpenChange, onPageCreated]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (isCreating) {
      toast.warning('Please wait for page creation to complete');
      return;
    }
    
    onOpenChange(false);
    
    // Reset form when closing
    setFormData({
      title: '',
      urlSlug: '',
      template: 'basic',
      navigationOrder: 0,
      isVisible: true,
    });
    setErrors({});
    setCreationProgress(0);
    setCurrentStep('');
  }, [isCreating, onOpenChange]);

  const selectedTemplate = PAGE_TEMPLATES.find(t => t.id === formData.template);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Page</DialogTitle>
          <DialogDescription>
            Add a new page to your website with automatic navigation integration.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Page Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Page Title *
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter page title..."
              disabled={isCreating}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>
          
          {/* URL Slug */}
          <div className="space-y-2">
            <label htmlFor="urlSlug" className="text-sm font-medium">
              URL Slug *
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                id="urlSlug"
                value={formData.urlSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="page-url-slug"
                disabled={isCreating}
                className={errors.urlSlug ? 'border-destructive' : ''}
              />
            </div>
            {errors.urlSlug && (
              <p className="text-sm text-destructive">{errors.urlSlug}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This will be the page URL: /{formData.urlSlug || 'page-url-slug'}
            </p>
          </div>
          
          {/* Template Selection */}
          <div className="space-y-2">
            <label htmlFor="template" className="text-sm font-medium">
              Page Template *
            </label>
            <Select
              value={formData.template}
              onValueChange={(value) => setFormData(prev => ({ ...prev, template: value }))}
              disabled={isCreating}
            >
              <SelectTrigger className={errors.template ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {PAGE_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {template.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.template && (
              <p className="text-sm text-destructive">{errors.template}</p>
            )}
            {selectedTemplate && (
              <p className="text-xs text-muted-foreground">
                {selectedTemplate.description}
              </p>
            )}
          </div>
          
          {/* Navigation Settings */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium">Navigation Settings</h4>
            
            <div className="space-y-2">
              <label htmlFor="navigationOrder" className="text-sm font-medium">
                Navigation Order
              </label>
              <Input
                id="navigationOrder"
                type="number"
                value={formData.navigationOrder}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  navigationOrder: parseInt(e.target.value) || 0 
                }))}
                placeholder="0"
                disabled={isCreating}
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in navigation (0 = first)
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                id="isVisible"
                type="checkbox"
                checked={formData.isVisible}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  isVisible: e.target.checked 
                }))}
                disabled={isCreating}
                className="rounded border-input"
              />
              <label htmlFor="isVisible" className="text-sm font-medium">
                Show in navigation menu
              </label>
            </div>
          </div>
          
          {/* Creation Progress */}
          {isCreating && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Creating page...</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(creationProgress)}%
                </span>
              </div>
              <Progress value={creationProgress} className="h-2" />
              {currentStep && (
                <p className="text-xs text-muted-foreground">
                  {creationSteps.find(s => s.id === currentStep)?.description}
                </p>
              )}
            </div>
          )}
        </form>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isCreating || !isAdmin}
          >
            {isCreating ? 'Creating...' : 'Create Page'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}