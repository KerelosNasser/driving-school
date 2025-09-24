'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, CreditCard, QrCode, Banknote, Copy, Check, Shield, Clock, Car, Zap, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface PaymentError {
  message: string;
  type?: string;
}

// Helper function to safely extract error message
const getErrorMessage = (error: PaymentError | null): string => {
  if (!error) return '';
  return error.message || 'An error occurred';
};

export default function ManualPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PaymentError | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const sessionId = searchParams.get('session_id');
  const gateway = searchParams.get('gateway');

  useEffect(() => {
    if (!sessionId) {
      setError({message: 'Invalid payment session', type: 'validation'});
      setLoading(false);
      return;
    }

    const fetchPaymentSession = async () => {
      try {
        const response = await fetch(`/api/manual-payment?session_id=${sessionId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch payment session');
        }
        
        setPaymentData(data);
        setSelectedGateway(gateway || data.gateway || 'payid');
      } catch (err: any) {
        setError({
          message: err.message || 'Failed to fetch payment session',
          type: 'network'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentSession();
  }, [sessionId, gateway]);

  const validatePaymentReference = (ref: string, gateway: string): string => {
    if (!ref.trim()) return 'Payment reference is required';
    
    const cleanRef = ref.trim();
    
    switch (gateway) {
      case 'payid':
        if (cleanRef.length < 6) return 'PayID reference must be at least 6 characters';
        if (!/^[A-Za-z0-9]+$/.test(cleanRef)) return 'PayID reference should contain only letters and numbers';
        break;
      case 'bpay':
        if (cleanRef.length < 8) return 'BPAY reference must be at least 8 characters';
        if (!/^[0-9]+$/.test(cleanRef)) return 'BPAY reference should contain only numbers';
        break;
      case 'tyro':
        if (cleanRef.length < 10) return 'Tyro receipt number must be at least 10 characters';
        if (!/^[A-Za-z0-9-]+$/.test(cleanRef)) return 'Tyro reference should contain letters, numbers, and hyphens only';
        break;
    }
    
    return '';
  };

  const handleConfirmPayment = async () => {
    const validation = validatePaymentReference(paymentReference, selectedGateway);
    if (validation) {
      setValidationError(validation);
      return;
    }

    setConfirming(true);
    setError(null);
    setValidationError('');
    
    try {
      const response = await fetch('/api/manual-payment/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          paymentReference: paymentReference.trim(),
          gateway: selectedGateway,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm payment');
      }
      
      setConfirmed(true);
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to confirm payment',
        type: err.type || 'payment'
      });
    } finally {
      setConfirming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getGatewayOptions = () => [
    {
      id: 'payid',
      title: 'PayID',
      icon: <QrCode className="h-5 w-5" />,
      description: 'Instant bank transfer',
      fee: '0.5% + 10¢',
      color: 'from-emerald-500 to-teal-600',
      popular: true
    },
    {
      id: 'bpay',
      title: 'BPAY',
      icon: <Banknote className="h-5 w-5" />,
      description: 'Bank transfer via BPAY',
      fee: '0.6% + 25¢',
      color: 'from-purple-500 to-violet-600',
      popular: false
    },
    {
      id: 'tyro',
      title: 'Tyro EFTPOS',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'In-person EFTPOS payment',
      fee: '1.8% + 30¢',
      color: 'from-blue-500 to-indigo-600',
      popular: false
    }
  ];

  const getGatewayDetails = (gatewayType: string) => {
    const generateReferenceNumber = () => {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `${gatewayType.toUpperCase()}${timestamp.slice(-6)}${random}`;
    };
    
    const referenceNumber = generateReferenceNumber();
    
    switch (gatewayType) {
      case 'payid':
        return {
          title: 'PayID Payment',
          icon: <QrCode className="h-6 w-6" />,
          description: 'Transfer funds using your bank\'s PayID service',
          instructions: [
            'Open your banking app or internet banking',
            'Select "Pay Someone" or "PayID Transfer"',
            `Enter PayID: ${process.env.NEXT_PUBLIC_PAYID_IDENTIFIER || '0431512095'}`,
            `Amount: $${paymentData?.amount} AUD`,
            `Reference: ${referenceNumber}`,
            'Complete the transfer and save the receipt'
          ],
          color: 'from-emerald-500 to-teal-600',
          referenceLabel: 'Transaction ID from your bank receipt'
        };
      case 'bpay':
        return {
          title: 'BPAY Payment',
          icon: <Banknote className="h-6 w-6" />,
          description: 'Pay using BPAY through your bank',
          instructions: [
            'Log in to your internet banking or mobile app',
            'Navigate to "BPAY" or "Pay Bills"',
            `Biller Code: ${process.env.NEXT_PUBLIC_BPAY_BILLER_CODE || '123456'}`,
            `Reference: ${referenceNumber}`,
            `Amount: $${paymentData?.amount} AUD`,
            'Complete payment and save the receipt number'
          ],
          color: 'from-purple-500 to-violet-600',
          referenceLabel: 'BPAY receipt number (8+ digits)'
        };
      case 'tyro':
        return {
          title: 'Tyro EFTPOS Payment',
          icon: <CreditCard className="h-6 w-6" />,
          description: 'Pay using Tyro EFTPOS terminal',
          instructions: [
            'Visit our office or authorized payment location',
            `Tell them you need to pay $${paymentData?.amount} for driving lessons`,
            `Provide reference: ${referenceNumber}`,
            'Complete the EFTPOS transaction',
            'Keep the printed receipt',
            'Enter the receipt number below'
          ],
          color: 'from-blue-500 to-indigo-600',
          referenceLabel: 'Receipt number from Tyro terminal'
        };
      default:
        return {
          title: 'Manual Payment',
          icon: <CreditCard className="h-6 w-6" />,
          description: 'Complete your payment manually',
          instructions: ['Follow the provided instructions'],
          color: 'from-gray-500 to-gray-700',
          referenceLabel: 'Payment reference'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-600" />
          <h2 className="text-xl font-semibold text-gray-800">Loading Payment Details</h2>
          <p className="text-gray-600">Please wait while we prepare your payment information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6">
        <div className="max-w-md mx-auto">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-6 w-6" />
                <span>Payment Error</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{error.message}</p>
              {error.type === 'network' && (
                <p className="text-sm text-gray-500 mt-2">Please check your internet connection and try again.</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                onClick={() => router.push('/packages')} 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
              >
                Return to Packages
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Try Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (confirmed) {
    const generateReferenceNumber = () => {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `${selectedGateway.toUpperCase()}${timestamp.slice(-6)}${random}`;
    };
    const referenceNumber = generateReferenceNumber();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="mx-auto bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full w-20 h-20 flex items-center justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Confirmed!</h1>
            <p className="text-gray-600 mb-8 text-lg">
              Thank you for your payment. Your driving lesson hours will be added to your account shortly.
            </p>
            
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-left">
                    <p className="text-sm text-gray-500 mb-1">Payment Reference</p>
                    <p className="font-mono text-lg font-semibold text-gray-900">{paymentReference}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500 mb-1">Our Reference</p>
                    <p className="font-mono text-lg font-semibold text-gray-900">{referenceNumber}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
                    <p className="text-2xl font-bold text-emerald-600">${paymentData?.amount} AUD</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500 mb-1">Package</p>
                    <p className="font-semibold text-gray-900">{paymentData?.packageName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push('/service-center')}
                className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
              >
                Continue to Dashboard
              </Button>
              <Button 
                onClick={() => router.push('/packages')}
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                View More Packages
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const gatewayOptions = getGatewayOptions();
  const gatewayDetails = getGatewayDetails(selectedGateway);
  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${selectedGateway.toUpperCase()}${timestamp.slice(-6)}${random}`;
  };
  const referenceNumber = generateReferenceNumber();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="relative mb-12">
          <Button
            onClick={() => router.push('/packages')}
            variant="ghost"
            className="absolute left-0 top-0 text-gray-600 hover:text-gray-900 hover:bg-white/50 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Packages
          </Button>
          
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                <div className="relative p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-xl">
                  <Car className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-3">
              Complete Your Payment
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Secure and fast payment processing for your driving lessons
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Payment Gateway Selection */}
          <div className="xl:col-span-2">
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">Payment Methods</CardTitle>
                <CardDescription className="text-gray-600">Choose your preferred payment option</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {gatewayOptions.map((option) => (
                  <motion.div
                    key={option.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-300 relative overflow-hidden ${
                        selectedGateway === option.id 
                          ? `border-2 bg-gradient-to-br ${option.color} text-white shadow-2xl ring-4 ring-white/20` 
                          : 'border border-gray-200 hover:border-gray-300 hover:shadow-xl bg-white/80 backdrop-blur-sm'
                      }`}
                      onClick={() => setSelectedGateway(option.id)}
                    >
                      {selectedGateway === option.id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                      )}
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl transition-all duration-300 ${
                              selectedGateway === option.id 
                                ? 'bg-white/20 shadow-lg' 
                                : `bg-gradient-to-br ${option.color} shadow-md`
                            }`}>
                              <div className="text-white">
                                {option.icon}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className={`font-bold text-lg ${
                                  selectedGateway === option.id ? 'text-white' : 'text-gray-900'
                                }`}>{option.title}</h3>
                                {option.popular && (
                                  <Badge className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1">
                                    ⭐ Popular
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-sm mb-2 ${
                                selectedGateway === option.id ? 'text-white/90' : 'text-gray-600'
                              }`}>
                                {option.description}
                              </p>
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                selectedGateway === option.id 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                💰 Fee: {option.fee}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {selectedGateway === option.id ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                              >
                                <CheckCircle className="h-6 w-6 text-white" />
                              </motion.div>
                            ) : (
                              <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Package Summary */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50 to-indigo-50 backdrop-blur-md mt-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-emerald-500" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Package</span>
                    <span className="font-bold text-gray-900">{paymentData?.packageName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Lesson Hours</span>
                    <span className="font-bold text-gray-900">{paymentData?.hours} hours</span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">Total Amount</span>
                      <div className="text-right">
                        <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          ${paymentData?.amount}
                        </span>
                        <p className="text-sm text-gray-500 font-medium">AUD</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Instructions */}
          <div className="xl:col-span-3">
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 bg-gradient-to-br ${gatewayDetails.color} rounded-xl shadow-lg`}>
                    <div className="text-white">
                      {gatewayDetails.icon}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">{gatewayDetails.title}</CardTitle>
                    <CardDescription className="text-gray-600 text-base">{gatewayDetails.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Reference Number */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                  <h4 className="font-bold text-blue-800 mb-4 flex items-center text-lg">
                    <div className="p-2 bg-blue-200 rounded-lg mr-3">
                      <AlertCircle className="h-5 w-5 text-blue-700" />
                    </div>
                    Payment Reference Number
                  </h4>
                  <div className="bg-white rounded-lg p-4 border-2 border-blue-300 shadow-inner">
                    <div className="flex items-center space-x-3">
                      <Input
                        value={referenceNumber}
                        readOnly
                        className="font-mono text-xl font-bold bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 text-center tracking-wider"
                      />
                      <Button
                        onClick={() => copyToClipboard(referenceNumber)}
                        variant="outline"
                        size="lg"
                        className="border-2 border-blue-300 hover:bg-blue-100 transition-all duration-200"
                      >
                        {copied ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center"
                          >
                            <Check className="h-5 w-5 text-green-600 mr-1" />
                            <span className="text-green-600 font-semibold">Copied!</span>
                          </motion.div>
                        ) : (
                          <>
                            <Copy className="h-5 w-5 text-blue-700 mr-1" />
                            <span className="text-blue-700 font-semibold">Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-blue-700 mt-3 font-medium text-center">
                    💳 Use this exact reference number when making your payment
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                    <div className={`p-2 bg-gradient-to-r ${gatewayDetails.color} rounded-lg mr-3`}>
                      <div className="text-white">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    </div>
                    Step-by-Step Instructions
                  </h3>
                  <ol className="space-y-5">
                    {gatewayDetails.instructions.map((instruction, index) => (
                      <motion.li 
                        key={index} 
                        className="flex items-start"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br ${gatewayDetails.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1 shadow-lg`}>
                          {index + 1}
                        </span>
                        <span className="text-gray-800 leading-relaxed font-medium text-base bg-white/60 backdrop-blur-sm rounded-lg p-3 flex-1 shadow-sm">
                          {instruction}
                        </span>
                      </motion.li>
                    ))}
                  </ol>
                </div>

                {/* Payment Confirmation */}
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-emerald-200">
                  <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg mr-3">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    Confirm Your Payment
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="paymentRef" className="text-lg font-bold text-gray-900 mb-2 block">
                        {gatewayDetails.referenceLabel}
                      </Label>
                      <Input
                        id="paymentRef"
                        placeholder={`Enter your ${selectedGateway.toUpperCase()} reference number`}
                        value={paymentReference}
                        onChange={(e) => {
                          setPaymentReference(e.target.value);
                          setValidationError('');
                        }}
                        className="text-xl font-mono border-2 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 bg-white shadow-inner py-4"
                      />
                      <p className="text-emerald-700 mt-3 font-medium flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        This confirms that you have completed the payment successfully
                      </p>
                    </div>

                    {(error || validationError) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Alert variant="destructive" className="border-2 border-red-300 bg-red-50 shadow-lg">
                          <AlertCircle className="h-5 w-5" />
                          <AlertDescription className="text-red-800 font-medium text-base">
                            {validationError || getErrorMessage(error)}
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}

                    <div className="pt-4">
                      <Button
                        onClick={handleConfirmPayment}
                        disabled={confirming || !paymentReference.trim()}
                        className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-xl font-bold py-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                      >
                        {confirming ? (
                          <>
                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                            Confirming Payment...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-3 h-6 w-6" />
                            Confirm Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="border-0 shadow-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white mt-8">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 bg-emerald-500/20 rounded-full">
                      <Shield className="h-6 w-6 text-emerald-400" />
                    </div>
                    <span className="font-semibold">Secure Processing</span>
                    <span className="text-sm text-gray-300">Bank-level security</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 bg-blue-500/20 rounded-full">
                      <Clock className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="font-semibold">24/7 Support</span>
                    <span className="text-sm text-gray-300">Always here to help</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 bg-purple-500/20 rounded-full">
                      <ExternalLink className="h-6 w-6 text-purple-400" />
                    </div>
                    <span className="font-semibold">Need Help?</span>
                    <span className="text-sm text-gray-300">Contact our team</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}