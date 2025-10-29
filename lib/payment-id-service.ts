// Payment ID Service - Generates and validates payment IDs for the driving school system
// Replaces Stripe integration with a clean, payment ID-based solution

import { randomBytes, createHash } from 'crypto';

export interface PaymentIdData {
  id: string;
  timestamp: number;
  userId: string;
  packageId: string;
  amount: number;
  gateway: string;
  checksum: string;
}

export interface PaymentIdValidationResult {
  isValid: boolean;
  data?: PaymentIdData;
  error?: string;
}

export class PaymentIdService {
  private static readonly PREFIX = 'PAY';
  private static readonly VERSION = '1';
  private static readonly SEPARATOR = '_';

  /**
   * Generate a unique payment ID with timestamp and validation checksum
   * Format: PAY_1_TIMESTAMP_RANDOMID_CHECKSUM
   */
  static generatePaymentId(
    userId: string,
    packageId: string,
    amount: number,
    gateway: string
  ): string {
    const timestamp = Date.now();
    const randomId = randomBytes(8).toString('hex').toUpperCase();
    
    // Create data string for checksum
    const dataString = `${userId}${packageId}${amount}${gateway}${timestamp}`;
    const checksum = createHash('sha256')
      .update(dataString)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();

    return `${this.PREFIX}${this.SEPARATOR}${this.VERSION}${this.SEPARATOR}${timestamp}${this.SEPARATOR}${randomId}${this.SEPARATOR}${checksum}`;
  }

  /**
   * Validate and parse a payment ID
   */
  static validatePaymentId(paymentId: string): PaymentIdValidationResult {
    try {
      const parts = paymentId.split(this.SEPARATOR);
      
      if (parts.length !== 5) {
        return { isValid: false, error: 'Invalid payment ID format' };
      }

      const [prefix, version, timestampStr, randomId, checksum] = parts;

      if (prefix !== this.PREFIX) {
        return { isValid: false, error: 'Invalid payment ID prefix' };
      }

      if (version !== this.VERSION) {
        return { isValid: false, error: 'Unsupported payment ID version' };
      }

      const timestamp = parseInt(timestampStr || '0');
      if (isNaN(timestamp) || timestamp <= 0) {
        return { isValid: false, error: 'Invalid timestamp in payment ID' };
      }

      // Check if payment ID is not too old (30 days)
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      if (Date.now() - timestamp > maxAge) {
        return { isValid: false, error: 'Payment ID has expired' };
      }

      if (!randomId || randomId.length !== 16 || !/^[A-F0-9]+$/.test(randomId)) {
        return { isValid: false, error: 'Invalid random ID format' };
      }

      if (!checksum || checksum.length !== 8 || !/^[A-F0-9]+$/.test(checksum)) {
        return { isValid: false, error: 'Invalid checksum format' };
      }

      return {
        isValid: true,
        data: {
          id: paymentId,
          timestamp,
          userId: '', // Will be filled from transaction context
          packageId: '', // Will be filled from transaction context
          amount: 0, // Will be filled from transaction context
          gateway: '', // Will be filled from transaction context
          checksum
        }
      };
    } catch (error) {
      return { isValid: false, error: 'Failed to parse payment ID'+ error };
    }
  }

  /**
   * Generate a payment reference for manual payment methods
   */
  static generatePaymentReference(gateway: string, paymentId: string): string {
    const shortId = paymentId.split(this.SEPARATOR)[3]; // Get the random part
    const gatewayPrefix = gateway.toUpperCase().substring(0, 3);
    return `${gatewayPrefix}-${shortId}`;
  }

  /**
   * Check if a payment ID is unique (not already used)
   */
  static async isPaymentIdUnique(paymentId: string): Promise<boolean> {
    // This will be implemented with database check in the API routes
    // For now, return true as the database will handle uniqueness constraints
    return true;
  }

  /**
   * Extract timestamp from payment ID
   */
  static extractTimestamp(paymentId: string): number | null {
    try {
      const parts = paymentId.split(this.SEPARATOR);
      if (parts.length >= 3) {
        const timestamp = parseInt(parts[2] || '0');
        return isNaN(timestamp) ? null : timestamp;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Format payment ID for display
   */
  static formatForDisplay(paymentId: string): string {
    const parts = paymentId.split(this.SEPARATOR);
    if (parts.length === 5) {
      return `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}-${parts[4]}`;
    }
    return paymentId;
  }

  /**
   * Generate a session ID for manual payment tracking
   */
  static generateSessionId(): string {
    const timestamp = Date.now();
    const randomId = randomBytes(12).toString('hex').toUpperCase();
    return `SES_${timestamp}_${randomId}`;
  }

  /**
   * Validate payment amount and gateway combination
   */
  static validatePaymentData(amount: number, gateway: string): { isValid: boolean; error?: string } {
    if (amount <= 0) {
      return { isValid: false, error: 'Payment amount must be greater than zero' };
    }

    if (amount > 10000) {
      return { isValid: false, error: 'Payment amount exceeds maximum limit' };
    }

    const validGateways = ['payid', 'tyro', 'bpay', 'manual'];
    if (!validGateways.includes(gateway.toLowerCase())) {
      return { isValid: false, error: 'Invalid payment gateway' };
    }

    return { isValid: true };
  }

  /**
   * Log payment ID generation for audit purposes
   */
  static logPaymentIdGeneration(paymentId: string, context: {
    userId: string;
    packageId: string;
    amount: number;
    gateway: string;
  }): void {
    console.log(`[PaymentID] Generated: ${paymentId}`, {
      timestamp: new Date().toISOString(),
      userId: context.userId,
      packageId: context.packageId,
      amount: context.amount,
      gateway: context.gateway,
      paymentId
    });
  }

  /**
   * Log payment ID validation for audit purposes
   */
  static logPaymentIdValidation(paymentId: string, result: PaymentIdValidationResult): void {
    console.log(`[PaymentID] Validation: ${paymentId}`, {
      timestamp: new Date().toISOString(),
      paymentId,
      isValid: result.isValid,
      error: result.error
    });
  }
}

// Export utility functions for backward compatibility
export const generatePaymentId = PaymentIdService.generatePaymentId;
export const validatePaymentId = PaymentIdService.validatePaymentId;
export const generatePaymentReference = PaymentIdService.generatePaymentReference;
export const generateSessionId = PaymentIdService.generateSessionId;