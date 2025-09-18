// Fraud detection for driving school payments - 2025 standards
import { supabase } from './supabase';

interface PaymentAttempt {
  userId: string;
  packageId: string;
  amount: number;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

interface FraudScore {
  score: number; // 0-100, higher = more suspicious
  reasons: string[];
  blocked: boolean;
}

export class FraudDetector {
  private static readonly FRAUD_THRESHOLD = 75;
  private static readonly BLOCK_THRESHOLD = 90;

  static async analyzePayment(attempt: PaymentAttempt): Promise<FraudScore> {
    let score = 0;
    const reasons: string[] = [];

    // Check for rapid successive attempts
    const recentAttempts = await this.getRecentAttempts(attempt.userId, 15); // 15 minutes
    if (recentAttempts.length > 3) {
      score += 30;
      reasons.push('Multiple rapid payment attempts');
    }

    // Check for unusual amounts
    const avgPackagePrice = await this.getAveragePackagePrice();
    if (attempt.amount > avgPackagePrice * 3) {
      score += 20;
      reasons.push('Unusually high payment amount');
    }

    // Check IP reputation
    const ipScore = await this.checkIPReputation(attempt.ipAddress);
    score += ipScore;
    if (ipScore > 20) {
      reasons.push('Suspicious IP address');
    }

    // Check for velocity patterns
    const velocityScore = await this.checkVelocityPatterns(attempt.userId);
    score += velocityScore;
    if (velocityScore > 15) {
      reasons.push('Unusual payment velocity');
    }

    // Check user behavior patterns
    const behaviorScore = await this.checkUserBehavior(attempt.userId);
    score += behaviorScore;
    if (behaviorScore > 10) {
      reasons.push('Unusual user behavior pattern');
    }

    // Geographic anomalies (for Australian driving school)
    const geoScore = await this.checkGeographicAnomaly(attempt.ipAddress, attempt.userId);
    score += geoScore;
    if (geoScore > 15) {
      reasons.push('Geographic anomaly detected');
    }

    return {
      score: Math.min(100, score),
      reasons,
      blocked: score >= this.BLOCK_THRESHOLD
    };
  }

  private static async getRecentAttempts(userId: string, minutes: number) {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    
    const { data } = await supabase
      .from('payment_attempts')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString());
      
    return data || [];
  }

  private static async getAveragePackagePrice(): Promise<number> {
    const { data } = await supabase
      .from('packages')
      .select('price')
      .eq('active', true);
      
    if (!data || data.length === 0) return 500; // Default fallback
    
    const total = data.reduce((sum, pkg) => sum + pkg.price, 0);
    return total / data.length;
  }

  private static async checkIPReputation(ipAddress: string): Promise<number> {
    // In production, integrate with IP reputation services
    // For now, basic checks
    
    // Check if IP has been flagged before
    const { data } = await supabase
      .from('flagged_ips')
      .select('risk_score')
      .eq('ip_address', ipAddress)
      .single();
      
    if (data) {
      return Math.min(40, data.risk_score);
    }

    // Basic pattern checks
    if (this.isKnownVPNRange(ipAddress)) {
      return 15;
    }
    
    if (this.isTorExitNode(ipAddress)) {
      return 35;
    }

    return 0;
  }

  private static async checkVelocityPatterns(userId: string): Promise<number> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const { data } = await supabase
      .from('payment_attempts')
      .select('amount, created_at')
      .eq('user_id', userId)
      .gte('created_at', last24h.toISOString())
      .order('created_at', { ascending: false });
      
    if (!data || data.length < 2) return 0;
    
    // Check for unusual spending patterns
    const totalAmount = data.reduce((sum, attempt) => sum + attempt.amount, 0);
    if (totalAmount > 2000) { // More than $2000 in 24h
      return 25;
    }
    
    // Check time intervals between attempts
    const intervals = [];
    for (let i = 1; i < data.length; i++) {
      const diff = new Date(data[i-1].created_at).getTime() - new Date(data[i].created_at).getTime();
      intervals.push(diff / 1000 / 60); // Convert to minutes
    }
    
    // Flag if all attempts are within very short intervals
    if (intervals.every(interval => interval < 5)) {
      return 20;
    }
    
    return 0;
  }

  private static async checkUserBehavior(userId: string): Promise<number> {
    // Check user account age
    const { data: user } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single();
      
    if (user) {
      const accountAge = Date.now() - new Date(user.created_at).getTime();
      const ageInHours = accountAge / (1000 * 60 * 60);
      
      // New accounts are slightly more risky
      if (ageInHours < 1) {
        return 15;
      } else if (ageInHours < 24) {
        return 8;
      }
    }
    
    return 0;
  }

  private static async checkGeographicAnomaly(ipAddress: string, userId: string): Promise<number> {
    // In production, use IP geolocation service
    // For Australian driving school, flag non-AU IPs
    
    // Basic check - this would be replaced with actual geolocation
    if (this.isNonAustralianIP(ipAddress)) {
      return 20;
    }
    
    return 0;
  }

  private static isKnownVPNRange(ip: string): boolean {
    // Basic VPN detection - in production, use comprehensive VPN database
    const vpnRanges = [
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16'
    ];
    
    // This is a simplified check - real implementation would be more sophisticated
    return false;
  }

  private static isTorExitNode(ip: string): boolean {
    // In production, check against Tor exit node list
    return false;
  }

  private static isNonAustralianIP(ip: string): boolean {
    // In production, use proper IP geolocation
    // This is a placeholder
    return false;
  }

  static async logFraudAttempt(userId: string, score: number, reasons: string[], blocked: boolean) {
    await supabase
      .from('fraud_logs')
      .insert({
        user_id: userId,
        fraud_score: score,
        reasons: reasons,
        blocked: blocked,
        timestamp: new Date().toISOString()
      });
  }
}