'use client';

import React, { useState, useRef } from 'react';
import { ComponentRenderContext } from '../../lib/components/types';

interface ImageComponentProps extends ComponentRenderContext {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

/**
 * Image Component - Preview Mode
 */
export function ImageComponentPreview({
  src,
  alt,
  width,
  height,
  objectFit = 'cover',
  borderRadius = 'none',
  className = '',
  ...context
}: ImageComponentProps) {
  const borderRadiusClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  const classes = [
    borderRadiusClasses[borderRadius],
    className
  ].filter(Boolean).join(' ');

  const style: React.CSSProperties = {
    objectFit,
    width: width ? `${width}px` : 'auto',
    height: height ? `${height}px` : 'auto'
  };

  if (!src) {
    return (
      <div 
        className={`bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center ${classes}`}
        style={{ 
          width: width ? `${width}px` : '200px',
          height: height ? `${height}px` : '150px'
        }}
        data-component-type="image"
        data-component-id={context.componentId}
      >
        <div className="text-gray-500 text-center">
          <div className="text-2xl mb-2">🖼️</div>
          <div className="text-sm">No image selected</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={classes}
      style={style}
      data-component-type="image"
      data-component-id={context.componentId}
    />
  );
}

/**
 * Image Component - Edit Mode
 */
export function ImageComponentEdit({
  src,
  alt,
  width,
  height,
  objectFit = 'cover',
  borderRadius = 'none',
  className = '',
  onPropsChange,
  ...context
}: ImageComponentProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingAlt, setEditingAlt] = useState(false);
  const [altValue, setAltValue] = useState(alt || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');

      // Upload to your API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (onPropsChange) {
        onPropsChange({
          src: result.url,
          alt: alt || file.name.replace(/\.[^/.]+$/, '') // Use filename as default alt if none exists
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePropertyChange = (property: string, value: any) => {
    if (onPropsChange) {
      onPropsChange({ [property]: value });
    }
  };

  const handleAltSave = () => {
    if (onPropsChange && altValue !== alt) {
      onPropsChange({ alt: altValue });
    }
    setEditingAlt(false);
  };

  const handleAltCancel = () => {
    setAltValue(alt || '');
    setEditingAlt(false);
  };

  const borderRadiusClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  const classes = [
    borderRadiusClasses[borderRadius],
    className,
    'relative group'
  ].filter(Boolean).join(' ');

  const style: React.CSSProperties = {
    objectFit,
    width: width ? `${width}px` : 'auto',
    height: height ? `${height}px` : 'auto'
  };

  return (
    <div 
      className={classes}
      data-component-type="image"
      data-component-id={context.componentId}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Editing Toolbar */}
      {showToolbar && (
        <div className="absolute -top-12 left-0 bg-gray-800 text-white px-3 py-1 rounded-md shadow-lg z-50 flex items-center gap-2 text-xs">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="hover:bg-gray-700 px-2 py-1 rounded disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Change Image'}
          </button>
          <button
            onClick={() => setEditingAlt(true)}
            className="hover:bg-gray-700 px-2 py-1 rounded"
          >
            Edit Alt Text
          </button>
          <div className="w-px h-4 bg-gray-600" />
          <select
            value={objectFit}
            onChange={(e) => handlePropertyChange('objectFit', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
            <option value="none">None</option>
            <option value="scale-down">Scale Down</option>
          </select>
          <select
            value={borderRadius}
            onChange={(e) => handlePropertyChange('borderRadius', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="none">No Radius</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="full">Full</option>
          </select>
          <input
            type="number"
            placeholder="Width"
            value={width || ''}
            onChange={(e) => handlePropertyChange('width', e.target.value ? parseInt(e.target.value) : undefined)}
            className="bg-gray-700 text-white text-xs rounded px-1 w-16"
          />
          <input
            type="number"
            placeholder="Height"
            value={height || ''}
            onChange={(e) => handlePropertyChange('height', e.target.value ? parseInt(e.target.value) : undefined)}
            className="bg-gray-700 text-white text-xs rounded px-1 w-16"
          />
        </div>
      )}

      {/* Alt Text Editor */}
      {editingAlt && (
        <div className="absolute -bottom-16 left-0 bg-white border border-gray-300 rounded-md shadow-lg p-3 z-50 min-w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alt Text (for accessibility)
          </label>
          <input
            type="text"
            value={altValue}
            onChange={(e) => setAltValue(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="Describe the image..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAltSave();
              if (e.key === 'Escape') handleAltCancel();
            }}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAltSave}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={handleAltCancel}
              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Image Content */}
      {!src ? (
        <div 
          className={`bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer hover:bg-gray-100 ${borderRadiusClasses[borderRadius]}`}
          style={{ 
            width: width ? `${width}px` : '200px',
            height: height ? `${height}px` : '150px'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-gray-500 text-center">
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-sm">Click to select image</div>
            {isUploading && <div className="text-xs mt-1">Uploading...</div>}
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`hover:opacity-80 cursor-pointer ${borderRadiusClasses[borderRadius]}`}
          style={style}
          onClick={() => fileInputRef.current?.click()}
        />
      )}

      {/* Upload overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
          <div className="text-white text-sm">Uploading...</div>
        </div>
      )}
    </div>
  );
}