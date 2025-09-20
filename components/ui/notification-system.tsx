'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X,
  Wifi,
  WifiOff,
  Users,
  Save,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SystemNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'connection' | 'collaboration';
  title: string;
  message: string;
  timestamp: string;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
}

interface NotificationContextType {
  notifications: SystemNotification[];
  addNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // Convenience methods
  notifySuccess: (title: string, message?: string) => void;
  notifyError: (title: string, message?: string, persistent?: boolean) => void;
  notifyWarning: (title: string, message?: string) => void;
  notifyInfo: (title: string, message?: string) => void;
  notifyConnection: (isConnected: boolean, message?: string) => void;
  notifyCollaboration: (title: string, message: string) => void;
  notifySaveStatus: (status: 'saving' | 'saved' | 'error', message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const addNotification = useCallback((notification: Omit<SystemNotification, 'id' | 'timestamp'>) => {
    const newNotification: SystemNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep max 10

    // Also show as toast for immediate feedback
    const toastMessage = notification.message || notification.title;
    switch (notification.type) {
      case 'success':
        toast.success(toastMessage);
        break;
      case 'error':
        toast.error(toastMessage);
        break;
      case 'warning':
        toast.warning(toastMessage);
        break;
      default:
        toast(toastMessage);
    }

    // Auto-remove non-persistent notifications
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const notifySuccess = useCallback((title: string, message?: string) => {
    addNotification({ type: 'success', title, message: message || '' });
  }, [addNotification]);

  const notifyError = useCallback((title: string, message?: string, persistent = false) => {
    addNotification({ type: 'error', title, message: message || '', persistent });
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message?: string) => {
    addNotification({ type: 'warning', title, message: message || '' });
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message?: string) => {
    addNotification({ type: 'info', title, message: message || '' });
  }, [addNotification]);

  const notifyConnection = useCallback((isConnected: boolean, message?: string) => {
    const title = isConnected ? 'Connected' : 'Connection Lost';
    const defaultMessage = isConnected 
      ? 'Real-time collaboration is active' 
      : 'Working offline - changes will sync when reconnected';
    
    addNotification({ 
      type: 'connection', 
      title, 
      message: message || defaultMessage,
      persistent: !isConnected
    });
  }, [addNotification]);

  const notifyCollaboration = useCallback((title: string, message: string) => {
    addNotification({ type: 'collaboration', title, message });
  }, [addNotification]);

  const notifySaveStatus = useCallback((status: 'saving' | 'saved' | 'error', message?: string) => {
    const configs = {
      saving: { type: 'info' as const, title: 'Saving...', defaultMessage: 'Saving changes' },
      saved: { type: 'success' as const, title: 'Saved', defaultMessage: 'All changes saved' },
      error: { type: 'error' as const, title: 'Save Failed', defaultMessage: 'Failed to save changes', persistent: true }
    };
    
    const config = configs[status];
    addNotification({ 
      type: config.type, 
      title: config.title, 
      message: message || config.defaultMessage,
      persistent: config.persistent
    });
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll,
      notifySuccess,
      notifyError,
      notifyWarning,
      notifyInfo,
      notifyConnection,
      notifyCollaboration,
      notifySaveStatus
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}