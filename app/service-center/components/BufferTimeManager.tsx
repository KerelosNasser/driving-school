'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Settings, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { format, parseISO, differenceInMinutes } from 'date-fns';

interface BufferTimeSettings {
  enabled: boolean;
  defaultMinutes: number;
  minBufferMinutes: number;
  maxBufferMinutes: number;
  adaptiveBuffer: boolean;
  lessonTypeBuffers: {
    [key: string]: number;
  };
}

interface BookingConflict {
  type: 'overlap' | 'insufficient_buffer' | 'back_to_back';
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

interface BufferTimeManagerProps {
  onSettingsChange?: (settings: BufferTimeSettings) => void;
  existingBookings?: Array<{
    start: string;
    end: string;
    type?: string;
  }>;
  proposedBooking?: {
    start: string;
    end: string;
    type?: string;
  };
  className?: string;
}

const DEFAULT_SETTINGS: BufferTimeSettings = {
  enabled: true,
  defaultMinutes: 30,
  minBufferMinutes: 15,
  maxBufferMinutes: 60,
  adaptiveBuffer: true,
  lessonTypeBuffers: {
    'standard': 30,
    'intensive': 45,
    'test_preparation': 60,
    'highway_driving': 45,
    'parking_practice': 20
  }
};

export default function BufferTimeManager({
  onSettingsChange,
  existingBookings = [],
  proposedBooking,
  className = ''
}: BufferTimeManagerProps) {
  const [settings, setSettings] = useState<BufferTimeSettings>(DEFAULT_SETTINGS);
  const [conflicts, setConflicts] = useState<BookingConflict[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('bufferTimeSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Error loading buffer time settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage and notify parent
  useEffect(() => {
    localStorage.setItem('bufferTimeSettings', JSON.stringify(settings));
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [settings, onSettingsChange]);

  // Check for conflicts when bookings or settings change
  useEffect(() => {
    if (proposedBooking && settings.enabled) {
      checkBookingConflicts();
    } else {
      setConflicts([]);
    }
  }, [proposedBooking, existingBookings, settings]);

  const checkBookingConflicts = () => {
    if (!proposedBooking) return;

    const newConflicts: BookingConflict[] = [];
    const proposedStart = parseISO(proposedBooking.start);
    const proposedEnd = parseISO(proposedBooking.end);
    const bufferMinutes = getBufferMinutes(proposedBooking.type);

    existingBookings.forEach((booking) => {
      const existingStart = parseISO(booking.start);
      const existingEnd = parseISO(booking.end);

      // Check for direct overlap
      if (
        (proposedStart >= existingStart && proposedStart < existingEnd) ||
        (proposedEnd > existingStart && proposedEnd <= existingEnd) ||
        (proposedStart <= existingStart && proposedEnd >= existingEnd)
      ) {
        newConflicts.push({
          type: 'overlap',
          message: `Booking overlaps with existing lesson from ${format(existingStart, 'HH:mm')} to ${format(existingEnd, 'HH:mm')}`,
          severity: 'high',
          suggestion: 'Choose a different time slot'
        });
      }

      // Check buffer time before existing booking
      const minutesBeforeExisting = differenceInMinutes(existingStart, proposedEnd);
      if (minutesBeforeExisting > 0 && minutesBeforeExisting < bufferMinutes) {
        newConflicts.push({
          type: 'insufficient_buffer',
          message: `Only ${minutesBeforeExisting} minutes before next lesson (${bufferMinutes} minutes recommended)`,
          severity: 'medium',
          suggestion: `Consider ending lesson ${bufferMinutes - minutesBeforeExisting} minutes earlier`
        });
      }

      // Check buffer time after existing booking
      const minutesAfterExisting = differenceInMinutes(proposedStart, existingEnd);
      if (minutesAfterExisting > 0 && minutesAfterExisting < bufferMinutes) {
        newConflicts.push({
          type: 'insufficient_buffer',
          message: `Only ${minutesAfterExisting} minutes after previous lesson (${bufferMinutes} minutes recommended)`,
          severity: 'medium',
          suggestion: `Consider starting lesson ${bufferMinutes - minutesAfterExisting} minutes later`
        });
      }

      // Check for back-to-back bookings
      if (minutesBeforeExisting === 0 || minutesAfterExisting === 0) {
        newConflicts.push({
          type: 'back_to_back',
          message: 'Back-to-back lessons detected',
          severity: 'low',
          suggestion: 'Consider adding buffer time for better lesson quality'
        });
      }
    });

    setConflicts(newConflicts);
  };

  const getBufferMinutes = (lessonType?: string): number => {
    if (!settings.enabled) return 0;
    
    if (settings.adaptiveBuffer && lessonType && settings.lessonTypeBuffers[lessonType]) {
      return settings.lessonTypeBuffers[lessonType];
    }
    
    return settings.defaultMinutes;
  };

  const updateSettings = (updates: Partial<BufferTimeSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updateLessonTypeBuffer = (lessonType: string, minutes: number) => {
    setSettings(prev => ({
      ...prev,
      lessonTypeBuffers: {
        ...prev.lessonTypeBuffers,
        [lessonType]: minutes
      }
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-blue-300 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Info className="h-4 w-4 text-blue-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Buffer Time Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Buffer Time Management</span>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
            />
          </CardTitle>
          <CardDescription>
            Automatically manage rest periods between lessons for optimal learning experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.enabled && (
            <>
              {/* Default Buffer Time */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Default Buffer Time: {settings.defaultMinutes} minutes
                </Label>
                <Slider
                  value={[settings.defaultMinutes]}
                  onValueChange={([value]) => updateSettings({ defaultMinutes: value })}
                  min={settings.minBufferMinutes}
                  max={settings.maxBufferMinutes}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{settings.minBufferMinutes} min</span>
                  <span>{settings.maxBufferMinutes} min</span>
                </div>
              </div>

              {/* Adaptive Buffer */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Adaptive Buffer Times</Label>
                  <p className="text-xs text-gray-600">Adjust buffer time based on lesson type</p>
                </div>
                <Switch
                  checked={settings.adaptiveBuffer}
                  onCheckedChange={(adaptiveBuffer) => updateSettings({ adaptiveBuffer })}
                />
              </div>

              {/* Advanced Settings */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                </Button>
              </div>

              {/* Lesson Type Specific Buffers */}
              {showAdvanced && settings.adaptiveBuffer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 p-4 bg-gray-50 rounded-lg"
                >
                  <h4 className="font-medium text-sm">Lesson Type Buffer Times</h4>
                  {Object.entries(settings.lessonTypeBuffers).map(([type, minutes]) => (
                    <div key={type} className="flex items-center justify-between">
                      <Label className="text-sm capitalize">
                        {type.replace('_', ' ')}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={minutes.toString()}
                          onValueChange={(value) => updateLessonTypeBuffer(type, parseInt(value))}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 9 }, (_, i) => (i + 1) * 15).map((mins) => (
                              <SelectItem key={mins} value={mins.toString()}>
                                {mins}m
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Conflict Detection */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>Booking Conflicts Detected</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conflicts.map((conflict, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Alert className={getSeverityColor(conflict.severity)}>
                    {getSeverityIcon(conflict.severity)}
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">{conflict.message}</p>
                        {conflict.suggestion && (
                          <p className="text-sm opacity-80">
                            💡 {conflict.suggestion}
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buffer Time Status */}
      {settings.enabled && proposedBooking && conflicts.length === 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Buffer Time Optimized</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              {getBufferMinutes(proposedBooking.type)} minutes buffer time will be automatically applied
            </p>
          </CardContent>
        </Card>
      )}

      {/* Buffer Time Benefits */}
      {!settings.enabled && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Why Use Buffer Times?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Allows time for lesson reflection and feedback</li>
                  <li>• Prevents instructor fatigue for better teaching quality</li>
                  <li>• Provides flexibility for lessons that run slightly over</li>
                  <li>• Reduces stress and improves overall learning experience</li>
                  <li>• Ensures adequate preparation time between different lesson types</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export utility functions for use in other components
export const calculateBufferTime = (lessonType?: string, settings?: BufferTimeSettings): number => {
  if (!settings?.enabled) return 0;
  
  if (settings.adaptiveBuffer && lessonType && settings.lessonTypeBuffers[lessonType]) {
    return settings.lessonTypeBuffers[lessonType];
  }
  
  return settings.defaultMinutes || 30;
};

export const validateBookingTime = (
  proposedStart: Date,
  proposedEnd: Date,
  existingBookings: Array<{ start: string; end: string }>,
  bufferMinutes: number
): { valid: boolean; conflicts: string[] } => {
  const conflicts: string[] = [];
  
  existingBookings.forEach((booking) => {
    const existingStart = parseISO(booking.start);
    const existingEnd = parseISO(booking.end);
    
    // Check for overlap
    if (
      (proposedStart >= existingStart && proposedStart < existingEnd) ||
      (proposedEnd > existingStart && proposedEnd <= existingEnd) ||
      (proposedStart <= existingStart && proposedEnd >= existingEnd)
    ) {
      conflicts.push('Booking time overlaps with existing lesson');
    }
    
    // Check buffer time
    const minutesBefore = differenceInMinutes(existingStart, proposedEnd);
    const minutesAfter = differenceInMinutes(proposedStart, existingEnd);
    
    if (minutesBefore > 0 && minutesBefore < bufferMinutes) {
      conflicts.push(`Insufficient buffer time before existing lesson (${minutesBefore}/${bufferMinutes} minutes)`);
    }
    
    if (minutesAfter > 0 && minutesAfter < bufferMinutes) {
      conflicts.push(`Insufficient buffer time after existing lesson (${minutesAfter}/${bufferMinutes} minutes)`);
    }
  });
  
  return {
    valid: conflicts.length === 0,
    conflicts
  };
};