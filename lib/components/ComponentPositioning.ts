import { 
  ComponentPosition, 
  ComponentInstance, 
  PositionCalculation, 
  ComponentHierarchy 
} from './types';
import { componentRegistry } from './ComponentRegistry';

/**
 * Component Positioning System - Handles component positioning, reordering, and hierarchy
 */
export class ComponentPositioning {
  /**
   * Validate a component position
   */
  public static validatePosition(position: ComponentPosition): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!position.pageId || typeof position.pageId !== 'string') {
      errors.push('Position pageId is required and must be a string');
    }

    if (!position.sectionId || typeof position.sectionId !== 'string') {
      errors.push('Position sectionId is required and must be a string');
    }

    if (typeof position.order !== 'number' || position.order < 0) {
      errors.push('Position order must be a non-negative number');
    }

    if (position.parentId && typeof position.parentId !== 'string') {
      errors.push('Position parentId must be a string if provided');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate new position when inserting a component
   */
  public static calculateInsertPosition(
    targetPosition: ComponentPosition,
    existingComponents: ComponentInstance[]
  ): PositionCalculation {
    const sectionComponents = existingComponents.filter(
      comp => comp.position.pageId === targetPosition.pageId && 
              comp.position.sectionId === targetPosition.sectionId &&
              comp.position.parentId === targetPosition.parentId
    );

    // Sort by current order
    sectionComponents.sort((a, b) => a.position.order - b.position.order);

    const targetOrder = targetPosition.order;
    const reorderOperations: Array<{
      componentId: string;
      oldOrder: number;
      newOrder: number;
    }> = [];

    // Find components that need to be shifted
    const componentsToShift = sectionComponents.filter(comp => comp.position.order >= targetOrder);
    
    // Calculate new orders for shifted components
    componentsToShift.forEach(comp => {
      const newOrder = comp.position.order + 1;
      reorderOperations.push({
        componentId: comp.id,
        oldOrder: comp.position.order,
        newOrder
      });
    });

    return {
      newOrder: targetOrder,
      affectedComponents: componentsToShift.map(comp => comp.id),
      reorderOperations
    };
  }

  /**
   * Calculate new positions when moving a component
   */
  public static calculateMovePosition(
    componentId: string,
    currentPosition: ComponentPosition,
    newPosition: ComponentPosition,
    existingComponents: ComponentInstance[]
  ): PositionCalculation {
    // If moving within the same section, handle reordering
    if (currentPosition.pageId === newPosition.pageId && 
        currentPosition.sectionId === newPosition.sectionId &&
        currentPosition.parentId === newPosition.parentId) {
      return this.calculateReorderPosition(componentId, currentPosition, newPosition, existingComponents);
    }

    // Moving to a different section - calculate insert position
    const otherComponents = existingComponents.filter(comp => comp.id !== componentId);
    return this.calculateInsertPosition(newPosition, otherComponents);
  }

  /**
   * Calculate positions for reordering within the same section
   */
  private static calculateReorderPosition(
    componentId: string,
    currentPosition: ComponentPosition,
    newPosition: ComponentPosition,
    existingComponents: ComponentInstance[]
  ): PositionCalculation {
    const sectionComponents = existingComponents.filter(
      comp => comp.position.pageId === currentPosition.pageId && 
              comp.position.sectionId === currentPosition.sectionId &&
              comp.position.parentId === currentPosition.parentId &&
              comp.id !== componentId // Exclude the component being moved
    );

    sectionComponents.sort((a, b) => a.position.order - b.position.order);

    const oldOrder = currentPosition.order;
    const newOrder = newPosition.order;
    const reorderOperations: Array<{
      componentId: string;
      oldOrder: number;
      newOrder: number;
    }> = [];

    if (newOrder > oldOrder) {
      // Moving down - shift components between old and new position up
      sectionComponents
        .filter(comp => comp.position.order > oldOrder && comp.position.order <= newOrder)
        .forEach(comp => {
          reorderOperations.push({
            componentId: comp.id,
            oldOrder: comp.position.order,
            newOrder: comp.position.order - 1
          });
        });
    } else if (newOrder < oldOrder) {
      // Moving up - shift components between new and old position down
      sectionComponents
        .filter(comp => comp.position.order >= newOrder && comp.position.order < oldOrder)
        .forEach(comp => {
          reorderOperations.push({
            componentId: comp.id,
            oldOrder: comp.position.order,
            newOrder: comp.position.order + 1
          });
        });
    }

    return {
      newOrder,
      affectedComponents: reorderOperations.map(op => op.componentId),
      reorderOperations
    };
  }

  /**
   * Get the next available order for a section
   */
  public static getNextOrder(
    pageId: string,
    sectionId: string,
    parentId?: string,
    existingComponents?: ComponentInstance[]
  ): number {
    const components = existingComponents || componentRegistry.getInstancesForPage(pageId);
    
    const sectionComponents = components.filter(
      comp => comp.position.sectionId === sectionId && comp.position.parentId === parentId
    );

    if (sectionComponents.length === 0) {
      return 0;
    }

    const maxOrder = Math.max(...sectionComponents.map(comp => comp.position.order));
    return maxOrder + 1;
  }

  /**
   * Build component hierarchy for a page
   */
  public static buildHierarchy(pageId: string): ComponentHierarchy[] {
    const components = componentRegistry.getInstancesForPage(pageId);
    const hierarchyMap = new Map<string, ComponentHierarchy>();
    const rootComponents: ComponentHierarchy[] = [];

    // First pass: create hierarchy nodes
    components.forEach(component => {
      const hierarchy: ComponentHierarchy = {
        componentId: component.id,
        parentId: component.position.parentId,
        children: [],
        depth: 0,
        position: component.position
      };
      hierarchyMap.set(component.id, hierarchy);
    });

    // Second pass: build parent-child relationships and calculate depth
    hierarchyMap.forEach(hierarchy => {
      if (hierarchy.parentId) {
        const parent = hierarchyMap.get(hierarchy.parentId);
        if (parent) {
          parent.children.push(hierarchy);
          hierarchy.depth = parent.depth + 1;
        } else {
          // Parent not found, treat as root
          rootComponents.push(hierarchy);
        }
      } else {
        rootComponents.push(hierarchy);
      }
    });

    // Sort children by order
    const sortChildren = (hierarchy: ComponentHierarchy) => {
      hierarchy.children.sort((a, b) => a.position.order - b.position.order);
      hierarchy.children.forEach(sortChildren);
    };

    rootComponents.forEach(sortChildren);
    rootComponents.sort((a, b) => a.position.order - b.position.order);

    return rootComponents;
  }

  /**
   * Get all descendant component IDs
   */
  public static getDescendants(componentId: string, pageId: string): string[] {
    const hierarchy = this.buildHierarchy(pageId);
    const descendants: string[] = [];

    const findDescendants = (nodes: ComponentHierarchy[]) => {
      for (const node of nodes) {
        if (node.componentId === componentId) {
          const collectDescendants = (children: ComponentHierarchy[]) => {
            children.forEach(child => {
              descendants.push(child.componentId);
              collectDescendants(child.children);
            });
          };
          collectDescendants(node.children);
          return;
        }
        findDescendants(node.children);
      }
    };

    findDescendants(hierarchy);
    return descendants;
  }

  /**
   * Check if a component can be moved to a new parent (prevent circular references)
   */
  public static canMoveToParent(
    componentId: string,
    newParentId: string | undefined,
    pageId: string
  ): { canMove: boolean; reason?: string } {
    if (!newParentId) {
      return { canMove: true }; // Moving to root is always allowed
    }

    if (componentId === newParentId) {
      return { canMove: false, reason: 'Component cannot be its own parent' };
    }

    // Check if the new parent is a descendant of the component
    const descendants = this.getDescendants(componentId, pageId);
    if (descendants.includes(newParentId)) {
      return { canMove: false, reason: 'Cannot move component to its own descendant' };
    }

    return { canMove: true };
  }

  /**
   * Normalize positions to ensure no gaps and proper ordering
   */
  public static normalizePositions(
    pageId: string,
    sectionId: string,
    parentId?: string
  ): Array<{ componentId: string; oldOrder: number; newOrder: number }> {
    const components = componentRegistry.getInstancesForPage(pageId)
      .filter(comp => 
        comp.position.sectionId === sectionId && 
        comp.position.parentId === parentId
      )
      .sort((a, b) => a.position.order - b.position.order);

    const normalizeOperations: Array<{
      componentId: string;
      oldOrder: number;
      newOrder: number;
    }> = [];

    components.forEach((component, index) => {
      if (component.position.order !== index) {
        normalizeOperations.push({
          componentId: component.id,
          oldOrder: component.position.order,
          newOrder: index
        });
      }
    });

    return normalizeOperations;
  }

  /**
   * Apply position changes to components
   */
  public static async applyPositionChanges(
    changes: Array<{ componentId: string; newOrder: number }>,
    userId: string
  ): Promise<void> {
    for (const change of changes) {
      const instance = componentRegistry.getInstance(change.componentId);
      if (instance) {
        const newPosition: ComponentPosition = {
          ...instance.position,
          order: change.newOrder
        };

        componentRegistry.updateInstance(
          change.componentId,
          { position: newPosition },
          userId
        );
      }
    }
  }

  /**
   * Handle position conflicts when multiple users move components simultaneously
   */
  public static resolvePositionConflict(
    conflictingMoves: Array<{
      componentId: string;
      userId: string;
      timestamp: string;
      newPosition: ComponentPosition;
    }>,
    pageId: string
  ): PositionCalculation {
    // Sort by timestamp - first move wins
    conflictingMoves.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const winningMove = conflictingMoves[0];
    const existingComponents = componentRegistry.getInstancesForPage(pageId);
    
    // Calculate position for the winning move
    const currentComponent = existingComponents.find(comp => comp.id === winningMove.componentId);
    if (!currentComponent) {
      throw new Error(`Component not found: ${winningMove.componentId}`);
    }

    return this.calculateMovePosition(
      winningMove.componentId,
      currentComponent.position,
      winningMove.newPosition,
      existingComponents
    );
  }

  /**
   * Get position statistics for a page
   */
  public static getPositionStats(pageId: string): {
    totalComponents: number;
    sectionCounts: Record<string, number>;
    maxDepth: number;
    orphanedComponents: string[];
  } {
    const components = componentRegistry.getInstancesForPage(pageId);
    const hierarchy = this.buildHierarchy(pageId);
    
    const sectionCounts: Record<string, number> = {};
    components.forEach(comp => {
      sectionCounts[comp.position.sectionId] = (sectionCounts[comp.position.sectionId] || 0) + 1;
    });

    const getMaxDepth = (nodes: ComponentHierarchy[]): number => {
      if (nodes.length === 0) return 0;
      return Math.max(...nodes.map(node => 
        1 + getMaxDepth(node.children)
      ));
    };

    // Find orphaned components (have parentId but parent doesn't exist)
    const componentIds = new Set(components.map(comp => comp.id));
    const orphanedComponents = components
      .filter(comp => comp.position.parentId && !componentIds.has(comp.position.parentId))
      .map(comp => comp.id);

    return {
      totalComponents: components.length,
      sectionCounts,
      maxDepth: getMaxDepth(hierarchy),
      orphanedComponents
    };
  }
}