'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditMode } from '@/app/layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';

interface EditableTextProps {
  children: string;
  onSave?: (value: string) => void;
  tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  multiline?: boolean;
  className?: string;
  // New props for Supabase integration
  tableName?: string;
  columnName?: string;
  rowId?: string;
}

export function EditableText({ 
  children, 
  onSave, 
  tagName: Tag = 'p',
  multiline = false,
  className = '',
  tableName,
  columnName,
  rowId
}: EditableTextProps) {
  const { isEditMode } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(children);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Update value when children change
  useEffect(() => {
    setValue(children);
  }, [children]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const saveToSupabase = async (newValue: string) => {
    if (!tableName || !columnName || !rowId) return false;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ [columnName]: newValue })
        .eq('id', rowId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setIsEditing(false);
    if (value !== children) {
      // Try to save to Supabase first if table info is provided
      if (tableName && columnName && rowId) {
        const saved = await saveToSupabase(value);
        if (!saved) {
          console.error('Failed to save to Supabase');
          // Revert to original value if save failed
          setValue(children);
          return;
        }
      }
      
      // Call custom onSave handler if provided
      if (onSave) {
        onSave(value);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(children);
      setIsEditing(false);
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
      handleSave();
    }
  };

  useEffect(() => {
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isEditing]);

  if (!isEditMode) {
    return <Tag className={className}>{children}</Tag>;
  }

  if (isEditing) {
    const commonProps = {
      ref: inputRef as any,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value),
      onKeyDown: handleKeyDown,
      onBlur: handleSave,
      className: `${className} border-2 border-yellow-500 rounded p-1 focus:outline-none focus:ring-2 focus:ring-yellow-300`,
      disabled: saving
    };

    return multiline ? (
      <Textarea {...commonProps} rows={3} />
    ) : (
      <Input {...commonProps} />
    );
  }

  return (
    <Tag 
      className={`${className} cursor-pointer hover:bg-yellow-50 hover:border-yellow-200 border-2 border-transparent rounded p-1 ${saving ? 'opacity-50' : ''}`}
      onClick={() => setIsEditing(true)}
    >
      {saving ? 'Saving...' : children}
    </Tag>
  );
}