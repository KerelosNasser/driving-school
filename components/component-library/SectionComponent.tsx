
'use client';

import React from 'react';
import { InPlaceDropZones } from '@/components/drag-drop/InPlaceDropZones';
import { ComponentRenderContext } from '@/lib/components/types';

interface SectionComponentProps extends ComponentRenderContext {
  children?: React.ReactNode;
}

export function SectionComponent({ children, pageId }: SectionComponentProps) {
  return (
    <div className="p-4 border border-dashed border-gray-300 my-4">
      {children}
    </div>
  );
}
