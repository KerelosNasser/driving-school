'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Copy, Save, X, Upload, Image } from 'lucide-react';
import { SiteContent } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface ContentItemProps {
  content: SiteContent;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SiteContent>) => Promise<void>;
  onDelete: () => Promise<void>;
  onDuplicate: () => Promise<void>;
  onUploadFile: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
  saving: boolean;
  uploading: boolean;
}

export function ContentItem({
  content,
  viewMode,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onUploadFile,
  saving,
  uploading
}: ContentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<SiteContent>>({
    content_value: content.content_value,
    content_json: content.content_json,
    is_active: content.is_active,
    is_draft: content.is_draft,
    alt_text: content.alt_text,
    title: content.title,
    description: content.description
  });
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSave = async () => {
    try {
      await onUpdate(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      content_value: content.content_value,
      content_json: content.content_json,
      is_active: content.is_active,
      is_draft: content.is_draft,
      alt_text: content.alt_text,
      title: content.title,
      description: content.description
    });
    setIsEditing(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileUrl = await onUploadFile(file, setUploadProgress);
      await onUpdate({
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        content_value: fileUrl
      });
      setUploadProgress(0);
    } catch (error) {
      console.error('Failed to upload file:', error);
      setUploadProgress(0);
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'json': return 'bg-purple-100 text-purple-800';
      case 'boolean': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContentPreview = () => {
    switch (content.content_type) {
      case 'image':
        return content.file_url ? (
          <div className="relative">
            <img
              src={content.file_url}
              alt={content.alt_text || content.content_key}
              className="w-full h-32 object-cover rounded"
            />
            {uploadProgress > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                <div className="text-white text-sm">{uploadProgress}%</div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded">
            <Image className="h-8 w-8 text-gray-400" />
          </div>
        );
      case 'text':
        return (
          <div className="text-sm text-gray-600 line-clamp-3">
            {content.content_value || 'No content'}
          </div>
        );
      case 'json':
        return (
          <div className="text-xs font-mono bg-gray-50 p-2 rounded overflow-hidden">
            {JSON.stringify(content.content_json, null, 2).substring(0, 100)}...
          </div>
        );
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch checked={content.content_value === 'true'} disabled />
            <span className="text-sm">{content.content_value === 'true' ? 'Enabled' : 'Disabled'}</span>
          </div>
        );
      default:
        return <div className="text-sm text-gray-500">Unknown content type</div>;
    }
  };

  const renderEditForm = () => {
    switch (content.content_type) {
      case 'text':
        return (
          <Textarea
            value={editData.content_value || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, content_value: e.target.value }))}
            placeholder="Enter text content..."
            rows={4}
          />
        );
      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`file-${content.id}`} className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <div className="text-sm text-gray-600">Click to upload new image</div>
                </div>
              </Label>
              <input
                id={`file-${content.id}`}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>
            <Input
              placeholder="Alt text"
              value={editData.alt_text || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, alt_text: e.target.value }))}
            />
            <Input
              placeholder="Title"
              value={editData.title || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Description"
              value={editData.description || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={editData.content_value === 'true'}
              onCheckedChange={(checked) => setEditData(prev => ({ ...prev, content_value: checked.toString() }))}
            />
            <Label>Enable this option</Label>
          </div>
        );
      case 'json':
        return (
          <Textarea
            value={JSON.stringify(editData.content_json, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setEditData(prev => ({ ...prev, content_json: parsed }));
              } catch {
                // Invalid JSON, don't update
              }
            }}
            placeholder="Enter valid JSON..."
            rows={6}
            className="font-mono text-sm"
          />
        );
      default:
        return (
          <Input
            value={editData.content_value || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, content_value: e.target.value }))}
            placeholder="Enter content..."
          />
        );
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className={`${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{content.content_key}</h3>
                  <Badge className={getContentTypeColor(content.content_type)}>
                    {content.content_type}
                  </Badge>
                  {!content.is_active && <Badge variant="secondary">Inactive</Badge>}
                  {content.is_draft && <Badge variant="outline">Draft</Badge>}
                </div>
                <div className="text-sm text-gray-500">
                  {content.page_section} • Updated {formatDistanceToNow(new Date(content.updated_at))} ago
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDuplicate}>
                <Copy className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Content</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{content.content_key}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${isSelected ? 'ring-2 ring-blue-500' : ''} ${isEditing ? 'ring-2 ring-orange-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded mt-1"
            />
            <div>
              <h3 className="font-medium text-sm">{content.content_key}</h3>
              <p className="text-xs text-gray-500">{content.page_section}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge className={getContentTypeColor(content.content_type)} variant="secondary">
              {content.content_type}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!content.is_active && <Badge variant="secondary">Inactive</Badge>}
          {content.is_draft && <Badge variant="outline">Draft</Badge>}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isEditing ? (
          <div className="space-y-4">
            {renderEditForm()}
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editData.is_active}
                  onCheckedChange={(checked) => setEditData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label className="text-sm">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editData.is_draft}
                  onCheckedChange={(checked) => setEditData(prev => ({ ...prev, is_draft: checked }))}
                />
                <Label className="text-sm">Draft</Label>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {renderContentPreview()}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-gray-500">
                Updated {formatDistanceToNow(new Date(content.updated_at))} ago
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onDuplicate}>
                  <Copy className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Content</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{content.content_key}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}