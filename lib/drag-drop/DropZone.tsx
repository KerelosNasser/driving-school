'use client';

import { useDroppable } from '@dnd-kit/core';

export function DropZone({ id, data, children }) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data,
  });

  const style = {
    border: isOver ? '2px dashed #3b82f6' : '2px dashed #d1d5db',
    backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}

export default DropZone;