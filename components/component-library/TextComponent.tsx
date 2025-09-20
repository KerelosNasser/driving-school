'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ComponentRenderContext } from '../../lib/components/types';

interface TextComponentProps extends ComponentRenderContext {
  text: string;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  className?: string;
}

/**
 * Text Component - Preview Mode
 */
export function TextComponentPreview({
  text,
  fontSize = 'base',
  fontWeight = 'normal',
  textAlign = 'left',
  color = '#000000',
  className = '',
  ...context
}: TextComponentProps) {
  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  };

  const fontWeightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const textAlignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const classes = [
    fontSizeClasses[fontSize],
    fontWeightClasses[fontWeight],
    textAlignClasses[textAlign],
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classes}
      style={{ color }}
      data-component-type="text"
      data-component-id={context.componentId}
    >
      {text || 'Click to edit text...'}
    </div>
  );
}

/**
 * Text Component - Edit Mode
 */
export function TextComponentEdit({
  text,
  fontSize = 'base',
  fontWeight = 'normal',
  textAlign = 'left',
  color = '#000000',
  className = '',
  onPropsChange,
  ...context
}: TextComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text || '');
  const [showToolbar, setShowToolbar] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      setEditValue(text || '');
    }
  };

  const handleSave = () => {
    if (onPropsChange && editValue !== text) {
      onPropsChange({ text: editValue });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(text || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handlePropertyChange = (property: string, value: any) => {
    if (onPropsChange) {
      onPropsChange({ [property]: value });
    }
  };

  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  };

  const fontWeightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const textAlignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const classes = [
    fontSizeClasses[fontSize],
    fontWeightClasses[fontWeight],
    textAlignClasses[textAlign],
    className,
    'relative group'
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classes}
      style={{ color }}
      data-component-type="text"
      data-component-id={context.componentId}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Editing Toolbar */}
      {showToolbar && !isEditing && (
        <div className="absolute -top-12 left-0 bg-gray-800 text-white px-3 py-1 rounded-md shadow-lg z-50 flex items-center gap-2 text-xs">
          <button
            onClick={handleClick}
            className="hover:bg-gray-700 px-2 py-1 rounded"
          >
            Edit Text
          </button>
          <div className="w-px h-4 bg-gray-600" />
          <select
            value={fontSize}
            onChange={(e) => handlePropertyChange('fontSize', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="sm">Small</option>
            <option value="base">Base</option>
            <option value="lg">Large</option>
            <option value="xl">XL</option>
            <option value="2xl">2XL</option>
            <option value="3xl">3XL</option>
          </select>
          <select
            value={fontWeight}
            onChange={(e) => handlePropertyChange('fontWeight', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="normal">Normal</option>
            <option value="medium">Medium</option>
            <option value="semibold">Semibold</option>
            <option value="bold">Bold</option>
          </select>
          <select
            value={textAlign}
            onChange={(e) => handlePropertyChange('textAlign', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
          <input
            type="color"
            value={color}
            onChange={(e) => handlePropertyChange('color', e.target.value)}
            className="w-6 h-6 rounded border-none cursor-pointer"
          />
        </div>
      )}

      {/* Text Content */}
      {isEditing ? (
        <div className="relative">
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full bg-transparent border-2 border-blue-500 rounded px-2 py-1 resize-none"
            style={{ 
              color,
              fontSize: 'inherit',
              fontWeight: 'inherit',
              textAlign: textAlign as any,
              minHeight: '1.5em'
            }}
            rows={editValue.split('\n').length}
          />
          <div className="absolute -bottom-8 left-0 flex gap-2 text-xs">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={textRef}
          onClick={handleClick}
          className="cursor-text min-h-[1.5em] hover:bg-blue-50 hover:outline hover:outline-2 hover:outline-blue-300 hover:outline-dashed rounded px-1"
        >
          {text || 'Click to edit text...'}
        </div>
      )}
    </div>
  );
}