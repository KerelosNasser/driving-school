'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DragDropProvider } from '@/lib/drag-drop';
import { 
  ChevronDown, 
  ChevronRight, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  Plus,
  Save,
  X,
  MoreVertical,
  Copy,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Check,
  Undo2,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigationManager } from '@/hooks/useNavigationManager';
import { NavigationItem } from '@/lib/realtime/types';
import { NavigationReorderOperation } from '@/lib/navigation/NavigationManager';

interface DragItem {
  type: 'navigation-item';
  id: string;
  item: NavigationItem;
  index: number;
  parentId: string | null;
}

interface NavigationItemProps {
  item: NavigationItem;
  index: number;
  level: number;
  children: NavigationItem[];
  onEdit: (item: NavigationItem) => void;
  onDelete: (itemId: string) => void;
  onToggleVisibility: (itemId: string, isVisible: boolean) => void;
  onMove: (draggedItem: NavigationItem, targetItem: NavigationItem, position: 'before' | 'after' | 'inside') => void;
  onInlineEdit: (itemId: string, field: 'displayName' | 'urlSlug', value: string) => void;
  onDuplicate: (item: NavigationItem) => void;
  onMoveUp: (itemId: string) => void;
  onMoveDown: (itemId: string) => void;
  permissions: {
    canUpdate: boolean;
    canReorder: boolean;
    canDelete: boolean;
    canToggleVisibility: boolean;
  };
}

const NavigationItemComponent: React.FC<NavigationItemProps> = ({
  item,
  index,
  level,
  children,
  onEdit,
  onDelete,
  onToggleVisibility,
  onMove,
  onInlineEdit,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  permissions
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [editingField, setEditingField] = useState<'displayName' | 'urlSlug' | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: 'navigation-item',
    item: { type: 'navigation-item', id: item.id, item, index, parentId: item.parentId },
    canDrag: permissions.canReorder,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop, dropPosition }, drop] = useDrop({
    accept: 'navigation-item',
    hover: (draggedItem: DragItem, monitor) => {
      if (!permissions.canReorder) return;
      
      const hoverBoundingRect = monitor.getDropTargetMonitor()?.getClientOffset();
      if (!hoverBoundingRect) return;

      // Determine drop position based on cursor position
      // This is a simplified version - you might want to make it more sophisticated
    },
    drop: (draggedItem: DragItem, monitor) => {
      if (!permissions.canReorder) return;
      if (draggedItem.id === item.id) return;

      const didDrop = monitor.didDrop();
      if (didDrop) return;

      // Determine drop position
      const position = 'after'; // Simplified - you can enhance this
      onMove(draggedItem.item, item, position);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
      dropPosition: 'after' // Simplified
    }),
  });

  const hasChildren = children.length > 0;
  const indentLevel = level * 20;

  // Handle inline editing
  const startInlineEdit = (field: 'displayName' | 'urlSlug') => {
    if (!permissions.canUpdate) return;
    setEditingField(field);
    setEditValue(item[field]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveInlineEdit = () => {
    if (editingField && editValue.trim() !== item[editingField]) {
      onInlineEdit(item.id, editingField, editValue.trim());
    }
    setEditingField(null);
    setEditValue('');
  };

  const cancelInlineEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveInlineEdit();
    } else if (e.key === 'Escape') {
      cancelInlineEdit();
    }
  };

  // Auto-generate URL slug from display name
  const generateSlug = (displayName: string) => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleDisplayNameChange = (value: string) => {
    setEditValue(value);
    // Auto-update URL slug if it matches the current pattern
    if (editingField === 'displayName' && item.urlSlug === generateSlug(item.displayName)) {
      // This would ideally update the slug in real-time, but for now we'll handle it on save
    }
  };

  return (
    <div ref={dragPreview}>
      <div
        ref={(node) => drag(drop(node))}
        className={`
          flex items-center p-2 rounded-lg border transition-all duration-200
          ${isDragging ? 'opacity-50' : ''}
          ${isOver && canDrop ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}
          ${isHovered ? 'bg-gray-50' : ''}
          ${!item.isVisible ? 'opacity-60' : ''}
        `}
        style={{ marginLeft: indentLevel }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Drag Handle */}
        {permissions.canReorder && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-grab active:cursor-grabbing mr-2 text-gray-400 hover:text-gray-600">
                <GripVertical className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>Drag to reorder</TooltipContent>
          </Tooltip>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`mr-2 p-1 rounded hover:bg-gray-200 transition-colors ${
            hasChildren ? 'visible' : 'invisible'
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Item Content */}
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            {/* Display Name - Inline Editable */}
            {editingField === 'displayName' ? (
              <div className="flex items-center space-x-1">
                <Input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  onBlur={saveInlineEdit}
                  onKeyDown={handleKeyDown}
                  className="h-6 text-sm font-medium min-w-0 flex-1"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={saveInlineEdit}
                  className="h-6 w-6 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelInlineEdit}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span 
                className="font-medium text-gray-900 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                onClick={() => startInlineEdit('displayName')}
                title="Click to edit"
              >
                {item.displayName}
              </span>
            )}

            {/* URL Slug - Inline Editable */}
            {editingField === 'urlSlug' ? (
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-500">/</span>
                <Input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveInlineEdit}
                  onKeyDown={handleKeyDown}
                  className="h-6 text-sm min-w-0 flex-1"
                  pattern="^[a-z0-9-]+$"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={saveInlineEdit}
                  className="h-6 w-6 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelInlineEdit}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span 
                className="text-sm text-gray-500 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                onClick={() => startInlineEdit('urlSlug')}
                title="Click to edit URL"
              >
                /{item.urlSlug}
              </span>
            )}

            {!item.isVisible && (
              <Badge variant="secondary" className="text-xs">
                Hidden
              </Badge>
            )}
          </div>

          {/* Action Buttons and Context Menu */}
          <div className={`flex items-center space-x-1 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
            {/* Quick Actions */}
            {permissions.canToggleVisibility && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onToggleVisibility(item.id, !item.isVisible)}
                    className="h-8 w-8 p-0"
                  >
                    {item.isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {item.isVisible ? 'Hide from navigation' : 'Show in navigation'}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Context Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {permissions.canUpdate && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(item)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                {permissions.canReorder && (
                  <>
                    <DropdownMenuItem onClick={() => onMoveUp(item.id)}>
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Move Up
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMoveDown(item.id)}>
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Move Down
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem onClick={() => window.open(`/${item.urlSlug}`, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview Page
                </DropdownMenuItem>

                {permissions.canToggleVisibility && (
                  <DropdownMenuItem onClick={() => onToggleVisibility(item.id, !item.isVisible)}>
                    {item.isVisible ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show
                      </>
                    )}
                  </DropdownMenuItem>
                )}

                {permissions.canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(item.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {children.map((child, childIndex) => (
            <NavigationItemComponent
              key={child.id}
              item={child}
              index={childIndex}
              level={level + 1}
              children={[]} // Children would be calculated recursively
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleVisibility={onToggleVisibility}
              onMove={onMove}
              onInlineEdit={onInlineEdit}
              onDuplicate={onDuplicate}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              permissions={permissions}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface EditFormProps {
  item: NavigationItem | null;
  onSave: (itemData: Partial<NavigationItem>) => void;
  onCancel: () => void;
  isCreating: boolean;
}

const EditForm: React.FC<EditFormProps> = ({ item, onSave, onCancel, isCreating }) => {
  const [formData, setFormData] = useState({
    displayName: item?.displayName || '',
    urlSlug: item?.urlSlug || '',
    pageId: item?.pageId || '',
    orderIndex: item?.orderIndex || 0,
    isVisible: item?.isVisible ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const generateSlug = (displayName: string) => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleDisplayNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      displayName: value,
      urlSlug: prev.urlSlug || generateSlug(value)
    }));
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">
          {isCreating ? 'Create Navigation Item' : 'Edit Navigation Item'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <Input
              value={formData.displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder="Enter display name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug
            </label>
            <Input
              value={formData.urlSlug}
              onChange={(e) => setFormData(prev => ({ ...prev, urlSlug: e.target.value }))}
              placeholder="url-slug"
              pattern="^[a-z0-9-]+$"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Only lowercase letters, numbers, and hyphens allowed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page ID
            </label>
            <Input
              value={formData.pageId}
              onChange={(e) => setFormData(prev => ({ ...prev, pageId: e.target.value }))}
              placeholder="page-id"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Index
            </label>
            <Input
              type="number"
              min="0"
              value={formData.orderIndex}
              onChange={(e) => setFormData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isVisible"
              checked={formData.isVisible}
              onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="isVisible" className="text-sm font-medium text-gray-700">
              Visible in navigation
            </label>
          </div>

          <div className="flex space-x-2">
            <Button type="submit" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {isCreating ? 'Create' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Navigation Preview Component
interface NavigationPreviewProps {
  items: NavigationItem[];
  className?: string;
}

const NavigationPreview: React.FC<NavigationPreviewProps> = ({ items, className }) => {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  const buildNavigationTree = (items: NavigationItem[], parentId: string | null = null): NavigationItem[] => {
    return items
      .filter(item => item.parentId === parentId && item.isVisible && item.isActive)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const renderNavigationItems = (items: NavigationItem[], level: number = 0): React.ReactNode => {
    return items.map(item => {
      const children = buildNavigationTree(items, item.id);
      const hasChildren = children.length > 0;
      
      return (
        <div key={item.id} className={`${level > 0 ? 'ml-4' : ''}`}>
          <div className="flex items-center space-x-2 py-2 px-3 hover:bg-gray-100 rounded-md transition-colors">
            <a 
              href={`/${item.urlSlug}`}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.displayName}
            </a>
            {hasChildren && (
              <ChevronDown className="h-3 w-3 text-gray-400" />
            )}
          </div>
          {hasChildren && (
            <div className="ml-2">
              {renderNavigationItems(children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const rootItems = buildNavigationTree(items);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Navigation Preview</CardTitle>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant={previewMode === 'desktop' ? 'default' : 'outline'}
              onClick={() => setPreviewMode('desktop')}
            >
              Desktop
            </Button>
            <Button
              size="sm"
              variant={previewMode === 'mobile' ? 'default' : 'outline'}
              onClick={() => setPreviewMode('mobile')}
            >
              Mobile
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`
          border rounded-lg p-4 bg-white
          ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'}
        `}>
          {previewMode === 'desktop' ? (
            // Desktop Navigation Preview
            <div className="flex items-center space-x-6">
              <div className="font-bold text-lg text-gray-900">
                Your Site
              </div>
              <div className="flex items-center space-x-4">
                {rootItems.map(item => (
                  <div key={item.id} className="relative group">
                    <a 
                      href={`/${item.urlSlug}`}
                      className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.displayName}
                    </a>
                    {buildNavigationTree(items, item.id).length > 0 && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <div className="py-2">
                          {buildNavigationTree(items, item.id).map(child => (
                            <a
                              key={child.id}
                              href={`/${child.urlSlug}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {child.displayName}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Mobile Navigation Preview
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="font-bold text-lg text-gray-900">
                  Your Site
                </div>
                <Button size="sm" variant="ghost">
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {renderNavigationItems(rootItems)}
              </div>
            </div>
          )}
        </div>
        
        {rootItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No visible navigation items to preview
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500">
          Preview updates automatically as you make changes. Click items to open in new tab.
        </div>
      </CardContent>
    </Card>
  );
};

export const NavigationEditor: React.FC = () => {
  const {
    items,
    loading,
    error,
    permissions,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
    toggleVisibility,
    getNavigationTree,
    clearError
  } = useNavigationManager({ includeHidden: true });

  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [navigationTree, setNavigationTree] = useState<NavigationItem[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  // Load navigation tree
  useEffect(() => {
    const loadTree = async () => {
      try {
        const tree = await getNavigationTree(true);
        setNavigationTree(tree);
      } catch (error) {
        console.error('Failed to load navigation tree:', error);
      }
    };

    if (!loading && items.length > 0) {
      loadTree();
    }
  }, [items, loading, getNavigationTree]);

  const handleEdit = useCallback((item: NavigationItem) => {
    setEditingItem(item);
    setIsCreating(false);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    setIsCreating(true);
  }, []);

  const handleSave = useCallback(async (itemData: Partial<NavigationItem>) => {
    try {
      if (isCreating) {
        const newItemData = {
          ...itemData,
          id: '', // Will be generated by the manager
          isActive: true
        } as Omit<NavigationItem, 'id'>;
        
        await createItem(newItemData);
      } else if (editingItem) {
        await updateItem(editingItem.id, itemData);
      }
      
      setEditingItem(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to save navigation item:', error);
    }
  }, [isCreating, editingItem, createItem, updateItem]);

  const handleCancel = useCallback(() => {
    setEditingItem(null);
    setIsCreating(false);
  }, []);

  const handleDelete = useCallback(async (itemId: string) => {
    if (confirm('Are you sure you want to delete this navigation item?')) {
      await deleteItem(itemId);
    }
  }, [deleteItem]);

  const handleToggleVisibility = useCallback(async (itemId: string, isVisible: boolean) => {
    await toggleVisibility(itemId, isVisible);
  }, [toggleVisibility]);

  const handleMove = useCallback(async (
    draggedItem: NavigationItem,
    targetItem: NavigationItem,
    position: 'before' | 'after' | 'inside'
  ) => {
    try {
      let newOrderIndex = targetItem.orderIndex;
      let newParentId = targetItem.parentId;

      if (position === 'before') {
        newOrderIndex = targetItem.orderIndex;
      } else if (position === 'after') {
        newOrderIndex = targetItem.orderIndex + 1;
      } else if (position === 'inside') {
        newParentId = targetItem.id;
        newOrderIndex = 0; // First child
      }

      const operations: NavigationReorderOperation[] = [{
        itemId: draggedItem.id,
        newOrderIndex,
        newParentId
      }];

      await reorderItems(operations);
    } catch (error) {
      console.error('Failed to move navigation item:', error);
    }
  }, [reorderItems]);

  // Handle inline editing
  const handleInlineEdit = useCallback(async (itemId: string, field: 'displayName' | 'urlSlug', value: string) => {
    try {
      const updates: Partial<NavigationItem> = {};
      updates[field] = value;
      
      // Auto-generate URL slug if display name changed and slug follows pattern
      if (field === 'displayName') {
        const item = items.find(i => i.id === itemId);
        if (item) {
          const expectedSlug = value
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          
          // If current slug matches the pattern of the old display name, update it
          const oldExpectedSlug = item.displayName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
            
          if (item.urlSlug === oldExpectedSlug) {
            updates.urlSlug = expectedSlug;
          }
        }
      }
      
      await updateItem(itemId, updates);
    } catch (error) {
      console.error('Failed to update navigation item:', error);
    }
  }, [items, updateItem]);

  // Handle duplication
  const handleDuplicate = useCallback(async (item: NavigationItem) => {
    try {
      const duplicatedItem = {
        ...item,
        displayName: `${item.displayName} (Copy)`,
        urlSlug: `${item.urlSlug}-copy`,
        orderIndex: item.orderIndex + 1,
        isActive: true
      };
      delete (duplicatedItem as any).id; // Remove ID so a new one is generated
      
      await createItem(duplicatedItem);
    } catch (error) {
      console.error('Failed to duplicate navigation item:', error);
    }
  }, [createItem]);

  // Handle move up/down
  const handleMoveUp = useCallback(async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      
      const siblings = items
        .filter(i => i.parentId === item.parentId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      
      const currentIndex = siblings.findIndex(i => i.id === itemId);
      if (currentIndex > 0) {
        const operations: NavigationReorderOperation[] = [
          {
            itemId: item.id,
            newOrderIndex: siblings[currentIndex - 1].orderIndex,
            newParentId: item.parentId
          },
          {
            itemId: siblings[currentIndex - 1].id,
            newOrderIndex: item.orderIndex,
            newParentId: siblings[currentIndex - 1].parentId
          }
        ];
        
        await reorderItems(operations);
      }
    } catch (error) {
      console.error('Failed to move item up:', error);
    }
  }, [items, reorderItems]);

  const handleMoveDown = useCallback(async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      
      const siblings = items
        .filter(i => i.parentId === item.parentId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      
      const currentIndex = siblings.findIndex(i => i.id === itemId);
      if (currentIndex < siblings.length - 1) {
        const operations: NavigationReorderOperation[] = [
          {
            itemId: item.id,
            newOrderIndex: siblings[currentIndex + 1].orderIndex,
            newParentId: item.parentId
          },
          {
            itemId: siblings[currentIndex + 1].id,
            newOrderIndex: item.orderIndex,
            newParentId: siblings[currentIndex + 1].parentId
          }
        ];
        
        await reorderItems(operations);
      }
    } catch (error) {
      console.error('Failed to move item down:', error);
    }
  }, [items, reorderItems]);

  const buildTreeItems = (items: NavigationItem[], parentId: string | null = null): NavigationItem[] => {
    return items
      .filter(item => item.parentId === parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading navigation...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <Button onClick={clearError} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rootItems = buildTreeItems(items);

  return (
    <DragDropProvider>
      <div className="space-y-4">
        {/* Navigation Preview */}
        {showPreview && (
          <NavigationPreview 
            items={items}
            className="mb-4"
          />
        )}

        {/* Main Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Navigation Tree Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Navigation Editor</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                  {permissions.canAdd && (
                    <Button onClick={handleCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(isCreating || editingItem) && (
                <EditForm
                  item={editingItem}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isCreating={isCreating}
                />
              )}

              <div className="space-y-2">
                {rootItems.map((item, index) => (
                  <NavigationItemComponent
                    key={item.id}
                    item={item}
                    index={index}
                    level={0}
                    children={buildTreeItems(items, item.id)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleVisibility={handleToggleVisibility}
                    onMove={handleMove}
                    onInlineEdit={handleInlineEdit}
                    onDuplicate={handleDuplicate}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    permissions={permissions}
                  />
                ))}
              </div>

              {rootItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No navigation items found. Create your first item to get started.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Statistics and Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {items.filter(item => item.isVisible && item.isActive).length}
                    </div>
                    <div className="text-sm text-blue-600">Visible Items</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">
                      {items.filter(item => !item.isVisible && item.isActive).length}
                    </div>
                    <div className="text-sm text-gray-600">Hidden Items</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        items.filter(item => !item.isVisible).forEach(item => {
                          handleToggleVisibility(item.id, true);
                        });
                      }}
                      disabled={!permissions.canToggleVisibility || items.filter(item => !item.isVisible).length === 0}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Show All Hidden Items
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open('/', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview Site
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm text-red-600 mb-2">{error}</div>
                    <Button size="sm" variant="outline" onClick={clearError}>
                      <Undo2 className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DragDropProvider>
  );
};