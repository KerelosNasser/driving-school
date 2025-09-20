'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  X, 
  Eye, 
  Clock,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ConflictItem, ConflictClassification } from '@/lib/conflict-resolution/types';

interface ConflictNotificationProps {
  conflicts: ConflictItem[];
  classifications?: Record<string, ConflictClassification>;
  onViewConflict: (conflict: ConflictItem) => void;
  onDismiss: (conflictId: string) => void;
  onResolveAll?: () => void;
  className?: string;
}

export function ConflictNotification({
  conflicts,
  classifications = {},
  onViewConflict,
  onDismiss,
  onResolveAll,
  className = ''
}: ConflictNotificationProps) {
  const [dismissedConflicts, setDismissedConflicts] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter out dismissed conflicts
  const visibleConflicts = conflicts.filter(conflict => 
    !dismissedConflicts.has(conflict.id) && conflict.status === 'pending'
  );

  // Auto-expand if there are critical conflicts
  useEffect(() => {
    const hasCritical = visibleConflicts.some(conflict => 
      classifications[conflict.id]?.severity === 'critical'
    );
    if (hasCritical) {
      setIsExpanded(true);
    }
  }, [visibleConflicts, classifications]);

  const handleDismiss = (conflictId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDismissedConflicts(prev => new Set([...prev, conflictId]));
    onDismiss(conflictId);
  };

  const getSeverityColor = (severity?: ConflictClassification['severity']) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getHighestSeverity = () => {
    const severities = visibleConflicts.map(conflict => 
      classifications[conflict.id]?.severity || 'medium'
    );
    
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const conflictTime = new Date(timestamp);
    const diffMs = now.getTime() - conflictTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (visibleConflicts.length === 0) {
    return null;
  }

  const highestSeverity = getHighestSeverity();
  const autoResolvableCount = visibleConflicts.filter(conflict => 
    classifications[conflict.id]?.autoResolvable
  ).length;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md ${className}`}>
      <Alert className={`${getSeverityColor(highestSeverity)} shadow-lg`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {visibleConflicts.length} Conflict{visibleConflicts.length !== 1 ? 's' : ''} Detected
                </span>
                <Badge className={getSeverityColor(highestSeverity)}>
                  {highestSeverity?.toUpperCase()}
                </Badge>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-transparent"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <XCircle className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            <AlertDescription className="space-y-3">
              <p className="text-sm">
                Changes conflict with recent edits. 
                {autoResolvableCount > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    {' '}({autoResolvableCount} auto-resolvable)
                  </span>
                )}
              </p>

              {isExpanded && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {visibleConflicts.map((conflict) => {
                    const classification = classifications[conflict.id];
                    
                    return (
                      <div
                        key={conflict.id}
                        className="bg-white dark:bg-gray-800 rounded-lg p-3 border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => onViewConflict(conflict)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm truncate">
                                {conflict.componentId}
                              </span>
                              {classification && (
                                <Badge variant="outline" className="text-xs">
                                  {classification.severity}
                                </Badge>
                              )}
                              {classification?.autoResolvable && (
                                <Badge variant="secondary" className="text-xs">
                                  Auto-fix
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="truncate">{conflict.conflictedBy}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimeAgo(conflict.conflictedAt)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                            onClick={(e) => handleDismiss(conflict.id, e)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewConflict(visibleConflicts[0])}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Review
                </Button>
                
                {autoResolvableCount > 0 && onResolveAll && (
                  <Button
                    size="sm"
                    onClick={onResolveAll}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Auto-fix ({autoResolvableCount})
                  </Button>
                )}
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
}

// Compact version for toolbar/status bar
export function ConflictIndicator({
  conflictCount,
  severity,
  onClick,
  className = ''
}: {
  conflictCount: number;
  severity?: ConflictClassification['severity'];
  onClick: () => void;
  className?: string;
}) {
  if (conflictCount === 0) return null;

  const getSeverityColor = (sev?: ConflictClassification['severity']) => {
    switch (sev) {
      case 'low': return 'text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200';
      case 'critical': return 'text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`${getSeverityColor(severity)} ${className}`}
    >
      <AlertTriangle className="h-4 w-4 mr-1" />
      <span>{conflictCount} Conflict{conflictCount !== 1 ? 's' : ''}</span>
    </Button>
  );
}