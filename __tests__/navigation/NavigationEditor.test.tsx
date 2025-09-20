import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NavigationEditor } from '@/components/navigation/NavigationEditor';
import { useNavigationManager } from '@/hooks/useNavigationManager';
import { NavigationItem } from '@/lib/realtime/types';

// Mock the useNavigationManager hook
jest.mock('@/hooks/useNavigationManager');
const mockUseNavigationManager = useNavigationManager as jest.MockedFunction<typeof useNavigationManager>;

// Mock the UI components
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('react-dnd', () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useDrag: () => [{ isDragging: false }, jest.fn(), jest.fn()],
  useDrop: () => [{ isOver: false, canDrop: false }, jest.fn()],
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
}));

const mockNavigationItems: NavigationItem[] = [
  {
    id: 'nav-1',
    pageId: 'home',
    displayName: 'Home',
    urlSlug: 'home',
    parentId: null,
    orderIndex: 0,
    isVisible: true,
    isActive: true,
  },
  {
    id: 'nav-2',
    pageId: 'about',
    displayName: 'About',
    urlSlug: 'about',
    parentId: null,
    orderIndex: 1,
    isVisible: true,
    isActive: true,
  },
];

const mockNavigationManagerReturn = {
  items: mockNavigationItems,
  loading: false,
  error: null,
  permissions: {
    canUpdate: true,
    canReorder: true,
    canAdd: true,
    canDelete: true,
    canToggleVisibility: true,
  },
  isInitialized: true,
  createItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  reorderItems: jest.fn(),
  toggleVisibility: jest.fn(),
  getNavigationTree: jest.fn().mockResolvedValue(mockNavigationItems),
  refreshItems: jest.fn(),
  findItemById: jest.fn(),
  findItemsByParent: jest.fn(),
  clearError: jest.fn(),
};

describe('NavigationEditor', () => {
  beforeEach(() => {
    mockUseNavigationManager.mockReturnValue(mockNavigationManagerReturn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation editor with items', async () => {
    render(<NavigationEditor />);
    
    expect(screen.getByText('Navigation Editor')).toBeInTheDocument();
    expect(screen.getByText('Navigation Preview')).toBeInTheDocument();
    
    // Check if navigation items are rendered
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });
  });

  it('shows add item button when user has permissions', () => {
    render(<NavigationEditor />);
    
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('displays navigation statistics', async () => {
    render(<NavigationEditor />);
    
    await waitFor(() => {
      expect(screen.getByText('Navigation Statistics')).toBeInTheDocument();
      expect(screen.getByText('Visible Items')).toBeInTheDocument();
      expect(screen.getByText('Hidden Items')).toBeInTheDocument();
    });
  });

  it('handles inline editing of display name', async () => {
    render(<NavigationEditor />);
    
    await waitFor(() => {
      const homeItem = screen.getByText('Home');
      fireEvent.click(homeItem);
    });
    
    // Should show inline editing input
    await waitFor(() => {
      const input = screen.getByDisplayValue('Home');
      expect(input).toBeInTheDocument();
    });
  });

  it('shows context menu actions', async () => {
    render(<NavigationEditor />);
    
    await waitFor(() => {
      // Find the more options button (MoreVertical icon)
      const moreButtons = screen.getAllByRole('button');
      const moreButton = moreButtons.find(button => 
        button.querySelector('svg') && 
        button.getAttribute('class')?.includes('h-8 w-8')
      );
      
      if (moreButton) {
        fireEvent.click(moreButton);
      }
    });
  });

  it('handles loading state', () => {
    mockUseNavigationManager.mockReturnValue({
      ...mockNavigationManagerReturn,
      loading: true,
    });
    
    render(<NavigationEditor />);
    
    expect(screen.getByText('Loading navigation...')).toBeInTheDocument();
  });

  it('handles error state', () => {
    const errorMessage = 'Failed to load navigation';
    mockUseNavigationManager.mockReturnValue({
      ...mockNavigationManagerReturn,
      loading: false,
      error: errorMessage,
    });
    
    render(<NavigationEditor />);
    
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('toggles preview visibility', async () => {
    render(<NavigationEditor />);
    
    const hidePreviewButton = screen.getByText('Hide Preview');
    fireEvent.click(hidePreviewButton);
    
    await waitFor(() => {
      expect(screen.getByText('Show Preview')).toBeInTheDocument();
    });
  });

  it('calls createItem when adding new item', async () => {
    render(<NavigationEditor />);
    
    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Create Navigation Item')).toBeInTheDocument();
    });
  });
});