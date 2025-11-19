'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarView, TimeSlotsView } from '@/app/service-center/components/QuotaManagementTab';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { format } from 'date-fns';
import { serviceAreas } from '@/lib/data';
import { Loader2, CheckCircle2, AlertCircle, Calendar, CreditCard, Dot } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PackageItem {
  id: string;
  name: string;
  description: string;
  price: number;
  hours: number;
}

export default function QuickBookPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [suburb, setSuburb] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const selectedPackage = useMemo(() => packages.find(p => p.id === selectedPackageId) || null, [packages, selectedPackageId]);

  const [sessionId, setSessionId] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [payIdIdentifier, setPayIdIdentifier] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [confirming, setConfirming] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  const [quota, setQuota] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [booking, setBooking] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { settings: calendarSettings } = useCalendarSettings();

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/packages');
        const json = await res.json();
        const list: PackageItem[] = json.packages || [];
        if (list.length > 0) {
          const sorted = [...list].sort((a, b) => a.price - b.price);
          setPackages(sorted);
          setSelectedPackageId(sorted[0].id);
        }
      } catch (e) {
        setError('Failed to load packages');
      }
    };
    init();
  }, []);

  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/quota');
      const json = await res.json();
      setQuota(json.quota || null);
    } catch {}
  };

  const handleBooking = async () => {
    if (selectedTimeSlots.length === 0 || !selectedDate) {
      setError('Please select a date and time slots first');
      return;
    }
    setBooking(true);
    setError(null);
    setSuccess(null);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const startTime = selectedTimeSlots.sort()[0];
      const duration = selectedTimeSlots.length * 60;
      const res = await fetch('/api/calendar/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          time: startTime,
          duration,
          lessonType: 'Standard',
          location: 'Brisbane CBD',
          notes: `${selectedTimeSlots.length} hour lesson - Booked via Quick Book`
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Lesson booked successfully for ${selectedDate.toLocaleDateString()} at ${startTime}!`);
        setSelectedTimeSlots([]);
        setSelectedDate(undefined);
        await fetchQuota();
      } else {
        setError(data.error || 'Failed to book lesson');
      }
    } catch {
      setError('Failed to book lesson');
    } finally {
      setBooking(false);
    }
  };

  const createSession = async () => {
    if (!selectedPackageId || !fullName || !address || !suburb || !phone) {
      setError('Please complete all details');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/create-quota-checkout-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackageId,
          paymentGateway: 'payid',
          acceptedTerms: true,
          metadata: {
            user_name: fullName,
            user_address: address,
            suburb,
            phone
          }
        })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.details || json.error || 'Failed to create payment session');
      }
      setSessionId(json.sessionId);
      setPaymentId(json.paymentId);
      const payRes = await fetch(`/api/manual-payment?session_id=${json.sessionId}`);
      const payJson = await payRes.json();
      if (payRes.ok) {
        setPayIdIdentifier(payJson.payIdIdentifier || '');
      }
      setStep(3);
    } catch (e: any) {
      setError(e.message || 'Failed to start payment');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!sessionId || !paymentReference || paymentReference.trim().length < 6) {
      setError('Enter a valid payment reference');
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch('/api/manual-payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, paymentReference: paymentReference.trim(), gateway: 'payid' })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to confirm payment');
      }
      setConfirmed(true);
      setPaymentStatus(String(json.status || 'pending'));
      await fetchQuota();
      setStep(4);
    } catch (e: any) {
      setError(e.message || 'Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`quickbook-payment-${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'manual_payment_sessions', filter: `session_id=eq.${sessionId}` }, payload => {
        const nextStatus = String((payload as any).new?.status || '');
        if (!nextStatus) return;
        setPaymentStatus(nextStatus);
        if (nextStatus === 'completed') {
          setConfirmed(true);
          fetchQuota();
          setStep(4);
        }
        if (nextStatus === 'rejected' || nextStatus === 'cancelled') {
          setError('Payment was rejected');
          setStep(3);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  

  const ProgressDots = () => {
    const items = [1, 2, 3, 4];
    return (
      <div className="flex items-center justify-center gap-3 py-4">
        {items.map(i => (
          <div key={i} className={`w-3 h-3 rounded-full ${step === i ? 'bg-emerald-600' : 'bg-emerald-200'}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
          <Dot className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold">Quick Booking</span>
        </div>
      </div>
      <div className="max-w-3xl mx-auto p-4">
        <ProgressDots />

        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Your Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Suburb</Label>
                <Select value={suburb} onValueChange={setSuburb}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select suburb" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceAreas.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" />
              </div>
              <div className="pt-2">
                <Button onClick={() => setStep(2)} className="w-full">Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Choose Package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Package</Label>
                <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} • ${p.price.toFixed(0)} • {p.hours}h</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2">
                <Button onClick={createSession} className="w-full" disabled={loading}>
                  {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Starting...</>) : 'Next'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Manual PayID</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Transfer to PayID</div>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono font-semibold text-blue-900">{payIdIdentifier || process.env.NEXT_PUBLIC_PAYID_IDENTIFIER || 'PayID'}</div>
                </div>
              </div>
              {selectedPackage && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <div className="text-xs text-gray-500">Amount</div>
                    <div className="text-xl font-bold text-emerald-700">${selectedPackage.price.toFixed(0)}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-gray-500">Package</div>
                    <div className="font-medium">{selectedPackage.name}</div>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="reference">Transaction ID</Label>
                <Input id="reference" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} className="mt-1" placeholder="Enter ID from your receipt" />
              </div>
              <div className="pt-2">
                <Button onClick={confirmPayment} className="w-full" disabled={confirming || !paymentReference.trim()}>
                  {confirming ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>) : 'Submit Payment'}
                </Button>
              </div>
              {confirmed && (
                <Alert className="mt-3 bg-yellow-50 border-yellow-300">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>Payment submitted. Pending admin verification.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Checkout Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="text-xs text-gray-500">Name</div>
                    <div className="font-medium">{fullName}</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="text-xs text-gray-500">Phone</div>
                    <div className="font-medium">{phone}</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border md:col-span-2">
                    <div className="text-xs text-gray-500">Address</div>
                    <div className="font-medium">{address}, {suburb}</div>
                  </div>
                  {selectedPackage && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="text-xs text-gray-500">Package</div>
                      <div className="font-semibold">{selectedPackage.name} • ${selectedPackage.price.toFixed(0)} • {selectedPackage.hours}h</div>
                    </div>
                  )}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xs text-gray-500">Payment Reference</div>
                    <div className="font-mono font-semibold">{paymentReference}</div>
                  </div>
                </div>
                <Alert className="bg-yellow-50 border-yellow-300">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>Booking can be confirmed after admin verifies your payment.</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Schedule Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <CalendarView
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                      calendarSettings={calendarSettings}
                    />
                  </div>
                  <div className="space-y-4">
                    {selectedDate ? (
                      <TimeSlotsView
                        selectedDate={selectedDate}
                        selectedTimeSlots={selectedTimeSlots}
                        onTimeSlotsChange={setSelectedTimeSlots}
                        calendarSettings={calendarSettings}
                        remainingHours={quota?.remaining_hours || 0}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Select a date to view available time slots</p>
                      </div>
                    )}
                    {selectedTimeSlots.length > 0 && selectedDate && (
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm font-medium">{selectedDate.toLocaleDateString()} at {selectedTimeSlots.sort()[0]} • {selectedTimeSlots.length} hour lesson</div>
                        <Button onClick={handleBooking} disabled={booking} className="w-full sm:w-auto">
                          {booking ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Booking...</>) : 'Book Lesson'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}