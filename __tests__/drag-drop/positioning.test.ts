/**
 * Unit tests for component positioning and drag-and-drop logic
 * Tests position calculation, reordering, and conflict resolution
 */

import { 
  ComponentPosition, 
  ComponentInstance,
  PositionCalculator,
  DragDropManager,
  DropZone,
  DragItem
} from '../../lib/drag-drop/types';
import { calculateNewPosition, validateDropZone, resolvePositionConflict } from '../../lib/drag-drop/positioning';

describe('Component Positioning', () => {
  describe('calculateNewPosition', () => {
    it('should calculate position for empty section', () => {
      const existingComponents: ComponentInstance[] = [];
      const dropZone: DropZone = {
        id: 'main-section',
        type: 'section',
        accepts: ['text', 'image'],
        position: { pageId: 'home', sectionId: 'main', order: 0 },
        isActive: true,
        isValid: true
      };

      const newPosition = calculateNewPosition(existingComponents, dropZone, 'insert');

      expect(newPosition).toEqual({
        pageId: 'home',
        sectionId: 'main',
        order: 0
      });
    });

    it('should calculate position for insertion at beginning', () => {
      const existingComponents: ComponentInstance[] = [
        {
          id: 'comp-1',
          type: 'text',
          position: { pageId: 'home', sectionId: 'main', order: 0 },
          props: {},
          version: '1.0',
          createdBy: 'user-1',
          createdAt: '2023-01-01T12:00:00Z',
          lastModifiedBy: 'user-1',
          lastModifiedAt: '2023-01-01T12:00:00Z'
        },
        {
          id: 'comp-2',
          type: 'image',
          position: { pageId: 'home', sectionId: 'main', order: 1 },
          props: {},
          version: '1.0',
          createdBy: 'user-1',
          createdAt: '2023-01-01T12:00:00Z',
          lastModifiedBy: 'user-1',
          lastModifiedAt: '2023-01-01T12:00:00Z'
        }
      ];

      const dropZone: DropZone = {
        id: 'main-section-before-0',
        type: 'section',
        accepts: ['text', 'image'],
        position: { pageId: 'home', sectionId: 'main', order: 0 },
        isActive: true,
        isValid: true
      };

      const newPosition = calculateNewPosition(existingComponents, dropZone, 'insert');

      expect(newPosition).toEqual({
        pageId: 'home',
        sectionId: 'main',
        order: 0
      });

      // Verify that existing components would be reordered
      const reorderedComponents = reorderExistingComponents(existingComponents, newPosition);
      expect(reorderedComponents[0].position.order).toBe(1); // comp-1 moved to order 1
      expect(reorderedComponents[1].position.order).toBe(2); // comp-2 moved to order 2
    });

    it('should calculate position for insertion between components', () => {
      const existingComponents: ComponentInstance[] = [
        {
          id: 'comp-1',
          type: 'text',
          position: { pageId: 'home', sectionId: 'main', order: 0 },
          props: {},
          version: '1.0',
          createdBy: 'user-1',
          createdAt: '2023-01-01T12:00:00Z',
          lastModifiedBy: 'user-1',
          lastModifiedAt: '2023-01-01T12:00:00Z'
        },
        {
          id: 'comp-2',
          type: 'image',
          position: { pageId: 'home', sectionId: 'main', order: 2 },
          props: {},
          version: '1.0',
          createdBy: 'user-1',
          createdAt: '2023-01-01T12:00:00Z',
          lastModifiedBy: 'user-1',
          lastModifiedAt: '2023-01-01T12:00:00Z'
        }
      ];

      const dropZone: DropZone = {
        id: 'main-section-between-0-2',
        type: 'section',
        accepts: ['text', 'image'],
        position: { pageId: 'home', sectionId: 'main', order: 1 },
        isActive: true,
        isValid: true
      };

      const newPosition = calculateNewPosition(existingComponents, dropZone, 'insert');

      expect(newPosition).toEqual({
        pageId: 'home',
        sectionId: 'main',
        order: 1
      });
    });

    it('should calculate position for append at end', () => {
      const existingComponents: ComponentInstance[] = [
        {
          id: 'comp-1',
          type: 'text',
          position: { pageId: 'home', sectionId: 'main', order: 0 },
          props: {},
          version: '1.0',
          createdBy: 'user-1',
          createdAt: '2023-01-01T12:00:00Z',
          lastModifiedBy: 'user-1',
          lastModifiedAt: '2023-01-01T12:00:00Z'
        },
        {
          id: 'comp-2',
          type: 'image',
          position: { pageId: 'home', sectionId: 'main', order: 1 },
          props: {},
          version: '1.0',
          createdBy: 'user-1',
          createdAt: '2023-01-01T12:00:00Z',
          lastModifiedBy: 'user-1',
          lastModifiedAt: '2023-01-01T12:00:00Z'
        }
      ];

      const dropZone: DropZone = {
        id: 'main-section-end',
        type: 'section',
        accepts: ['text', 'image'],
        position: { pageId: 'home', sectionId: 'main', order: 2 },
        isActive: true,
        isValid: true
      };

      const newPosition = calculateNewPosition(existingComponents, dropZone, 'append');

      expect(newPosition).toEqual({
        pageId: 'home',
        sectionId: 'main',
        order: 2
      });
    });

    it('should handle gaps in order sequence', () => {
      const existingComponents: ComponentInstance[] = [
        {
          id: 'comp-1',
          type: 'text',
          position: { pageId: 'home', sectionId: 'main', order: 0 },
          props: {},
          version: '1.0',
          createdBy: 'user-1',
          createdAt: '2023-01-01T12:00:00Z',
          lastModifiedBy: 'user-1',
          lastModifiedAt: '2023-01-01T12:00:00Z'
        },
        {
          id: 'comp-2',
          type: 'image',
          position: { pageId: 'home', sectionId: 'main', order: 5 }, // Gap in sequence
          props: {},
          version: '1.0',
          createdBy: 'user-1',
          createdAt: '2023-01-01T12:00:00Z',
          lastModifiedBy: 'user-1',
          lastModifiedAt: '2023-01-01T12:00:00Z'
        }
      ];

      const dropZone: DropZone = {
        id: 'main-section-between',
        type: 'section',
        accepts: ['text', 'image'],
        position: { pageId: 'home', sectionId: 'main', order: 3 },
        isActive: true,
        isValid: true
      };

      const newPosition = calculateNewPosition(existingComponents, dropZone, 'insert');

      expect(newPosition).toEqual({
        pageId: 'home',
        sectionId: 'main',
        order: 3
      });
    });
  });

  describe('validateDropZone', () => {
    it('should validate compatible component types', () => {
      const dragItem: DragItem = {
        type: 'new_component',
        componentType: 'text'
      };

      const dropZone: DropZone = {
        id: 'main-section',
        type: 'section',
        accepts: ['text', 'image'],
        position: { pageId: 'home', sectionId: 'main', order: 0 },
        isActive: true,
        isValid: true
      };

      const result = validateDropZone(dragItem, dropZone);

      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject incompatible component types', () => {
      const dragItem: DragItem = {
        type: 'new_component',
        componentType: 'video'
      };

      const dropZone: DropZone = {
        id: 'main-section',
        type: 'section',
        accepts: ['text', 'image'],
        position: { pageId: 'home', sectionId: 'main', order: 0 },
        isActive: true,
        isValid: true
      };

      const result = validateDropZone(dragItem, dropZone);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Component type "video" is not accepted in this zone');
    });

    it('should validate existing component moves', () => {
      const dragItem: DragItem = {
        type: 'existing_component',
        componentId: 'comp-1',
        sourcePosition: { pageId: 'home', sectionId: 'sidebar', order: 0 }
      };

      const dropZone: DropZone = {
        id: 'main-section',
        type: 'section',
        accepts: ['text', 'image'],
        position: { pageId: 'home', sectionId: 'main', order: 0 },
        isActive: true,
        isValid: true
      };

      const result = validateDropZone(dragItem, dropZone, 'text');

      expect(result.isValid).toBe(true);
    });

    it('should prevent dropping component on itself', () => {
      const dragItem: DragItem = {
        type: 'existing_component',
        componentId: 'comp-1',
        sourcePosition: { pageId: 'home', sectionId: 'main', order: 0 }
      };

      const dropZone: DropZone = {
        id: 'main-section',
        type: 'section',
        accepts: ['text', 'image'],
        position: { pageId: 'home', sectionId: 'main', order: 0 },
        isActive: true,
        isValid: true
      };

      const result = validateDropZone(dragItem, dropZone, 'text');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Cannot drop component on its current position');
    });

    it('should validate trash zone for deletion', () => {
      const dragItem: DragItem = {
        type: 'existing_component',
        componentId: 'comp-1',
        sourcePosition: { pageId: 'home', sectionId: 'main', order: 0 }
      };

      const trashZone: DropZone = {
        id: 'trash-zone',
        type: 'trash',
        accepts: ['*'], // Accepts all types for deletion
        position: { pageId: 'trash', sectionId: 'deleted', order: 0 },
        isActive: true,
        isValid: true
      };

      const result = validateDropZone(dragItem, trashZone, 'text');

      expect(result.isValid).toBe(true);
    });

    it('should reject drops on inactive zones', () => {
      const dragItem: DragItem = {
        type: 'new_component',
        componentType: 'text'
      };

      const dropZone: DropZone = {
        id: 'main-section',
        type: 'section',
        accepts: ['text', 'image'],
        position: { pageId: 'home', sectionId: 'main', order: 0 },
        isActive: false, // Inactive zone
        isValid: true
      };

      const result = validateDropZone(dragItem, dropZone);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Drop zone is not active');
    });
  });

  describe('resolvePositionConflict', () => {
    it('should resolve conflicts by shifting positions', () => {
      const conflictingComponents: ComponentInstance[] = [
        {
          id: 'comp-1',
          type: 'text',
          position: { pageId: 'home', sectionId: 'main', order: 0 },
          props: {},
          version: '1.0',
          createdBy: 'user-1',
          createdAt: '2023-01-01T12:00:00Z',
          lastModifiedBy: 'user-1',
          lastModifiedAt: '2023-01-01T12:00:00Z'
        },
        {
          id: 'comp-2',
          type: 'image',
          position: { pageId: 'home', sectionId: 'main', order: 0 }, // Conflict!
          props: {},
          version: '1.0',
          createdBy: 'user-2',
          createdAt: '2023-01-01T12:01:00Z',
          lastModifiedBy: 'user-2',
          lastModifiedAt: '2023-01-01T12:01:00Z'
        }
      ];

      const resolution = resolvePositionConflict(conflictingComponents, 'shift_newer');

      expect(resolution.strategy).toBe('shift_newer');
      expect(resolution.resolvedPositions).toHaveLength(2);
      expect(resolution.resolvedPositions[0]).toEqual({
        componentId: 'comp-1',
        position: { pageId: 'home', sectionId: 'main', order: 0 }
      });
      expect(resolution.resolvedPositions[1]).toEqual({
        componentId: 'comp-2',
        position: { pageId: 'home', sectionId: 'main', order: 1 }
      });
    });

    it('should resolve conflicts by shifting older components', () => {
      const conflictingComponents: ComponentInstance[] = [
        {
          id: 'comp-1',
          type: 'text',
          position: { pageId: 'home', sectionId: 'main', order: 0 },
          props: {},
          version: '1.0',
          createdBy: 'user-1',
          createdAt: '2023-01-01T12:00:00Z',
          lastModifiedBy: 'user-1',
          lastModifiedAt: '2023-01-01T12:00:00Z'
        },
        {
          id: 'comp-2',
          type: 'image',
          position: { pageId: 'home', sectionId: 'main', order: 0 }, // Conflict!
          props: {},
          version: '1.0',
          createdBy: 'user-2',
          createdAt: '2023-01-01T12:01:00Z',
          lastModifiedBy: 'user-2',
          lastModifiedAt: '2023-01-01T12:01:00Z'
        }
      ];

      const resolution = resolvePositionConflict(conflictingComponents, 'shift_older');

      expect(resolution.strategy).toBe('shift_older');
      expect(resolution.resolvedPositions[0]).toEqual({
        componentId: 'comp-1',
        position: { pageId: 'home', sectionId: 'main', order: 1 }
      });
      expect(resolution.resolvedPositions[1]).toEqual({
        componentId: 'comp-2',
        position: { pageId: 'home', sectionId: 'main', order: 0 }
      });
    });

    it('should handle multiple conflicts in sequence', () => {
      const conflictingComponents: ComponentInstance[] = [
        {
          id: 'comp-1',
          type: 'text',
          position: { pageId: 'home', sectionId: 'main', order: 0 },
          props: {},
          version: '1.0',
          createdBy: 'user-1',
          createdAt: '2023-01-01T12:00:00Z',
          lastModifiedBy: 'user-1',
          lastModifiedAt: '2023-01-01T12:00:00Z'
        },
        {
          id: 'comp-2',
          type: 'image',
          position: { pageId: 'home', sectionId: 'main', order: 0 }, // Conflict with comp-1
          props: {},
          version: '1.0',
          createdBy: 'user-2',
          createdAt: '2023-01-01T12:01:00Z',
          lastModifiedBy: 'user-2',
          lastModifiedAt: '2023-01-01T12:01:00Z'
        },
        {
          id: 'comp-3',
          type: 'button',
          position: { pageId: 'home', sectionId: 'main', order: 1 }, // Will conflict after resolution
          props: {},
          version: '1.0',
          createdBy: 'user-3',
          createdAt: '2023-01-01T12:02:00Z',
          lastModifiedBy: 'user-3',
          lastModifiedAt: '2023-01-01T12:02:00Z'
        }
      ];

      const resolution = resolvePositionConflict(conflictingComponents, 'shift_newer');

      expect(resolution.resolvedPositions).toHaveLength(3);
      expect(resolution.resolvedPositions[0].position.order).toBe(0); // comp-1 stays
      expect(resolution.resolvedPositions[1].position.order).toBe(1); // comp-2 shifted
      expect(resolution.resolvedPositions[2].position.order).toBe(2); // comp-3 shifted
    });

    it('should preserve non-conflicting positions', () => {
      const conflictingComponents: ComponentInstance[] = [
        {
          id: 'comp-1',
          type: 'text',
          position: { pageId: 'home', sectionId: 'main', order: 0 },
          props: {},
          version: '1.0',
          createdBy: 'user-1',
          createdAt: '2023-01-01T12:00:00Z',
          lastModifiedBy: 'user-1',
          lastModifiedAt: '2023-01-01T12:00:00Z'
        },
        {
          id: 'comp-2',
          type: 'image',
          position: { pageId: 'home', sectionId: 'main', order: 2 }, // No conflict
          props: {},
          version: '1.0',
          createdBy: 'user-2',
          createdAt: '2023-01-01T12:01:00Z',
          lastModifiedBy: 'user-2',
          lastModifiedAt: '2023-01-01T12:01:00Z'
        },
        {
          id: 'comp-3',
          type: 'button',
          position: { pageId: 'home', sectionId: 'main', order: 0 }, // Conflict with comp-1
          props: {},
          version: '1.0',
          createdBy: 'user-3',
          createdAt: '2023-01-01T12:02:00Z',
          lastModifiedBy: 'user-3',
          lastModifiedAt: '2023-01-01T12:02:00Z'
        }
      ];

      const resolution = resolvePositionConflict(conflictingComponents, 'shift_newer');

      // comp-2 should keep its original position
      const comp2Resolution = resolution.resolvedPositions.find(r => r.componentId === 'comp-2');
      expect(comp2Resolution?.position.order).toBe(2);
    });
  });

  describe('PositionCalculator class', () => {
    let calculator: PositionCalculator;

    beforeEach(() => {
      calculator = new PositionCalculator();
    });

    it('should calculate optimal insertion point', () => {
      const existingPositions = [0, 1, 3, 4]; // Gap at position 2
      const preferredPosition = 2;

      const result = calculator.calculateOptimalPosition(existingPositions, preferredPosition);

      expect(result).toBe(2);
    });

    it('should find next available position when preferred is taken', () => {
      const existingPositions = [0, 1, 2, 3];
      const preferredPosition = 2;

      const result = calculator.calculateOptimalPosition(existingPositions, preferredPosition);

      expect(result).toBe(4); // Next available position
    });

    it('should handle negative positions', () => {
      const existingPositions = [0, 1, 2];
      const preferredPosition = -1;

      const result = calculator.calculateOptimalPosition(existingPositions, preferredPosition);

      expect(result).toBe(0); // Should normalize to valid position
    });

    it('should compact positions to remove gaps', () => {
      const positions = [
        { componentId: 'comp-1', position: { pageId: 'home', sectionId: 'main', order: 0 } },
        { componentId: 'comp-2', position: { pageId: 'home', sectionId: 'main', order: 5 } },
        { componentId: 'comp-3', position: { pageId: 'home', sectionId: 'main', order: 10 } }
      ];

      const compacted = calculator.compactPositions(positions);

      expect(compacted[0].position.order).toBe(0);
      expect(compacted[1].position.order).toBe(1);
      expect(compacted[2].position.order).toBe(2);
    });

    it('should maintain relative order during compaction', () => {
      const positions = [
        { componentId: 'comp-3', position: { pageId: 'home', sectionId: 'main', order: 10 } },
        { componentId: 'comp-1', position: { pageId: 'home', sectionId: 'main', order: 0 } },
        { componentId: 'comp-2', position: { pageId: 'home', sectionId: 'main', order: 5 } }
      ];

      const compacted = calculator.compactPositions(positions);

      // Should be sorted by original order
      expect(compacted[0].componentId).toBe('comp-1');
      expect(compacted[1].componentId).toBe('comp-2');
      expect(compacted[2].componentId).toBe('comp-3');
    });
  });
});

// Helper function for testing
function reorderExistingComponents(
  components: ComponentInstance[], 
  newPosition: ComponentPosition
): ComponentInstance[] {
  return components.map(comp => {
    if (comp.position.pageId === newPosition.pageId && 
        comp.position.sectionId === newPosition.sectionId &&
        comp.position.order >= newPosition.order) {
      return {
        ...comp,
        position: {
          ...comp.position,
          order: comp.position.order + 1
        }
      };
    }
    return comp;
  });
}