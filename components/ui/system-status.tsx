'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { EditorPresence, ConflictItem } from '@/lib/realtime/types';
import { StatusBadge, ConnectionStatus, ConflictIndicator } from './visual-feedback';

interface SystemStatusProps {
  isConnected: boolean;
  isReconnecting?: boolean;
  lastConnected?: string;
  activeEditors: EditorPresence[];
  conflictedItems: ConflictItem[];
  saveState: 'idle' | 'saving' | 'saved' | 'conflict' | 'error';
  operationCount?: number;
  onReconnect?: () => void;
  onResolveConflicts?: () => void;
  className?: string;
  compact?: boolean;
}

export function SystemStatus({
  isConnected,
  isReconnecting = false,
  lastConnected,
  activeEditors,
  conflictedItems,
  saveState,
  operationCount = 0,
  onReconnect,
  onResolveConflicts,
  className,
  compact = false
}: SystemStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const editingUsers = activeEditors.filter(user => user.action === 'editing');
  const conflictCount = conflictedItems.length;

  const getOverallStatus = () => {
    if (!isConnected) return 'offline';
    if (conflictCount > 0) return 'warning';
    if (saveState === 'error') return 'error';
    if (saveState === 'saving' || isReconnecting) return 'syncing';
    return 'online';
  };

  const getStatusMessage = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'offline':
        return 'Working offline';
      case 'warning':
        return `${conflictCount} conflict${conflictCount !== 1 ? 's' : ''} detected`;
      case 'error':
        return 'System error detected';
      case 'syncing':
        return isReconnecting ? 'Reconnecting...' : 'Syncing changes...';
      case 'online':
        return `${activeEditors.length} user${activeEditors.length !== 1 ? 's' : ''} online`;
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center space-x-2", className)}>
              <StatusBadge status={getOverallStatus()} />
              {activeEditors.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {activeEditors.length}
                </Badge>
              )}
              {conflictCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {conflictCount}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-2">
              <p className="font-medium">{getStatusMessage()}</p>
              <div className="text-xs space-y-1">
                <p>Connection: {isConnected ? 'Active' : 'Lost'}</p>
                <p>Active editors: {activeEditors.length}</p>
                <p>Conflicts: {conflictCount}</p>
                <p>Save state: {saveState}</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">System Status</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Main Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <StatusBadge 
              status={getOverallStatus()} 
              text={getStatusMessage()}
              className="flex-1"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="space-y-1">
              <div className={cn(
                "text-lg font-semibold",
                isConnected ? "text-green-600" : "text-red-600"
              )}>
                {isConnected ? '●' : '○'}
              </div>
              <div className="text-xs text-gray-500">Connection</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-blue-600">
                {activeEditors.length}
              </div>
              <div className="text-xs text-gray-500">Online</div>
            </div>
            <div className="space-y-1">
              <div className={cn(
                "text-lg font-semibold",
                conflictCount > 0 ? "text-yellow-600" : "text-green-600"
              )}>
                {conflictCount}
              </div>
              <div className="text-xs text-gray-500">Conflicts</div>
            </div>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <Separator />

                {/* Connection Details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Connection
                  </h4>
                  <ConnectionStatus
                    isConnected={isConnected}
                    isReconnecting={isReconnecting}
                    lastConnected={lastConnected}
                    onReconnect={onReconnect}
                    showReconnectButton={true}
                  />
                </div>

                {/* Active Users */}
                {activeEditors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Active Users ({activeEditors.length})
                    </h4>
                    <div className="space-y-1">
                      {activeEditors.slice(0, 3).map(user => (
                        <div key={user.userId} className="flex items-center space-x-2 text-xs">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            user.action === 'editing' ? "bg-green-500 animate-pulse" : "bg-gray-400"
                          )} />
                          <span className="text-gray-600">
                            {user.userName} 
                            {user.action === 'editing' && user.componentId && (
                              <span className="text-blue-600 ml-1">
                                (editing {user.componentId})
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                      {activeEditors.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{activeEditors.length - 3} more users
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Conflicts */}
                {conflictCount > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Conflicts ({conflictCount})
                    </h4>
                    <ConflictIndicator
                      conflictCount={conflictCount}
                      onResolveAll={onResolveConflicts}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Save State */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Save State
                  </h4>
                  <div className="flex items-center space-x-2">
                    {saveState === 'saving' && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
                    {saveState === 'saved' && <CheckCircle className="h-3 w-3 text-green-500" />}
                    {saveState === 'error' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                    {saveState === 'conflict' && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                    {saveState === 'idle' && <Clock className="h-3 w-3 text-gray-400" />}
                    <span className="text-xs text-gray-600 capitalize">{saveState}</span>
                  </div>
                </div>

                {/* Performance Stats */}
                {operationCount > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Performance
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">
                        {operationCount} operations processed
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}