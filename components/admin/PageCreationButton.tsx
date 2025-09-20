'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewPageDialog } from './NewPageDialog';
import { useEditMode } from '@/contexts/editModeContext';

interface PageCreationButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onPageCreated?: (pageId: string) => void;
  children?: React.ReactNode;
}

export function PageCreationButton({ 
  variant = 'default',
  size = 'default',
  className,
  onPageCreated,
  children
}: PageCreationButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { isAdmin } = useEditMode();

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setShowDialog(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        {children || 'Create Page'}
      </Button>
      
      <NewPageDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onPageCreated={onPageCreated}
      />
    </>
  );
}