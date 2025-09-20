import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { NavigationItem } from '@/lib/realtime/types';
import { 
  NavigationManager, 
  createNavigationManager, 
  NavigationPermissions,
  NavigationOperationResult,
  NavigationReorderOperation
} from '@/lib/navigation/NavigationManager';
import { getEventRouter } from '@/lib/realtime';

export interface UseNavigationManagerOptions {
  autoSync?: boolean;
  syncInterval?: number;
  includeHidden?: boolean;
}

export interface NavigationManagerState {
  items: NavigationItem[];
  loading: boolean;
  error: string | null;
  permissions: typeof NavigationPermissions.ADMIN;
  isInitialized: boolean;
}

export interface NavigationManagerActions {
  // Data fetching
  refreshItems: () => Promise<void>;
  getNavigationTree: (includeHidden?: boolean) => Promise<NavigationItem[]>;
  
  // CRUD operations
  createItem: (itemData: Omit<NavigationItem, 'id'>) => Promise<NavigationOperationResult>;
  updateItem: (itemId: string, updates: Partial<Omit<NavigationItem, 'id'>>) => Promise<NavigationOperationResult>;
  deleteItem: (itemId: string) => Promise<NavigationOperationResult>;
  
  // Reordering and visibility
  reorderItems: (operations: NavigationReorderOperation[]) => Promise<NavigationOperationResult>;
  toggleVisibility: (itemId: string, isVisible: boolean) => Promise<NavigationOperationResult>;
  
  // Utility functions
  findItemById: (itemId: string) => NavigationItem | undefined;
  findItemsByParent: (parentId: string | null) => NavigationItem[];
  clearError: () => void;
}

export function useNavigationManager(options: UseNavigationManagerOptions = {}) {
  const { user, isLoaded } = useUser();
  const {
    autoSync = true,
    syncInterval = 30000, // 30 seconds
    includeHidden = false
  } = options;

  // State
  const [state, setState] = useState<NavigationManagerState>({
    items: [],
    loading: true,
    error: null,
    permissions: NavigationPermissions.VIEWER,
    isInitialized: false
  });

  // Refs
  const navigationManagerRef = useRef<NavigationManager | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to get user permissions
  const getUserPermissions = useCallback((userId: string, userRole?: string) => {
    if (process.env.NODE_ENV === 'development') {
      return NavigationPermissions.ADMIN;
    }
    
    if (userRole === 'admin') {
      return NavigationPermissions.ADMIN;
    } else if (userRole === 'editor') {
      return NavigationPermissions.EDITOR;
    } else {
      return NavigationPermissions.VIEWER;
    }
  }, []);

  // Initialize navigation manager
  useEffect(() => {
    if (!isLoaded || !user) return;

    const initializeManager = async () => {
      try {
        const permissions = getUserPermissions(user.id, user.publicMetadata?.role as string);
        
        navigationManagerRef.current = createNavigationManager({
          eventRouter: getEventRouter(),
          userId: user.id,
          permissions
        });

        await navigationManagerRef.current.initialize(user.id, permissions);

        setState(prev => ({
          ...prev,
          permissions,
          isInitialized: true
        }));

        // Initial data load
        await refreshItems();
      } catch (error) {
        console.error('Failed to initialize navigation manager:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to initialize navigation manager',
          loading: false
        }));
      }
    };

    initializeManager();

    // Cleanup
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isLoaded, user, getUserPermissions]);

  // Auto-sync setup
  useEffect(() => {
    if (!autoSync || !state.isInitialized) return;

    syncIntervalRef.current = setInterval(() => {
      refreshItems();
    }, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, syncInterval, state.isInitialized]);

  // Refresh navigation items
  const refreshItems = useCallback(async () => {
    if (!navigationManagerRef.current) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const items = await navigationManagerRef.current.getNavigationItems({
        includeHidden,
        orderBy: 'orderIndex'
      });

      setState(prev => ({
        ...prev,
        items,
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('Failed to refresh navigation items:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load navigation items'
      }));
    }
  }, [includeHidden]);

  // Get navigation tree
  const getNavigationTree = useCallback(async (includeHidden = false): Promise<NavigationItem[]> => {
    if (!navigationManagerRef.current) {
      throw new Error('Navigation manager not initialized');
    }

    try {
      return await navigationManagerRef.current.getNavigationTree(includeHidden);
    } catch (error) {
      console.error('Failed to get navigation tree:', error);
      throw error;
    }
  }, []);

  // Create navigation item
  const createItem = useCallback(async (itemData: Omit<NavigationItem, 'id'>): Promise<NavigationOperationResult> => {
    if (!navigationManagerRef.current) {
      return {
        success: false,
        error: 'Navigation manager not initialized'
      };
    }

    try {
      const result = await navigationManagerRef.current.createNavigationItem(itemData);
      
      if (result.success) {
        toast.success('Navigation item created successfully');
        await refreshItems(); // Refresh to get updated data
      } else {
        toast.error(result.error || 'Failed to create navigation item');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create navigation item';
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [refreshItems]);

  // Update navigation item
  const updateItem = useCallback(async (
    itemId: string, 
    updates: Partial<Omit<NavigationItem, 'id'>>
  ): Promise<NavigationOperationResult> => {
    if (!navigationManagerRef.current) {
      return {
        success: false,
        error: 'Navigation manager not initialized'
      };
    }

    try {
      const result = await navigationManagerRef.current.updateNavigationItem(itemId, updates);
      
      if (result.success) {
        toast.success('Navigation item updated successfully');
        await refreshItems(); // Refresh to get updated data
      } else {
        toast.error(result.error || 'Failed to update navigation item');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update navigation item';
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [refreshItems]);

  // Delete navigation item
  const deleteItem = useCallback(async (itemId: string): Promise<NavigationOperationResult> => {
    if (!navigationManagerRef.current) {
      return {
        success: false,
        error: 'Navigation manager not initialized'
      };
    }

    try {
      const result = await navigationManagerRef.current.deleteNavigationItem(itemId);
      
      if (result.success) {
        toast.success('Navigation item deleted successfully');
        await refreshItems(); // Refresh to get updated data
      } else {
        toast.error(result.error || 'Failed to delete navigation item');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete navigation item';
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [refreshItems]);

  // Reorder navigation items
  const reorderItems = useCallback(async (operations: NavigationReorderOperation[]): Promise<NavigationOperationResult> => {
    if (!navigationManagerRef.current) {
      return {
        success: false,
        error: 'Navigation manager not initialized'
      };
    }

    try {
      const result = await navigationManagerRef.current.reorderNavigationItems(operations);
      
      if (result.success) {
        toast.success('Navigation items reordered successfully');
        await refreshItems(); // Refresh to get updated data
      } else {
        toast.error(result.error || 'Failed to reorder navigation items');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reorder navigation items';
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [refreshItems]);

  // Toggle visibility
  const toggleVisibility = useCallback(async (itemId: string, isVisible: boolean): Promise<NavigationOperationResult> => {
    if (!navigationManagerRef.current) {
      return {
        success: false,
        error: 'Navigation manager not initialized'
      };
    }

    try {
      const result = await navigationManagerRef.current.toggleVisibility(itemId, isVisible);
      
      if (result.success) {
        toast.success(`Navigation item ${isVisible ? 'shown' : 'hidden'} successfully`);
        await refreshItems(); // Refresh to get updated data
      } else {
        toast.error(result.error || 'Failed to toggle navigation visibility');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle navigation visibility';
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [refreshItems]);

  // Utility functions
  const findItemById = useCallback((itemId: string): NavigationItem | undefined => {
    return state.items.find(item => item.id === itemId);
  }, [state.items]);

  const findItemsByParent = useCallback((parentId: string | null): NavigationItem[] => {
    return state.items.filter(item => item.parentId === parentId);
  }, [state.items]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Actions object
  const actions: NavigationManagerActions = {
    refreshItems,
    getNavigationTree,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
    toggleVisibility,
    findItemById,
    findItemsByParent,
    clearError
  };

  return {
    ...state,
    ...actions
  };
}