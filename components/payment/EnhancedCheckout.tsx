'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Shield, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrustSignals } from './TrustSignals';

interface EnhancedCheckoutProps {
  packageDetails: {
    id: string;
    name: string;
    price: number;
    hours: number;
    features: string[];
  };
  onPurchase: (packageId: string) => Promise<void>;
}

export function EnhancedCheckout({ packageDetails, onPurchase }: EnhancedCheckoutProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 1, name: 'Package Selection', icon: CheckCircle },
    { id: 2, name: 'Payment Details', icon: CreditCard },
    { id: 3, name: 'Confirmation', icon: Shield }
  ];

  const handlePurchase = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      setCurrentStep(2);
      await onPurchase(packageDetails.id);
      setCurrentStep(3);
    } catch (err) {
      setError('Payment failed. Please try again.');
      setCurrentStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Indicator */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Checkout Progress</span>
              <span className="text-sm text-gray-500">Step {currentStep} of {steps.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep >= step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full ${
                    isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-sm ${
                    isActive ? 'text-green-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Package Selected</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h3 className="font-semibold text-lg mb-2">{packageDetails.name}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-green-600">
                          ${packageDetails.price.toFixed(0)}
                        </span>
                        <span className="text-gray-600">{packageDetails.hours} hours</span>
                      </div>
                      <ul className="space-y-1">
                        {packageDetails.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      onClick={handlePurchase}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
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
                          Secure Checkout - ${packageDetails.price.toFixed(0)}
                        </>
                      )}
                    </Button>

                    <div className="text-center text-sm text-gray-500">
                      <Shield className="h-4 w-4 inline mr-1" />
                      Your payment is secured by 256-bit SSL encryption
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
                <Card>
                  <CardContent className="p-8 text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                    <h3 className="text-lg font-semibold mb-2">Redirecting to Secure Payment</h3>
                    <p className="text-gray-600">
                      You're being redirected to our secure payment processor...
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trust Signals Sidebar */}
        <div className="space-y-6">
          <TrustSignals />
          
          {/* Pricing Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Package ({packageDetails.hours} hours)</span>
                <span>${packageDetails.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>GST (10%)</span>
                <span>Included</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-green-600">${packageDetails.price.toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-500 text-center">
                No hidden fees • Cancel anytime
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
              <p className="text-sm text-blue-700 mb-3">
                Our team is here to assist you with any questions.
              </p>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}