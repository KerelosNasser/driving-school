
// Payment Instructions Component - PayID Only
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Banknote, 
  Copy, 
  CheckCircle,
  Clock,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentInstructionsProps {
  paymentData: any;
  onPaymentComplete: () => void;
}

export function PaymentInstructions({ paymentData, onPaymentComplete }: PaymentInstructionsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderPayIDInstructions = () => (
    <div className="space-y-4">
      <div className="text-center p-4 bg-amber-50 rounded-lg">
        <Banknote className="h-12 w-12 text-amber-600 mx-auto mb-2" />
        <h3 className="font-semibold text-lg">PayID Bank Transfer (0431512095)</h3>
        <p className="text-gray-600">
          Complete your payment using internet banking with these details.
        </p>
      </div>
      
      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <span className="text-sm font-medium">PayID</span>
            <div className="font-medium flex items-center justify-between">
              <span>0431512095</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard('0431512095', 'payid')}
              >
                {copiedField === 'payid' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div>
            <span className="text-sm font-medium">Account Name</span>
            <div className="font-medium">{paymentData.accountName}</div>
          </div>
          
          <div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Reference</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(paymentData.reference, 'reference')}
              >
                {copiedField === 'reference' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="font-mono font-bold">{paymentData.reference}</div>
          </div>
          
          <div>
            <span className="text-sm font-medium">Amount</span>
            <div className="text-lg font-bold text-green-600">${paymentData.amount.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>
      
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Please complete your PayID transfer within 24 hours to secure your booking. 
          Use the reference number provided to ensure proper payment tracking.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2">
        <h4 className="font-medium">Payment Instructions:</h4>
        <ol className="text-sm space-y-1 text-gray-600 list-decimal list-inside">
          <li>Log into your internet banking</li>
          <li>Select "Pay Someone" or "Transfer Money"</li>
          <li>Enter PayID: 0431512095</li>
          <li>Enter the exact amount: ${paymentData.amount.toFixed(2)}</li>
          <li>Use the reference: {paymentData.reference}</li>
          <li>Complete the transfer</li>
        </ol>
      </div>
      
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          You'll receive a confirmation email once your payment is processed (usually within 1-2 business hours).
        </AlertDescription>
      </Alert>
      
      <div className="pt-4">
        <Button onClick={onPaymentComplete} className="w-full">
          I've Made the Payment
        </Button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Payment Instructions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {renderPayIDInstructions()}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}