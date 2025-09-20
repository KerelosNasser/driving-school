'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  User, 
  Clock, 
  FileText, 
  GitMerge,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { ConflictItem, ConflictResolution, ConflictClassification } from '@/lib/conflict-resolution/types';
import { ConflictDiffView } from './ConflictDiffView';
import { ConflictNotification } from './ConflictNotification';

interface ConflictDialogProps {
  conflict: ConflictItem | null;
  classification?: ConflictClassification;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (conflictId: string, resolution: ConflictResolution['strategy'], notes?: string) => Promise<void>;
  isResolving?: boolean;
}

export function ConflictDialog({
  conflict,
  classification,
  isOpen,
  onClose,
  onResolve,
  isResolving = false
}: ConflictDialogProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictResolution['strategy'] | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showDiff, setShowDiff] = useState(true);

  // Reset state when conflict changes
  useEffect(() => {
    if (conflict) {
      setSelectedStrategy(classification?.suggestedStrategy || null);
      setResolutionNotes('');
      setShowDiff(true);
    }
  }, [conflict, classification]);

  if (!conflict) return null;

  const handleResolve = async () => {
    if (!selectedStrategy) return;
    
    try {
      await onResolve(conflict.id, selectedStrategy, resolutionNotes || undefined);
      onClose();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const getSeverityColor = (severity?: ConflictClassification['severity']) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStrategyDescription = (strategy: ConflictResolution['strategy']) => {
    switch (strategy) {
      case 'accept_remote':
        return 'Discard your changes and use the remote version';
      case 'keep_local':
        return 'Keep your changes and override the remote version';
      case 'merge':
        return 'Automatically merge compatible changes';
      case 'three_way_merge':
        return 'Perform intelligent merge with conflict resolution';
      default:
        return 'Unknown strategy';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <DialogTitle>Conflict Resolution Required</DialogTitle>
            {classification && (
              <Badge className={getSeverityColor(classification.severity)}>
                {classification.severity?.toUpperCase()}
              </Badge>
            )}
          </div>
          <DialogDescription>
            A conflict has been detected in your changes. Please review and choose how to resolve it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-6 pr-4">
              {/* Conflict Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Component:</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {conflict.componentId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Conflicted by:</span>
                    <span>{conflict.conflictedBy}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">When:</span>
                    <span>{formatTimestamp(conflict.conflictedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitMerge className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Type:</span>
                    <Badge variant="outline">
                      {conflict.type === 'content' ? 'Content' : 'Structure'}
                    </Badge>
                  </div>
                </div>

                {conflict.metadata && (
                  <Alert>
                    <AlertDescription>
                      <strong>Details:</strong> {conflict.metadata.what}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* Diff View */}
              {showDiff && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Changes Comparison</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDiff(!showDiff)}
                    >
                      {showDiff ? 'Hide' : 'Show'} Diff
                    </Button>
                  </div>
                  
                  <ConflictDiffView
                    localVersion={conflict.localVersion}
                    remoteVersion={conflict.remoteVersion}
                    contentType={conflict.type}
                  />
                </div>
              )}

              <Separator />

              {/* Resolution Strategies */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resolution Options</h3>
                
                <div className="grid gap-3">
                  {/* Accept Remote */}
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStrategy === 'accept_remote' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedStrategy('accept_remote')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedStrategy === 'accept_remote' 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Accept Remote Changes</span>
                          {classification?.suggestedStrategy === 'accept_remote' && (
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getStrategyDescription('accept_remote')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Keep Local */}
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStrategy === 'keep_local' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedStrategy('keep_local')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedStrategy === 'keep_local' 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="font-medium">Keep Local Changes</span>
                          {classification?.suggestedStrategy === 'keep_local' && (
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getStrategyDescription('keep_local')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Merge */}
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStrategy === 'merge' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedStrategy('merge')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedStrategy === 'merge' 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <GitMerge className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Automatic Merge</span>
                          {classification?.suggestedStrategy === 'merge' && (
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getStrategyDescription('merge')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Three-way Merge */}
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStrategy === 'three_way_merge' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedStrategy('three_way_merge')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedStrategy === 'three_way_merge' 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">Smart Merge</span>
                          {classification?.suggestedStrategy === 'three_way_merge' && (
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getStrategyDescription('three_way_merge')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resolution Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Resolution Notes (Optional)
                  </label>
                  <textarea
                    className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    rows={3}
                    placeholder="Add any notes about this resolution..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isResolving}>
            Cancel
          </Button>
          <Button 
            onClick={handleResolve} 
            disabled={!selectedStrategy || isResolving}
          >
            {isResolving ? 'Resolving...' : 'Resolve Conflict'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}