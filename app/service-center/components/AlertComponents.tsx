'use client';

import { CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Error alert component
export const ErrorAlert = ({ message }: { message: string | null }) => {
  if (!message) return null;
  
  return (
    <Alert className="border-red-300 bg-red-50">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">{message}</AlertDescription>
    </Alert>
  );
};

// Success message component
export const SuccessAlert = ({ message }: { message: string | null }) => {
  if (!message) return null;
  
  return (
    <Alert className="border-green-300 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">{message}</AlertDescription>
    </Alert>
  );
};