'use client';

import React, { useState, useEffect } from 'react';
import { EditorPresence, PresenceState } from '../../lib/realtime/types';
import { PresenceTracker } from '../../lib/realtime/PresenceTracker';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';

interface PresenceIndicatorsProps {
  presenceTracker: PresenceTracker;
  className?: string;
  maxVisible?: number;
  showEditingStatus?: boolean;
}

export function PresenceIndicators({ 
  presenceTracker, 
  className,
  maxVisible = 5,
  showEditingStatus = true
}: PresenceIndicatorsProps) {
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [currentUser, setCurrentUser] = useState<EditorPresence | null>(null);

  useEffect(() => {
    // Initialize state
    setPresenceState(presenceTracker.getPresenceState());
    setCurrentUser(presenceTracker.getCurrentPresence());

    // Listen for presence updates
    const handlePresenceStateChanged = (state: PresenceState) => {
      setPresenceState(state);
    };

    const handlePresenceUpdate = (presence: EditorPresence) => {
      if (presence.userId === currentUser?.userId) {
        setCurrentUser(presence);
      }
    };

    presenceTracker.on('presenceStateChanged', handlePresenceStateChanged);
    presenceTracker.on('presenceUpdate', handlePresenceUpdate);

    return () => {
      presenceTracker.off('presenceStateChanged', handlePresenceStateChanged);
      presenceTracker.off('presenceUpdate', handlePresenceUpdate);
    };
  }, [presenceTracker, currentUser?.userId]);

  const activeUsers = Object.values(presenceState);
  const visibleUsers = activeUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, activeUsers.length - maxVisible);

  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn("flex items-center space-x-2", className)}>
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => (
            <UserPresenceAvatar
              key={user.userId}
              presence={user}
              showEditingStatus={showEditingStatus}
            />
          ))}
          {hiddenCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 border-2 border-white rounded-full text-xs font-medium text-gray-600">
                  +{hiddenCount}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hiddenCount} more user{hiddenCount > 1 ? 's' : ''} online</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {activeUsers.length} user{activeUsers.length > 1 ? 's' : ''} online
        </div>
      </div>
    </TooltipProvider>
  );
}

interface UserPresenceAvatarProps {
  presence: EditorPresence;
  showEditingStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function UserPresenceAvatar({ 
  presence, 
  showEditingStatus = true,
  size = 'md'
}: UserPresenceAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

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
        return 'Currently editing';
      case 'idle':
        return 'Online but idle';
      default:
        return 'Online';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Avatar className={cn(sizeClasses[size], "border-2 border-white")}>
              <AvatarImage src={presence.avatar} alt={presence.userName} />
              <AvatarFallback className="text-xs font-medium">
                {getInitials(presence.userName)}
              </AvatarFallback>
            </Avatar>
            {showEditingStatus && (
              <div 
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                  getStatusColor(presence.action)
                )}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{presence.userName}</p>
            <p className="text-xs text-gray-500">{getStatusText(presence.action)}</p>
            {presence.componentId && (
              <p className="text-xs text-blue-500">
                Editing component: {presence.componentId}
              </p>
            )}
            <p className="text-xs text-gray-400">
              Last seen: {new Date(presence.lastSeen).toLocaleTimeString()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ComponentEditingIndicatorProps {
  componentId: string;
  presenceTracker: PresenceTracker;
  className?: string;
}

export function ComponentEditingIndicator({ 
  componentId, 
  presenceTracker, 
  className 
}: ComponentEditingIndicatorProps) {
  const [editingUsers, setEditingUsers] = useState<EditorPresence[]>([]);

  useEffect(() => {
    const updateEditingUsers = () => {
      const users = presenceTracker.getUsersEditingComponent(componentId);
      setEditingUsers(users);
    };

    // Initial update
    updateEditingUsers();

    // Listen for presence updates
    const handlePresenceUpdate = () => {
      updateEditingUsers();
    };

    presenceTracker.on('presenceUpdate', handlePresenceUpdate);
    presenceTracker.on('presenceStateChanged', handlePresenceUpdate);

    return () => {
      presenceTracker.off('presenceUpdate', handlePresenceUpdate);
      presenceTracker.off('presenceStateChanged', handlePresenceUpdate);
    };
  }, [componentId, presenceTracker]);

  if (editingUsers.length === 0) {
    return null;
  }

  return (
    <div className={cn("absolute top-0 right-0 z-10", className)}>
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs">
            {editingUsers.length === 1 
              ? `${editingUsers[0].userName} is editing`
              : `${editingUsers.length} users editing`
            }
          </span>
        </div>
      </Badge>
    </div>
  );
}

interface PresenceStatusProps {
  presenceTracker: PresenceTracker;
  className?: string;
}

export function PresenceStatus({ presenceTracker, className }: PresenceStatusProps) {
  const [onlineCount, setOnlineCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<EditorPresence | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      setOnlineCount(presenceTracker.getOnlineUserCount());
      setCurrentUser(presenceTracker.getCurrentPresence());
    };

    // Initial update
    updateStatus();

    // Listen for changes
    presenceTracker.on('presenceStateChanged', updateStatus);

    return () => {
      presenceTracker.off('presenceStateChanged', updateStatus);
    };
  }, [presenceTracker]);

  return (
    <div className={cn("flex items-center space-x-2 text-sm text-gray-600", className)}>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span>
          {onlineCount} user{onlineCount !== 1 ? 's' : ''} online
        </span>
      </div>
      {currentUser && (
        <div className="flex items-center space-x-1">
          <span>•</span>
          <span>
            You are {currentUser.action === 'editing' ? 'editing' : 'online'}
          </span>
        </div>
      )}
    </div>
  );
}