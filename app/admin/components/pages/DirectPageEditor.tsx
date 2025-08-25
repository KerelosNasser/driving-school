// Direct Page Editor - WordPress-like direct file editing interface
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Code, 
  Edit3,
  FileText,
  Image,
  Type,
  Palette,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { updatePageContent, DirectPageInfo } from '@/lib/directPageEditor';

interface DirectPageEditorProps {
  page: DirectPageInfo;
  onBack: () => void;
}

interface EditableSection {
  id: string;
  type: 'text' | 'image' | 'hero' | 'html';
  content: any;
  position: {
    line: number;
    component: string;
  };
}

// Helper function to get line number from string index
function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

// Parse React component code to find editable sections
function parseEditableContent(fileContent: string): EditableSection[] {
  const sections: EditableSection[] = [];
  
  // Extract EditableText components
  const editableTextRegex = /<EditableText[^>]*contentKey=["']([^"']+)["'][^>]*(?:defaultValue=["']([^"']*)["'])?[^>]*(?:\/>|>[^<]*<\/EditableText>)/g;
  let match;
  
  while ((match = editableTextRegex.exec(fileContent)) !== null) {
    sections.push({
      id: match[1],
      type: 'text',
      content: match[2] || '',
      position: {
        line: getLineNumber(fileContent, match.index),
        component: 'EditableText'
      }
    });
  }

  // Extract EditableImage components
  const editableImageRegex = /<EditableImage[^>]*contentKey=["']([^"']+)["'][^>]*(?:src|defaultSrc)=["']([^"']+)["'][^>]*\/?>/g;
  
  while ((match = editableImageRegex.exec(fileContent)) !== null) {
    sections.push({
      id: match[1],
      type: 'image',
      content: match[2],
      position: {
        line: getLineNumber(fileContent, match.index),
        component: 'EditableImage'
      }
    });
  }

  return sections;
}

// Extract editable sections from file content
const extractEditableContent = async (slug: string): Promise<EditableSection[]> => {
  try {
    const response = await fetch(`/api/admin/direct-pages/content?slug=${slug}`);
    if (!response.ok) {
      throw new Error('Failed to fetch page content');
    }
    
    const { data } = await response.json();
    return parseEditableContent(data.content);
  } catch (error) {
    console.error('Error extracting content:', error);
    return [];
  }
};

export function DirectPageEditor({ page, onBack }: DirectPageEditorProps) {
  const [sections, setSections] = useState<EditableSection[]>([]);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'visual' | 'code'>('visual');
  const [hasChanges, setHasChanges] = useState(false);

  // Load page content
  useEffect(() => {
    loadPageContent();
  }, [page.slug]);

  const loadPageContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/direct-pages/content?slug=${page.slug}`);
      if (!response.ok) {
        throw new Error('Failed to load page content');
      }

      const { data } = await response.json();
      setFileContent(data.content);
      
      // Extract editable sections
      const editableSections = await extractEditableContent(page.slug);
      setSections(editableSections);
    } catch (error) {
      console.error('Error loading page:', error);
      toast.error('Failed to load page content');
    } finally {
      setLoading(false);
    }
  };

  // Update section content
  const updateSection = async (sectionId: string, newContent: string, type: string = 'text') => {
    setSaving(true);
    try {
      const success = await updatePageContent(page.slug, sectionId, newContent);
      
      if (success) {
        // Update local sections
        setSections(prev => 
          prev.map(section => 
            section.id === sectionId 
              ? { ...section, content: newContent }
              : section
          )
        );
        setHasChanges(false);
        toast.success('Content updated successfully');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error('Failed to update content');
    } finally {
      setSaving(false);
    }
  };

  // Open page in new tab
  const previewPage = () => {
    window.open(`/${page.slug}`, '_blank');
  };

  // Open page in edit mode
  const editLive = () => {
    window.open(`/${page.slug}?edit=1`, '_blank');
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'text': return Type;
      case 'image': return Image;
      case 'hero': return Palette;
      default: return FileText;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading page content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pages
            </Button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{page.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">/{page.slug}</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Live File
                </Badge>
                {hasChanges && (
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                    Modified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={previewPage}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={editLive}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Live
            </Button>
            
            <Button 
              onClick={loadPageContent}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <Tabs value={editMode} onValueChange={(value: any) => setEditMode(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="visual">Visual</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
              </TabsList>
              
              <TabsContent value="visual" className="space-y-4 mt-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Editable Sections</h3>
                  
                  {sections.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No editable sections found</p>
                      <p className="text-xs">Add EditableText or EditableImage components</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sections.map((section) => {
                        const IconComponent = getSectionIcon(section.type);
                        return (
                          <Card 
                            key={section.id}
                            className={`cursor-pointer transition-all ${
                              selectedSection === section.id 
                                ? 'ring-2 ring-blue-500 border-blue-200' 
                                : 'hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedSection(section.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <IconComponent className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-sm">{section.id}</span>
                                <Badge variant="outline" className="text-xs">
                                  {section.type}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500">
                                Line {section.position.line} • {section.position.component}
                              </div>
                              <div className="mt-2 text-sm text-gray-700 truncate">
                                {typeof section.content === 'string' 
                                  ? section.content.slice(0, 50) + '...'
                                  : 'Complex content'
                                }
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="code" className="mt-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Page Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">File:</span>
                      <span className="font-mono text-xs">{page.filePath}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Modified:</span>
                      <span className="text-xs">{new Date(page.lastModified).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 p-6 overflow-auto">
          {selectedSection ? (
            <SectionEditor
              section={sections.find(s => s.id === selectedSection)!}
              onUpdate={(content) => {
                setHasChanges(true);
                // Update section immediately for preview
                setSections(prev => 
                  prev.map(s => 
                    s.id === selectedSection 
                      ? { ...s, content }
                      : s
                  )
                );
              }}
              onSave={(content) => updateSection(selectedSection, content, sections.find(s => s.id === selectedSection)?.type)}
              saving={saving}
            />
          ) : (
            <div className="text-center py-16 text-gray-500">
              <Edit3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">WordPress-like Direct Editing</h3>
              <p className="mb-4">Select a section from the sidebar to start editing</p>
              <div className="max-w-md mx-auto text-left bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">Direct File Editing</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      This editor directly modifies your Next.js page files. Changes are immediately reflected on your live website.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Section Editor Component
interface SectionEditorProps {
  section: EditableSection;
  onUpdate: (content: string) => void;
  onSave: (content: string) => void;
  saving: boolean;
}

function SectionEditor({ section, onUpdate, onSave, saving }: SectionEditorProps) {
  const [content, setContent] = useState(section.content || '');

  useEffect(() => {
    setContent(section.content || '');
  }, [section]);

  const handleSave = () => {
    onSave(content);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Editing: {section.id}</h3>
          <p className="text-sm text-gray-600">
            {section.position.component} at line {section.position.line}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || content === section.content}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          {section.type === 'text' || section.type === 'hero' ? (
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                onUpdate(e.target.value);
              }}
              rows={8}
              className="font-mono text-sm"
              placeholder="Enter your content..."
            />
          ) : section.type === 'image' ? (
            <Input
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                onUpdate(e.target.value);
              }}
              placeholder="Image URL..."
              className="font-mono"
            />
          ) : (
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                onUpdate(e.target.value);
              }}
              rows={12}
              className="font-mono text-sm"
              placeholder="Enter HTML content..."
            />
          )}
        </CardContent>
      </Card>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-2">Preview:</h4>
        <div className="bg-white border rounded p-3 text-sm">
          {section.type === 'image' ? (
            content ? (
              <img src={content} alt="Preview" className="max-w-full h-auto rounded" />
            ) : (
              <div className="text-gray-500 italic">No image URL provided</div>
            )
          ) : (
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content || '<em>No content</em>' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}