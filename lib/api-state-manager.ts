/**
 * Centralized API State Management System
 * 
 * This system implements industry best practices for API request management:
 * - Unified request queue processing one call at a time
 * - Strict synchronization across all components
 * - Request freezing/unfreezing mechanism
 * - Professional error handling and recovery
 * - Memory-efficient cleanup and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';

interface QueuedRequest {
  id: string;
  request: NextRequest;
  endpoint: string;
  timestamp: number;
  resolve: (response: NextResponse) => void;
  reject: (error: Error) => void;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
}

interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  queueLength: number;
  isProcessing: boolean;
  lastProcessedAt: number;
}

interface RequestHandler {
  (request: NextRequest): Promise<NextResponse>;
}

class CentralizedAPIStateManager {
  private static instance: CentralizedAPIStateManager;
  private requestQueue: QueuedRequest[] = [];
  private isProcessing: boolean = false;
  private isFrozen: boolean = false;
  private metrics: APIMetrics;
  private handlers: Map<string, RequestHandler> = new Map();
  private processingPromise: Promise<void> | null = null;
  private readonly maxQueueSize = 1000;
  private readonly requestTimeout = 30000; // 30 seconds
  private readonly cleanupInterval = 60000; // 1 minute

  private constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      queueLength: 0,
      isProcessing: false,
      lastProcessedAt: 0
    };

    // Start cleanup interval
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  public static getInstance(): CentralizedAPIStateManager {
    if (!CentralizedAPIStateManager.instance) {
      CentralizedAPIStateManager.instance = new CentralizedAPIStateManager();
    }
    return CentralizedAPIStateManager.instance;
  }

  /**
   * Register an API endpoint handler
   */
  public registerHandler(endpoint: string, handler: RequestHandler): void {
    this.handlers.set(endpoint, handler);
  }

  /**
   * Queue a request for processing
   */
  public async queueRequest(
    request: NextRequest,
    endpoint: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
    maxRetries: number = 3
  ): Promise<NextResponse> {
    return new Promise((resolve, reject) => {
      // Check if system is frozen
      if (this.isFrozen) {
        reject(new Error('API system is currently frozen'));
        return;
      }

      // Check queue size limit
      if (this.requestQueue.length >= this.maxQueueSize) {
        reject(new Error('Request queue is full'));
        return;
      }

      const queuedRequest: QueuedRequest = {
        id: this.generateRequestId(),
        request,
        endpoint,
        timestamp: Date.now(),
        resolve,
        reject,
        priority,
        retryCount: 0,
        maxRetries
      };

      // Insert request based on priority
      this.insertByPriority(queuedRequest);
      this.metrics.totalRequests++;
      this.metrics.queueLength = this.requestQueue.length;

      // Start processing if not already running
      if (!this.isProcessing) {
        this.startProcessing();
      }
    });
  }

  /**
   * Freeze the system - all subsequent requests will be rejected
   */
  public freeze(): void {
    this.isFrozen = true;
    console.log('[API State Manager] System frozen - rejecting new requests');
  }

  /**
   * Unfreeze the system - resume normal operation
   */
  public unfreeze(): void {
    this.isFrozen = false;
    console.log('[API State Manager] System unfrozen - resuming normal operation');
    
    // Resume processing if there are queued requests
    if (this.requestQueue.length > 0 && !this.isProcessing) {
      this.startProcessing();
    }
  }

  /**
   * Get current system metrics
   */
  public getMetrics(): APIMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all queued requests
   */
  public clearQueue(): void {
    const rejectedCount = this.requestQueue.length;
    this.requestQueue.forEach(req => {
      req.reject(new Error('Request cancelled - queue cleared'));
    });
    this.requestQueue = [];
    this.metrics.queueLength = 0;
    console.log(`[API State Manager] Cleared ${rejectedCount} queued requests`);
  }

  /**
   * Start processing the queue (one request at a time)
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing || this.processingPromise) {
      return;
    }

    this.isProcessing = true;
    this.metrics.isProcessing = true;

    this.processingPromise = this.processQueue();
    await this.processingPromise;

    this.isProcessing = false;
    this.metrics.isProcessing = false;
    this.processingPromise = null;
  }

  /**
   * Process requests one at a time with strict synchronization
   */
  private async processQueue(): Promise<void> {
    while (this.requestQueue.length > 0 && !this.isFrozen) {
      const queuedRequest = this.requestQueue.shift();
      if (!queuedRequest) continue;

      this.metrics.queueLength = this.requestQueue.length;
      const startTime = Date.now();

      try {
        // Check for timeout
        if (Date.now() - queuedRequest.timestamp > this.requestTimeout) {
          throw new Error('Request timeout');
        }

        // Get handler for endpoint
        const handler = this.handlers.get(queuedRequest.endpoint);
        if (!handler) {
          throw new Error(`No handler registered for endpoint: ${queuedRequest.endpoint}`);
        }

        // Process the request
        const response = await handler(queuedRequest.request);
        
        // Update metrics
        const responseTime = Date.now() - startTime;
        this.updateResponseTimeMetrics(responseTime);
        this.metrics.successfulRequests++;
        this.metrics.lastProcessedAt = Date.now();

        // Resolve the promise
        queuedRequest.resolve(response);

      } catch (error) {
        // Handle retry logic
        if (queuedRequest.retryCount < queuedRequest.maxRetries) {
          queuedRequest.retryCount++;
          queuedRequest.timestamp = Date.now(); // Reset timestamp for retry
          
          // Re-queue with lower priority
          this.insertByPriority(queuedRequest, true);
          console.log(`[API State Manager] Retrying request ${queuedRequest.id} (attempt ${queuedRequest.retryCount}/${queuedRequest.maxRetries})`);
          continue;
        }

        // Max retries exceeded
        this.metrics.failedRequests++;
        queuedRequest.reject(error instanceof Error ? error : new Error('Unknown error'));
      }

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Insert request into queue based on priority
   */
  private insertByPriority(request: QueuedRequest, isRetry: boolean = false): void {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const requestPriority = isRetry ? 2 : priorityOrder[request.priority]; // Retries get low priority

    let insertIndex = this.requestQueue.length;
    for (let i = 0; i < this.requestQueue.length; i++) {
      const queuePriority = priorityOrder[this.requestQueue[i].priority];
      if (requestPriority < queuePriority) {
        insertIndex = i;
        break;
      }
    }

    this.requestQueue.splice(insertIndex, 0, request);
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update response time metrics
   */
  private updateResponseTimeMetrics(responseTime: number): void {
    const totalProcessed = this.metrics.successfulRequests + this.metrics.failedRequests;
    if (totalProcessed === 0) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (totalProcessed - 1) + responseTime) / totalProcessed;
    }
  }

  /**
   * Cleanup expired requests and reset metrics
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredRequests = this.requestQueue.filter(
      req => now - req.timestamp > this.requestTimeout
    );

    // Remove expired requests
    expiredRequests.forEach(req => {
      req.reject(new Error('Request expired'));
      const index = this.requestQueue.indexOf(req);
      if (index > -1) {
        this.requestQueue.splice(index, 1);
      }
    });

    if (expiredRequests.length > 0) {
      this.metrics.queueLength = this.requestQueue.length;
      this.metrics.failedRequests += expiredRequests.length;
      console.log(`[API State Manager] Cleaned up ${expiredRequests.length} expired requests`);
    }
  }
}

// Export singleton instance
export const apiStateManager = CentralizedAPIStateManager.getInstance();

// Export types for use in other modules
export type { APIMetrics, RequestHandler };