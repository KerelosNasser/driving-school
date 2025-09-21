'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';

interface UserQuota {
  total_hours: number;
  used_hours: number;
  remaining_hours: number;
}

export function QuotaIndicator() {
  const { user, isLoaded } = useUser();
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchQuota();
    } else if (isLoaded && !user) {
      setLoading(false);
    }
  }, [user, isLoaded]);

  const fetchQuota = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/quota');
      const data = await response.json();
      
      if (response.ok) {
        setQuota(data.quota);
      } else {
        setError(data.error || 'Failed to fetch quota');
      }
    } catch (err) {
      console.error('Error fetching quota:', err);
      setError('Failed to load quota');
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything if user is not logged in
  if (!isLoaded || !user) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-emerald-200">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2 text-red-400 cursor-pointer">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Quota Error</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{error}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show quota information
  if (quota) {
    const isLowQuota = quota.remaining_hours <= 2;
    const hasNoQuota = quota.remaining_hours <= 0;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/service-center" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Clock className={`h-4 w-4 ${
                hasNoQuota ? 'text-red-400' : isLowQuota ? 'text-yellow-400' : 'text-green-400'
              }`} />
              <Button 
                variant="ghost"
                size="sm"
                className={`text-xs px-2 py-1 h-auto ${
                  hasNoQuota 
                    ? 'bg-red-900/30 text-red-300 hover:bg-red-800/40' 
                    : isLowQuota 
                    ? 'bg-yellow-900/30 text-yellow-300 hover:bg-yellow-800/40'
                    : 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-800/40'
                }`}
              >
                {quota.remaining_hours}h left
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p><strong>Total:</strong> {quota.total_hours} hours</p>
              <p><strong>Used:</strong> {quota.used_hours} hours</p>
              <p><strong>Remaining:</strong> {quota.remaining_hours} hours</p>
              <p className="text-xs text-emerald-200/80 mt-1">Click to manage quota</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show "Get Started" button if no quota exists
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="outline" size="sm" className="bg-white/10 border-emerald-500/30 text-emerald-100 hover:bg-white/20 hover:text-white">
            <Link href="/packages" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Get Hours</span>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Purchase lesson hours to get started</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}