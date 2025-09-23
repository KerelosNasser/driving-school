'use client';

import React, { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DragDropConfig } from '../types/drag-drop';
import { toast } from 'sonner';
import { useEditMode } from '../../contexts/editModeContext';
import installDndDebug from './dnd-debug';

interface DragDropProviderProps {
  children: React.ReactNode;
  config?: Partial<DragDropConfig>;
}

const defaultConfig: DragDropConfig = {
  enablePreview: true,
  enableGhostIndicators: true,
  enableDropValidation: true,
  enableRealTimeSync: true,
  maxDragDistance: 1000,
  dropZoneHighlightDelay: 100,
};

export function DragDropProvider({ children, config = {} }: DragDropProviderProps) {
  const mergedConfig = { ...defaultConfig, ...config };
  const { isEditMode } = useEditMode();

  useEffect(() => {
    console.log('DragDropProvider useEffect run - isEditMode =', isEditMode);
    // Keep debug off by default; enable when edit mode is active
    const prev = (window as any).__DND_DEBUG;
    try {
      (window as any).__DND_DEBUG = !!isEditMode;
    } catch (e) {
      // ignore
    }

    // Mark provider presence on the document for runtime inspection
    try {
      document.body.setAttribute('data-dnd-provider', 'true');
    } catch (err) {}

    // Install debug listeners (no-op unless window.__DND_DEBUG enabled)
    const cleanup = installDndDebug();

    // Heuristic CSS check: if there are elements that should be draggable but
    // no visible drag handles/styles are present, warn the developer.
    const cssCheckTimeout = setTimeout(() => {
      try {
        const sample = document.querySelector('.drag-source');
        if (!sample) {
          // No .drag-source elements in DOM at this moment — not necessarily an error.
          return;
        }

        const cs = window.getComputedStyle(sample as Element);
        // If cursor style not applied and element is visible, likely missing CSS
        if (!cs || (cs.cursor === 'auto' || cs.cursor === '') ) {
          toast.error("CSS file 'sortable-theme.css' 404'd—drag handles invisible.");
          console.group('DragDrop CSS diagnostic');
          console.warn('Expected drag handle styles (e.g. .drag-source) appear missing or not applied.');
          console.groupEnd();
        }
      } catch (e) {
        // ignore diagnostics failure
      }
    }, 800);

    return () => {
      // cleanup debug listeners first
      console.log('DragDropProvider cleanup - isEditMode =', isEditMode);
      try {
        cleanup?.();
      } catch (e) {}

      clearTimeout(cssCheckTimeout);

      // restore previous debug state
      try {
        (window as any).__DND_DEBUG = prev;
      } catch (e) {}
      try {
        document.body.removeAttribute('data-dnd-provider');
      } catch (err) {}
    };
  }, [isEditMode]);

  try {
    return (
      <DndProvider backend={HTML5Backend}>
        <div data-drag-drop-config={JSON.stringify(mergedConfig)}>
          {children}
          {/* Show a small debug helper when in edit mode (no-op for normal users) */}
          {isEditMode ? (
            // Lazy require to avoid server-side import
            React.createElement(require('./DebugMountChecker').DebugMountChecker)
          ) : null}
        </div>
      </DndProvider>
    );
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    // Developer-facing logs
    console.group('DragDropProvider Error');
    console.error(err);
    console.groupEnd();
    // User-facing toast
    toast.error(`DragDropContext failed to mount: ${details}`);

    // Render fallback UI so app isn't blank
    return (
      <div data-dnd-fallback data-drag-drop-config={JSON.stringify(mergedConfig)}>
        {children}
      </div>
    );
  }
}

export default DragDropProvider;