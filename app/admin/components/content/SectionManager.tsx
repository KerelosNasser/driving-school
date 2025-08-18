'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import enhancedContentService from '@/lib/content-service';

interface Section {
  name: string;
  count: number;
  description?: string;
}

interface SectionManagerProps {
  sections: string[];
  onSectionsChange: () => void;
}

export function SectionManager({ sections, onSectionsChange }: SectionManagerProps) {
  const [sectionData, setSectionData] = useState<Section[]>([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSectionData();
  }, [sections]);

  const loadSectionData = async () => {
    try {
      const stats = await enhancedContentService.getAll({ limit: 1 });
      const sectionCounts = stats.stats.bySection;
      
      const sectionsWithData = sections.map(section => ({
        name: section,
        count: sectionCounts[section] || 0,
        description: getSectionDescription(section)
      }));
      
      setSectionData(sectionsWithData);
    } catch (error) {
      console.error('Failed to load section data:', error);
    }
  };

  const getSectionDescription = (section: string): string => {
    const descriptions: Record<string, string> = {
      'hero': 'Main homepage hero section content',
      'about': 'About page and company information',
      'services': 'Driving services and offerings',
      'packages': 'Lesson packages and pricing',
      'contact': 'Contact information and forms',
      'footer': 'Footer content and links',
      'navigation': 'Navigation menu items',
      'testimonials': 'Customer reviews and testimonials',
      'gallery': 'Image galleries and media',
      'blog': 'Blog posts and articles'
    };
    return descriptions[section.toLowerCase()] || 'Custom content section';
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      toast.error('Section name is required');
      return;
    }

    if (sections.includes(newSectionName.trim())) {
      toast.error('Section already exists');
      return;
    }

    setLoading(true);
    try {
      // Create a placeholder content item for the new section
      await enhancedContentService.create({
        content_key: `${newSectionName.toLowerCase()}_placeholder`,
        content_type: 'text',
        content_json: null,
        content_value: 'Placeholder content for new section',
        page_section: newSectionName.trim(),
        display_order: 0,
        is_active: false,
        is_draft: true
      });
      
      setNewSectionName('');
      onSectionsChange();
      toast.success('Section created successfully');
    } catch (error) {
      toast.error('Failed to create section');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenameSection = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) {
      setEditingSection(null);
      return;
    }

    if (sections.includes(newName.trim())) {
      toast.error('Section name already exists');
      return;
    }

    setLoading(true);
    try {
      // Get all content in this section
      const { data: contentItems } = await enhancedContentService.getAll({
        filters: { section: oldName }
      });
      
      // Update all content items to use the new section name
      const updatePromises = contentItems.map(item => 
        enhancedContentService.update(item.id, { page_section: newName.trim() })
      );
      
      await Promise.all(updatePromises);
      
      setEditingSection(null);
      onSectionsChange();
      toast.success('Section renamed successfully');
    } catch (error) {
      toast.error('Failed to rename section');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionName: string) => {
    setLoading(true);
    try {
      // Get all content in this section
      const { data: contentItems } = await enhancedContentService.getAll({
        filters: { section: sectionName }
      });
      
      if (contentItems.length > 0) {
        // Delete all content items in this section
        const ids = contentItems.map(item => item.id);
        await enhancedContentService.bulkDelete(ids);
      }
      
      onSectionsChange();
      toast.success('Section and all its content deleted successfully');
    } catch (error) {
      toast.error('Failed to delete section');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Content Sections
          <Badge variant="secondary">{sections.length} sections</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new section */}
        <div className="flex gap-2">
          <Input
            placeholder="New section name..."
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateSection()}
          />
          <Button 
            onClick={handleCreateSection} 
            disabled={loading || !newSectionName.trim()}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Existing sections */}
        <div className="space-y-2">
          {sectionData.map((section) => (
            <div key={section.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                {editingSection === section.name ? (
                  <div className="flex gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameSection(section.name, editName);
                        } else if (e.key === 'Escape') {
                          setEditingSection(null);
                        }
                      }}
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRenameSection(section.name, editName)}
                      disabled={loading}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingSection(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{section.name}</span>
                      <Badge variant="outline">{section.count} items</Badge>
                    </div>
                    {section.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {editingSection !== section.name && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingSection(section.name);
                      setEditName(section.name);
                    }}
                    disabled={loading}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={loading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Section</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the "{section.name}" section? 
                          This will permanently delete all {section.count} content items in this section.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteSection(section.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Section
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}
        </div>

        {sections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No content sections found.</p>
            <p className="text-sm">Create your first section to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}