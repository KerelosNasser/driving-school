'use client';

import React, { useState } from 'react';
import { ComponentRenderContext } from '../../lib/components/types';

interface ButtonComponentProps extends ComponentRenderContext {
  text: string;
  href?: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  className?: string;
}

/**
 * Button Component - Preview Mode
 */
export function ButtonComponentPreview({
  text,
  href,
  target = '_self',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...context
}: ButtonComponentProps) {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
    outline: 'bg-transparent hover:bg-blue-50 text-blue-600 border-blue-600',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  const baseClasses = [
    'inline-flex items-center justify-center',
    'border rounded-md font-medium',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    fullWidth ? 'w-full' : '',
    variantClasses[variant],
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  const buttonContent = (
    <>
      {icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {text || 'Button Text'}
      {icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </>
  );

  const commonProps = {
    className: baseClasses,
    'data-component-type': 'button',
    'data-component-id': context.componentId,
    disabled
  };

  if (href && !disabled) {
    return (
      <a
        href={href}
        target={target}
        {...commonProps}
        className={`${baseClasses} no-underline`}
      >
        {buttonContent}
      </a>
    );
  }

  return (
    <button {...commonProps}>
      {buttonContent}
    </button>
  );
}

/**
 * Button Component - Edit Mode
 */
export function ButtonComponentEdit({
  text,
  href,
  target = '_self',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  onPropsChange,
  ...context
}: ButtonComponentProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [editingText, setEditingText] = useState(false);
  const [editingLink, setEditingLink] = useState(false);
  const [textValue, setTextValue] = useState(text || '');
  const [linkValue, setLinkValue] = useState(href || '');

  const handlePropertyChange = (property: string, value: any) => {
    if (onPropsChange) {
      onPropsChange({ [property]: value });
    }
  };

  const handleTextSave = () => {
    if (onPropsChange && textValue !== text) {
      onPropsChange({ text: textValue });
    }
    setEditingText(false);
  };

  const handleTextCancel = () => {
    setTextValue(text || '');
    setEditingText(false);
  };

  const handleLinkSave = () => {
    if (onPropsChange && linkValue !== href) {
      onPropsChange({ href: linkValue });
    }
    setEditingLink(false);
  };

  const handleLinkCancel = () => {
    setLinkValue(href || '');
    setEditingLink(false);
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
    outline: 'bg-transparent hover:bg-blue-50 text-blue-600 border-blue-600',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  const baseClasses = [
    'inline-flex items-center justify-center',
    'border rounded-md font-medium',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    fullWidth ? 'w-full' : '',
    variantClasses[variant],
    sizeClasses[size],
    className,
    'relative group'
  ].filter(Boolean).join(' ');

  const buttonContent = (
    <>
      {icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {text || 'Button Text'}
      {icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </>
  );

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Editing Toolbar */}
      {showToolbar && !editingText && !editingLink && (
        <div className="absolute -top-12 left-0 bg-gray-800 text-white px-3 py-1 rounded-md shadow-lg z-50 flex items-center gap-2 text-xs whitespace-nowrap">
          <button
            onClick={() => setEditingText(true)}
            className="hover:bg-gray-700 px-2 py-1 rounded"
          >
            Edit Text
          </button>
          <button
            onClick={() => setEditingLink(true)}
            className="hover:bg-gray-700 px-2 py-1 rounded"
          >
            {href ? 'Edit Link' : 'Add Link'}
          </button>
          <div className="w-px h-4 bg-gray-600" />
          <select
            value={variant}
            onChange={(e) => handlePropertyChange('variant', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="outline">Outline</option>
            <option value="ghost">Ghost</option>
            <option value="danger">Danger</option>
          </select>
          <select
            value={size}
            onChange={(e) => handlePropertyChange('size', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">XL</option>
          </select>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={fullWidth}
              onChange={(e) => handlePropertyChange('fullWidth', e.target.checked)}
              className="w-3 h-3"
            />
            <span>Full Width</span>
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={disabled}
              onChange={(e) => handlePropertyChange('disabled', e.target.checked)}
              className="w-3 h-3"
            />
            <span>Disabled</span>
          </label>
        </div>
      )}

      {/* Text Editor */}
      {editingText && (
        <div className="absolute -top-20 left-0 bg-white border border-gray-300 rounded-md shadow-lg p-3 z-50 min-w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Button Text
          </label>
          <input
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="Enter button text..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTextSave();
              if (e.key === 'Escape') handleTextCancel();
            }}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleTextSave}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={handleTextCancel}
              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Link Editor */}
      {editingLink && (
        <div className="absolute -top-32 left-0 bg-white border border-gray-300 rounded-md shadow-lg p-3 z-50 min-w-80">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link URL
          </label>
          <input
            type="url"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2"
            placeholder="https://example.com"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLinkSave();
              if (e.key === 'Escape') handleLinkCancel();
            }}
            autoFocus
          />
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target
          </label>
          <select
            value={target}
            onChange={(e) => handlePropertyChange('target', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2"
          >
            <option value="_self">Same window</option>
            <option value="_blank">New window</option>
            <option value="_parent">Parent frame</option>
            <option value="_top">Top frame</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleLinkSave}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={handleLinkCancel}
              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
            >
              Cancel
            </button>
            {href && (
              <button
                onClick={() => {
                  handlePropertyChange('href', '');
                  setEditingLink(false);
                }}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
              >
                Remove Link
              </button>
            )}
          </div>
        </div>
      )}

      {/* Button Element */}
      {href && !disabled ? (
        <a
          href={href}
          target={target}
          className={`${baseClasses} no-underline`}
          data-component-type="button"
          data-component-id={context.componentId}
          onClick={(e) => e.preventDefault()} // Prevent navigation in edit mode
        >
          {buttonContent}
        </a>
      ) : (
        <button
          className={baseClasses}
          data-component-type="button"
          data-component-id={context.componentId}
          disabled={disabled}
        >
          {buttonContent}
        </button>
      )}
    </div>
  );
}