'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2, QrCode, Copy, Check, Clock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ManualPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [paymentData, setPaymentData] = useState<{
    amount: number;
    packageName: string;
    hours: number;
  } | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [paymentApproved, setPaymentApproved] = useState(false);

  const sessionId = searchParams.get('session_id');
  const payidNumber = process.env.NEXT_PUBLIC_PAYID_IDENTIFIER || '0431512095';

  useEffect(() => {
    if (!sessionId) {
      setError('Invalid payment session');
      setLoading(false);
      return;
    }

    fetch(`/api/manual-payment?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setPaymentData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load payment session');
        setLoading(false);
      });
  }, [sessionId]);

  // Real-time subscription for payment verification updates
  useEffect(() => {
    if (!sessionId || !confirmed) return; // Only listen after payment submission

    console.log('🔌 Setting up real-time subscription for session:', sessionId);

    const channel = supabase
      .channel(`manual-payment-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'manual_payment_sessions',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('📡 Received real-time update:', payload);
          const status = payload.new?.status;

          if (status === 'completed') {
            console.log('✅ Payment approved!');
            setPaymentApproved(true);
            toast.success('Payment verified! Hours have been added to your account.', {
              duration: 5000,
            });
          } else if (status === 'rejected') {
            console.log('❌ Payment rejected');
            toast.error('Payment rejected. Please check your reference and contact support if needed.', {
              duration: 5000,
            });
            setConfirmed(false); // Allow re-submission
            setError('Payment was rejected by admin. Please verify your payment reference.');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
          setRealtimeStatus('disconnected');
        }
      });

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId, confirmed]);

  const handleConfirmPayment = async () => {
    if (!paymentReference.trim() || paymentReference.length < 6) {
      setError('Please enter a valid payment reference (at least 6 characters)');
      return;
    }

    setConfirming(true);
    setError('');
    
    try {
      const response = await fetch('/api/manual-payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          paymentReference: paymentReference.trim(),
          gateway: 'payid',
          amountPaid: amountPaid ? parseFloat(amountPaid) : undefined
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm payment');
      }
      
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bankApps = [
    { name: 'CommBank', icon: '🏦', link: 'commbank://' },
    { name: 'NAB', icon: '🏦', link: 'nab://' },
    { name: 'Westpac', icon: '🏦', link: 'westpac://' },
    { name: 'ANZ', icon: '🏦', link: 'anz://' },
  ];

  const openBankApp = (link: string) => {
    window.location.href = link;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error && !paymentData) {
    return (
      <div className="min-h-screen p-4">
        <Card className="max-w-md mx-auto mt-8">
          <CardContent className="p-6">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-center text-gray-700 mb-4">{error}</p>
            <Button onClick={() => router.push('/packages')} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600">
              Return to Packages
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    // If payment approved, show success screen
    if (paymentApproved) {
      return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <Card className="max-w-md mx-auto mt-8 border-0 shadow-xl">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-center rounded-t-xl">
            <div className="mx-auto bg-white rounded-full w-16 h-16 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-white">Payment Approved!</h2>
          </div>
          
          <CardContent className="p-6 space-y-4">
            <Alert className="bg-emerald-50 border-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-900 text-sm font-medium">
                Your hours have been added to your account. You can now book lessons!
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Reference</p>
                <p className="font-mono font-bold">{paymentReference}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Amount</p>
                <p className="text-2xl font-bold text-emerald-600">${paymentData?.amount}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Package</p>
                <p className="font-semibold">{paymentData?.packageName}</p>
                <p className="text-sm text-gray-600">{paymentData?.hours} hours added</p>
              </div>
            </div>

              <div className="space-y-2 pt-2">
                <Button 
                  onClick={() => router.push('/service-center')} 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 h-11"
                >
                  Go to Dashboard & Book Lessons
                </Button>
                <Button 
                  onClick={() => router.push('/packages')} 
                  variant="outline" 
                  className="w-full"
                >
                  View More Packages
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Waiting for verification
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
        <Card className="max-w-md mx-auto mt-8 border-0 shadow-xl">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-center rounded-t-xl">
            <div className="mx-auto bg-white rounded-full w-16 h-16 flex items-center justify-center mb-3">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-white">Payment Submitted!</h2>
          </div>
          
          <CardContent className="p-6 space-y-4">
            {/* Real-time connection status indicator */}
            {realtimeStatus === 'connected' && (
              <Alert className="bg-blue-50 border-blue-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <AlertDescription className="text-blue-900 text-sm font-medium">
                    Waiting for admin verification... You'll be notified immediately.
                  </AlertDescription>
                </div>
              </Alert>
            )}
            {realtimeStatus === 'disconnected' && (
              <Alert className="bg-yellow-50 border-yellow-300">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900 text-sm">
                  Connection lost. Please refresh to check status.
                </AlertDescription>
              </Alert>
            )}
            {realtimeStatus === 'connecting' && (
              <Alert className="bg-gray-50 border-gray-300">
                <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
                <AlertDescription className="text-gray-700 text-sm">
                  Connecting to real-time updates...
                </AlertDescription>
              </Alert>
            )}

            <Alert className="bg-yellow-50 border-yellow-300">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900 text-sm">
                Your hours will be added within 24 hours once verified.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Reference</p>
                <p className="font-mono font-bold">{paymentReference}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Amount</p>
                <p className="text-2xl font-bold text-emerald-600">${paymentData?.amount}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Package</p>
                <p className="font-semibold">{paymentData?.packageName}</p>
                <p className="text-sm text-gray-600">{paymentData?.hours} hours</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button 
                onClick={() => router.push('/service-center')} 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                Go to Dashboard
              </Button>
              <Button 
                onClick={() => router.push('/packages')} 
                variant="outline" 
                className="w-full"
              >
                View More Packages
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white p-3 border-b sticky top-0 z-10">
          <Button onClick={() => router.push('/packages')} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Hero - Mobile Only */}
        <div className="lg:hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white text-center">
          <QrCode className="h-10 w-10 mx-auto mb-2 opacity-80" />
          <h1 className="text-2xl font-bold mb-1">PayID Payment</h1>
          <div className="text-4xl font-bold my-3">${paymentData?.amount}</div>
          <p className="text-emerald-100 text-sm">{paymentData?.packageName} • {paymentData?.hours} hours</p>
        </div>

        {/* Content - Mobile: Stack | Desktop: Grid */}
        <div className="p-4 lg:p-8">
          {/* Desktop: 2 column grid | Mobile: Single column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 max-w-lg lg:max-w-none mx-auto">
            {/* Amount - Desktop shows here */}
            <Card className="border-0 shadow-sm lg:shadow-lg hidden lg:block">
              <CardContent className="p-6 text-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg">
                <p className="text-emerald-100 text-sm mb-2">Amount to Pay</p>
                <div className="text-5xl font-bold my-2">${paymentData?.amount}</div>
                <p className="text-emerald-100 text-sm">{paymentData?.packageName} • {paymentData?.hours}h</p>
              </CardContent>
            </Card>

            {/* PayID */}
            <Card className="border-0 shadow-sm lg:shadow-lg">
              <CardContent className="p-4 lg:p-6">
                <p className="text-xs text-gray-500 mb-2">Transfer to PayID</p>
                <div className="flex items-center justify-between gap-2 bg-blue-50 p-3 rounded-lg">
                  <p className="font-mono font-bold text-blue-900 text-sm">{payidNumber}</p>
                  <Button
                    onClick={() => copyToClipboard(payidNumber)}
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex-shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bank Apps */}
            <Card className="border-0 shadow-sm lg:shadow-lg">
              <CardContent className="p-4 lg:p-6">
                <p className="text-xs text-gray-500 mb-2">Quick access</p>
                <div className="grid grid-cols-4 gap-2">
                  {bankApps.map((bank) => (
                    <button
                      key={bank.name}
                      onClick={() => openBankApp(bank.link)}
                      className="flex flex-col items-center p-2 bg-gray-50 rounded-lg hover:bg-emerald-50 border hover:border-emerald-500 transition-all active:scale-95"
                    >
                      <span className="text-2xl">{bank.icon}</span>
                      <span className="text-xs font-medium text-gray-700 mt-1">{bank.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="border-0 shadow-sm lg:shadow-lg bg-emerald-50">
              <CardContent className="p-4 lg:p-6">
                <p className="text-xs font-semibold text-emerald-900 mb-2">Steps:</p>
                <div className="space-y-1.5">
                  {[
                    'Open your bank app',
                    'Select PayID payment',
                    'Enter PayID above',
                    'Complete transfer',
                    'Enter transaction ID below',
                  ].map((step, i) => (
                    <div key={i} className="flex items-center text-sm">
                      <span className="flex-shrink-0 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                        {i + 1}
                      </span>
                      <span className="text-emerald-900">{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm lg:shadow-lg lg:col-span-2">
              <CardContent className="p-4 lg:p-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="reference" className="text-sm font-medium">
                      Transaction ID
                    </Label>
                    <Input
                      id="reference"
                      placeholder="Enter ID from your receipt"
                      value={paymentReference}
                      onChange={(e) => {
                        setPaymentReference(e.target.value);
                        setError('');
                      }}
                      className="mt-1.5 h-11 text-base border-2 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amountPaid" className="text-sm font-medium">
                      Amount Paid (After Tax)
                    </Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      step="0.01"
                      placeholder="e.g. 595.00"
                      value={amountPaid}
                      onChange={(e) => {
                        setAmountPaid(e.target.value);
                      }}
                      className="mt-1.5 h-11 text-base border-2 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleConfirmPayment}
                  disabled={confirming || !paymentReference.trim()}
                  className="w-full h-11 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-transform"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Payment'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
