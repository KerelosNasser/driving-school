'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface InvitationCodeDisplayProps {
  className?: string;
}

export default function InvitationCodeDisplay({ className = '' }: InvitationCodeDisplayProps) {
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const fetchInvitationCode = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/check-profile-completion');
        const data = await response.json();
        
        if (response.ok) {
          setInvitationCode(data.invitationCode || null);
        } else {
          setError(data.error || 'Failed to fetch invitation code');
        }
      } catch (err) {
        setError('Failed to load invitation code');
        console.error('Error fetching invitation code:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitationCode();
  }, []);

  const copyInvitationCode = async () => {
    if (!invitationCode) return;
    
    try {
      await navigator.clipboard.writeText(invitationCode);
      setCopiedCode(true);
      toast.success('Invitation code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      toast.error('Failed to copy invitation code'+ error);
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
        <AlertDescription className="text-red-800">{error}</AlertDescription>
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
            Share this code with friends to earn rewards! You'll get a 30% discount after 1 successful referral,
            and 2 free driving hours after 3 successful referrals.
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