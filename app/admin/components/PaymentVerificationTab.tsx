'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, DollarSign, User, CreditCard, AlertCircle } from 'lucide-react';
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 shadow-lg">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Verification</h1>
            <p className="text-gray-600">Review and approve manual payment submissions</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {pendingPayments.length} Pending
        </Badge>
      </div>

      {/* Alert */}
      {pendingPayments.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 font-medium">
                You have {pendingPayments.length} payment{pendingPayments.length !== 1 ? 's' : ''} waiting for verification
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Payments List */}
      {pendingPayments.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No pending payment verifications at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingPayments.map((payment) => (
            <Card key={payment.session_id} className="shadow-lg border-yellow-100">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-200 rounded-lg">
                      <User className="h-5 w-5 text-yellow-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {payment.users?.full_name || payment.metadata?.user_name || 'Unknown User'}
                      </CardTitle>
                      <CardDescription>
                        {payment.users?.email || payment.metadata?.user_email || payment.email}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500 text-white">
                    Pending Verification
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Payment Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-gray-600 font-medium">Amount</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${payment.amount} {payment.currency}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600 font-medium">Gateway</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 uppercase">
                      {payment.gateway}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-600 font-medium">Hours</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {payment.metadata?.hours || 0} hours
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600 font-medium">Submitted</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {format(new Date(payment.submitted_at), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(payment.submitted_at), 'hh:mm a')}
                    </p>
                  </div>
                </div>

                {/* Package Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Package Details</h4>
                  <p className="text-blue-800">{payment.metadata?.package_name || 'Unknown Package'}</p>
                </div>

                {/* Payment Reference */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-900 mb-2">Payment Reference</h4>
                  <p className="font-mono text-lg font-bold text-emerald-800">
                    {payment.payment_reference}
                  </p>
                  <p className="text-sm text-emerald-700 mt-1">
                    Verify this reference in your {payment.gateway.toUpperCase()} account
                  </p>
                </div>

                {/* Admin Notes */}
                <div>
                  <Label htmlFor={`notes-${payment.session_id}`} className="text-sm font-medium">
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
                    className="mt-2"
                    rows={2}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Button
                    onClick={() => handleVerifyPayment(payment.session_id, 'approve')}
                    disabled={processingId === payment.session_id}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    {processingId === payment.session_id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve & Grant Hours
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleVerifyPayment(payment.session_id, 'reject')}
                    disabled={processingId === payment.session_id}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
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
