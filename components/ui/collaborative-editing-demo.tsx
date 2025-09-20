'use client';

import React, { useState, useEffect } from 'react';
import { useEditMode } from '@/contexts/editModeContext';
import { EditingToolbar } from './editing-toolbar';
import { CollaborationPanel } from './collaboration-panel';
import { SystemStatus } from './system-status';
import { NotificationProvider, useNotifications } from './notification-system';
import { 
  LoadingOverlay, 
  ProgressIndicator, 
  OperationStatus,
  ConflictIndicator 
} from './visual-feedback';
import { ComponentEditingOverlay } from './collaboration-ui';
import { EditorPresence, ConflictItem } from '@/lib/realtime/types';

// Demo component showing integration of all UI components
function CollaborativeEditingDemoContent() {
  const {
    isEditMode,
    isAdmin,
    isSaving,
    saveState,
    isConnected,
    activeEditors,
    conflictedItems,
    resolveConflict
  } = useEditMode();

  const {
    notifySuccess,
    notifyError,
    notifyConnection,
    notifyCollaboration,
    notifySaveStatus
  } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSystemStatus, setShowSystemStatus] = useState(true);

  // Demo: Simulate connection changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random connection events for demo
      if (Math.random() > 0.95) {
        notifyConnection(!isConnected, 'Connection status changed');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected, notifyConnection]);

  // Demo: Handle save state changes
  useEffect(() => {
    if (saveState !== 'idle') {
      notifySaveStatus(saveState as any);
    }
  }, [saveState, notifySaveStatus]);

  // Demo: Simulate user joining/leaving
  useEffect(() => {
    if (activeEditors.length > 0) {
      const latestEditor = activeEditors[activeEditors.length - 1];
      if (latestEditor) {
        notifyCollaboration(
          'User Activity',
          `${latestEditor.userName} is ${latestEditor.action === 'editing' ? 'editing' : 'online'}`
        );
      }
    }
  }, [activeEditors, notifyCollaboration]);

  const handleResolveConflict = async (conflictId: string) => {
    try {
      await resolveConflict(conflictId, {
        conflictId,
        strategy: 'accept_remote',
        resolvedBy: 'current-user',
        resolvedAt: new Date().toISOString(),
        resultingData: {}
      });
      notifySuccess('Conflict Resolved', 'The conflict has been successfully resolved');
    } catch (error) {
      notifyError('Resolution Failed', 'Failed to resolve the conflict');
    }
  };

  const handleResolveAllConflicts = async () => {
    setIsLoading(true);
    setProgress(0);

    try {
      for (let i = 0; i < conflictedItems.length; i++) {
        await handleResolveConflict(conflictedItems[i].id);
        setProgress(((i + 1) / conflictedItems.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
      }
      notifySuccess('All Conflicts Resolved', 'All conflicts have been successfully resolved');
    } catch (error) {
      notifyError('Bulk Resolution Failed', 'Some conflicts could not be resolved');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const simulateOperation = async (operation: 'save' | 'upload' | 'sync') => {
    setIsLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
      notifySuccess(`${operation} Complete`, `The ${operation} operation completed successfully`);
    }, 2000);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Admin Access Required
        </h2>
        <p className="text-gray-500">
          You need admin privileges to access collaborative editing features.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Editing Toolbar */}
      <EditingToolbar />

      {/* Main Content Area */}
      <div className="pt-20 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Demo Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Collaborative Editing Demo
            </h1>
            <p className="text-gray-600 mb-6">
              This demo showcases all the collaborative editing UI components working together.
            </p>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">System Status</h3>
              <SystemStatus
                isConnected={isConnected}
                activeEditors={activeEditors}
                conflictedItems={conflictedItems}
                saveState={saveState}
                onReconnect={() => notifyConnection(true, 'Reconnection initiated')}
                onResolveConflicts={handleResolveAllConflicts}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Operation Status</h3>
              <div className="space-y-3">
                <OperationStatus
                  operation="save"
                  status={isSaving ? 'loading' : saveState === 'saved' ? 'success' : 'idle'}
                  message={isSaving ? 'Saving changes...' : undefined}
                />
                <OperationStatus
                  operation="sync"
                  status={isConnected ? 'success' : 'error'}
                  message={isConnected ? 'Real-time sync active' : 'Sync unavailable'}
                />
              </div>
            </div>
          </div>

          {/* Conflict Management */}
          {conflictedItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Conflict Management</h3>
              <ConflictIndicator
                conflictCount={conflictedItems.length}
                onResolveAll={handleResolveAllConflicts}
                onViewConflicts={() => console.log('View conflicts')}
              />
            </div>
          )}

          {/* Demo Operations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Demo Operations</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => simulateOperation('save')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={isLoading}
              >
                Simulate Save
              </button>
              <button
                onClick={() => simulateOperation('upload')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={isLoading}
              >
                Simulate Upload
              </button>
              <button
                onClick={() => simulateOperation('sync')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                disabled={isLoading}
              >
                Simulate Sync
              </button>
            </div>
          </div>

          {/* Progress Indicator Demo */}
          {progress > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Operation Progress</h3>
              <ProgressIndicator
                progress={progress}
                status="loading"
                text="Processing operation..."
                showPercentage={true}
              />
            </div>
          )}

          {/* Sample Editable Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sample Editable Content</h3>
            <div className="relative bg-white p-6 rounded-lg border">
              {/* Component Editing Overlay Demo */}
              {activeEditors.filter(u => u.action === 'editing').length > 0 && (
                <ComponentEditingOverlay
                  componentId="demo-component"
                  editingUsers={activeEditors.filter(u => u.action === 'editing')}
                />
              )}
              
              <h4 className="text-xl font-semibold mb-4">Sample Page Content</h4>
              <p className="text-gray-600 mb-4">
                This is a sample editable component. In edit mode, you would be able to click 
                and modify this content. The system would show real-time indicators when other 
                users are editing the same component.
              </p>
              <div className="bg-gray-100 p-4 rounded">
                <p className="text-sm text-gray-500">
                  Component ID: demo-component<br/>
                  Status: {isEditMode ? 'Editable' : 'Read-only'}<br/>
                  Active editors: {activeEditors.filter(u => u.action === 'editing').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collaboration Panel */}
      {isEditMode && (
        <CollaborationPanel
          activeEditors={activeEditors}
          currentUserId="current-user-id"
          isConnected={isConnected}
          conflictedItems={conflictedItems}
          onResolveConflict={handleResolveConflict}
        />
      )}

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={isLoading}
        message="Processing operation..."
        progress={progress}
        onCancel={() => {
          setIsLoading(false);
          setProgress(0);
          notifyError('Operation Cancelled', 'The operation was cancelled by user');
        }}
      />
    </div>
  );
}

// Main demo component with notification provider
export function CollaborativeEditingDemo() {
  return (
    <NotificationProvider>
      <CollaborativeEditingDemoContent />
    </NotificationProvider>
  );
}