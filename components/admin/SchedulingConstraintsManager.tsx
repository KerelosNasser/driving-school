'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Calendar, 
  Users, 
  Settings, 
  Save, 
  RotateCcw, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { 
  SchedulingConstraints, 
  DEFAULT_CONSTRAINTS, 
  schedulingValidator,
  formatDuration 
} from '@/lib/calendar/scheduling-constraints';

interface ConstraintsManagerProps {
  onSave?: (constraints: SchedulingConstraints) => void;
  initialConstraints?: SchedulingConstraints;
}

export default function SchedulingConstraintsManager({ 
  onSave, 
  initialConstraints = DEFAULT_CONSTRAINTS 
}: ConstraintsManagerProps) {
  const [constraints, setConstraints] = useState<SchedulingConstraints>(initialConstraints);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const isChanged = JSON.stringify(constraints) !== JSON.stringify(initialConstraints);
    setHasChanges(isChanged);
  }, [constraints, initialConstraints]);

  const updateConstraint = <K extends keyof SchedulingConstraints>(
    key: K, 
    value: SchedulingConstraints[K]
  ) => {
    setConstraints(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      // Update the validator with new constraints
      schedulingValidator.updateConstraints(constraints);
      
      // Call the onSave callback if provided
      if (onSave) {
        await onSave(constraints);
      }
      
      setSaveStatus('success');
      setHasChanges(false);
      
      // Reset success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save constraints:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConstraints(DEFAULT_CONSTRAINTS);
    setSaveStatus('idle');
  };

  const addAllowedDuration = () => {
    const newDuration = 60; // Default 1 hour
    if (!constraints.allowedDurations.includes(newDuration)) {
      updateConstraint('allowedDurations', [...constraints.allowedDurations, newDuration].sort((a, b) => a - b));
    }
  };

  const removeAllowedDuration = (duration: number) => {
    updateConstraint('allowedDurations', constraints.allowedDurations.filter(d => d !== duration));
  };

  const updateAllowedDuration = (oldDuration: number, newDuration: number) => {
    const durations = constraints.allowedDurations.map(d => d === oldDuration ? newDuration : d);
    updateConstraint('allowedDurations', durations.sort((a, b) => a - b));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Scheduling Constraints</h2>
          <p className="text-muted-foreground">
            Configure booking limits, time constraints, and scheduling rules
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {saveStatus === 'success' && (
            <Alert className="w-auto border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Constraints saved successfully
              </AlertDescription>
            </Alert>
          )}
          
          {saveStatus === 'error' && (
            <Alert className="w-auto border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Failed to save constraints
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your configuration.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="limits" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="limits">
            <Users className="h-4 w-4 mr-2" />
            Booking Limits
          </TabsTrigger>
          <TabsTrigger value="time">
            <Clock className="h-4 w-4 mr-2" />
            Time Constraints
          </TabsTrigger>
          <TabsTrigger value="duration">
            <Calendar className="h-4 w-4 mr-2" />
            Lesson Duration
          </TabsTrigger>
          <TabsTrigger value="instructor">
            <Settings className="h-4 w-4 mr-2" />
            Instructor Rules
          </TabsTrigger>
        </TabsList>

        {/* Booking Limits Tab */}
        <TabsContent value="limits" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Limits</CardTitle>
                <CardDescription>
                  Maximum bookings and hours per student per week
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxHoursPerWeek">Maximum Hours per Week</Label>
                  <Input
                    id="maxHoursPerWeek"
                    type="number"
                    min="1"
                    max="40"
                    value={constraints.maxHoursPerWeek}
                    onChange={(e) => updateConstraint('maxHoursPerWeek', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLessonsPerWeek">Maximum Lessons per Week</Label>
                  <Input
                    id="maxLessonsPerWeek"
                    type="number"
                    min="1"
                    max="20"
                    value={constraints.maxLessonsPerWeek}
                    onChange={(e) => updateConstraint('maxLessonsPerWeek', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxConsecutiveLessons">Maximum Consecutive Lessons</Label>
                  <Input
                    id="maxConsecutiveLessons"
                    type="number"
                    min="1"
                    max="5"
                    value={constraints.maxConsecutiveLessons}
                    onChange={(e) => updateConstraint('maxConsecutiveLessons', parseInt(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Limits</CardTitle>
                <CardDescription>
                  Maximum bookings and hours per student per day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxHoursPerDay">Maximum Hours per Day</Label>
                  <Input
                    id="maxHoursPerDay"
                    type="number"
                    min="1"
                    max="12"
                    value={constraints.maxHoursPerDay}
                    onChange={(e) => updateConstraint('maxHoursPerDay', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLessonsPerDay">Maximum Lessons per Day</Label>
                  <Input
                    id="maxLessonsPerDay"
                    type="number"
                    min="1"
                    max="10"
                    value={constraints.maxLessonsPerDay}
                    onChange={(e) => updateConstraint('maxLessonsPerDay', parseInt(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking Advance Constraints</CardTitle>
              <CardDescription>
                How far in advance students can book lessons
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxAdvanceBookingDays">Maximum Advance Booking (Days)</Label>
                <Input
                  id="maxAdvanceBookingDays"
                  type="number"
                  min="1"
                  max="90"
                  value={constraints.maxAdvanceBookingDays}
                  onChange={(e) => updateConstraint('maxAdvanceBookingDays', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minAdvanceBookingHours">Minimum Advance Booking (Hours)</Label>
                <Input
                  id="minAdvanceBookingHours"
                  type="number"
                  min="1"
                  max="168"
                  value={constraints.minAdvanceBookingHours}
                  onChange={(e) => updateConstraint('minAdvanceBookingHours', parseInt(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Constraints Tab */}
        <TabsContent value="time" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Operating Hours</CardTitle>
                <CardDescription>
                  Define when lessons can be scheduled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="earliestStartTime">Earliest Start Time</Label>
                  <Input
                    id="earliestStartTime"
                    type="time"
                    value={constraints.earliestStartTime}
                    onChange={(e) => updateConstraint('earliestStartTime', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="latestEndTime">Latest End Time</Label>
                  <Input
                    id="latestEndTime"
                    type="time"
                    value={constraints.latestEndTime}
                    onChange={(e) => updateConstraint('latestEndTime', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Buffer Time</CardTitle>
                <CardDescription>
                  Time required between consecutive lessons
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="minBufferBetweenLessons">
                    Minimum Buffer Time (Minutes)
                  </Label>
                  <Input
                    id="minBufferBetweenLessons"
                    type="number"
                    min="0"
                    max="120"
                    value={constraints.minBufferBetweenLessons}
                    onChange={(e) => updateConstraint('minBufferBetweenLessons', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxBufferBetweenLessons">
                    Maximum Buffer Time (Minutes)
                  </Label>
                  <Input
                    id="maxBufferBetweenLessons"
                    type="number"
                    min="0"
                    max="240"
                    value={constraints.maxBufferBetweenLessons}
                    onChange={(e) => updateConstraint('maxBufferBetweenLessons', parseInt(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lesson Duration Tab */}
        <TabsContent value="duration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Duration Constraints</CardTitle>
              <CardDescription>
                Define minimum and maximum lesson durations
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minLessonDuration">Minimum Lesson Duration (Minutes)</Label>
                <Input
                  id="minLessonDuration"
                  type="number"
                  min="30"
                  max="240"
                  step="15"
                  value={constraints.minLessonDuration}
                  onChange={(e) => updateConstraint('minLessonDuration', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxLessonDuration">Maximum Lesson Duration (Minutes)</Label>
                <Input
                  id="maxLessonDuration"
                  type="number"
                  min="60"
                  max="480"
                  step="15"
                  value={constraints.maxLessonDuration}
                  onChange={(e) => updateConstraint('maxLessonDuration', parseInt(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allowed Durations</CardTitle>
              <CardDescription>
                Specific lesson durations that students can book
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {constraints.allowedDurations.map((duration, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {formatDuration(duration)}
                    </Badge>
                    <Input
                      type="number"
                      min="30"
                      max="480"
                      step="15"
                      value={duration}
                      onChange={(e) => updateAllowedDuration(duration, parseInt(e.target.value) || 60)}
                      className="w-20 h-8"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAllowedDuration(duration)}
                      className="h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" onClick={addAllowedDuration}>
                Add Duration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instructor Rules Tab */}
        <TabsContent value="instructor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Instructor Constraints</CardTitle>
              <CardDescription>
                Rules for instructor scheduling and breaks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxInstructorHoursPerDay">
                    Maximum Instructor Hours per Day
                  </Label>
                  <Input
                    id="maxInstructorHoursPerDay"
                    type="number"
                    min="4"
                    max="12"
                    value={constraints.maxInstructorHoursPerDay}
                    onChange={(e) => updateConstraint('maxInstructorHoursPerDay', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="requiredBreakAfterHours">
                    Required Break After (Hours)
                  </Label>
                  <Input
                    id="requiredBreakAfterHours"
                    type="number"
                    min="2"
                    max="8"
                    value={constraints.requiredBreakAfterHours}
                    onChange={(e) => updateConstraint('requiredBreakAfterHours', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minBreakDuration">
                    Minimum Break Duration (Minutes)
                  </Label>
                  <Input
                    id="minBreakDuration"
                    type="number"
                    min="15"
                    max="120"
                    value={constraints.minBreakDuration}
                    onChange={(e) => updateConstraint('minBreakDuration', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}