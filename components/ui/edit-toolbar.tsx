'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Plus, X } from 'lucide-react';
import { useEditMode } from '@/app/layout';

interface EditToolbarProps {
  onSave: () => void;
  onAdd?: () => void;
  onCancel: () => void;
}

export function EditToolbar({ onSave, onAdd, onCancel }: EditToolbarProps) {
  const { isEditMode } = useEditMode();

  if (!isEditMode) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200">
        {onAdd && (
          <Button size="icon" className="rounded-full bg-blue-500 hover:bg-blue-600 text-white" onClick={onAdd}>
            <Plus className="h-5 w-5" />
          </Button>
        )}
        <Button size="icon" className="rounded-full bg-green-500 hover:bg-green-600 text-white" onClick={onSave}>
          <Check className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="destructive" className="rounded-full" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
}
