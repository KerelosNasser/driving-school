'use client';

import { useEditMode } from '@/app/layout';
import { Button } from '@/components/ui/button';
import { Edit, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export function EditButton() {
  const { isEditMode, toggleEditMode, isAdmin } = useEditMode();

  if (!isAdmin) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        size="lg"
        className="rounded-full shadow-xl h-14 w-14 p-0 flex items-center justify-center"
        onClick={toggleEditMode}
        variant={isEditMode ? "default" : "outline"}
      >
        {isEditMode ? (
          <Eye className="h-6 w-6" />
        ) : (
          <Edit className="h-6 w-6" />
        )}
      </Button>
    </motion.div>
  );
}