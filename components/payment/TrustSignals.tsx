'use client';

import { Shield, Lock, Award, Users, Clock, CheckCircle, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function TrustSignals() {
  return (
    <div className="space-y-4">
      {/* Security Badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-xs font-medium text-green-800">SSL Secured</span>
        </div>
        <div className="flex items-center space-x-2">
          <Lock className="h-4 w-4 text-green-600" />
          <span className="text-xs font-medium text-green-800">PCI Compliant</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-xs font-medium text-green-800">Stripe Verified</span>
        </div>
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4 text-green-600" />
          <span className="text-xs font-medium text-green-800">Afterpay Enabled</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">95%</div>
          <div className="text-xs text-blue-700">Pass Rate</div>
        </div>
        <div className="p-2 bg-yellow-50 rounded-lg">
          <div className="text-lg font-bold text-yellow-600">500+</div>
          <div className="text-xs text-yellow-700">Students</div>
        </div>
        <div className="p-2 bg-purple-50 rounded-lg">
          <div className="text-lg font-bold text-purple-600">4.9★</div>
          <div className="text-xs text-purple-700">Rating</div>
        </div>
      </div>

      {/* Money Back Guarantee */}
      <div className="text-center p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
        <div className="flex items-center justify-center space-x-2 mb-1">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-gray-900">100% Satisfaction Guarantee</span>
        </div>
        <p className="text-xs text-gray-700">
          Not satisfied with your first lesson? Get a full refund, no questions asked.
        </p>
      </div>
      
      {/* Payment Options */}
      <div className="text-center p-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">
        <div className="flex items-center justify-center space-x-2 mb-1">
          <CreditCard className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-900">Multiple Payment Options</span>
        </div>
        <p className="text-xs text-gray-700">
          We accept all major cards and Afterpay for your convenience.
        </p>
      </div>
    </div>
  );
}