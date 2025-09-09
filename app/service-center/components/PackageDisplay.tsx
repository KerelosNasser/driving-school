'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Package } from '@/lib/supabase';

interface PackageDisplayProps {
  onSuccess: (message: string) => void;
  onError: (error: Error) => void;
  onQuotaUpdate: () => void;
}

// Loading skeleton for packages
const PackagesSkeleton = () => (
  <div className="space-y-4">
    {[1, 2].map((i) => (
      <div key={i} className="p-4 border rounded-lg space-y-3">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3 mt-4"></div>
      </div>
    ))}
  </div>
);

// Package card component
const PackageCard = ({ pkg, onPurchase, isPurchasing, purchasingId }: {
  pkg: Package;
  onPurchase: (packageId: string) => void;
  isPurchasing: boolean;
  purchasingId: string | null;
}) => (
  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-semibold">{pkg.name}</h4>
      <Badge variant="outline">{pkg.hours} hours</Badge>
    </div>
    <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
    <div className="flex justify-between items-center">
      <span className="text-lg font-bold text-blue-600">
        ${pkg.price}
      </span>
      <Button 
        size="sm" 
        onClick={() => onPurchase(pkg.id)}
        disabled={isPurchasing}
      >
        {isPurchasing && purchasingId === pkg.id ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Purchase
            <ArrowRight className="h-4 w-4 ml-1" />
          </>
        )}
      </Button>
    </div>
  </div>
);

export default function PackageDisplay({ onSuccess, onError, onQuotaUpdate }: PackageDisplayProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [packagesError, setPackagesError] = useState<boolean>(false);
  
  // Use React Query for packages data fetching
  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('packages')
          .select('*')
          .order('price', { ascending: true });
        
        if (error) {
          throw new Error(error.message);
        }
        
        return data as Package[];
      } catch (error) {
        console.error('Error in packages fetch:', error);
        setPackagesError(true);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use React Query mutation for package purchase
  const purchasePackageMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const response = await fetch('/api/packages/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase package');
      }

      return data;
    },
    onSuccess: (data) => {
      onSuccess(`Package purchased successfully! ${data.hours_added} hours have been added to your quota.`);
      onQuotaUpdate();
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error: Error) => {
      onError(error);
    },
  });

  // Handle package purchase
  const handlePurchasePackage = (packageId: string) => {
    purchasePackageMutation.mutate(packageId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Purchase More Hours</span>
        </CardTitle>
        <CardDescription>
          Buy lesson packages to add hours to your quota
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {packagesLoading ? (
            <PackagesSkeleton />
          ) : packages.length > 0 ? (
            packages.slice(0, 2).map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onPurchase={handlePurchasePackage}
                isPurchasing={purchasePackageMutation.isPending}
                purchasingId={purchasePackageMutation.variables as string}
              />
            ))
          ) : (
            <div className="text-center py-4">
              {packagesError ? (
                <p className="text-sm text-red-500">Failed to load packages</p>
              ) : (
                <p className="text-sm text-gray-500">No packages available</p>
              )}
            </div>
          )}
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => router.push('/packages')}
          >
            View All Packages
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}