'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Save, 
  Settings,
  Sun,
  Moon,
  Coffee,
  Sunset,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarSettings {
  id?: string;
  buffer_time_minutes: number;
  monday_start: string;
  monday_end: string;
  monday_enabled: boolean;
  tuesday_start: string;
  tuesday_end: string;
  tuesday_enabled: boolean;
  wednesday_start: string;
  wednesday_end: string;
  wednesday_enabled: boolean;
  thursday_start: string;
  thursday_end: string;
  thursday_enabled: boolean;
  friday_start: string;
  friday_end: string;
  friday_enabled: boolean;
  saturday_start: string;
  saturday_end: string;
  saturday_enabled: boolean;
  sunday_start: string;
  sunday_end: string;
  sunday_enabled: boolean;
}

interface VacationDay {
  id?: string;
  date: string;
  reason: string;
  created_at?: string;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday', icon: Sun },
  { key: 'tuesday', label: 'Tuesday', icon: Sun },
  { key: 'wednesday', label: 'Wednesday', icon: Sun },
  { key: 'thursday', label: 'Thursday', icon: Sun },
  { key: 'friday', label: 'Friday', icon: Sun },
  { key: 'saturday', label: 'Saturday', icon: Sunset },
  { key: 'sunday', label: 'Sunday', icon: Moon },
];

const DEFAULT_SETTINGS: CalendarSettings = {
  buffer_time_minutes: 15,
  monday_start: '09:00',
  monday_end: '17:00',
  monday_enabled: true,
  tuesday_start: '09:00',
  tuesday_end: '17:00',
  tuesday_enabled: true,
  wednesday_start: '09:00',
  wednesday_end: '17:00',
  wednesday_enabled: true,
  thursday_start: '09:00',
  thursday_end: '17:00',
  thursday_enabled: true,
  friday_start: '09:00',
  friday_end: '17:00',
  friday_enabled: true,
  saturday_start: '10:00',
  saturday_end: '16:00',
  saturday_enabled: false,
  sunday_start: '10:00',
  sunday_end: '16:00',
  sunday_enabled: false,
};

export function CalendarSettingsTab() {
  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_SETTINGS);
  const [vacationDays, setVacationDays] = useState<VacationDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [newVacationReason, setNewVacationReason] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  // Load settings and vacation days on component mount
  useEffect(() => {
    loadSettings();
    loadVacationDays();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading calendar settings:', error);
      toast.error('Failed to load calendar settings');
    } finally {
      setLoading(false);
    }
  };

  const loadVacationDays = async () => {
    try {
      const { data, error } = await supabase
        .from('vacation_days')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      setVacationDays(data || []);
    } catch (error) {
      console.error('Error loading vacation days:', error);
      toast.error('Failed to load vacation days');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('calendar_settings')
        .upsert(settings, { onConflict: 'id' });

      if (error) throw error;

      toast.success('Calendar settings saved successfully!');
    } catch (error) {
      console.error('Error saving calendar settings:', error);
      toast.error('Failed to save calendar settings');
    } finally {
      setSaving(false);
    }
  };

  const addVacationDay = async () => {
    if (!selectedDate || !newVacationReason.trim()) {
      toast.error('Please select a date and provide a reason');
      return;
    }

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    // Check if date already exists
    if (vacationDays.some(day => day.date === dateString)) {
      toast.error('This date is already marked as a vacation day');
      return;
    }

    try {
      const newVacationDay = {
        date: dateString,
        reason: newVacationReason.trim(),
      };

      const { data, error } = await supabase
        .from('vacation_days')
        .insert([newVacationDay])
        .select()
        .single();

      if (error) throw error;

      setVacationDays([...vacationDays, data]);
      setSelectedDate(undefined);
      setNewVacationReason('');
      setShowCalendar(false);
      toast.success('Vacation day added successfully!');
    } catch (error) {
      console.error('Error adding vacation day:', error);
      toast.error('Failed to add vacation day');
    }
  };

  const removeVacationDay = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vacation_days')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVacationDays(vacationDays.filter(day => day.id !== id));
      toast.success('Vacation day removed successfully!');
    } catch (error) {
      console.error('Error removing vacation day:', error);
      toast.error('Failed to remove vacation day');
    }
  };

  const updateDaySettings = (day: string, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [`${day}_${field}`]: value
    }));
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar Settings</h1>
            <p className="text-gray-600">Configure buffer time, working hours, and vacation days</p>
          </div>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Buffer Time Settings */}
        <Card className="shadow-lg border-emerald-100">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              <span>Buffer Time</span>
            </CardTitle>
            <CardDescription>
              Time between appointments to prepare and travel
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="buffer-time">Buffer Time (minutes)</Label>
                <Input
                  id="buffer-time"
                  type="number"
                  min="0"
                  max="120"
                  value={settings.buffer_time_minutes}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    buffer_time_minutes: parseInt(e.target.value) || 0
                  }))}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Recommended: 15-30 minutes between lessons
                </p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">
                    Current buffer time: {settings.buffer_time_minutes} minutes
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vacation Days */}
        <Card className="shadow-lg border-emerald-100">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-emerald-600" />
              <span>Vacation Days</span>
            </CardTitle>
            <CardDescription>
              Manage days when you're not available for lessons
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => 
                        date < new Date() || 
                        vacationDays.some(vd => isSameDay(new Date(vd.date), date))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <Input
                placeholder="Reason for vacation (e.g., Holiday, Personal)"
                value={newVacationReason}
                onChange={(e) => setNewVacationReason(e.target.value)}
              />
              
              <Button 
                onClick={addVacationDay}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                disabled={!selectedDate || !newVacationReason.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vacation Day
              </Button>

              {vacationDays.length > 0 && (
                <div className="space-y-2">
                  <Label>Scheduled Vacation Days</Label>
                  <ScrollArea className="h-32 w-full border rounded-md p-2">
                    {vacationDays.map((day) => (
                      <div key={day.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{format(new Date(day.date), 'PPP')}</div>
                          <div className="text-sm text-gray-500">{day.reason}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVacationDay(day.id!)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Working Hours */}
      <Card className="shadow-lg border-emerald-100">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Coffee className="h-5 w-5 text-emerald-600" />
            <span>Working Hours</span>
          </CardTitle>
          <CardDescription>
            Set your availability for each day of the week
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {DAYS_OF_WEEK.map((day) => {
              const DayIcon = day.icon;
              const isEnabled = settings[`${day.key}_enabled` as keyof CalendarSettings] as boolean;
              const startTime = settings[`${day.key}_start` as keyof CalendarSettings] as string;
              const endTime = settings[`${day.key}_end` as keyof CalendarSettings] as string;

              return (
                <div key={day.key} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3 w-32">
                    <DayIcon className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium">{day.label}</span>
                  </div>
                  
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => updateDaySettings(day.key, 'enabled', checked)}
                  />

                  {isEnabled ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <Select
                        value={startTime}
                        onValueChange={(value) => updateDaySettings(day.key, 'start', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <span className="text-gray-500">to</span>
                      
                      <Select
                        value={endTime}
                        onValueChange={(value) => updateDaySettings(day.key, 'end', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <Badge variant="secondary" className="text-gray-500">
                        Closed
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          size="lg"
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg px-8"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving Settings...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}