'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  AlertCircle,
  Info,
  Clock,
  Zap,
  Upload,
  Download,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Loading States and Progress Indicators
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}

interface ProgressIndicatorProps {
  progress: number;
  status: 'loading' | 'success' | 'error' | 'idle';
  text?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressIndicator({ 
  progress, 
  status, 
  text, 
  showPercentage = true, 
  className 
}: ProgressIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          {text && <span className="text-sm font-medium">{text}</span>}
        </div>
        {showPercentage && (
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        )}
      </div>
      <Progress 
        value={progress} 
        className={cn("h-2", getStatusColor())}
      />
    </div>
  );
}

// Operation Status Indicators
interface OperationStatusProps {
  operation: 'save' | 'upload' | 'download' | 'sync' | 'delete';
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  className?: string;
  showIcon?: boolean;
}

export function OperationStatus({ 
  operation, 
  status, 
  message, 
  className,
  showIcon = true 
}: OperationStatusProps) {
  const getOperationIcon = () => {
    switch (operation) {
      case 'save':
        return Save;
      case 'upload':
        return Upload;
      case 'download':
        return Download;
      case 'sync':
        return RefreshCw;
      case 'delete':
        return X;
      default:
        return Clock;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    if (message) return message;
    
    const operationText = operation.charAt(0).toUpperCase() + operation.slice(1);
    switch (status) {
      case 'loading':
        return `${operationText}ing...`;
      case 'success':
        return `${operationText}d successfully`;
      case 'error':
        return `${operationText} failed`;
      default:
        return `Ready to ${operation}`;
    }
  };

  const OperationIcon = getOperationIcon();

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {showIcon && (
        <OperationIcon 
          className={cn(
            "h-4 w-4",
            status === 'loading' && "animate-spin",
            getStatusColor()
          )} 
        />
      )}
      <span className={cn("text-sm", getStatusColor())}>
        {getStatusText()}
      </span>
    </div>
  );
}

// Connection Status Indicator
interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting?: boolean;
  lastConnected?: string;
  onReconnect?: () => void;
  className?: string;
  showReconnectButton?: boolean;
}

export function ConnectionStatus({ 
  isConnected, 
  isReconnecting = false, 
  lastConnected, 
  onReconnect,
  className,
  showReconnectButton = true
}: ConnectionStatusProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = () => {
    if (isReconnecting) {
      return <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />;
    }
    return isConnected ? (
      <Wifi className="h-4 w-4 text-green-500" />
    ) : (
      <WifiOff className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusText = () => {
    if (isReconnecting) return 'Reconnecting...';
    return isConnected ? 'Connected' : 'Offline';
  };

  const getStatusColor = () => {
    if (isReconnecting) return 'text-yellow-500';
    return isConnected ? 'text-green-500' : 'text-red-500';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn("flex items-center space-x-2 cursor-pointer", className)}
            onClick={() => setShowDetails(!showDetails)}
          >
            {getStatusIcon()}
            <span className={cn("text-sm font-medium", getStatusColor())}>
              {getStatusText()}
            </span>
            {!isConnected && showReconnectButton && onReconnect && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onReconnect();
                }}
              >
                Reconnect
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">
              {isConnected ? 'Real-time connection active' : 'Connection lost'}
            </p>
            {!isConnected && lastConnected && (
              <p className="text-xs text-gray-400">
                Last connected: {new Date(lastConnected).toLocaleString()}
              </p>
            )}
            {!isConnected && (
              <p className="text-xs text-gray-400">
                Changes will sync when reconnected
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Error and Success Notification System
interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onDismiss?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
  className?: string;
}

export function Notification({ 
  type, 
  title, 
  message, 
  duration = 5000, 
  onDismiss,
  actions,
  className 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const getNotificationIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationColors = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={cn(
        "border rounded-lg shadow-lg p-4 max-w-md",
        getNotificationColors(),
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getNotificationIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          {message && (
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          )}
          {actions && actions.length > 0 && (
            <div className="flex space-x-2 mt-3">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant || 'outline'}
                  onClick={action.onClick}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-6 w-6 p-0"
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onDismiss(), 300);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Conflict Resolution Visual Indicators
interface ConflictIndicatorProps {
  conflictCount: number;
  onResolveAll?: () => void;
  onViewConflicts?: () => void;
  className?: string;
}

export function ConflictIndicator({ 
  conflictCount, 
  onResolveAll, 
  onViewConflicts,
  className 
}: ConflictIndicatorProps) {
  if (conflictCount === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        "flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2",
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
      <span className="text-sm font-medium text-yellow-800">
        {conflictCount} conflict{conflictCount !== 1 ? 's' : ''} detected
      </span>
      <div className="flex space-x-1">
        {onViewConflicts && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            onClick={onViewConflicts}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
        )}
        {onResolveAll && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            onClick={onResolveAll}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolve All
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Loading Overlay for Operations
interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  onCancel?: () => void;
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  message = 'Loading...', 
  progress,
  onCancel,
  className 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
        className
      )}
    >
      <Card className="w-80 max-w-sm">
        <CardContent className="p-6 text-center">
          <LoadingSpinner size="lg" className="justify-center mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
          {progress !== undefined && (
            <ProgressIndicator
              progress={progress}
              status="loading"
              showPercentage={true}
              className="mb-4"
            />
          )}
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="mt-4"
            >
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Status Badge Component
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'syncing' | 'error' | 'idle';
  text?: string;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ 
  status, 
  text, 
  className,
  showIcon = true 
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <div className="w-2 h-2 bg-green-500 rounded-full" />,
          defaultText: 'Online'
        };
      case 'offline':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <div className="w-2 h-2 bg-red-500 rounded-full" />,
          defaultText: 'Offline'
        };
      case 'syncing':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />,
          defaultText: 'Syncing'
        };
      case 'error':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertTriangle className="w-3 h-3" />,
          defaultText: 'Error'
        };
      case 'idle':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <div className="w-2 h-2 bg-gray-500 rounded-full" />,
          defaultText: 'Idle'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center space-x-1 text-xs",
        config.color,
        className
      )}
    >
      {showIcon && config.icon}
      <span>{text || config.defaultText}</span>
    </Badge>
  );
}