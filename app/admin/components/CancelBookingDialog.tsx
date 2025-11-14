'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CancelBookingDialogProps {
  bookingId: string;
  studentName: string;
  date: string;
  time: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CancelBookingDialog({
  bookingId,
  studentName,
  date,
  time,
  open,
  onOpenChange,
  onSuccess
}: CancelBookingDialogProps) {
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    if (cancellationReason.trim().length < 10) {
      toast.error('Please provide a detailed reason (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: cancellationReason.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      toast.success(`Booking cancelled successfully. ${data.hoursRefunded} hours refunded to student.`);
      onOpenChange(false);
      setCancellationReason('');
      onSuccess();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel booking';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            This action will cancel the booking and refund the hours to the student's account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Booking Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Student:</span>
              <span className="font-medium">{studentName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{new Date(date).toLocaleDateString('en-AU')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Time:</span>
              <span className="font-medium">{time}</span>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Cancellation Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for cancellation (minimum 10 characters)..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              This reason will be sent to the student via email.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>The student will be notified via email</li>
                <li>Hours will be automatically refunded</li>
                <li>Calendar event will be removed</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isSubmitting || cancellationReason.trim().length < 10}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Booking'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
