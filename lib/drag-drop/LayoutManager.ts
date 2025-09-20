import { ComponentPosition, ComponentInstance } from '../types/drag-drop';

export interface LayoutAdjustment {
  componentId: string;
  oldPosition: ComponentPosition;
  newPosition: ComponentPosition;
  reason: 'reorder' | 'insert' | 'remove' | 'compact';
}

export class LayoutManager {
  private static instance: LayoutManager;

  private constructor() {}

  static getInstance(): LayoutManager {
    if (!LayoutManager.instance) {
      LayoutManager.instance = new LayoutManager();
    }
    return LayoutManager.instance;
  }

  /**
   * Calculate layout adjustments when a component is added
   */
  calculateAddAdjustments(
    newPosition: ComponentPosition,
    existingComponents: ComponentInstance[]
  ): LayoutAdjustment[] {
    const adjustments: LayoutAdjustment[] = [];
    
    // Get components in the same section
    const sectionComponents = existingComponents.filter(comp =>
      comp.position.pageId === newPosition.pageId &&
      comp.position.sectionId === newPosition.sectionId &&
      comp.position.parentId === newPosition.parentId
    );

    // Sort by current order
    sectionComponents.sort((a, b) => a.position.order - b.position.order);

    // Shift components that are at or after the new position
    sectionComponents.forEach(component => {
      if (component.position.order >= newPosition.order) {
        const oldPosition = { ...component.position };
        const newOrder = component.position.order + 1;
        
        adjustments.push({
          componentId: component.id,
          oldPosition,
          newPosition: {
            ...component.position,
            order: newOrder
          },
          reason: 'insert'
        });
      }
    });

    return adjustments;
  }

  /**
   * Calculate layout adjustments when a component is moved
   */
  calculateMoveAdjustments(
    componentId: string,
    oldPosition: ComponentPosition,
    newPosition: ComponentPosition,
    existingComponents: ComponentInstance[]
  ): LayoutAdjustment[] {
    const adjustments: LayoutAdjustment[] = [];

    // If moving within the same section
    if (
      oldPosition.pageId === newPosition.pageId &&
      oldPosition.sectionId === newPosition.sectionId &&
      oldPosition.parentId === newPosition.parentId
    ) {
      return this.calculateReorderAdjustments(componentId, oldPosition, newPosition, existingComponents);
    }

    // Moving to a different section - handle as remove + add
    const removeAdjustments = this.calculateRemoveAdjustments(oldPosition, existingComponents);
    const addAdjustments = this.calculateAddAdjustments(newPosition, existingComponents);

    return [...removeAdjustments, ...addAdjustments];
  }

  /**
   * Calculate layout adjustments when reordering within the same section
   */
  private calculateReorderAdjustments(
    componentId: string,
    oldPosition: ComponentPosition,
    newPosition: ComponentPosition,
    existingComponents: ComponentInstance[]
  ): LayoutAdjustment[] {
    const adjustments: LayoutAdjustment[] = [];
    
    // Get components in the same section (excluding the moving component)
    const sectionComponents = existingComponents.filter(comp =>
      comp.id !== componentId &&
      comp.position.pageId === oldPosition.pageId &&
      comp.position.sectionId === oldPosition.sectionId &&
      comp.position.parentId === oldPosition.parentId
    );

    // Sort by current order
    sectionComponents.sort((a, b) => a.position.order - b.position.order);

    const oldOrder = oldPosition.order;
    const newOrder = newPosition.order;

    if (oldOrder < newOrder) {
      // Moving down - shift components between old and new position up
      sectionComponents.forEach(component => {
        if (component.position.order > oldOrder && component.position.order <= newOrder) {
          const oldPos = { ...component.position };
          adjustments.push({
            componentId: component.id,
            oldPosition: oldPos,
            newPosition: {
              ...component.position,
              order: component.position.order - 1
            },
            reason: 'reorder'
          });
        }
      });
    } else if (oldOrder > newOrder) {
      // Moving up - shift components between new and old position down
      sectionComponents.forEach(component => {
        if (component.position.order >= newOrder && component.position.order < oldOrder) {
          const oldPos = { ...component.position };
          adjustments.push({
            componentId: component.id,
            oldPosition: oldPos,
            newPosition: {
              ...component.position,
              order: component.position.order + 1
            },
            reason: 'reorder'
          });
        }
      });
    }

    return adjustments;
  }

  /**
   * Calculate layout adjustments when a component is removed
   */
  calculateRemoveAdjustments(
    removedPosition: ComponentPosition,
    existingComponents: ComponentInstance[]
  ): LayoutAdjustment[] {
    const adjustments: LayoutAdjustment[] = [];
    
    // Get components in the same section
    const sectionComponents = existingComponents.filter(comp =>
      comp.position.pageId === removedPosition.pageId &&
      comp.position.sectionId === removedPosition.sectionId &&
      comp.position.parentId === removedPosition.parentId
    );

    // Shift components that are after the removed position
    sectionComponents.forEach(component => {
      if (component.position.order > removedPosition.order) {
        const oldPosition = { ...component.position };
        adjustments.push({
          componentId: component.id,
          oldPosition,
          newPosition: {
            ...component.position,
            order: component.position.order - 1
          },
          reason: 'remove'
        });
      }
    });

    return adjustments;
  }

  /**
   * Compact layout by removing gaps in ordering
   */
  compactLayout(
    pageId: string,
    sectionId: string,
    parentId: string | undefined,
    existingComponents: ComponentInstance[]
  ): LayoutAdjustment[] {
    const adjustments: LayoutAdjustment[] = [];
    
    // Get components in the section
    const sectionComponents = existingComponents.filter(comp =>
      comp.position.pageId === pageId &&
      comp.position.sectionId === sectionId &&
      comp.position.parentId === parentId
    );

    // Sort by current order
    sectionComponents.sort((a, b) => a.position.order - b.position.order);

    // Reassign orders to remove gaps
    sectionComponents.forEach((component, index) => {
      if (component.position.order !== index) {
        const oldPosition = { ...component.position };
        adjustments.push({
          componentId: component.id,
          oldPosition,
          newPosition: {
            ...component.position,
            order: index
          },
          reason: 'compact'
        });
      }
    });

    return adjustments;
  }

  /**
   * Find the optimal insertion position based on cursor position or other criteria
   */
  findOptimalInsertionPosition(
    targetSection: { pageId: string; sectionId: string; parentId?: string },
    existingComponents: ComponentInstance[],
    cursorY?: number,
    componentHeight?: number
  ): number {
    // Get components in the target section
    const sectionComponents = existingComponents.filter(comp =>
      comp.position.pageId === targetSection.pageId &&
      comp.position.sectionId === targetSection.sectionId &&
      comp.position.parentId === targetSection.parentId
    );

    // If no cursor position provided, append to end
    if (cursorY === undefined) {
      return sectionComponents.length;
    }

    // Sort by order
    sectionComponents.sort((a, b) => a.position.order - b.position.order);

    // Find the best position based on cursor Y position
    // This would require component DOM positions, which would be passed in
    // For now, we'll use a simple heuristic
    
    // If cursor is in the top third, insert at beginning
    if (cursorY < 0.33) {
      return 0;
    }
    
    // If cursor is in the bottom third, insert at end
    if (cursorY > 0.67) {
      return sectionComponents.length;
    }
    
    // Otherwise, insert in the middle
    return Math.floor(sectionComponents.length / 2);
  }

  /**
   * Validate that a layout adjustment is safe to apply
   */
  validateAdjustment(adjustment: LayoutAdjustment, existingComponents: ComponentInstance[]): boolean {
    const { componentId, newPosition } = adjustment;
    
    // Check if the new position would conflict with existing components
    const conflictingComponent = existingComponents.find(comp =>
      comp.id !== componentId &&
      comp.position.pageId === newPosition.pageId &&
      comp.position.sectionId === newPosition.sectionId &&
      comp.position.parentId === newPosition.parentId &&
      comp.position.order === newPosition.order
    );

    return !conflictingComponent;
  }

  /**
   * Apply layout adjustments to component instances
   */
  applyAdjustments(
    adjustments: LayoutAdjustment[],
    components: ComponentInstance[]
  ): ComponentInstance[] {
    const updatedComponents = [...components];

    adjustments.forEach(adjustment => {
      const componentIndex = updatedComponents.findIndex(comp => comp.id === adjustment.componentId);
      if (componentIndex !== -1) {
        updatedComponents[componentIndex] = {
          ...updatedComponents[componentIndex],
          position: adjustment.newPosition
        };
      }
    });

    return updatedComponents;
  }

  /**
   * Get layout statistics for a section
   */
  getLayoutStats(
    pageId: string,
    sectionId: string,
    parentId: string | undefined,
    components: ComponentInstance[]
  ) {
    const sectionComponents = components.filter(comp =>
      comp.position.pageId === pageId &&
      comp.position.sectionId === sectionId &&
      comp.position.parentId === parentId
    );

    const orders = sectionComponents.map(comp => comp.position.order).sort((a, b) => a - b);
    const gaps = [];
    
    for (let i = 1; i < orders.length; i++) {
      if (orders[i] - orders[i - 1] > 1) {
        gaps.push({
          after: orders[i - 1],
          before: orders[i],
          size: orders[i] - orders[i - 1] - 1
        });
      }
    }

    return {
      componentCount: sectionComponents.length,
      minOrder: orders.length > 0 ? orders[0] : 0,
      maxOrder: orders.length > 0 ? orders[orders.length - 1] : -1,
      gaps,
      hasGaps: gaps.length > 0,
      isCompact: gaps.length === 0 && orders.length > 0 && orders[0] === 0
    };
  }
}

export default LayoutManager;