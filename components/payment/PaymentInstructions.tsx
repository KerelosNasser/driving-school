
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  QrCode, 
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

  const renderAfterPayInstructions = () => (
    <div className="space-y-4">
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <CreditCard className="h-12 w-12 text-purple-600 mx-auto mb-2" />
        <h3 className="font-semibold text-lg">Redirecting to Afterpay</h3>
        <p className="text-gray-600">
          You will be redirected to Afterpay to complete your purchase with flexible payment options.
        </p>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium">What happens next:</h4>
        <ul className="text-sm space-y-1 text-gray-600">
          <li className="flex items-start">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
            Set up your Afterpay payment plan
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
            Confirm your payment schedule
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
            You'll be redirected back to our site upon completion
          </li>
        </ul>
      </div>
    </div>
  );

  const renderTyroInstructions = () => (
    <div className="space-y-4">
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <QrCode className="h-12 w-12 text-purple-600 mx-auto mb-2" />
        <h3 className="font-semibold text-lg">Tyro EFTPOS Payment</h3>
        <p className="text-gray-600">
          Complete your payment in-person at our office using EFTPOS.
        </p>
      </div>
      
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Please visit our office within 24 hours to complete your payment and secure your booking.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2">
        <h4 className="font-medium">Office Location:</h4>
        <p className="text-sm text-gray-600">
          123 Driving School Road<br />
          Brisbane, QLD 4000
        </p>
      </div>
      
      <div className="pt-4">
        <Button onClick={onPaymentComplete} className="w-full">
          I'll Pay at the Office
        </Button>
      </div>
    </div>
  );

  const renderBPAYInstructions = () => (
    <div className="space-y-4">
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <Banknote className="h-12 w-12 text-green-600 mx-auto mb-2" />
        <h3 className="font-semibold text-lg">BPAY Payment</h3>
        <p className="text-gray-600">
          Complete your payment using internet banking with these BPAY details.
        </p>
      </div>
      
      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Biller Code</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(paymentData.billerCode, 'billerCode')}
              >
                {copiedField === 'billerCode' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="text-lg font-mono font-bold">{paymentData.billerCode}</div>
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
            <div className="text-lg font-mono font-bold">{paymentData.reference}</div>
          </div>
          
          <div>
            <span className="text-sm font-medium">Amount</span>
            <div className="text-lg font-bold text-green-600">${paymentData.amount.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        <h4 className="font-medium">Payment Instructions:</h4>
        <ol className="text-sm space-y-1 text-gray-600">
          {paymentData.instructions.map((instruction: string, index: number) => (
            <li key={index} className="flex items-start">
              <span className="font-medium mr-2">{index + 1}.</span>
              {instruction}
            </li>
          ))}
        </ol>
      </div>
      
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          Once you've completed the payment, please email your receipt to payments@egdrivingschool.com.au
        </AlertDescription>
      </Alert>
      
      <div className="pt-4">
        <Button onClick={onPaymentComplete} className="w-full">
          I've Made the Payment
        </Button>
      </div>
    </div>
  );

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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">BSB</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(paymentData.bsb, 'bsb')}
                >
                  {copiedField === 'bsb' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="font-mono font-bold">{paymentData.bsb}</div>
            </div>
            
            <div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Account Number</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(paymentData.accountNumber, 'accountNumber')}
                >
                  {copiedField === 'accountNumber' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="font-mono font-bold">{paymentData.accountNumber}</div>
            </div>
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
      
      <div className="space-y-2">
        <h4 className="font-medium">Payment Instructions:</h4>
        <ol className="text-sm space-y-1 text-gray-600">
          {paymentData.instructions.map((instruction: string, index: number) => (
            <li key={index} className="flex items-start">
              <span className="font-medium mr-2">{index + 1}.</span>
              {instruction}
            </li>
          ))}
        </ol>
      </div>
      
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          {paymentData.timeframe}
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
            {paymentData.paymentMethod === 'afterpay' && renderAfterPayInstructions()}
            {paymentData.paymentMethod === 'tyro' && renderTyroInstructions()}
            {paymentData.paymentMethod === 'bpay' && renderBPAYInstructions()}
            {paymentData.paymentMethod === 'payid' && renderPayIDInstructions()}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}