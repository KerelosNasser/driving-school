'use client';

import { DndContext } from '@dnd-kit/core';

export function DragDropProvider({ children }: { children: React.ReactNode }) {
  return <DndContext>{children}</DndContext>;
}

export default DragDropProvider;