// Payment utilities for PayID-only payment system

export interface PaymentError {
  code: string;
  message: string;
  type: 'validation' | 'gateway' | 'network' | 'server' | 'unknown';
  recoverable: boolean;
}

export interface PaymentGateway {
  id: string;
  name: string;
  fees: string; // e.g., "2.6% + 30¢"
  supported: boolean;
  recommended: boolean;
  type: 'automated' | 'manual';
}

// PayID-only payment gateway for Australian businesses
// PayID is set as the primary recommended payment method with the specific ID 0431512095
export const PAYMENT_GATEWAYS: PaymentGateway[] = [
  {
    id: 'payid',
    name: 'PayID (0431512095)',
    fees: '0.5% + 10¢',
    supported: true,
    recommended: true,
    type: 'manual'
  }
];

// Parse and categorize payment errors
export function parsePaymentError(error: any): PaymentError {
  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed. Please check your internet connection and try again.',
      type: 'network',
      recoverable: true
    };
  }

  // Handle validation errors
  if (error.type === 'validation') {
    return {
      code: error.code || 'VALIDATION_ERROR',
      message: error.message || 'Please check your payment information and try again.',
      type: 'validation',
      recoverable: true
    };
  }

  // Handle server errors
  if (error.status >= 500) {
    return {
      code: 'SERVER_ERROR',
      message: 'Our payment system is temporarily unavailable. Please try again in a few minutes.',
      type: 'server',
      recoverable: true
    };
  }

  // Handle manual payment errors
  if (error.step === 'manual') {
    return {
      code: 'PAYMENT_PROCESSING_ERROR',
      message: error.details || 'Payment processing error. Please contact support.',
      type: 'gateway',
      recoverable: false
    };
  }

  // Handle payment ID errors
  if (error.step === 'payment_id') {
    return {
      code: 'PAYMENT_ID_ERROR',
      message: error.details || 'Payment ID generation or validation error. Please try again.',
      type: 'gateway',
      recoverable: true
    };
  }

  // Default error
  return {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'An unexpected error occurred. Please try again.',
    type: 'unknown',
    recoverable: true
  };
}

// Format error message for user display
export function formatPaymentErrorMessage(error: PaymentError): string {
  switch (error.type) {
    case 'validation':
      return `Validation Error: ${error.message}`;
    case 'network':
      return `Connection Issue: ${error.message}`;
    case 'gateway':
      return `Payment Issue: ${error.message}`;
    case 'server':
      return `Service Unavailable: ${error.message}`;
    default:
      return error.message;
  }
}

// Get the recommended payment gateway based on fees for Australian businesses
export function getRecommendedGateway(): PaymentGateway {
  const gateway = PAYMENT_GATEWAYS.find(gateway => gateway.recommended);
  // Ensure we always return a valid gateway (fallback to first if none found)
  return gateway || PAYMENT_GATEWAYS[0]!;
}

// Compare gateways by fees
export function compareGatewaysByFees(a: PaymentGateway, b: PaymentGateway): number {
  // Extract numeric values from fee strings for comparison
  const aFee = parseFloat(a.fees.replace(/[^\d.]/g, ''));
  const bFee = parseFloat(b.fees.replace(/[^\d.]/g, ''));
  
  return aFee - bFee;
}

// Check if a gateway is manual
export function isManualGateway(gatewayId: string): boolean {
  const gateway = PAYMENT_GATEWAYS.find(g => g.id === gatewayId);
  return gateway ? gateway.type === 'manual' : false;
}