'use client';

import React, { useState } from 'react';
import { ComponentRenderContext } from '../../lib/components/types';

// Section Component
interface SectionComponentProps extends ComponentRenderContext {
  backgroundColor?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
  children?: React.ReactNode;
}

export function SectionComponentPreview({
  backgroundColor = 'transparent',
  padding = 'md',
  margin = 'none',
  maxWidth = 'full',
  className = '',
  children,
  ...context
}: SectionComponentProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const marginClasses = {
    none: '',
    sm: 'm-2',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8'
  };

  const maxWidthClasses = {
    none: '',
    sm: 'max-w-sm mx-auto',
    md: 'max-w-md mx-auto',
    lg: 'max-w-lg mx-auto',
    xl: 'max-w-xl mx-auto',
    '2xl': 'max-w-2xl mx-auto',
    full: 'w-full'
  };

  const classes = [
    paddingClasses[padding],
    marginClasses[margin],
    maxWidthClasses[maxWidth],
    className
  ].filter(Boolean).join(' ');

  return (
    <section
      className={classes}
      style={{ backgroundColor }}
      data-component-type="section"
      data-component-id={context.componentId}
    >
      {children || (
        <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded">
          Section Content Area
        </div>
      )}
    </section>
  );
}

export function SectionComponentEdit({
  backgroundColor = 'transparent',
  padding = 'md',
  margin = 'none',
  maxWidth = 'full',
  className = '',
  children,
  onPropsChange,
  ...context
}: SectionComponentProps) {
  const [showToolbar, setShowToolbar] = useState(false);

  const handlePropertyChange = (property: string, value: any) => {
    if (onPropsChange) {
      onPropsChange({ [property]: value });
    }
  };

  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const marginClasses = {
    none: '',
    sm: 'm-2',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8'
  };

  const maxWidthClasses = {
    none: '',
    sm: 'max-w-sm mx-auto',
    md: 'max-w-md mx-auto',
    lg: 'max-w-lg mx-auto',
    xl: 'max-w-xl mx-auto',
    '2xl': 'max-w-2xl mx-auto',
    full: 'w-full'
  };

  const classes = [
    paddingClasses[padding],
    marginClasses[margin],
    maxWidthClasses[maxWidth],
    className,
    'relative group'
  ].filter(Boolean).join(' ');

  return (
    <section
      className={classes}
      style={{ backgroundColor }}
      data-component-type="section"
      data-component-id={context.componentId}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Editing Toolbar */}
      {showToolbar && (
        <div className="absolute -top-12 left-0 bg-gray-800 text-white px-3 py-1 rounded-md shadow-lg z-50 flex items-center gap-2 text-xs">
          <span className="text-gray-300">Section:</span>
          <select
            value={padding}
            onChange={(e) => handlePropertyChange('padding', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="none">No Padding</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">XL</option>
          </select>
          <select
            value={maxWidth}
            onChange={(e) => handlePropertyChange('maxWidth', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="full">Full Width</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">XL</option>
            <option value="2xl">2XL</option>
          </select>
          <input
            type="color"
            value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
            onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
            className="w-6 h-6 rounded border-none cursor-pointer"
          />
        </div>
      )}

      {children || (
        <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded hover:border-blue-400">
          Section Content Area - Drop components here
        </div>
      )}
    </section>
  );
}

// Column Component
interface ColumnComponentProps extends ComponentRenderContext {
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
  children?: React.ReactNode;
}

export function ColumnComponentPreview({
  columns = 2,
  gap = 'md',
  alignItems = 'start',
  className = '',
  children,
  ...context
}: ColumnComponentProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12'
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const classes = [
    'grid',
    columnClasses[columns],
    gapClasses[gap],
    alignClasses[alignItems],
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      data-component-type="columns"
      data-component-id={context.componentId}
    >
      {children || (
        Array.from({ length: columns }, (_, i) => (
          <div
            key={i}
            className="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-500"
          >
            Column {i + 1}
          </div>
        ))
      )}
    </div>
  );
}

export function ColumnComponentEdit({
  columns = 2,
  gap = 'md',
  alignItems = 'start',
  className = '',
  children,
  onPropsChange,
  ...context
}: ColumnComponentProps) {
  const [showToolbar, setShowToolbar] = useState(false);

  const handlePropertyChange = (property: string, value: any) => {
    if (onPropsChange) {
      onPropsChange({ [property]: value });
    }
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12'
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const classes = [
    'grid',
    columnClasses[columns],
    gapClasses[gap],
    alignClasses[alignItems],
    className,
    'relative group'
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      data-component-type="columns"
      data-component-id={context.componentId}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Editing Toolbar */}
      {showToolbar && (
        <div className="absolute -top-12 left-0 bg-gray-800 text-white px-3 py-1 rounded-md shadow-lg z-50 flex items-center gap-2 text-xs">
          <span className="text-gray-300">Columns:</span>
          <select
            value={columns}
            onChange={(e) => handlePropertyChange('columns', parseInt(e.target.value))}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value={1}>1 Column</option>
            <option value={2}>2 Columns</option>
            <option value={3}>3 Columns</option>
            <option value={4}>4 Columns</option>
            <option value={6}>6 Columns</option>
            <option value={12}>12 Columns</option>
          </select>
          <select
            value={gap}
            onChange={(e) => handlePropertyChange('gap', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="none">No Gap</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">XL</option>
          </select>
          <select
            value={alignItems}
            onChange={(e) => handlePropertyChange('alignItems', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="start">Start</option>
            <option value="center">Center</option>
            <option value="end">End</option>
            <option value="stretch">Stretch</option>
          </select>
        </div>
      )}

      {children || (
        Array.from({ length: columns }, (_, i) => (
          <div
            key={i}
            className="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-500 hover:border-blue-400"
          >
            Column {i + 1} - Drop components here
          </div>
        ))
      )}
    </div>
  );
}

// Row Component
interface RowComponentProps extends ComponentRenderContext {
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function RowComponentPreview({
  justifyContent = 'start',
  alignItems = 'center',
  gap = 'md',
  wrap = false,
  className = '',
  children,
  ...context
}: RowComponentProps) {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const classes = [
    'flex',
    justifyClasses[justifyContent],
    alignClasses[alignItems],
    gapClasses[gap],
    wrap ? 'flex-wrap' : 'flex-nowrap',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      data-component-type="row"
      data-component-id={context.componentId}
    >
      {children || (
        <>
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-500 flex-1">
            Item 1
          </div>
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-500 flex-1">
            Item 2
          </div>
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-500 flex-1">
            Item 3
          </div>
        </>
      )}
    </div>
  );
}

export function RowComponentEdit({
  justifyContent = 'start',
  alignItems = 'center',
  gap = 'md',
  wrap = false,
  className = '',
  children,
  onPropsChange,
  ...context
}: RowComponentProps) {
  const [showToolbar, setShowToolbar] = useState(false);

  const handlePropertyChange = (property: string, value: any) => {
    if (onPropsChange) {
      onPropsChange({ [property]: value });
    }
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const classes = [
    'flex',
    justifyClasses[justifyContent],
    alignClasses[alignItems],
    gapClasses[gap],
    wrap ? 'flex-wrap' : 'flex-nowrap',
    className,
    'relative group'
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      data-component-type="row"
      data-component-id={context.componentId}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Editing Toolbar */}
      {showToolbar && (
        <div className="absolute -top-12 left-0 bg-gray-800 text-white px-3 py-1 rounded-md shadow-lg z-50 flex items-center gap-2 text-xs">
          <span className="text-gray-300">Row:</span>
          <select
            value={justifyContent}
            onChange={(e) => handlePropertyChange('justifyContent', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="start">Start</option>
            <option value="center">Center</option>
            <option value="end">End</option>
            <option value="between">Between</option>
            <option value="around">Around</option>
            <option value="evenly">Evenly</option>
          </select>
          <select
            value={alignItems}
            onChange={(e) => handlePropertyChange('alignItems', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="start">Start</option>
            <option value="center">Center</option>
            <option value="end">End</option>
            <option value="stretch">Stretch</option>
          </select>
          <select
            value={gap}
            onChange={(e) => handlePropertyChange('gap', e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-1"
          >
            <option value="none">No Gap</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">XL</option>
          </select>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={wrap}
              onChange={(e) => handlePropertyChange('wrap', e.target.checked)}
              className="w-3 h-3"
            />
            <span>Wrap</span>
          </label>
        </div>
      )}

      {children || (
        <>
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-500 flex-1 hover:border-blue-400">
            Item 1 - Drop components here
          </div>
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-500 flex-1 hover:border-blue-400">
            Item 2 - Drop components here
          </div>
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-500 flex-1 hover:border-blue-400">
            Item 3 - Drop components here
          </div>
        </>
      )}
    </div>
  );
}