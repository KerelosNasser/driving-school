'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageCircle, 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Info,
  UserPlus,
  UserMinus,
  Edit3
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { EditorPresence } from '@/lib/realtime/types';

interface CollaborationNotification {
  id: string;
  type: 'user_joined' | 'user_left' | 'conflict_resolved' | 'save_success' | 'save_error' | 'component_edited';
  title: string;
  message: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  avatar?: string;
  componentId?: string;
  autoHide?: boolean;
  duration?: number;
}

interface CollaborationNotificationsProps {
  notifications: CollaborationNotification[];
  onDismiss: (id: string) => void;
  className?: string;
}

export function CollaborationNotifications({ 
  notifications, 
  onDismiss, 
  className 
}: CollaborationNotificationsProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<CollaborationNotification[]>([]);

  useEffect(() => {
    setVisibleNotifications(notifications);

    // Auto-hide notifications with autoHide enabled
    notifications.forEach(notification => {
      if (notification.autoHide) {
        const duration = notification.duration || 5000;
        setTimeout(() => {
          onDismiss(notification.id);
        }, duration);
      }
    });
  }, [notifications, onDismiss]);

  const getNotificationIcon = (type: CollaborationNotification['type']) => {
    switch (type) {
      case 'user_joined':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'user_left':
        return <UserMinus className="h-4 w-4 text-gray-500" />;
      case 'conflict_resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'save_success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'save_error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'component_edited':
        return <Edit3 className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: CollaborationNotification['type']) => {
    switch (type) {
      case 'user_joined':
      case 'conflict_resolved':
      case 'save_success':
        return 'border-green-200 bg-green-50';
      case 'save_error':
        return 'border-red-200 bg-red-50';
      case 'user_left':
        return 'border-gray-200 bg-gray-50';
      case 'component_edited':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className={cn("fixed top-20 right-4 z-40 space-y-2 max-w-sm", className)}>
      <AnimatePresence>
        {visibleNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className={cn(
              "border rounded-lg shadow-lg p-4",
              getNotificationColor(notification.type)
            )}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {notification.avatar ? (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={notification.avatar} alt={notification.userName} />
                    <AvatarFallback className="text-xs">
                      {notification.userName?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  getNotificationIcon(notification.type)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-6 w-6 p-0"
                onClick={() => onDismiss(notification.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface UserPresenceListProps {
  activeEditors: EditorPresence[];
  currentUserId?: string;
  className?: string;
  showDetails?: boolean;
}

export function UserPresenceList({ 
  activeEditors, 
  currentUserId, 
  className,
  showDetails = true
}: UserPresenceListProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (action: EditorPresence['action']) => {
    switch (action) {
      case 'editing':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (action: EditorPresence['action']) => {
    switch (action) {
      case 'editing':
        return 'Editing';
      case 'idle':
        return 'Online';
      default:
        return 'Away';
    }
  };

  if (activeEditors.length === 0) {
    return (
      <div className={cn("text-center py-4 text-gray-500", className)}>
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No other users online</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {activeEditors.map((editor) => (
        <div
          key={editor.userId}
          className={cn(
            "flex items-center space-x-3 p-2 rounded-lg",
            editor.userId === currentUserId ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
          )}
        >
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarImage src={editor.avatar} alt={editor.userName} />
              <AvatarFallback className="text-xs font-medium">
                {getInitials(editor.userName)}
              </AvatarFallback>
            </Avatar>
            <div 
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                getStatusColor(editor.action)
              )}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {editor.userName}
                {editor.userId === currentUserId && (
                  <span className="text-xs text-blue-600 ml-1">(You)</span>
                )}
              </p>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs",
                  editor.action === 'editing' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                )}
              >
                {getStatusText(editor.action)}
              </Badge>
            </div>
            
            {showDetails && (
              <div className="text-xs text-gray-500 mt-1">
                {editor.componentId ? (
                  <span>Editing: {editor.componentId}</span>
                ) : (
                  <span>Last seen: {new Date(editor.lastSeen).toLocaleTimeString()}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ComponentEditingOverlayProps {
  componentId: string;
  editingUsers: EditorPresence[];
  className?: string;
}

export function ComponentEditingOverlay({ 
  componentId, 
  editingUsers, 
  className 
}: ComponentEditingOverlayProps) {
  if (editingUsers.length === 0) {
    return null;
  }

  const primaryEditor = editingUsers[0];
  const otherEditorsCount = editingUsers.length - 1;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "absolute -top-2 -right-2 z-20 flex items-center space-x-1",
            className
          )}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
              <Avatar className="w-4 h-4 mr-1">
                <AvatarImage src={primaryEditor.avatar} alt={primaryEditor.userName} />
                <AvatarFallback className="text-xs">
                  {primaryEditor.userName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span>
                {primaryEditor.userName.split(' ')[0]}
                {otherEditorsCount > 0 && ` +${otherEditorsCount}`}
              </span>
            </motion.div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Currently editing:</p>
            {editingUsers.map(user => (
              <p key={user.userId} className="text-xs">
                {user.userName}
              </p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CollaborationStatusBarProps {
  activeEditors: EditorPresence[];
  isConnected: boolean;
  conflictCount: number;
  className?: string;
}

export function CollaborationStatusBar({ 
  activeEditors, 
  isConnected, 
  conflictCount,
  className 
}: CollaborationStatusBarProps) {
  return (
    <div className={cn("flex items-center space-x-4 text-sm", className)}>
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isConnected ? "bg-green-500" : "bg-red-500"
        )} />
        <span className={isConnected ? "text-green-600" : "text-red-600"}>
          {isConnected ? "Connected" : "Offline"}
        </span>
      </div>

      {/* Active Users */}
      {activeEditors.length > 0 && (
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">
            {activeEditors.length} user{activeEditors.length !== 1 ? 's' : ''} online
          </span>
        </div>
      )}

      {/* Conflicts */}
      {conflictCount > 0 && (
        <div className="flex items-center space-x-1">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-yellow-600">
            {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

// Hook for managing collaboration notifications
export function useCollaborationNotifications() {
  const [notifications, setNotifications] = useState<CollaborationNotification[]>([]);

  const addNotification = (notification: Omit<CollaborationNotification, 'id' | 'timestamp'>) => {
    const newNotification: CollaborationNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      autoHide: notification.autoHide ?? true,
      duration: notification.duration ?? 5000
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep max 5 notifications
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Helper functions for common notification types
  const notifyUserJoined = (user: EditorPresence) => {
    addNotification({
      type: 'user_joined',
      title: 'User Joined',
      message: `${user.userName} joined the editing session`,
      userId: user.userId,
      userName: user.userName,
      avatar: user.avatar
    });
  };

  const notifyUserLeft = (user: EditorPresence) => {
    addNotification({
      type: 'user_left',
      title: 'User Left',
      message: `${user.userName} left the editing session`,
      userId: user.userId,
      userName: user.userName,
      avatar: user.avatar
    });
  };

  const notifyConflictResolved = (componentId: string) => {
    addNotification({
      type: 'conflict_resolved',
      title: 'Conflict Resolved',
      message: `Conflict in ${componentId} has been resolved`,
      componentId
    });
  };

  const notifySaveSuccess = (message: string = 'Changes saved successfully') => {
    addNotification({
      type: 'save_success',
      title: 'Saved',
      message,
      duration: 3000
    });
  };

  const notifySaveError = (message: string = 'Failed to save changes') => {
    addNotification({
      type: 'save_error',
      title: 'Save Error',
      message,
      autoHide: false
    });
  };

  const notifyComponentEdited = (componentId: string, userName: string) => {
    addNotification({
      type: 'component_edited',
      title: 'Component Updated',
      message: `${userName} is editing ${componentId}`,
      componentId,
      userName,
      duration: 3000
    });
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,
    notifyUserJoined,
    notifyUserLeft,
    notifyConflictResolved,
    notifySaveSuccess,
    notifySaveError,
    notifyComponentEdited
  };
}