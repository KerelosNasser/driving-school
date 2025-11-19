'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, DollarSign, User, CreditCard, AlertCircle, Package } from 'lucide-react';
import { format } from 'date-fns';

interface PendingPayment {
  session_id: string;
  user_id: string;
  email: string;
  full_name: string;
  amount: number;
  currency: string;
  gateway: string;
  payment_reference: string;
  submitted_at: string;
  package_id: string;
  metadata: {
    package_name?: string;
    hours?: number;
    user_email?: string;
    user_name?: string;
    amount_paid?: number;
  };
  users?: {
    email: string;
    full_name: string;
    phone?: string;
  };
}

export function PaymentVerificationTab() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadPendingPayments();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('manual-payment-verification')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_payment_sessions' }, () => {
        loadPendingPayments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPendingPayments = async () => {
    try {
      const response = await fetch('/api/admin/verify-payment');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load pending payments');
      }

      setPendingPayments(result.data || []);
    } catch (error: any) {
      console.error('Error loading pending payments:', error);
      toast.error(error?.message || 'Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (sessionId: string, action: 'approve' | 'reject') => {
    setProcessingId(sessionId);
    try {
      const response = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          action,
          adminNotes: adminNotes[sessionId] || ''
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${action} payment`);
      }

      toast.success(result.message || `Payment ${action}d successfully`);
      
      // Remove from pending list
      setPendingPayments(prev => prev.filter(p => p.session_id !== sessionId));
      
      // Clear admin notes
      setAdminNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[sessionId];
        return newNotes;
      });
    } catch (error: any) {
      console.error(`Error ${action}ing payment:`, error);
      toast.error(error?.message || `Failed to ${action} payment`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Clock className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Payment Verification</h1>
              <p className="text-yellow-100 mt-1">Review and approve manual payment submissions</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-2xl px-6 py-3 bg-white/90 backdrop-blur-sm">
            {pendingPayments.length}
          </Badge>
        </div>
      </div>

      {/* Alert Banner */}
      {pendingPayments.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
          <p className="text-yellow-900 font-medium">
            You have <span className="font-bold">{pendingPayments.length}</span> payment{pendingPayments.length !== 1 ? 's' : ''} waiting for verification
          </p>
        </div>
      )}

      {/* Payments List */}
      {pendingPayments.length === 0 ? (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="p-16 text-center">
            <CheckCircle className="h-20 w-20 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600 text-lg">No pending payment verifications at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingPayments.map((payment) => (
            <Card key={payment.session_id} className="shadow-xl border-2 border-yellow-100 hover:shadow-2xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 border-b-2 border-yellow-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {payment.users?.full_name || payment.metadata?.user_name || 'Unknown User'}
                      </CardTitle>
                      <CardDescription className="text-base mt-1">
                        {payment.users?.email || payment.metadata?.user_email || payment.email}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-sm px-4 py-2">
                    Pending Verification
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Payment Details Grid - Enhanced */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Expected Amount */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border-2 border-emerald-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm text-emerald-700 font-semibold">Expected Amount</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900">
                      ${payment.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">{payment.currency}</p>
                  </div>

                  {/* Amount Paid (if reported) */}
                  {payment.metadata?.amount_paid && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                      <div className="flex items-center space-x-2 mb-3">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-blue-700 font-semibold">Amount Paid</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">
                        ${payment.metadata.amount_paid.toFixed(2)}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">User reported</p>
                    </div>
                  )}

                  {/* Gateway */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      <span className="text-sm text-purple-700 font-semibold">Gateway</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 uppercase">
                      {payment.gateway}
                    </p>
                  </div>

                  {/* Hours */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border-2 border-orange-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <span className="text-sm text-orange-700 font-semibold">Hours</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">
                      {payment.metadata?.hours || 0} hours
                    </p>
                  </div>

                  {/* Package */}
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-5 rounded-xl border-2 border-cyan-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <Package className="h-5 w-5 text-cyan-600" />
                      <span className="text-sm text-cyan-700 font-semibold">Package</span>
                    </div>
                    <p className="text-base font-bold text-cyan-900">
                      {payment.metadata?.package_name || 'Unknown'}
                    </p>
                  </div>

                  {/* Submitted Time */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-5 rounded-xl border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <span className="text-sm text-gray-700 font-semibold">Submitted</span>
                    </div>
                    <p className="text-base font-bold text-gray-900">
                      {format(new Date(payment.submitted_at), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(payment.submitted_at), 'hh:mm a')}
                    </p>
                  </div>
                </div>

                {/* Payment Reference - Prominent Display */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 shadow-lg">
                  <h4 className="font-bold text-white mb-3 text-lg">Payment Reference</h4>
                  <p className="font-mono text-3xl font-bold text-white break-all">
                    {payment.payment_reference}
                  </p>
                  <p className="text-emerald-100 mt-3 text-sm">
                    ✓ Verify this reference in your {payment.gateway.toUpperCase()} account
                  </p>
                </div>

                {/* Admin Notes */}
                <div>
                  <Label htmlFor={`notes-${payment.session_id}`} className="text-base font-semibold text-gray-700">
                    Admin Notes (Optional)
                  </Label>
                  <Textarea
                    id={`notes-${payment.session_id}`}
                    placeholder="Add any notes about this verification..."
                    value={adminNotes[payment.session_id] || ''}
                    onChange={(e) => setAdminNotes(prev => ({
                      ...prev,
                      [payment.session_id]: e.target.value
                    }))}
                    className="mt-2 border-2 focus:border-emerald-500"
                    rows={3}
                  />
                </div>

                {/* Action Buttons - Enhanced */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t-2">
                  <Button
                    onClick={() => handleVerifyPayment(payment.session_id, 'approve')}
                    disabled={processingId === payment.session_id}
                    className="flex-1 h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    {processingId === payment.session_id ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Approve & Grant Hours
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleVerifyPayment(payment.session_id, 'reject')}
                    disabled={processingId === payment.session_id}
                    variant="destructive"
                    className="flex-1 h-14 text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Reject Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
