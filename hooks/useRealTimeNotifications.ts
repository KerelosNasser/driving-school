import { useEffect, useState, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface Notification {
  type: 'referral_success' | 'reward_earned' | 'connected' | 'keepalive';
  title?: string;
  message?: string;
  data?: any;
  timestamp: string;
}

interface UseRealTimeNotificationsReturn {
  isConnected: boolean;
  notifications: Notification[];
  connectionError: string | null;
  clearNotifications: () => void;
  markAsRead: (timestamp: string) => void;
}

export function useRealTimeNotifications(): UseRealTimeNotificationsReturn {
  const { user, isLoaded } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((timestamp: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.timestamp !== timestamp)
    );
  }, []);

  const showNotificationToast = useCallback((notification: Notification) => {
    if (notification.type === 'referral_success') {
      toast.success(notification.title || 'Referral Success!', {
        description: notification.message,
        duration: 5000,
        action: {
          label: 'View Details',
          onClick: () => {
            // Navigate to referral dashboard or show details modal
            console.log('Show referral details:', notification);
          }
        }
      });
    } else if (notification.type === 'reward_earned') {
      toast.success(notification.title || 'Reward Earned!', {
        description: notification.message,
        duration: 7000,
        action: {
          label: 'View Rewards',
          onClick: () => {
            // Navigate to rewards page
            console.log('Show rewards:', notification);
          }
        }
      });
    }
  }, []);

  const connectEventSource = useCallback(() => {
    if (!isLoaded || !user) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
        console.log('Real-time notifications connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          
          if (notification.type === 'connected') {
            console.log('Notification stream initialized');
            return;
          }

          if (notification.type === 'keepalive') {
            // Just a keepalive ping
            return;
          }

          // Add to notifications list
          setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications

          // Show toast notification
          showNotificationToast(notification);

        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setIsConnected(false);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          setConnectionError('Connection closed by server');
        } else {
          setConnectionError('Connection error occurred');
        }

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts) * 1000; // Exponential backoff
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectEventSource();
          }, delay);
        } else {
          setConnectionError('Unable to connect after multiple attempts');
        }
      };

    } catch (error) {
      console.error('Error creating EventSource:', error);
      setConnectionError('Failed to establish connection');
    }
  }, [isLoaded, user, reconnectAttempts, showNotificationToast]);

  // Initialize connection when user is loaded
  useEffect(() => {
    if (isLoaded && user) {
      connectEventSource();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectEventSource]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    notifications,
    connectionError,
    clearNotifications,
    markAsRead
  };
}
