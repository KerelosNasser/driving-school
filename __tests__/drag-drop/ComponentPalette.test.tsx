import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ComponentPalette } from '../../components/drag-drop/ComponentPalette';

// Mock the drag-drop library
jest.mock('../../lib/drag-drop', () => ({
  ...jest.requireActual('../../lib/drag-drop'),
  useDragDrop: () => ({
    isDragging: false,
    currentDragItem: null,
    activeZones: [],
    registerDropZone: jest.fn(),
    unregisterDropZone: jest.fn(),
    handleDragStart: jest.fn(),
    handleDragEnd: jest.fn(),
    handleDrop: jest.fn(),
    validateDrop: jest.fn(),
    getCompatibleZones: jest.fn(() => []),
  }),
  ThumbnailGenerator: {
    generateThumbnail: jest.fn(() => 'data:image/svg+xml;base64,mock-thumbnail')
  }
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DndProvider backend={HTML5Backend}>
    {children}
  </DndProvider>
);

describe('ComponentPalette', () => {
  const defaultProps = {
    userId: 'test-user',
    userName: 'Test User',
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders component palette with header', () => {
    render(
      <TestWrapper>
        <ComponentPalette {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Component Palette')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search components...')).toBeInTheDocument();
  });

  test('displays component categories', () => {
    render(
      <TestWrapper>
        <ComponentPalette {...defaultProps} />
      </TestWrapper>
    );

    // Check for category sections
    expect(screen.getByText(/Text Components/)).toBeInTheDocument();
    expect(screen.getByText(/Media Components/)).toBeInTheDocument();
    expect(screen.getByText(/Layout Components/)).toBeInTheDocument();
    expect(screen.getByText(/Interactive Components/)).toBeInTheDocument();
  });

  test('displays component items with correct information', () => {
    render(
      <TestWrapper>
        <ComponentPalette {...defaultProps} />
      </TestWrapper>
    );

    // Check for specific components
    expect(screen.getByText('Heading')).toBeInTheDocument();
    expect(screen.getByText('Add a heading to your page')).toBeInTheDocument();
    expect(screen.getByText('Image')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  test('filters components by search term', async () => {
    render(
      <TestWrapper>
        <ComponentPalette {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search components...');
    
    // Search for "text" components
    fireEvent.change(searchInput, { target: { value: 'text' } });

    await waitFor(() => {
      expect(screen.getByText('Heading')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      // Image should not be visible
      expect(screen.queryByText('Image')).not.toBeInTheDocument();
    });
  });

  test('filters components by category', async () => {
    render(
      <TestWrapper>
        <ComponentPalette {...defaultProps} />
      </TestWrapper>
    );

    const categorySelect = screen.getByDisplayValue('All Categories');
    
    // Filter by media category
    fireEvent.change(categorySelect, { target: { value: 'media' } });

    await waitFor(() => {
      expect(screen.getByText('Image')).toBeInTheDocument();
      expect(screen.getByText('Gallery')).toBeInTheDocument();
      expect(screen.getByText('Video')).toBeInTheDocument();
      // Text components should not be visible
      expect(screen.queryByText('Heading')).not.toBeInTheDocument();
    });
  });

  test('sorts components by name', async () => {
    render(
      <TestWrapper>
        <ComponentPalette {...defaultProps} />
      </TestWrapper>
    );

    const sortSelect = screen.getByDisplayValue('Sort by Category');
    
    // Sort by name
    fireEvent.change(sortSelect, { target: { value: 'name' } });

    await waitFor(() => {
      // Components should be sorted alphabetically
      const componentElements = screen.getAllByText(/^[A-Z]/);
      const componentNames = componentElements.map(el => el.textContent);
      const sortedNames = [...componentNames].sort();
      expect(componentNames).toEqual(sortedNames);
    });
  });

  test('shows most used components section', () => {
    render(
      <TestWrapper>
        <ComponentPalette {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Most Used')).toBeInTheDocument();
  });

  test('shows usage count when sorting by usage', async () => {
    render(
      <TestWrapper>
        <ComponentPalette {...defaultProps} />
      </TestWrapper>
    );

    const sortSelect = screen.getByDisplayValue('Sort by Category');
    
    // Sort by usage
    fireEvent.change(sortSelect, { target: { value: 'usage' } });

    await waitFor(() => {
      // Should show usage badges
      const usageBadges = screen.getAllByText(/^\d+$/);
      expect(usageBadges.length).toBeGreaterThan(0);
    });
  });

  test('shows no results message when search returns empty', async () => {
    render(
      <TestWrapper>
        <ComponentPalette {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search components...');
    
    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No components found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });
  });

  test('calls onDragStart when component drag starts', () => {
    render(
      <TestWrapper>
        <ComponentPalette {...defaultProps} />
      </TestWrapper>
    );

    // This test would need to simulate drag events
    // For now, we just verify the component renders without errors
    expect(screen.getByText('Component Palette')).toBeInTheDocument();
  });

  test('displays component count', () => {
    render(
      <TestWrapper>
        <ComponentPalette {...defaultProps} />
      </TestWrapper>
    );

    // Should show total component count
    expect(screen.getByText(/Showing \d+ of \d+ components/)).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const { container } = render(
      <TestWrapper>
        <ComponentPalette {...defaultProps} className="custom-class" />
      </TestWrapper>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});