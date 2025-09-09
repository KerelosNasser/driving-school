'use client';

import { CalendarClock, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import GoogleCalendarIntegration from './GoogleCalendarIntegration';

interface CalendarIntegrationCardProps {
  onSuccess: (bookingData?: any) => void;
  onError: (error: any) => string;
  userQuota?: {
    remaining_hours: number;
  } | null;
  bufferSettings?: any;
  isPending?: boolean;
}

export default function CalendarIntegrationCard({
  onSuccess,
  onError,
  userQuota,
  bufferSettings,
  isPending = false
}: CalendarIntegrationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarClock className="h-5 w-5" />
          <span>Google Calendar Integration</span>
        </CardTitle>
        <CardDescription>
          Sync your lessons with Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Google Calendar to automatically sync your driving lessons.
            This makes it easier to keep track of your schedule.
          </p>
          
          {/* Sync Status */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Synchronized with Packages Page
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSuccess()}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <ArrowRight className="h-3 w-3 mr-1" />
                )}
                Sync Now
              </Button>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Bookings made here will automatically update your quota and sync with the packages page
            </p>
          </div>
          
          <GoogleCalendarIntegration
            onBookingComplete={(bookingData) => {
              onSuccess(bookingData);
            }}
            onError={onError}
            quota={userQuota}
            bufferTimeMinutes={bufferSettings?.defaultMinutes}
          />
        </div>
      </CardContent>
    </Card>
  );
}