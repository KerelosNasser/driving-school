'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Shield, Clock, CheckCircle, AlertCircle, Loader2, FileText, QrCode, Banknote, ArrowLeft, ArrowRight, Car, Zap, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { TrustSignals } from './TrustSignals';

interface PaymentGatewayType {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  fee: string;
  popular?: boolean;
  color: string;
}

interface EnhancedCheckoutProps {
  packageDetails: {
    id: string;
    name: string;
    price: number;
    hours: number;
    features: string[];
    popular?: boolean;
  };
  onPurchase: (packageId: string, paymentGateway: string) => Promise<void>;
}

export function EnhancedCheckout({ packageDetails, onPurchase }: EnhancedCheckoutProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<{message: string, type?: string} | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState('payid'); // Set PayID as default

  const steps = [
    { id: 1, name: 'Package Selection', icon: CheckCircle, ariaLabel: 'Step 1: Select your package' },
    { id: 2, name: 'Payment Details', icon: CreditCard, ariaLabel: 'Step 2: Enter payment information' },
    { id: 3, name: 'Confirmation', icon: Shield, ariaLabel: 'Step 3: Confirm your purchase' }
  ];

  const paymentGateways = [
    { 
      id: 'payid', 
      name: 'PayID', 
      icon: QrCode, 
      description: 'Instant bank transfer via PayID',
      fee: '0.5% + 10¢',
      popular: true,
      color: 'from-emerald-500 to-teal-600'
    },
    { 
      id: 'tyro', 
      name: 'Tyro EFTPOS', 
      icon: CreditCard, 
      description: 'EFTPOS card payment',
      fee: '1.8% + 30¢',
      color: 'from-blue-500 to-indigo-600'
    },
    { 
      id: 'bpay', 
      name: 'BPAY', 
      icon: Banknote, 
      description: 'Bank transfer via BPAY',
      fee: '0.6% + 25¢',
      color: 'from-purple-500 to-violet-600'
    },
    { 
      id: 'afterpay', 
      name: 'Afterpay', 
      icon: Clock, 
      description: 'Buy now, pay later in 4 installments',
      fee: '3.5% + 30¢',
      color: 'from-pink-500 to-rose-600'
    }
  ];

  const handlePurchase = async () => {
    if (!acceptedTerms) {
      setError({message: 'Please accept the terms and conditions to proceed with payment.', type: 'validation'});
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      setCurrentStep(2);
      await onPurchase(packageDetails.id, selectedGateway);
      setCurrentStep(3);
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Payment failed. Please try again.';
      const errorType = err.type || 'payment';
      setError({message: errorMessage, type: errorType});
      setCurrentStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const getGatewayIcon = (gateway: string) => {
    switch (gateway) {
      case 'payid': return <QrCode className="h-5 w-5" />;
      case 'tyro': return <CreditCard className="h-5 w-5" />;
      case 'bpay': return <Banknote className="h-5 w-5" />;
      case 'afterpay': return <Clock className="h-5 w-5" />;
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

  const getSelectedGateway = () => {
    return paymentGateways.find(g => g.id === selectedGateway) || paymentGateways[0];
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header with driving school theme */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full">
            <Car className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
          Complete Your Purchase
        </h1>
        <p className="text-gray-600">Secure checkout with multiple payment options</p>
      </div>

      {/* Progress Bar */}
      <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4" role="list" aria-label="Checkout steps">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center" aria-label={step.ariaLabel} role="listitem">
                  <div 
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isCompleted 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-transparent text-white' 
                        : isCurrent 
                          ? 'border-blue-500 text-blue-500 bg-white' 
                          : 'border-gray-300 text-gray-400 bg-white'
                    }`}
                    aria-label={isCompleted ? `Completed: ${step.name}` : isCurrent ? `Current step: ${step.name}` : `Pending: ${step.name}`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    )}
                    <span className="sr-only">{step.name}</span>
                  </div>
                  <div 
                    className={`ml-3 ${
                      isCurrent ? 'font-semibold text-gray-900' : 'text-gray-500'
                    }`}
                    aria-hidden="true"
                  >
                    {step.name}
                  </div>
                  {index < steps.length - 1 && (
                    <div 
                      className={`hidden md:block w-16 h-0.5 mx-4 ${
                        isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gray-200'
                      }`} 
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Progress 
            value={(currentStep - 1) * 50} 
            className="w-full" 
            aria-label={`Checkout progress: Step ${currentStep} of 3`}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Checkout Area */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-emerald-700">
                      <CheckCircle className="h-5 w-5" />
                      <span>Selected Package</span>
                    </CardTitle>
                    <CardDescription>
                      Review your package details and select a payment method
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Package Summary with driving school theme */}
                    <div className={`p-6 rounded-xl border-2 ${
                      packageDetails.popular 
                        ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-xl mb-1 text-gray-900">{packageDetails.name}</h3>
                          <p className="text-gray-600 flex items-center">
                            <Zap className="h-4 w-4 mr-1 text-emerald-500" />
                            {packageDetails.hours} hours of driving lessons
                          </p>
                        </div>
                        {packageDetails.popular && (
                          <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center">
                            <Award className="h-3 w-3 mr-1" />
                            MOST POPULAR
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
                          ${packageDetails.price.toFixed(0)}
                        </span>
                        <span className="text-gray-600">One-time payment</span>
                      </div>
                      
                      <ul className="mt-4 space-y-2">
                        {packageDetails.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Payment Gateway Selection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Select Payment Method</h3>
                      <p className="text-gray-600 text-sm">
                        Choose from our secure payment options. All transactions are encrypted and protected.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paymentGateways.map((gateway) => {
                          const Icon = gateway.icon;
                          return (
                            <Card 
                              key={gateway.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedGateway === gateway.id 
                                  ? 'border-2 border-emerald-500 ring-2 ring-emerald-100' 
                                  : 'border border-gray-200'
                              }`}
                              onClick={() => setSelectedGateway(gateway.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start">
                                  <div className={`p-2 rounded-lg mr-3 ${
                                    selectedGateway === gateway.id 
                                      ? `bg-gradient-to-r ${gateway.color} text-white` 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex justify-between">
                                      <h4 className="font-medium">{gateway.name}</h4>
                                      {gateway.popular && (
                                        <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                          RECOMMENDED
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{gateway.description}</p>
                                    <p className="text-xs font-medium text-gray-700 mt-1">Fee: {gateway.fee}</p>
                                  </div>
                                  
                                  <div className={`ml-2 mt-1 w-5 h-5 rounded-full border ${
                                    selectedGateway === gateway.id 
                                      ? 'bg-emerald-500 border-emerald-500' 
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedGateway === gateway.id && (
                                      <CheckCircle className="h-5 w-5 text-white" />
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    {/* Terms Acceptance */}
                    <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <Checkbox
                        id="terms"
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                        className="mt-0.5 border-blue-500 data-[state=checked]:bg-blue-500"
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I accept the{' '}
                        <a href="/terms" target="_blank" className="text-blue-600 hover:underline inline-flex items-center">
                          Terms and Conditions
                          <FileText className="ml-1 h-3 w-3" />
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                          Privacy Policy
                        </a>
                      </label>
                    </div>

                    {error && (
                      <Alert variant={error.type === 'validation' ? 'default' : 'destructive'} className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-700">{error.message}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={handlePurchase}
                        disabled={isProcessing || !acceptedTerms}
                        className={`flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]`}
                        size="lg"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay ${packageDetails.price.toFixed(0)} with {getSelectedGateway()?.name || 'Payment Method'}
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-center text-sm text-gray-500 flex items-center justify-center">
                      <Shield className="h-4 w-4 inline mr-1 text-emerald-500" />
                      Secured checkout with 256-bit SSL encryption
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-600" />
                    <h3 className="text-xl font-semibold mb-2">Redirecting to Secure Payment</h3>
                    <p className="text-gray-600 mb-4">
                      You're being redirected to our secure payment processor for {getSelectedGateway()?.name || 'Payment Method'}...
                    </p>
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 max-w-md mx-auto border border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong>Amount:</strong> ${packageDetails.price.toFixed(2)} AUD
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Package:</strong> {packageDetails.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Payment Method:</strong> {getSelectedGateway()?.name || 'Payment Method'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                      <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-900">Payment Initiated Successfully!</h3>
                    <p className="text-gray-600 mb-6">
                      Your payment for the {packageDetails.name} package has been initiated. 
                      Please complete the payment process in the new window that opened.
                    </p>
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 max-w-md mx-auto mb-6 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Amount:</strong> ${packageDetails.price.toFixed(2)} AUD
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Package:</strong> {packageDetails.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Payment Method:</strong> {getSelectedGateway()?.name || 'Payment Method'}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Packages
                      </Button>
                      <Button 
                        onClick={() => window.location.href = '/service-center'}
                        className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
                      >
                        Continue to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <TrustSignals />
          
          {/* Pricing Breakdown */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">{packageDetails.name}</span>
                <span>${packageDetails.price.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
                    ${packageDetails.price.toFixed(2)} AUD
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                All prices include GST where applicable
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Info */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-700">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 bg-gradient-to-r ${getSelectedGateway()?.color || 'from-gray-500 to-gray-700'} text-white`}>
                  {getGatewayIcon(selectedGateway)}
                </div>
                <div>
                  <div className="font-medium">
                    {getSelectedGateway()?.name || 'Payment Method'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getSelectedGateway()?.description || 'Payment method description'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Need Help? */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2 text-gray-900">Need help with your purchase?</h4>
              <p className="text-sm text-gray-600 mb-3">
                Our support team is available 24/7 to assist you with any questions.
              </p>
              <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}