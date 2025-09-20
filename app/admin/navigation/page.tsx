'use client';

import { NavigationEditor } from '@/components/navigation/NavigationEditor';
import { Toaster } from 'sonner';

export default function NavigationAdminPage() {
  return (
    <div className="container mx-auto py-10">
      <Toaster />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Navigation Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your site's navigation structure with real-time collaborative editing.
        </p>
      </div>
      
      <NavigationEditor />
    </div>
  );
}