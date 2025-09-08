'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface InvitationCodeDisplayProps {
  className?: string;
}

interface ErrorState {
  message: string;
  isInternal: boolean;
  firstOccurrence: number;
}

export default function InvitationCodeDisplay({ className = '' }: InvitationCodeDisplayProps) {
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Smart error handling similar to main service center page
  const handleError = useCallback((errorMessage: string) => {
    const isInternal = errorMessage.toLowerCase().includes('internal server error') || 
                       errorMessage.toLowerCase().includes('500') ||
                       errorMessage.includes('Failed to fetch');
    
    const now = Date.now();
    
    // If it's an internal server error and we've shown it before
    if (isInternal && error?.isInternal) {
      const timeSinceFirst = now - error.firstOccurrence;
      if (timeSinceFirst < 300000) { // 5 minutes
        console.warn('Suppressing repeated internal server error in invitation code:', errorMessage);
        return;
      }
    }
    
    setError({
      message: errorMessage,
      isInternal,
      firstOccurrence: error?.isInternal && isInternal ? error.firstOccurrence : now,
    });
  }, [error]);

  const fetchInvitationCode = useCallback(async (isRetry: boolean = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
      } else {
        setIsRetrying(true);
      }
      setError(null);
      
      // Try new encrypted invitation API first
      let response = await fetch('/api/invitation/generate');
      let data = await response.json();
      
      if (response.ok && data.invitationCode) {
        setInvitationCode(data.invitationCode);
        if (error) {
          setError(null);
        }
      } else {
        // Fallback to profile completion API
        response = await fetch('/api/check-profile-completion');
        data = await response.json();
        
        if (response.ok) {
          setInvitationCode(data.invitationCode || null);
          if (error) {
            setError(null);
          }
        } else {
          handleError(data.error || 'Failed to fetch invitation code');
        }
      }
    } catch (err) {
      const errorMessage = 'Failed to load invitation code';
      handleError(errorMessage);
      console.error('Error fetching invitation code:', err);
    } finally {
      if (!isRetry) {
        setLoading(false);
      } else {
        setIsRetrying(false);
      }
    }
  }, [handleError, error]);

  useEffect(() => {
    fetchInvitationCode();
  }, [fetchInvitationCode]);

  const retryFetch = async () => {
    await fetchInvitationCode(true);
  };

  const copyInvitationCode = async () => {
    if (!invitationCode) return;
    
    try {
      await navigator.clipboard.writeText(invitationCode);
      setCopiedCode(true);
      toast.success('Invitation code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (_error) {
      toast.error('Failed to copy invitation code');
    }
  };

  if (loading) {
    return (
      <Card className={`bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 ${className}`}>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-green-600" />
          <span className="text-green-700">Loading invitation code...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className={`border-red-300 bg-red-50 ${className}`}>
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 flex items-center justify-between">
          <span>{error.message}</span>
          {error.isInternal && (
            <Button
              variant="outline"
              size="sm"
              onClick={retryFetch}
              disabled={isRetrying}
              className="ml-2 h-8"
            >
              {isRetrying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="ml-1 text-xs">Retry</span>
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!invitationCode) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-green-900">
            <Gift className="h-5 w-5 text-green-600" />
            <span>Your Invitation Code</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700 mb-4">
            Share this encrypted code with friends to earn rewards! You'll get a 30% discount after 1 successful referral,
            and 2 free driving hours after 3 successful referrals. Your code is securely encrypted for safety.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-4 py-3 bg-white border border-green-300 rounded-lg font-mono text-lg tracking-wider text-center font-semibold text-green-800">
              {invitationCode}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyInvitationCode}
              className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-100"
            >
              {copiedCode ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}