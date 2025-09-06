'use client';

import { useState, useRef, useEffect, ReactNode, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { useEditMode } from '@/contexts/editModeContext';
import { PersistentContentLoader } from '@/lib/contentLoader';
import { getContentValue } from '@/lib/content';
import { Loader2, History, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PersistentEditableTextProps {
  contentKey: string;
  pageName?: string;
  defaultValue: string;
  tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  showHistory?: boolean;
}

export function PersistentEditableText({
  contentKey,
  pageName = 'home',
  defaultValue,
  tagName = 'div',
  className = '',
  placeholder = 'Click to edit...',
  multiline = false,
  maxLength = 500,
  showHistory = false
}: PersistentEditableTextProps) {
  const { isEditMode, isSaving } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [hasConflict, setHasConflict] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [contentHistory, setContentHistory] = useState<any[]>([]);
  const editRef = useRef<HTMLDivElement>(null);
  const contentLoader = PersistentContentLoader.getInstance();

  // Load saved content on mount and subscribe to real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const loadContent = async () => {
      try {
        const pageContent = await contentLoader.loadPageContent(pageName);
        const savedValue = getContentValue(pageContent, contentKey, defaultValue);
        
        if (savedValue !== defaultValue && savedValue !== text) {
          setText(savedValue);
        }
      } catch (error) {
        console.error('Error loading content:', error);
        toast.error('Failed to load saved content');
      } finally {
        setIsLoading(false);
      }
    };

    // Subscribe to real-time updates
    unsubscribe = contentLoader.subscribe((updatedPageName, content) => {
      if (updatedPageName === pageName) {
        const updatedValue = getContentValue(content, contentKey, defaultValue);
        if (updatedValue !== text && !isEditing) {
          setText(updatedValue);
          setHasConflict(false);
        }
      }
    });

    loadContent();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [contentKey, pageName, defaultValue]);

  const handleClick = () => {
    if (!isEditMode || isSaving || isLoading) return;
    setIsEditing(true);
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.innerText = text;
        editRef.current.focus();
        // Select all text
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(editRef.current);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 10);
  };

  const handleBlur = async () => {
    if (!isEditing || !editRef.current) return;
    const finalValue = editRef.current.innerText.trim();
    setIsEditing(false);

    if (finalValue !== '' && finalValue !== text) {
      setText(finalValue); // Optimistic update
      
      try {
        const result = await contentLoader.saveContent(
          pageName,
          contentKey,
          finalValue,
          'text',
          'current-user' // You should get this from your auth context
        );

        if (result.conflict) {
          setHasConflict(true);
          toast.error('Content was modified by another user. Please refresh to see latest changes.');
        } else if (!result.success) {
          // Revert optimistic update
          setText(text);
          toast.error('Failed to save changes');
        } else {
          setHasConflict(false);
          toast.success(`Saved: ${contentKey.replace(/_/g, ' ')}`);
        }
      } catch (error) {
        // Revert optimistic update
        setText(text);
        toast.error('Save failed');
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      editRef.current?.blur();
    } else if (e.key === 'Escape') {
      if (editRef.current) {
        editRef.current.innerText = text;
      }
      editRef.current?.blur();
    }
  };

  const handleInput = () => {
    if (editRef.current) {
      const newValue = editRef.current.innerText;
      if (newValue.length > maxLength) {
        const truncated = newValue.substring(0, maxLength);
        editRef.current.innerText = truncated;
        // Move cursor to end
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(editRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  const loadHistory = async () => {
    try {
      const history = await contentLoader.getContentHistory(pageName, contentKey);
      setContentHistory(history);
      setShowHistoryPanel(true);
    } catch (error) {
      toast.error('Failed to load content history');
    }
  };

  const restoreFromHistory = async (version: string) => {
    try {
      const success = await contentLoader.restoreVersion(
        pageName,
        contentKey,
        version,
        'current-user'
      );
      
      if (success) {
        setShowHistoryPanel(false);
        toast.success('Content restored from history');
        // Content will be updated via subscription
      } else {
        toast.error('Failed to restore content');
      }
    } catch (error) {
      toast.error('Restore failed');
    }
  };

  const Tag = tagName;

  // Loading state
  if (isLoading) {
    return (
      <Tag className={cn(className, 'flex items-center gap-2 opacity-50')}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </Tag>
    );
  }

  // Non-edit mode
  if (!isEditMode) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <div className="relative inline-block w-full">
      <Tag
        ref={editRef}
        className={cn(
          className,
          'editable-element transition-all duration-200',
          isEditing ? 'editing' : 'cursor-pointer hover:bg-blue-50',
          hasConflict ? 'border-2 border-orange-500' : '',
          isSaving ? 'opacity-50 pointer-events-none' : ''
        )}
        contentEditable={isEditing}
        suppressContentEditableWarning={true}
        onClick={handleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        data-placeholder={placeholder}
        dir="ltr"
        style={{
          minHeight: isEditing ? '1.5em' : 'auto',
          outline: isEditing ? '2px solid #3b82f6' : 'none',
          padding: isEditing ? '4px 8px' : '2px',
          borderRadius: isEditing ? '4px' : '0',
          backgroundColor: isEditing 
            ? 'rgba(59, 130, 246, 0.1)' 
            : hasConflict 
            ? 'rgba(245, 101, 101, 0.1)'
            : 'transparent',
        }}
      >
        {isEditing ? null : text}
      </Tag>

      {/* Status indicators */}
      {isEditMode && (
        <div className="absolute -top-6 left-0 flex items-center gap-1 text-xs">
          {isSaving && (
            <div className="flex items-center gap-1 text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          
          {hasConflict && (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="h-3 w-3" />
              <span>Conflict detected</span>
            </div>
          )}
          
          {showHistory && (
            <button
              onClick={loadHistory}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
              title="View edit history"
            >
              <History className="h-3 w-3" />
              <span>History</span>
            </button>
          )}
        </div>
      )}

      {/* History panel */}
      {showHistoryPanel && (
        <div className="absolute top-full left-0 z-50 mt-2 w-80 bg-white border rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Edit History</h4>
            <button
              onClick={() => setShowHistoryPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-2">
            {contentHistory.map((entry, index) => (
              <div
                key={entry.version}
                className="p-2 border rounded text-xs hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-gray-600">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                  {index > 0 && (
                    <button
                      onClick={() => restoreFromHistory(entry.version)}
                      className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      Restore
                    </button>
                  )}
                </div>
                <div className="text-gray-800 truncate">
                  {entry.content_value || JSON.stringify(entry.content_json)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
