'use client';

import { Plus, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface QuickActionsProps {
  onScrollToBooking?: () => void;
}

export default function QuickActions({ onScrollToBooking }: QuickActionsProps) {
  const router = useRouter();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Access booking and package management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            onClick={() => {
              if (onScrollToBooking) {
                onScrollToBooking();
              } else {
                // Scroll to booking section
                const bookingSection = document.querySelector('[data-booking-section]');
                if (bookingSection) {
                  bookingSection.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }}
          >
            <Calendar className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Book via Calendar</div>
              <div className="text-xs text-gray-500">Use Google Calendar integration</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            onClick={() => router.push('/packages')}
          >
            <Plus className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Purchase Hours</div>
              <div className="text-xs text-gray-500">Buy more driving lesson hours</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}