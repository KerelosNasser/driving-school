import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditingToolbar } from '../../components/ui/editing-toolbar';
import { CollaborationPanel } from '../../components/ui/collaboration-panel';
import { SystemStatus } from '../../components/ui/system-status';
import { NotificationProvider, useNotifications } from '../../components/ui/notification-system';
import { 
  LoadingSpinner, 
  ProgressIndicator, 
  OperationStatus,
  ConnectionStatus,
  ConflictIndicator
} from '../../components/ui/visual-feedback';
import { EditorPresence, ConflictItem } from '../../lib/realtime/types';

// Mock the edit mode context
const mockEditModeContext = {
  isEditMode: true,
  toggleEditMode: jest.fn(),
  isAdmin: true,
  isSaving: false,
  saveState: 'idle' as const,
  isConnected: true,
  activeEditors: [] as EditorPresence[],
  conflictedItems: [] as ConflictItem[],
  resolveConflict: jest.fn()
};

jest.mock('../../contexts/editModeContext', () => ({
  useEditMode: () => mockEditModeContext
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Collaborative Editing UI Components', () => {
  describe('EditingToolbar', () => {
    it('renders toolbar with admin access', () => {
      render(<EditingToolbar />);
      
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      expect(screen.getByText('Edit Mode')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('shows save status correctly', () => {
      mockEditModeContext.saveState = 'saving';
      mockEditModeContext.isSaving = true;
      
      render(<EditingToolbar />);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('displays active editors count', () => {
      mockEditModeContext.activeEditors = [
        {
          userId: '1',
          userName: 'John Doe',
          action: 'editing',
          lastSeen: new Date().toISOString()
        }
      ];
      
      render(<EditingToolbar />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('handles edit mode toggle', () => {
      render(<EditingToolbar />);
      
      const toggleButton = screen.getByText('Exit Edit');
      fireEvent.click(toggleButton);
      
      expect(mockEditModeContext.toggleEditMode).toHaveBeenCalled();
    });
  });

  describe('Visual Feedback Components', () => {
    it('renders loading spinner with text', () => {
      render(<LoadingSpinner text="Loading content..." />);
      
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('shows progress indicator with percentage', () => {
      render(
        <ProgressIndicator 
          progress={75} 
          status="loading" 
          text="Uploading files..." 
          showPercentage={true}
        />
      );
      
      expect(screen.getByText('Uploading files...')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('displays operation status correctly', () => {
      render(
        <OperationStatus 
          operation="save" 
          status="success" 
          message="Content saved successfully"
        />
      );
      
      expect(screen.getByText('Content saved successfully')).toBeInTheDocument();
    });

    it('shows connection status with reconnect option', () => {
      const mockReconnect = jest.fn();
      
      render(
        <ConnectionStatus 
          isConnected={false}
          onReconnect={mockReconnect}
          showReconnectButton={true}
        />
      );
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
      
      const reconnectButton = screen.getByText('Reconnect');
      fireEvent.click(reconnectButton);
      
      expect(mockReconnect).toHaveBeenCalled();
    });

    it('displays conflict indicator with resolve actions', () => {
      const mockResolveAll = jest.fn();
      const mockViewConflicts = jest.fn();
      
      render(
        <ConflictIndicator 
          conflictCount={3}
          onResolveAll={mockResolveAll}
          onViewConflicts={mockViewConflicts}
        />
      );
      
      expect(screen.getByText('3 conflicts detected')).toBeInTheDocument();
      
      const resolveButton = screen.getByText('Resolve All');
      fireEvent.click(resolveButton);
      
      expect(mockResolveAll).toHaveBeenCalled();
    });
  });

  describe('CollaborationPanel', () => {
    const mockProps = {
      activeEditors: [
        {
          userId: '1',
          userName: 'John Doe',
          action: 'editing' as const,
          lastSeen: new Date().toISOString()
        },
        {
          userId: '2',
          userName: 'Jane Smith',
          action: 'idle' as const,
          lastSeen: new Date().toISOString()
        }
      ],
      currentUserId: '1',
      isConnected: true,
      conflictedItems: [
        {
          id: 'conflict-1',
          type: 'content' as const,
          componentId: 'comp-1',
          localVersion: 'local',
          remoteVersion: 'remote',
          conflictedAt: new Date().toISOString(),
          conflictedBy: 'Jane Smith'
        }
      ],
      onResolveConflict: jest.fn()
    };

    it('renders collaboration panel with user list', () => {
      render(<CollaborationPanel {...mockProps} />);
      
      expect(screen.getByText('Collaboration')).toBeInTheDocument();
      expect(screen.getByText('2 online')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('shows conflicts tab with conflict details', () => {
      render(<CollaborationPanel {...mockProps} />);
      
      const conflictsTab = screen.getByText('Conflicts (1)');
      fireEvent.click(conflictsTab);
      
      expect(screen.getByText('Content Conflict')).toBeInTheDocument();
      expect(screen.getByText('Component: comp-1')).toBeInTheDocument();
    });

    it('handles conflict resolution', async () => {
      render(<CollaborationPanel {...mockProps} />);
      
      const conflictsTab = screen.getByText('Conflicts (1)');
      fireEvent.click(conflictsTab);
      
      const resolveButton = screen.getByText('Resolve');
      fireEvent.click(resolveButton);
      
      expect(mockProps.onResolveConflict).toHaveBeenCalledWith('conflict-1');
    });
  });

  describe('SystemStatus', () => {
    const mockStatusProps = {
      isConnected: true,
      activeEditors: [
        {
          userId: '1',
          userName: 'John Doe',
          action: 'editing' as const,
          lastSeen: new Date().toISOString()
        }
      ],
      conflictedItems: [],
      saveState: 'saved' as const,
      onReconnect: jest.fn(),
      onResolveConflicts: jest.fn()
    };

    it('renders system status in compact mode', () => {
      render(<SystemStatus {...mockStatusProps} compact={true} />);
      
      // Should show status badges
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('shows expanded details when not compact', () => {
      render(<SystemStatus {...mockStatusProps} compact={false} />);
      
      expect(screen.getByText('System Status')).toBeInTheDocument();
      expect(screen.getByText('Connection')).toBeInTheDocument();
      expect(screen.getByText('Active Users (1)')).toBeInTheDocument();
    });

    it('handles reconnection in expanded mode', () => {
      const disconnectedProps = {
        ...mockStatusProps,
        isConnected: false
      };
      
      render(<SystemStatus {...disconnectedProps} compact={false} />);
      
      const reconnectButton = screen.getByText('Reconnect');
      fireEvent.click(reconnectButton);
      
      expect(mockStatusProps.onReconnect).toHaveBeenCalled();
    });
  });

  describe('NotificationSystem', () => {
    function TestComponent() {
      const { notifySuccess, notifyError, notifications } = useNotifications();
      
      return (
        <div>
          <button onClick={() => notifySuccess('Test Success', 'Success message')}>
            Success
          </button>
          <button onClick={() => notifyError('Test Error', 'Error message')}>
            Error
          </button>
          <div data-testid="notification-count">{notifications.length}</div>
        </div>
      );
    }

    it('provides notification context and methods', () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      const successButton = screen.getByText('Success');
      fireEvent.click(successButton);
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    });

    it('handles different notification types', () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      const errorButton = screen.getByText('Error');
      fireEvent.click(errorButton);
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    });
  });
});

// Integration test for the complete collaborative editing system
describe('Collaborative Editing Integration', () => {
  it('integrates all components correctly', async () => {
    const mockProps = {
      activeEditors: [
        {
          userId: '1',
          userName: 'John Doe',
          action: 'editing' as const,
          lastSeen: new Date().toISOString()
        }
      ],
      conflictedItems: [
        {
          id: 'conflict-1',
          type: 'content' as const,
          componentId: 'comp-1',
          localVersion: 'local',
          remoteVersion: 'remote',
          conflictedAt: new Date().toISOString(),
          conflictedBy: 'Jane Smith'
        }
      ]
    };

    mockEditModeContext.activeEditors = mockProps.activeEditors;
    mockEditModeContext.conflictedItems = mockProps.conflictedItems;
    mockEditModeContext.saveState = 'conflict';

    render(
      <NotificationProvider>
        <div>
          <EditingToolbar />
          <SystemStatus
            isConnected={true}
            activeEditors={mockProps.activeEditors}
            conflictedItems={mockProps.conflictedItems}
            saveState="conflict"
            onReconnect={jest.fn()}
            onResolveConflicts={jest.fn()}
          />
        </div>
      </NotificationProvider>
    );

    // Verify toolbar shows conflict state
    expect(screen.getByText('1 conflict')).toBeInTheDocument();
    
    // Verify system status shows the conflict
    expect(screen.getByText('1 conflict detected')).toBeInTheDocument();
    
    // Verify active editor is shown
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});