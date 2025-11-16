'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function TestCalendarSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/calendar/settings');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setSettings(data);
      console.log('📊 Calendar Settings:', data);
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Calendar Settings Test Page</h1>
        <p className="text-gray-600">
          This page shows the calendar settings as they are returned from the API.
          Use this to verify that settings are being read correctly.
        </p>
      </div>

      <div className="mb-4">
        <Button onClick={fetchSettings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Settings
        </Button>
      </div>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-700">
              <XCircle className="h-5 w-5 mr-2" />
              <span className="font-semibold">Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {settings && (
        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">Buffer Time:</span>
                  <span className="ml-2">{settings.bufferTimeMinutes} minutes</span>
                </div>
                <div>
                  <span className="font-semibold">Lesson Duration:</span>
                  <span className="ml-2">{settings.lessonDurationMinutes || 60} minutes</span>
                </div>
                <div>
                  <span className="font-semibold">Max Bookings/Day:</span>
                  <span className="ml-2">{settings.maxBookingsPerDay || 8}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Working Days Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Working Days Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dayNames.map((dayName, index) => {
                  const dayKey = dayName.toLowerCase();
                  const enabled = settings[`${dayKey}Enabled`];
                  const start = settings[`${dayKey}Start`];
                  const end = settings[`${dayKey}End`];
                  
                  return (
                    <div key={dayName} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {enabled ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-semibold w-24">{dayName}</span>
                      </div>
                      {enabled ? (
                        <span className="text-gray-700">
                          {start} - {end}
                        </span>
                      ) : (
                        <span className="text-gray-400">Disabled</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Vacation Days */}
          <Card>
            <CardHeader>
              <CardTitle>Vacation Days ({settings.vacationDays?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {settings.vacationDays && settings.vacationDays.length > 0 ? (
                <div className="space-y-2">
                  {settings.vacationDays.map((date: string) => {
                    const detail = settings.vacationDaysDetails?.find((v: any) => v.date === date);
                    return (
                      <div key={date} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-semibold">{date}</span>
                        {detail?.reason && (
                          <span className="text-gray-600">{detail.reason}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No vacation days configured</p>
              )}
            </CardContent>
          </Card>

          {/* Raw JSON */}
          <Card>
            <CardHeader>
              <CardTitle>Raw JSON Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                {JSON.stringify(settings, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <ValidationItem
                  label="Buffer Time is set"
                  valid={typeof settings.bufferTimeMinutes === 'number'}
                  value={settings.bufferTimeMinutes}
                />
                <ValidationItem
                  label="At least one day is enabled"
                  valid={dayNames.some((_, i) => settings[`${dayNames[i].toLowerCase()}Enabled`])}
                />
                <ValidationItem
                  label="Working days array exists"
                  valid={Array.isArray(settings.workingDays)}
                  value={settings.workingDays?.join(', ')}
                />
                <ValidationItem
                  label="Vacation days array exists"
                  valid={Array.isArray(settings.vacationDays)}
                  value={`${settings.vacationDays?.length || 0} days`}
                />
                {dayNames.map((dayName) => {
                  const dayKey = dayName.toLowerCase();
                  const enabled = settings[`${dayKey}Enabled`];
                  const start = settings[`${dayKey}Start`];
                  const end = settings[`${dayKey}End`];
                  
                  if (!enabled) return null;
                  
                  return (
                    <ValidationItem
                      key={dayName}
                      label={`${dayName} has valid hours`}
                      valid={!!start && !!end && start < end}
                      value={`${start} - ${end}`}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ValidationItem({ label, valid, value }: { label: string; valid: boolean; value?: any }) {
  return (
    <div className="flex items-center justify-between p-2 border-b">
      <span className="text-sm">{label}</span>
      <div className="flex items-center space-x-2">
        {value && <span className="text-xs text-gray-600">{value}</span>}
        {valid ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
      </div>
    </div>
  );
}
