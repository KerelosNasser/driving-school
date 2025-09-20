import { NavigationItem, RealtimeEvent, NavigationUpdateEventData } from '../realtime/types';
import { EventRouter } from '../realtime/types';
import { supabase } from '../supabase';

export interface NavigationPermissions {
  canUpdate: boolean;
  canReorder: boolean;
  canAdd: boolean;
  canDelete: boolean;
  canToggleVisibility: boolean;
}

export interface NavigationManagerConfig {
  eventRouter?: EventRouter;
  userId?: string;
  permissions?: NavigationPermissions;
}

export interface NavigationOperationResult {
  success: boolean;
  data?: any;
  error?: string;
  conflictId?: string;
}

export interface NavigationReorderOperation {
  itemId: string;
  newOrderIndex: number;
  newParentId?: string;
}

export class NavigationManager {
  private eventRouter?: EventRouter;
  private userId?: string;
  private permissions: NavigationPermissions;
  private cache: Map<string, NavigationItem> = new Map();
  private lastSyncTime: number = 0;

  constructor(config: NavigationManagerConfig = {}) {
    this.eventRouter = config.eventRouter;
    this.userId = config.userId;
    this.permissions = config.permissions || {
      canUpdate: false,
      canReorder: false,
      canAdd: false,
      canDelete: false,
      canToggleVisibility: false
    };
  }

  /**
   * Initialize the navigation manager with user permissions
   */
  async initialize(userId: string, permissions: NavigationPermissions): Promise<void> {
    this.userId = userId;
    this.permissions = permissions;
    
    // Load initial navigation data
    await this.syncNavigationItems();
  }

  /**
   * Get all navigation items with optional filtering
   */
  async getNavigationItems(options: {
    includeHidden?: boolean;
    parentId?: string;
    orderBy?: 'orderIndex' | 'displayName';
  } = {}): Promise<NavigationItem[]> {
    try {
      let query = supabase
        .from('navigation_items')
        .select('*')
        .eq('is_active', true);

      if (!options.includeHidden) {
        query = query.eq('is_visible', true);
      }

      if (options.parentId !== undefined) {
        if (options.parentId === null) {
          query = query.is('parent_id', null);
        } else {
          query = query.eq('parent_id', options.parentId);
        }
      }

      const orderBy = options.orderBy || 'orderIndex';
      if (orderBy === 'orderIndex') {
        query = query.order('order_index', { ascending: true });
      } else {
        query = query.order('display_name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch navigation items: ${error.message}`);
      }

      // Convert database format to NavigationItem format
      const items: NavigationItem[] = (data || []).map(item => ({
        id: item.id,
        pageId: item.page_name,
        displayName: item.display_name,
        urlSlug: item.url_slug,
        parentId: item.parent_id,
        orderIndex: item.order_index,
        isVisible: item.is_visible,
        isActive: item.is_active
      }));

      // Update cache
      items.forEach(item => this.cache.set(item.id, item));
      this.lastSyncTime = Date.now();

      return items;
    } catch (error) {
      console.error('Error fetching navigation items:', error);
      throw error;
    }
  }

  /**
   * Create a new navigation item
   */
  async createNavigationItem(itemData: Omit<NavigationItem, 'id'>): Promise<NavigationOperationResult> {
    if (!this.permissions.canAdd) {
      return {
        success: false,
        error: 'Insufficient permissions to add navigation items'
      };
    }

    if (!this.userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    try {
      const itemId = `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Validate order index
      if (itemData.orderIndex < 0) {
        return {
          success: false,
          error: 'Order index must be non-negative'
        };
      }

      // Check for URL slug conflicts
      const existingItems = await this.getNavigationItems();
      const slugConflict = existingItems.find(item => item.urlSlug === itemData.urlSlug);
      if (slugConflict) {
        return {
          success: false,
          error: `URL slug '${itemData.urlSlug}' already exists`
        };
      }

      const newItem: NavigationItem = {
        ...itemData,
        id: itemId
      };

      // Insert into database
      const { data, error } = await supabase
        .from('navigation_items')
        .insert({
          id: itemId,
          page_name: itemData.pageId,
          display_name: itemData.displayName,
          url_slug: itemData.urlSlug,
          parent_id: itemData.parentId || null,
          order_index: itemData.orderIndex,
          is_visible: itemData.isVisible,
          is_active: itemData.isActive
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create navigation item: ${error.message}`);
      }

      // Update cache
      this.cache.set(itemId, newItem);

      // Broadcast real-time event
      await this.broadcastNavigationUpdate([newItem], 'add', [itemId]);

      return {
        success: true,
        data: newItem
      };
    } catch (error) {
      console.error('Error creating navigation item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update an existing navigation item
   */
  async updateNavigationItem(itemId: string, updates: Partial<Omit<NavigationItem, 'id'>>): Promise<NavigationOperationResult> {
    if (!this.permissions.canUpdate) {
      return {
        success: false,
        error: 'Insufficient permissions to update navigation items'
      };
    }

    if (!this.userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    try {
      // Get current item
      const currentItem = this.cache.get(itemId);
      if (!currentItem) {
        // Try to fetch from database
        const items = await this.getNavigationItems();
        const item = items.find(i => i.id === itemId);
        if (!item) {
          return {
            success: false,
            error: 'Navigation item not found'
          };
        }
      }

      // Validate URL slug if being updated
      if (updates.urlSlug) {
        const existingItems = await this.getNavigationItems();
        const slugConflict = existingItems.find(item => 
          item.urlSlug === updates.urlSlug && item.id !== itemId
        );
        if (slugConflict) {
          return {
            success: false,
            error: `URL slug '${updates.urlSlug}' already exists`
          };
        }
      }

      // Prepare database update
      const dbUpdates: any = {};
      if (updates.pageId !== undefined) dbUpdates.page_name = updates.pageId;
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
      if (updates.urlSlug !== undefined) dbUpdates.url_slug = updates.urlSlug;
      if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
      if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;
      if (updates.isVisible !== undefined) dbUpdates.is_visible = updates.isVisible;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

      dbUpdates.updated_at = new Date().toISOString();

      // Update in database
      const { data, error } = await supabase
        .from('navigation_items')
        .update(dbUpdates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update navigation item: ${error.message}`);
      }

      // Update cache
      const updatedItem: NavigationItem = {
        id: itemId,
        pageId: data.page_name,
        displayName: data.display_name,
        urlSlug: data.url_slug,
        parentId: data.parent_id,
        orderIndex: data.order_index,
        isVisible: data.is_visible,
        isActive: data.is_active
      };

      this.cache.set(itemId, updatedItem);

      // Broadcast real-time event
      await this.broadcastNavigationUpdate([updatedItem], 'update', [itemId]);

      return {
        success: true,
        data: updatedItem
      };
    } catch (error) {
      console.error('Error updating navigation item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete a navigation item
   */
  async deleteNavigationItem(itemId: string): Promise<NavigationOperationResult> {
    if (!this.permissions.canDelete) {
      return {
        success: false,
        error: 'Insufficient permissions to delete navigation items'
      };
    }

    if (!this.userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    try {
      // Check if item has children
      const items = await this.getNavigationItems({ includeHidden: true });
      const hasChildren = items.some(item => item.parentId === itemId);
      
      if (hasChildren) {
        return {
          success: false,
          error: 'Cannot delete navigation item with child items'
        };
      }

      // Soft delete (set is_active to false)
      const { error } = await supabase
        .from('navigation_items')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        throw new Error(`Failed to delete navigation item: ${error.message}`);
      }

      // Remove from cache
      this.cache.delete(itemId);

      // Broadcast real-time event
      await this.broadcastNavigationUpdate([], 'remove', [itemId]);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting navigation item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Reorder navigation items with drag and drop support
   */
  async reorderNavigationItems(operations: NavigationReorderOperation[]): Promise<NavigationOperationResult> {
    if (!this.permissions.canReorder) {
      return {
        success: false,
        error: 'Insufficient permissions to reorder navigation items'
      };
    }

    if (!this.userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    try {
      const updatedItems: NavigationItem[] = [];
      const affectedItemIds: string[] = [];

      // Process each reorder operation
      for (const operation of operations) {
        const { itemId, newOrderIndex, newParentId } = operation;

        // Validate order index
        if (newOrderIndex < 0) {
          return {
            success: false,
            error: `Invalid order index for item ${itemId}: ${newOrderIndex}`
          };
        }

        // Update in database
        const { data, error } = await supabase
          .from('navigation_items')
          .update({
            order_index: newOrderIndex,
            parent_id: newParentId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to reorder navigation item ${itemId}: ${error.message}`);
        }

        // Convert to NavigationItem format
        const updatedItem: NavigationItem = {
          id: itemId,
          pageId: data.page_name,
          displayName: data.display_name,
          urlSlug: data.url_slug,
          parentId: data.parent_id,
          orderIndex: data.order_index,
          isVisible: data.is_visible,
          isActive: data.is_active
        };

        updatedItems.push(updatedItem);
        affectedItemIds.push(itemId);

        // Update cache
        this.cache.set(itemId, updatedItem);
      }

      // Broadcast real-time event
      await this.broadcastNavigationUpdate(updatedItems, 'reorder', affectedItemIds);

      return {
        success: true,
        data: updatedItems
      };
    } catch (error) {
      console.error('Error reordering navigation items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Toggle visibility of a navigation item
   */
  async toggleVisibility(itemId: string, isVisible: boolean): Promise<NavigationOperationResult> {
    if (!this.permissions.canToggleVisibility) {
      return {
        success: false,
        error: 'Insufficient permissions to change navigation visibility'
      };
    }

    return this.updateNavigationItem(itemId, { isVisible });
  }

  /**
   * Get navigation hierarchy as a tree structure
   */
  async getNavigationTree(includeHidden: boolean = false): Promise<NavigationItem[]> {
    const allItems = await this.getNavigationItems({ includeHidden });
    
    // Build tree structure
    const itemMap = new Map<string, NavigationItem & { children: NavigationItem[] }>();
    const rootItems: (NavigationItem & { children: NavigationItem[] })[] = [];

    // Initialize all items with children array
    allItems.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Build parent-child relationships
    allItems.forEach(item => {
      const itemWithChildren = itemMap.get(item.id)!;
      
      if (item.parentId && itemMap.has(item.parentId)) {
        const parent = itemMap.get(item.parentId)!;
        parent.children.push(itemWithChildren);
      } else {
        rootItems.push(itemWithChildren);
      }
    });

    // Sort children by order index
    const sortByOrderIndex = (items: (NavigationItem & { children: NavigationItem[] })[]) => {
      items.sort((a, b) => a.orderIndex - b.orderIndex);
      items.forEach(item => sortByOrderIndex(item.children));
    };

    sortByOrderIndex(rootItems);

    return rootItems;
  }

  /**
   * Sync navigation items from database
   */
  private async syncNavigationItems(): Promise<void> {
    try {
      await this.getNavigationItems({ includeHidden: true });
    } catch (error) {
      console.error('Failed to sync navigation items:', error);
    }
  }

  /**
   * Broadcast navigation update event for real-time synchronization
   */
  private async broadcastNavigationUpdate(
    items: NavigationItem[], 
    changeType: 'reorder' | 'add' | 'remove' | 'update',
    affectedItemIds: string[]
  ): Promise<void> {
    if (!this.eventRouter || !this.userId) {
      return;
    }

    try {
      const event: RealtimeEvent = {
        id: `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'nav_update',
        pageName: 'navigation', // Special page name for navigation events
        userId: this.userId,
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          items,
          changeType,
          affectedItemIds
        } as NavigationUpdateEventData
      };

      await this.eventRouter.route(event);
    } catch (error) {
      console.error('Failed to broadcast navigation update:', error);
    }
  }

  /**
   * Clear the navigation cache
   */
  clearCache(): void {
    this.cache.clear();
    this.lastSyncTime = 0;
  }

  /**
   * Get cached navigation item
   */
  getCachedItem(itemId: string): NavigationItem | undefined {
    return this.cache.get(itemId);
  }

  /**
   * Check if cache is stale
   */
  isCacheStale(maxAgeMs: number = 300000): boolean { // 5 minutes default
    return Date.now() - this.lastSyncTime > maxAgeMs;
  }
}

// Factory function for creating NavigationManager instances
export function createNavigationManager(config: NavigationManagerConfig = {}): NavigationManager {
  return new NavigationManager(config);
}

// Default permissions for different user roles
export const NavigationPermissions = {
  ADMIN: {
    canUpdate: true,
    canReorder: true,
    canAdd: true,
    canDelete: true,
    canToggleVisibility: true
  } as NavigationPermissions,
  
  EDITOR: {
    canUpdate: true,
    canReorder: true,
    canAdd: false,
    canDelete: false,
    canToggleVisibility: true
  } as NavigationPermissions,
  
  VIEWER: {
    canUpdate: false,
    canReorder: false,
    canAdd: false,
    canDelete: false,
    canToggleVisibility: false
  } as NavigationPermissions
};