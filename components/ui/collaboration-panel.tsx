'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ChevronRight, 
  ChevronDown, 
  MessageCircle, 
  Settings,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { EditorPresence, ConflictItem } from '@/lib/realtime/types';
import { 
  UserPresenceList, 
  CollaborationStatusBar,
  useCollaborationNotifications,
  CollaborationNotifications
} from './collaboration-ui';
import { PresenceIndicators } from '../realtime/PresenceIndicators';

interface CollaborationPanelProps {
  activeEditors: EditorPresence[];
  currentUserId?: string;
  isConnected: boolean;
  conflictedItems: ConflictItem[];
  className?: string;
  onResolveConflict?: (conflictId: string) => void;
}

export function CollaborationPanel({ 
  activeEditors, 
  currentUserId, 
  isConnected, 
  conflictedItems,
  className,
  onResolveConflict
}: CollaborationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'conflicts' | 'activity'>('users');
  
  const {
    notifications,
    dismissNotification,
    clearAllNotifications
  } = useCollaborationNotifications();

  const totalOnlineUsers = activeEditors.length;
  const editingUsers = activeEditors.filter(user => user.action === 'editing');
  const conflictCount = conflictedItems.length;

  if (isMinimized) {
    return (
      <>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "fixed bottom-4 right-4 z-40",
            className
          )}
        >
          <Button
            onClick={() => setIsMinimized(false)}
            className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <Users className="h-5 w-5" />
            {totalOnlineUsers > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs min-w-[1.25rem] h-5">
                {totalOnlineUsers}
              </Badge>
            )}
          </Button>
        </motion.div>
        <CollaborationNotifications 
          notifications={notifications}
          onDismiss={dismissNotification}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        className={cn(
          "fixed right-4 top-20 z-40 w-80",
          className
        )}
      >
        <Card className="shadow-lg border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-medium">Collaboration</CardTitle>
                {totalOnlineUsers > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {totalOnlineUsers} online
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-3 w-3" />
                  ) : (
                    <Maximize2 className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsMinimized(true)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <CollaborationStatusBar
              activeEditors={activeEditors}
              isConnected={isConnected}
              conflictCount={conflictCount}
              className="mt-2"
            />
          </CardHeader>

          <CardContent className="p-0">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('users')}
                className={cn(
                  "flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                  activeTab === 'users'
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                Users ({totalOnlineUsers})
              </button>
              <button
                onClick={() => setActiveTab('conflicts')}
                className={cn(
                  "flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                  activeTab === 'conflicts'
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                Conflicts ({conflictCount})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={cn(
                  "flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                  activeTab === 'activity'
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                Activity
              </button>
            </div>

            {/* Tab Content */}
            <div className={cn(
              "transition-all duration-200",
              isExpanded ? "max-h-96 overflow-y-auto" : "max-h-48 overflow-y-auto"
            )}>
              <AnimatePresence mode="wait">
                {activeTab === 'users' && (
                  <motion.div
                    key="users"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3"
                  >
                    <UserPresenceList
                      activeEditors={activeEditors}
                      currentUserId={currentUserId}
                      showDetails={isExpanded}
                    />
                    
                    {editingUsers.length > 0 && (
                      <>
                        <Separator className="my-3" />
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                            Currently Editing
                          </h4>
                          {editingUsers.map(user => (
                            <div key={user.userId} className="flex items-center space-x-2 text-xs">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-gray-600">
                                {user.userName} - {user.componentId || 'Unknown component'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === 'conflicts' && (
                  <motion.div
                    key="conflicts"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3"
                  >
                    {conflictedItems.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No conflicts detected</p>
                        <p className="text-xs text-gray-400 mt-1">
                          All changes are synchronized
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {conflictedItems.map(conflict => (
                          <div
                            key={conflict.id}
                            className="border border-yellow-200 bg-yellow-50 rounded-lg p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-yellow-800">
                                  {conflict.type === 'content' ? 'Content Conflict' : 'Structure Conflict'}
                                </h4>
                                <p className="text-xs text-yellow-700 mt-1">
                                  Component: {conflict.componentId}
                                </p>
                                <p className="text-xs text-yellow-600 mt-1">
                                  Conflicted by: {conflict.conflictedBy}
                                </p>
                                <p className="text-xs text-yellow-600">
                                  {new Date(conflict.conflictedAt).toLocaleString()}
                                </p>
                              </div>
                              {onResolveConflict && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => onResolveConflict(conflict.id)}
                                >
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Recent Activity
                        </h4>
                        {notifications.length > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={clearAllNotifications}
                          >
                            Clear All
                          </Button>
                        )}
                      </div>
                      
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No recent activity</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {notifications.slice(0, 10).map(notification => (
                            <div
                              key={notification.id}
                              className="flex items-start space-x-2 p-2 rounded-lg bg-gray-50"
                            >
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0"
                                onClick={() => dismissNotification(notification.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <CollaborationNotifications 
        notifications={notifications}
        onDismiss={dismissNotification}
        className="top-20 right-[22rem]" // Position to the left of the panel
      />
    </>
  );
}