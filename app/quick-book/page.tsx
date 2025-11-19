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
import { TermsAcceptanceDialog } from '@/components/ui/terms-acceptance-dialog';
import { FullScreenLoading } from '@/components/ui/full-screen-loading';
import { CalendarView, TimeSlotsView } from '@/app/service-center/components/QuotaManagementTab';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { serviceAreas } from '@/lib/data';
import { Loader2, CheckCircle2, AlertCircle, Calendar, CreditCard, Dot, Lightbulb, Car, Shield, Gauge, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
  
  const [payIdIdentifier, setPayIdIdentifier] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [confirming, setConfirming] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);
  
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  const [quota, setQuota] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [booking, setBooking] = useState<boolean>(false);
  const [showAdvice, setShowAdvice] = useState<boolean>(false);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'verifying' | 'approved' | 'rejected'>('pending');
  const tips: { text: string; Icon: React.ComponentType<{ className?: string }>; }[] = [
    { text: 'Check mirrors every 5–8 seconds to build awareness.', Icon: Shield },
    { text: 'Look 12–15 seconds ahead to plan safely.', Icon: Lightbulb },
    { text: 'Smooth steering and braking keep passengers comfortable.', Icon: Car },
    { text: 'Pause, breathe, and scan before any turn.', Icon: Gauge },
    { text: 'Maintain a safe following distance—3 seconds minimum.', Icon: Shield },
  ];
  
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
          setSelectedPackageId(sorted[0]?.id || '');
        }
      } catch (_e) {
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
      const payRes = await fetch(`/api/manual-payment?session_id=${json.sessionId}`);
      const payJson = await payRes.json();
      if (payRes.ok) {
        setPayIdIdentifier(payJson.payIdIdentifier || '');
      }
      await goToStep(3);
    } catch (e: any) {
      setError(e.message || 'Failed to start payment');
    } finally {
      setLoading(false);
    }
  };

  const goToStep = async (next: number) => {
    setTipIndex(Math.floor(Math.random() * tips.length));
    setShowAdvice(true);
    await new Promise(r => setTimeout(r, 5000)); // Increased delay for smooth transition
    setShowAdvice(false);
    setStep(next);
  };

  const startPaymentFlow = () => {
    const accepted = typeof window !== 'undefined' && window.localStorage.getItem('termsAccepted') === 'true';
    if (accepted) {
      createSession();
    } else {
      setShowTermsDialog(true);
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
      await fetchQuota();
      await goToStep(4);
    } catch (e: any) {
      setError(e.message || 'Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    
    console.log('🔌 [Quick-Book] Setting up real-time subscription for session:', sessionId);
    
    const channel = supabase
      .channel(`quickbook-payment-${sessionId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'manual_payment_sessions', 
          filter: `session_id=eq.${sessionId}` 
        },
        (payload) => {
          console.log('📡 [Quick-Book] Received real-time update:', payload);
          const nextStatus = String((payload as any).new?.status || '');
          if (!nextStatus) return;
          
          if (nextStatus === 'pending_verification') {
            setPaymentStatus('verifying');
            toast.info('Admin is reviewing your payment...', {
              duration: 3000,
            });
          } else if (nextStatus === 'completed') {
            console.log('✅ [Quick-Book] Payment approved!');
            setPaymentStatus('approved');
            setConfirmed(true);
            fetchQuota();
            toast.success('Payment approved! Quota has been added to your account.', {
              duration: 5000,
            });
            goToStep(4);
          } else if (nextStatus === 'rejected' || nextStatus === 'cancelled') {
            console.log('❌ [Quick-Book] Payment rejected');
            setPaymentStatus('rejected');
            toast.error('Payment was rejected. Please verify your reference.', {
              duration: 5000,
            });
            setError('Payment was rejected by admin. Please check your payment reference.');
            goToStep(3);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [Quick-Book] Real-time subscription active');
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [Quick-Book] Real-time subscription error');
          setRealtimeStatus('disconnected');
        }
      });

    return () => {
      console.log('🔌 [Quick-Book] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  

  const ProgressDots = () => {
    const items = [1, 2, 3, 4];
    return (
      <div className="flex items-center justify-center gap-3 py-6">
        {items.map(i => (
          <div key={i} className={`w-3 h-3 rounded-full transition-all duration-300 ${step === i ? 'bg-emerald-500 scale-125' : 'bg-emerald-200/50'}`} />
        ))}
      </div>
    );
  };

  return (
    <>
    {/* Full Screen Loading Overlay */}
    <FullScreenLoading 
      show={showAdvice} 
      tip={tips[tipIndex]}
      loadingText="Preparing your booking..."
    />
    
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M0 30h60v2H0zM30 0v60h-2V0z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Animated Orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-emerald-800/30 via-teal-700/30 to-blue-800/30 backdrop-blur-sm border-b border-white/10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Car className="h-5 w-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg">Quick Booking</h1>
            <p className="text-emerald-200 text-xs">Fast-track your driving lessons</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto p-4 md:p-6 pt-4">
        <ProgressDots />

        {error && (
          <Alert className="mb-4 bg-red-500/20 border-red-300/30 backdrop-blur-sm" variant="destructive">
            <AlertCircle className="h-4 w-4 text-red-200" />
            <AlertDescription className="text-red-100">{error}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
              <CardTitle className="flex items-center gap-3 text-emerald-900">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                </div>
                Your Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="fullName" className="text-gray-700">Full name</Label>
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1.5 border-emerald-200 focus:border-emerald-500" />
              </div>
              <div>
                <Label htmlFor="address" className="text-gray-700">Address</Label>
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} className="mt-1.5 border-emerald-200 focus:border-emerald-500" />
              </div>
              <div>
                <Label className="text-gray-700">Suburb</Label>
                <Select value={suburb} onValueChange={setSuburb}>
                  <SelectTrigger className="mt-1.5 border-emerald-200 focus:border-emerald-500">
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
                <Label htmlFor="phone" className="text-gray-700">Phone</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1.5 border-emerald-200 focus:border-emerald-500" />
              </div>
              <div className="pt-4">
                <Button onClick={() => goToStep(2)} className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg">Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
              <CardTitle className="flex items-center gap-3 text-emerald-900">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                </div>
                Choose Package
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label className="text-gray-700">Package</Label>
                <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                  <SelectTrigger className="mt-1.5 border-emerald-200 focus:border-emerald-500">
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} • ${p.price.toFixed(0)} • {p.hours}h</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-4">
                <Button onClick={startPaymentFlow} className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg" disabled={loading}>
                  {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Starting...</>) : 'Next'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
              <CardTitle className="flex items-center gap-3 text-emerald-900">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                </div>
                Manual PayID
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-gray-500 mb-1">Transfer to PayID</div>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono font-semibold text-blue-900">{payIdIdentifier || process.env.NEXT_PUBLIC_PAYID_IDENTIFIER || 'PayID'}</div>
                </div>
              </div>
              {selectedPackage && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="text-xs text-gray-500">Amount</div>
                    <div className="text-2xl font-bold text-emerald-700">${selectedPackage.price.toFixed(0)}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xs text-gray-500">Package</div>
                    <div className="font-medium text-blue-900">{selectedPackage.name}</div>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="reference" className="text-gray-700">Transaction ID</Label>
                <Input id="reference" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} className="mt-1.5 border-emerald-200 focus:border-emerald-500" placeholder="Enter ID from your receipt" />
              </div>
              <div className="pt-2">
                <Button onClick={confirmPayment} className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg" disabled={confirming || !paymentReference.trim()}>
                  {confirming ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>) : 'Submit Payment'}
                </Button>
              </div>
              {confirmed && (
                <>
                  {realtimeStatus === 'connected' && (
                    <Alert className="mt-3 bg-blue-50 border-blue-300">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <AlertDescription className="text-blue-900 text-sm font-medium">
                          {paymentStatus === 'verifying' ? 'Admin is verifying your payment...' : 'Waiting for admin verification... You\'ll be notified immediately.'}
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}
                  {realtimeStatus === 'connecting' && (
                    <Alert className="mt-3 bg-gray-50 border-gray-300">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <AlertDescription className="text-gray-700">Payment submitted. Connecting to real-time updates...</AlertDescription>
                    </Alert>
                  )}
                  {realtimeStatus === 'disconnected' && (
                    <Alert className="mt-3 bg-yellow-50 border-yellow-300">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">Payment submitted. Pending admin verification.</AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                <CardTitle className="flex items-center gap-3 text-emerald-900">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  Checkout Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500">Name</div>
                    <div className="font-medium text-gray-900">{fullName}</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500">Phone</div>
                    <div className="font-medium text-gray-900">{phone}</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200 md:col-span-2">
                    <div className="text-xs text-gray-500">Address</div>
                    <div className="font-medium text-gray-900">{address}, {suburb}</div>
                  </div>
                  {selectedPackage && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="text-xs text-gray-500">Package</div>
                      <div className="font-semibold text-emerald-900">{selectedPackage.name} • ${selectedPackage.price.toFixed(0)} • {selectedPackage.hours}h</div>
                    </div>
                  )}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xs text-gray-500">Payment Reference</div>
                    <div className="font-mono font-semibold text-blue-900">{paymentReference}</div>
                  </div>
                </div>
                <Alert className="bg-yellow-50 border-yellow-300">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">Booking can be confirmed after admin verifies your payment.</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                <CardTitle className="flex items-center gap-3 text-emerald-900">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  Schedule Lessons
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4 overflow-x-auto">
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
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="text-sm font-medium text-emerald-900 text-center sm:text-left">{selectedDate.toLocaleDateString()} at {selectedTimeSlots.sort()[0]} • {selectedTimeSlots.length} hour lesson</div>
                        <Button onClick={handleBooking} disabled={booking} className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
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
      <TermsAcceptanceDialog
        open={showTermsDialog}
        onAccept={() => {
          if (typeof window !== 'undefined') window.localStorage.setItem('termsAccepted', 'true');
          setShowTermsDialog(false);
          createSession();
        }}
        onDecline={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
          } else {
            router.push('/');
          }
        }}
      />
    </div>
    </>
  );
}