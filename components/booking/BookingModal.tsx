'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Clock, MapPin, User, Calendar } from 'lucide-react';

interface TimeSlot {
  time: string;
  available: boolean;
  duration: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  availableSlots: TimeSlot[];
  onBookingComplete: () => void;
}

export function BookingModal({ 
  isOpen, 
  onClose, 
  selectedDate, 
  availableSlots, 
  onBookingComplete 
}: BookingModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [duration, setDuration] = useState<string>('60');
  const [title, setTitle] = useState('Driving Lesson');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot) {
      toast.error('Please select a date and time slot');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/calendar/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedSlot,
          duration: parseInt(duration),
          title,
          description,
          location,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Booking created successfully!');
        onBookingComplete();
        onClose();
        resetForm();
      } else {
        toast.error(result.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedSlot('');
    setDuration('60');
    setTitle('Driving Lesson');
    setDescription('');
    setLocation('');
  };

  const availableSlotOptions = availableSlots.filter(slot => slot.available);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book a Lesson
          </DialogTitle>
          <DialogDescription>
            {selectedDate && (
              <>Schedule your driving lesson for {format(selectedDate, 'EEEE, MMMM d, yyyy')}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time Slot Selection */}
          <div className="space-y-2">
            <Label htmlFor="timeSlot" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Available Time Slots
            </Label>
            <Select value={selectedSlot} onValueChange={setSelectedSlot}>
              <SelectTrigger>
                <SelectValue placeholder="Select a time slot" />
              </SelectTrigger>
              <SelectContent>
                {availableSlotOptions.length > 0 ? (
                  availableSlotOptions.map((slot) => (
                    <SelectItem key={slot.time} value={slot.time}>
                      {slot.time} ({slot.duration} min available)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No available slots for this date
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Duration Selection */}
          <div className="space-y-2">
            <Label htmlFor="duration">Lesson Duration (minutes)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lesson Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Lesson Type
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Driving Lesson, Road Test Practice"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Meeting Location (Optional)
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., School parking lot, Your address"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Notes (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any specific requirements or notes for the lesson"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleBooking} 
            disabled={isLoading || !selectedSlot || availableSlotOptions.length === 0}
          >
            {isLoading ? 'Booking...' : 'Book Lesson'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}