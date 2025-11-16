'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ConnectionStatus() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok' && data.services.supabase === 'connected') {
          setStatus('ok');
          setMessage('All systems operational');
        } else {
          setStatus('error');
          setMessage('Database connection issue detected');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Unable to check system status');
      });
  }, []);

  if (status === 'loading') {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-900">
          Checking system status...
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'error') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {message}. Some features may not work properly.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-green-50 border-green-200">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-900">
        {message}
      </AlertDescription>
    </Alert>
  );
}
