'use client';

import { useState } from 'react';
import { ThemeCustomizer } from '@/components/admin/ThemeCustomizer';
import { toast } from 'sonner';

export const ThemeTab = () => {
  const [themeConfig, setThemeConfig] = useState(null);

  const handlePreview = (config: any) => {
    // Apply theme preview logic here
    console.log('Theme preview:', config);
  };

  const handleSave = async (config: any) => {
    try {
      // Save theme configuration logic here
      console.log('Saving theme:', config);
      toast.success('Theme saved successfully!');
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('Failed to save theme');
    }
  };

  return (
    <div className="h-full bg-white">
      <ThemeCustomizer
        initialConfig={themeConfig}
        onPreview={handlePreview}
        onSave={handleSave}
      />
    </div>
  );
};
