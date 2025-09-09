'use client';

import { Calendar, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface QuickActionsProps {
  onToggleBookingForm: () => void;
  showBookingForm: boolean;
}

export default function QuickActions({ onToggleBookingForm, showBookingForm }: QuickActionsProps) {
  const router = useRouter();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Book a lesson or purchase more hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            onClick={onToggleBookingForm}
          >
            <Calendar className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Book a Lesson</div>
              <div className="text-xs text-gray-500">Schedule your next driving lesson</div>
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