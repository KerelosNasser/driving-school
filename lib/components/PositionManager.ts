import { ComponentPosition, ComponentInstance } from './types';
import { ComponentPositioning } from './ComponentPositioning';
import { componentRegistry } from './ComponentRegistry';
import { RealtimeEvent } from '../realtime/types';

/**
 * Position Manager - Handles real-time component positioning with conflict resolution
 */
export class PositionManager {
  private pendingMoves = new Map<string, {
    componentId: string;
    newPosition: ComponentPosition;
    timestamp: string;
    userId: string;
  }>();

  private conflictResolutionTimeout = 1000; // 1 second to collect conflicting moves

  /**
   * Move a component to a new position with real-time synchronization
   */
  public async moveComponent(
    componentId: string,
    newPosition: ComponentPosition,
    userId: string,
    eventRouter?: any
  ): Promise<{ success: boolean; conflicts?: string[]; finalPosition?: ComponentPosition }> {
    try {
      // Validate the new position
      const validation = ComponentPositioning.validatePosition(newPosition);
      if (!validation.isValid) {
        throw new Error(`Invalid position: ${validation.errors.join(', ')}`);
      }

      // Get current component
      const component = componentRegistry.getInstance(componentId);
      if (!component) {
        throw new Error(`Component not found: ${componentId}`);
      }

      // Check if move is allowed (prevent circular references)
      const canMove = ComponentPositioning.canMoveToParent(
        componentId,
        newPosition.parentId,
        newPosition.pageId
      );
      if (!canMove.canMove) {
        throw new Error(canMove.reason || 'Move not allowed');
      }

      // Calculate position changes
      const existingComponents = componentRegistry.getInstancesForPage(newPosition.pageId);
      const calculation = ComponentPositioning.calculateMovePosition(
        componentId,
        component.position,
        newPosition,
        existingComponents
      );

      // Check for pending moves to the same position (conflict detection)
      const conflictKey = `${newPosition.pageId}:${newPosition.sectionId}:${newPosition.order}`;
      const existingMove = this.pendingMoves.get(conflictKey);
      
      if (existingMove && existingMove.componentId !== componentId) {
        // Conflict detected - add to pending moves and resolve after timeout
        this.pendingMoves.set(conflictKey, {
          componentId,
          newPosition,
          timestamp: new Date().toISOString(),
          userId
        });

        setTimeout(() => {
          this.resolvePositionConflicts(conflictKey, newPosition.pageId);
        }, this.conflictResolutionTimeout);

        return {
          success: false,
          conflicts: [existingMove.componentId]
        };
      }

      // No immediate conflict - proceed with move
      this.pendingMoves.set(conflictKey, {
        componentId,
        newPosition,
        timestamp: new Date().toISOString(),
        userId
      });

      // Apply position changes
      await this.applyPositionCalculation(calculation, componentId, newPosition, userId);

      // Broadcast move event
      if (eventRouter) {
        const moveEvent: RealtimeEvent = {
          id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'component_move',
          pageName: newPosition.pageId,
          userId,
          timestamp: new Date().toISOString(),
          version: '1.0',
          data: {
            componentId,
            oldPosition: component.position,
            newPosition,
            affectedComponents: calculation.affectedComponents
          }
        };

        await eventRouter.route(moveEvent);
      }

      // Clear pending move after successful application
      setTimeout(() => {
        this.pendingMoves.delete(conflictKey);
      }, this.conflictResolutionTimeout);

      return {
        success: true,
        finalPosition: newPosition
      };

    } catch (error) {
      console.error('Failed to move component:', error);
      throw error;
    }
  }

  /**
   * Insert a component at a specific position
   */
  public async insertComponent(
    componentId: string,
    position: ComponentPosition,
    userId: string,
    eventRouter?: any
  ): Promise<{ success: boolean; finalPosition: ComponentPosition }> {
    try {
      // Validate position
      const validation = ComponentPositioning.validatePosition(position);
      if (!validation.isValid) {
        throw new Error(`Invalid position: ${validation.errors.join(', ')}`);
      }

      // Calculate insert position
      const existingComponents = componentRegistry.getInstancesForPage(position.pageId);
      const calculation = ComponentPositioning.calculateInsertPosition(position, existingComponents);

      // Apply position changes
      await this.applyPositionCalculation(calculation, componentId, position, userId);

      // Broadcast insert event
      if (eventRouter) {
        const insertEvent: RealtimeEvent = {
          id: `insert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'component_add',
          pageName: position.pageId,
          userId,
          timestamp: new Date().toISOString(),
          version: '1.0',
          data: {
            componentId,
            position,
            affectedComponents: calculation.affectedComponents
          }
        };

        await eventRouter.route(insertEvent);
      }

      return {
        success: true,
        finalPosition: position
      };

    } catch (error) {
      console.error('Failed to insert component:', error);
      throw error;
    }
  }

  /**
   * Remove a component and adjust positions of remaining components
   */
  public async removeComponent(
    componentId: string,
    userId: string,
    eventRouter?: any
  ): Promise<{ success: boolean; affectedComponents: string[] }> {
    try {
      const component = componentRegistry.getInstance(componentId);
      if (!component) {
        throw new Error(`Component not found: ${componentId}`);
      }

      // Get all descendants that will also be removed
      const descendants = ComponentPositioning.getDescendants(componentId, component.position.pageId);
      const allRemovedIds = [componentId, ...descendants];

      // Get components that need position adjustment
      const existingComponents = componentRegistry.getInstancesForPage(component.position.pageId);
      const componentsToAdjust = existingComponents.filter(comp => 
        comp.position.sectionId === component.position.sectionId &&
        comp.position.parentId === component.position.parentId &&
        comp.position.order > component.position.order &&
        !allRemovedIds.includes(comp.id)
      );

      // Calculate new positions (shift up by 1)
      const adjustments = componentsToAdjust.map(comp => ({
        componentId: comp.id,
        newOrder: comp.position.order - 1
      }));

      // Apply position adjustments
      await ComponentPositioning.applyPositionChanges(adjustments, userId);

      // Remove the component and its descendants
      allRemovedIds.forEach(id => {
        componentRegistry.deleteInstance(id);
      });

      // Broadcast remove event
      if (eventRouter) {
        const removeEvent: RealtimeEvent = {
          id: `remove-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'component_delete',
          pageName: component.position.pageId,
          userId,
          timestamp: new Date().toISOString(),
          version: '1.0',
          data: {
            componentId,
            position: component.position,
            removedComponents: allRemovedIds,
            affectedComponents: adjustments.map(adj => adj.componentId)
          }
        };

        await eventRouter.route(removeEvent);
      }

      return {
        success: true,
        affectedComponents: adjustments.map(adj => adj.componentId)
      };

    } catch (error) {
      console.error('Failed to remove component:', error);
      throw error;
    }
  }

  /**
   * Reorder components within the same section
   */
  public async reorderComponents(
    componentIds: string[],
    sectionId: string,
    pageId: string,
    parentId: string | undefined,
    userId: string,
    eventRouter?: any
  ): Promise<{ success: boolean; changes: Array<{ componentId: string; newOrder: number }> }> {
    try {
      // Validate all components exist and are in the same section
      const components = componentIds.map(id => {
        const comp = componentRegistry.getInstance(id);
        if (!comp) {
          throw new Error(`Component not found: ${id}`);
        }
        if (comp.position.pageId !== pageId || 
            comp.position.sectionId !== sectionId ||
            comp.position.parentId !== parentId) {
          throw new Error(`Component ${id} is not in the specified section`);
        }
        return comp;
      });

      // Calculate new positions
      const changes = componentIds.map((id, index) => ({
        componentId: id,
        newOrder: index
      }));

      // Apply changes
      await ComponentPositioning.applyPositionChanges(changes, userId);

      // Broadcast reorder event
      if (eventRouter) {
        const reorderEvent: RealtimeEvent = {
          id: `reorder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'component_move',
          pageName: pageId,
          userId,
          timestamp: new Date().toISOString(),
          version: '1.0',
          data: {
            type: 'reorder',
            sectionId,
            parentId,
            componentIds,
            changes
          }
        };

        await eventRouter.route(reorderEvent);
      }

      return {
        success: true,
        changes
      };

    } catch (error) {
      console.error('Failed to reorder components:', error);
      throw error;
    }
  }

  /**
   * Normalize positions in a section (remove gaps, ensure proper ordering)
   */
  public async normalizeSection(
    pageId: string,
    sectionId: string,
    parentId: string | undefined,
    userId: string
  ): Promise<{ changes: Array<{ componentId: string; oldOrder: number; newOrder: number }> }> {
    const changes = ComponentPositioning.normalizePositions(pageId, sectionId, parentId);
    
    if (changes.length > 0) {
      const positionChanges = changes.map(change => ({
        componentId: change.componentId,
        newOrder: change.newOrder
      }));

      await ComponentPositioning.applyPositionChanges(positionChanges, userId);
    }

    return { changes };
  }

  /**
   * Apply position calculation results
   */
  private async applyPositionCalculation(
    calculation: any,
    componentId: string,
    newPosition: ComponentPosition,
    userId: string
  ): Promise<void> {
    // Update the main component position
    componentRegistry.updateInstance(componentId, { position: newPosition }, userId);

    // Apply reorder operations for affected components
    if (calculation.reorderOperations.length > 0) {
      const changes = calculation.reorderOperations.map((op: any) => ({
        componentId: op.componentId,
        newOrder: op.newOrder
      }));

      await ComponentPositioning.applyPositionChanges(changes, userId);
    }
  }

  /**
   * Resolve position conflicts when multiple users move components simultaneously
   */
  private async resolvePositionConflicts(conflictKey: string, pageId: string): Promise<void> {
    const pendingMove = this.pendingMoves.get(conflictKey);
    if (!pendingMove) return;

    try {
      // In a real implementation, you would collect all conflicting moves
      // For now, we'll just apply the pending move
      const component = componentRegistry.getInstance(pendingMove.componentId);
      if (!component) return;

      const existingComponents = componentRegistry.getInstancesForPage(pageId);
      const calculation = ComponentPositioning.calculateMovePosition(
        pendingMove.componentId,
        component.position,
        pendingMove.newPosition,
        existingComponents
      );

      await this.applyPositionCalculation(
        calculation,
        pendingMove.componentId,
        pendingMove.newPosition,
        pendingMove.userId
      );

      console.log(`Resolved position conflict for component ${pendingMove.componentId}`);

    } catch (error) {
      console.error('Failed to resolve position conflict:', error);
    } finally {
      this.pendingMoves.delete(conflictKey);
    }
  }

  /**
   * Get current position statistics
   */
  public getPositionStats(pageId: string) {
    return ComponentPositioning.getPositionStats(pageId);
  }

  /**
   * Get component hierarchy
   */
  public getHierarchy(pageId: string) {
    return ComponentPositioning.buildHierarchy(pageId);
  }

  /**
   * Clear all pending moves (for cleanup)
   */
  public clearPendingMoves(): void {
    this.pendingMoves.clear();
  }
}

// Export singleton instance
export const positionManager = new PositionManager();