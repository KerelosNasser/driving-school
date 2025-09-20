import { DragItem, DropZone, DropValidationResult, ComponentPosition } from '../types/drag-drop';

export class DropZoneValidator {
  /**
   * Validates if a drag item can be dropped in a specific zone
   */
  static validateDrop(item: DragItem, zone: DropZone): DropValidationResult {
    // Check basic type compatibility
    if (!zone.accepts.includes(item.type)) {
      return {
        canDrop: false,
        reason: `${item.type} cannot be dropped in ${zone.type} zone`,
        suggestions: [`Try dropping in zones that accept: ${zone.accepts.join(', ')}`]
      };
    }

    // Validate component-specific rules
    if (item.type === 'new_component') {
      return this.validateNewComponent(item, zone);
    }

    if (item.type === 'existing_component') {
      return this.validateExistingComponent(item, zone);
    }

    return { canDrop: true };
  }

  /**
   * Validates dropping a new component
   */
  private static validateNewComponent(item: DragItem, zone: DropZone): DropValidationResult {
    // Trash zones don't accept new components
    if (zone.type === 'trash') {
      return {
        canDrop: false,
        reason: 'Cannot delete a component that doesn\'t exist yet',
        suggestions: ['Drop new components in content sections']
      };
    }

    // Check component type restrictions
    if (item.componentType) {
      const restrictions = this.getComponentRestrictions(item.componentType);
      
      if (restrictions.allowedZones && !restrictions.allowedZones.includes(zone.type)) {
        return {
          canDrop: false,
          reason: `${item.componentType} components can only be placed in: ${restrictions.allowedZones.join(', ')}`,
          suggestions: [`Look for ${restrictions.allowedZones.join(' or ')} zones`]
        };
      }

      if (restrictions.forbiddenZones && restrictions.forbiddenZones.includes(zone.type)) {
        return {
          canDrop: false,
          reason: `${item.componentType} components cannot be placed in ${zone.type} zones`,
          suggestions: ['Try a different section']
        };
      }
    }

    return { canDrop: true };
  }

  /**
   * Validates moving an existing component
   */
  private static validateExistingComponent(item: DragItem, zone: DropZone): DropValidationResult {
    // Allow dropping in trash for deletion
    if (zone.type === 'trash') {
      return { canDrop: true };
    }

    // Prevent dropping component on itself
    if (item.sourcePosition && this.isSamePosition(item.sourcePosition, zone.position)) {
      return {
        canDrop: false,
        reason: 'Component is already in this position',
        suggestions: ['Try dropping in a different section']
      };
    }

    // Check if moving to a child of itself (prevent infinite nesting)
    if (item.componentId && zone.position.parentId === item.componentId) {
      return {
        canDrop: false,
        reason: 'Cannot move component inside itself',
        suggestions: ['Choose a different drop zone']
      };
    }

    return { canDrop: true };
  }

  /**
   * Gets component-specific restrictions
   */
  private static getComponentRestrictions(componentType: string) {
    const restrictions: Record<string, {
      allowedZones?: string[];
      forbiddenZones?: string[];
      maxInstances?: number;
    }> = {
      'header': {
        allowedZones: ['section'],
        maxInstances: 1
      },
      'footer': {
        allowedZones: ['section'],
        maxInstances: 1
      },
      'navigation': {
        allowedZones: ['section'],
        maxInstances: 1
      },
      'sidebar': {
        forbiddenZones: ['component']
      }
    };

    return restrictions[componentType] || {};
  }

  /**
   * Checks if two positions are the same
   */
  private static isSamePosition(pos1: ComponentPosition, pos2: ComponentPosition): boolean {
    return pos1.pageId === pos2.pageId &&
           pos1.sectionId === pos2.sectionId &&
           pos1.order === pos2.order &&
           pos1.parentId === pos2.parentId;
  }

  /**
   * Calculates the optimal drop position within a zone
   */
  static calculateDropPosition(
    item: DragItem, 
    zone: DropZone, 
    existingComponents: ComponentPosition[] = []
  ): ComponentPosition {
    // For trash zone, return a special position
    if (zone.type === 'trash') {
      return {
        pageId: 'trash',
        sectionId: 'deleted',
        order: -1
      };
    }

    // Calculate next available order in the target zone
    const sameZoneComponents = existingComponents.filter(comp => 
      comp.pageId === zone.position.pageId &&
      comp.sectionId === zone.position.sectionId &&
      comp.parentId === zone.position.parentId
    );

    const maxOrder = sameZoneComponents.length > 0 
      ? Math.max(...sameZoneComponents.map(comp => comp.order))
      : -1;

    return {
      pageId: zone.position.pageId,
      sectionId: zone.position.sectionId,
      order: maxOrder + 1,
      parentId: zone.position.parentId
    };
  }

  /**
   * Validates drop zone highlighting
   */
  static shouldHighlightZone(item: DragItem, zone: DropZone): boolean {
    const validation = this.validateDrop(item, zone);
    return validation.canDrop;
  }
}