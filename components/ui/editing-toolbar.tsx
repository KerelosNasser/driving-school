'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Edit3,
    Save,
    EyeOff,
    Loader2,
    Undo2,
    Redo2,
    Users,
    Wifi,
    WifiOff,
    AlertTriangle,
    CheckCircle,
    Clock,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditMode } from '@/contexts/editModeContext';

type SaveState = 'idle' | 'saving' | 'saved' | 'conflict' | 'error';

interface OperationHistoryItem {
  id: string;
  type: 'content_change' | 'component_add' | 'component_move' | 'component_delete';
  description: string;
  timestamp: string;
  canUndo: boolean;
  canRedo: boolean;
}

export function EditingToolbar() {
  const { 
    isEditMode, 
    toggleEditMode, 
    isAdmin, 
    isSaving, 
    saveState,
    isConnected,
    activeEditors,
    conflictedItems
  } = useEditMode();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [operationHistory, setOperationHistory] = useState<OperationHistoryItem[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  // Mock operation history for demonstration
  useEffect(() => {
    if (isEditMode) {
      setOperationHistory([
        {
          id: '1',
          type: 'content_change',
          description: 'Updated hero text',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          canUndo: true,
          canRedo: false
        },
        {
          id: '2',
          type: 'component_add',
          description: 'Added image component',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          canUndo: true,
          canRedo: false
        }
      ]);
      setCurrentHistoryIndex(1);
    }
  }, [isEditMode]);

  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(currentHistoryIndex - 1);
      // TODO: Implement actual undo logic
      console.log('Undo operation:', operationHistory[currentHistoryIndex]);
    }
  };

  const handleRedo = () => {
    if (currentHistoryIndex < operationHistory.length - 1) {
      setCurrentHistoryIndex(currentHistoryIndex + 1);
      // TODO: Implement actual redo logic
      console.log('Redo operation:', operationHistory[currentHistoryIndex + 1]);
    }
  };

  const getSaveStatusIcon = () => {
    switch (saveState) {
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'saved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'conflict':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSaveStatusText = () => {
    switch (saveState) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'All changes saved';
      case 'conflict':
        return `${conflictedItems.length} conflict${conflictedItems.length !== 1 ? 's' : ''}`;
      case 'error':
        return 'Save failed';
      default:
        return 'Ready';
    }
  };

  const getSaveStatusColor = () => {
    switch (saveState) {
      case 'saving':
        return 'text-yellow-400';
      case 'saved':
        return 'text-green-400';
      case 'conflict':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!isAdmin) return null;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Left Section - Status and Save State */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white font-medium text-sm">Admin Panel</span>
                <Badge variant="secondary" className="text-xs">
                  {isEditMode ? 'Edit Mode' : 'Preview Mode'}
                </Badge>
              </div>

              {/* Connection Status */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-1">
                    {isConnected ? (
                      <Wifi className="h-4 w-4 text-green-400" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                      {isConnected ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isConnected ? 'Real-time collaboration active' : 'Working offline - changes will sync when reconnected'}</p>
                </TooltipContent>
              </Tooltip>

              {/* Save Status */}
              <div className={`flex items-center space-x-2 ${getSaveStatusColor()}`}>
                {getSaveStatusIcon()}
                <span className="text-sm">{getSaveStatusText()}</span>
              </div>

              {/* Active Editors Count */}
              {activeEditors.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-1 text-blue-400">
                      <Users className="h-4 w-4" />
                      <span className="text-xs">{activeEditors.length}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">Active Editors:</p>
                      {activeEditors.map(editor => (
                        <p key={editor.userId} className="text-xs">
                          {editor.userName} {editor.action === 'editing' ? '(editing)' : '(idle)'}
                        </p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-2">
              {/* Undo/Redo Buttons */}
              {isEditMode && (
                <div className="flex items-center space-x-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-slate-800 p-2"
                        onClick={handleUndo}
                        disabled={currentHistoryIndex <= 0}
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Undo last action</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-slate-800 p-2"
                        onClick={handleRedo}
                        disabled={currentHistoryIndex >= operationHistory.length - 1}
                      >
                        <Redo2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Redo last action</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}

              {/* Collapse/Expand Button */}
              {isEditMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-slate-800"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {isCollapsed ? '▼' : '▲'}
                </Button>
              )}

              {/* Main Toggle Button */}
              <Button
                onClick={toggleEditMode}
                size="sm"
                className={`${
                  isEditMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
                disabled={isSaving}
              >
                {isEditMode ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Exit Edit
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit Page
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Expanded Toolbar Content */}
          <AnimatePresence>
            {!isCollapsed && isEditMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-slate-700 py-3 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-white text-sm font-medium">Edit Tools:</span>
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="text-xs text-white border-slate-600">
                        Click any text to edit
                      </Badge>
                      <Badge variant="outline" className="text-xs text-white border-slate-600">
                        Hover components for actions
                      </Badge>
                      {conflictedItems.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conflictedItems.length} conflict{conflictedItems.length !== 1 ? 's' : ''} need resolution
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Operation History */}
                    {operationHistory.length > 0 && (
                      <div className="text-xs text-gray-400">
                        {currentHistoryIndex + 1} of {operationHistory.length} operations
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-slate-600 hover:bg-slate-800"
                      disabled={saveState === 'saving'}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save All Changes
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Spacer to prevent content overlap */}
      <div className="h-16"></div>
    </TooltipProvider>
  );
}