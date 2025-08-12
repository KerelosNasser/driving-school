'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { useEffect } from 'react'

interface AnalyticsEvent {
  name: string
  value: number
  id: string
  label?: string
  attribution?: Record<string, unknown>
}

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Enhanced analytics with attribution
    const analyticsEvent: AnalyticsEvent = {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      label: metric.label,
      attribution: metric.attribution,
    }

    // Send to multiple analytics services
    if (process.env.NODE_ENV === 'production') {
      // Google Analytics 4
      // Sentry Performance Monitoring
      try {
        if (typeof window !== 'undefined' && (window as any).Sentry) {
          (window as any).Sentry.addBreadcrumb({
            category: 'web-vitals',
            message: `${metric.name}: ${metric.value}`,
            level: 'info',
            data: analyticsEvent,
          });
        }
      } catch (error) {
        console.error('Failed to send data to Sentry:', error);
      }

      // Custom analytics endpoint
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyticsEvent),
      }).catch(console.error)
    }

    // Development logging with performance thresholds
    if (process.env.NODE_ENV === 'development') {
      const thresholds = {
        CLS: 0.1,
        FID: 100,
        FCP: 1800,
        LCP: 2500,
        TTFB: 800,
      }

      const threshold = thresholds[metric.name as keyof typeof thresholds]
      const status = threshold && metric.value > threshold ? '❌ POOR' : '✅ GOOD'
      
      console.log(`🔍 Web Vital: ${metric.name} = ${metric.value} ${status}`)
    }
  })

  // Performance observer for additional metrics
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn(`⚠️ Long task detected: ${entry.duration}ms`)
          }
        })
      })
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        console.log(e)
            }

      return () => longTaskObserver.disconnect()
    }
  }, [])

  return null
}