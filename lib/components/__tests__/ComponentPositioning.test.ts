import { ComponentPositioning } from '../ComponentPositioning';
import { ComponentRegistryManager } from '../ComponentRegistry';
import { ComponentInstance, ComponentPosition } from '../types';

describe('ComponentPositioning', () => {
  let registry: ComponentRegistryManager;

  beforeEach(() => {
    registry = ComponentRegistryManager.getInstance();
    registry.clear();

    // Register a test component definition
    registry.registerComponent({
      id: 'test-component',
      name: 'Test Component',
      category: 'text',
      icon: 'Test',
      description: 'Test component',
      defaultProps: {},
      schema: { type: 'object', properties: {} },
      previewComponent: 'TestPreview',
      editComponent: 'TestEdit',
      version: '1.0.0',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  describe('Position Validation', () => {
    it('should validate correct position', () => {
      const position: ComponentPosition = {
        pageId: 'page1',
        sectionId: 'main',
        order: 0
      };

      const result = ComponentPositioning.validatePosition(position);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid position', () => {
      const position = {
        pageId: '',
        sectionId: 'main',
        order: -1
      } as ComponentPosition;

      const result = ComponentPositioning.validatePosition(position);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Insert Position Calculation', () => {
    it('should calculate insert position for empty section', () => {
      const position: ComponentPosition = {
        pageId: 'page1',
        sectionId: 'main',
        order: 0
      };

      const calculation = ComponentPositioning.calculateInsertPosition(position, []);
      expect(calculation.newOrder).toBe(0);
      expect(calculation.affectedComponents).toHaveLength(0);
      expect(calculation.reorderOperations).toHaveLength(0);
    });

    it('should calculate insert position with existing components', () => {
      // Create existing components
      const comp1 = registry.createInstance('test-component', {}, 'user1');
      const comp2 = registry.createInstance('test-component', {}, 'user1');
      
      registry.updateInstance(comp1.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 0 }
      }, 'user1');
      
      registry.updateInstance(comp2.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 1 }
      }, 'user1');

      const existingComponents = [
        registry.getInstance(comp1.id)!,
        registry.getInstance(comp2.id)!
      ];

      // Insert at position 1 (between existing components)
      const insertPosition: ComponentPosition = {
        pageId: 'page1',
        sectionId: 'main',
        order: 1
      };

      const calculation = ComponentPositioning.calculateInsertPosition(insertPosition, existingComponents);
      
      expect(calculation.newOrder).toBe(1);
      expect(calculation.affectedComponents).toContain(comp2.id);
      expect(calculation.reorderOperations).toHaveLength(1);
      expect(calculation.reorderOperations[0].newOrder).toBe(2);
    });
  });

  describe('Move Position Calculation', () => {
    it('should calculate move within same section', () => {
      // Create components
      const comp1 = registry.createInstance('test-component', {}, 'user1');
      const comp2 = registry.createInstance('test-component', {}, 'user1');
      const comp3 = registry.createInstance('test-component', {}, 'user1');
      
      registry.updateInstance(comp1.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 0 }
      }, 'user1');
      
      registry.updateInstance(comp2.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 1 }
      }, 'user1');
      
      registry.updateInstance(comp3.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 2 }
      }, 'user1');

      const existingComponents = [
        registry.getInstance(comp1.id)!,
        registry.getInstance(comp2.id)!,
        registry.getInstance(comp3.id)!
      ];

      // Move comp1 from position 0 to position 2
      const currentPosition = { pageId: 'page1', sectionId: 'main', order: 0 };
      const newPosition = { pageId: 'page1', sectionId: 'main', order: 2 };

      const calculation = ComponentPositioning.calculateMovePosition(
        comp1.id,
        currentPosition,
        newPosition,
        existingComponents
      );

      expect(calculation.newOrder).toBe(2);
      expect(calculation.affectedComponents).toContain(comp2.id);
      expect(calculation.affectedComponents).toContain(comp3.id);
      expect(calculation.reorderOperations).toHaveLength(2);
    });
  });

  describe('Next Order Calculation', () => {
    it('should return 0 for empty section', () => {
      const nextOrder = ComponentPositioning.getNextOrder('page1', 'main');
      expect(nextOrder).toBe(0);
    });

    it('should return next order for section with components', () => {
      const comp1 = registry.createInstance('test-component', {}, 'user1');
      const comp2 = registry.createInstance('test-component', {}, 'user1');
      
      registry.updateInstance(comp1.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 0 }
      }, 'user1');
      
      registry.updateInstance(comp2.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 1 }
      }, 'user1');

      const nextOrder = ComponentPositioning.getNextOrder('page1', 'main');
      expect(nextOrder).toBe(2);
    });
  });

  describe('Hierarchy Building', () => {
    it('should build flat hierarchy', () => {
      const comp1 = registry.createInstance('test-component', {}, 'user1');
      const comp2 = registry.createInstance('test-component', {}, 'user1');
      
      registry.updateInstance(comp1.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 0 }
      }, 'user1');
      
      registry.updateInstance(comp2.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 1 }
      }, 'user1');

      const hierarchy = ComponentPositioning.buildHierarchy('page1');
      
      expect(hierarchy).toHaveLength(2);
      expect(hierarchy[0].componentId).toBe(comp1.id);
      expect(hierarchy[0].depth).toBe(0);
      expect(hierarchy[0].children).toHaveLength(0);
      expect(hierarchy[1].componentId).toBe(comp2.id);
      expect(hierarchy[1].depth).toBe(0);
      expect(hierarchy[1].children).toHaveLength(0);
    });

    it('should build nested hierarchy', () => {
      const parent = registry.createInstance('test-component', {}, 'user1');
      const child1 = registry.createInstance('test-component', {}, 'user1');
      const child2 = registry.createInstance('test-component', {}, 'user1');
      
      registry.updateInstance(parent.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 0 }
      }, 'user1');
      
      registry.updateInstance(child1.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 0, parentId: parent.id }
      }, 'user1');
      
      registry.updateInstance(child2.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 1, parentId: parent.id }
      }, 'user1');

      const hierarchy = ComponentPositioning.buildHierarchy('page1');
      
      expect(hierarchy).toHaveLength(1);
      expect(hierarchy[0].componentId).toBe(parent.id);
      expect(hierarchy[0].depth).toBe(0);
      expect(hierarchy[0].children).toHaveLength(2);
      expect(hierarchy[0].children[0].componentId).toBe(child1.id);
      expect(hierarchy[0].children[0].depth).toBe(1);
      expect(hierarchy[0].children[1].componentId).toBe(child2.id);
      expect(hierarchy[0].children[1].depth).toBe(1);
    });
  });

  describe('Circular Reference Prevention', () => {
    it('should prevent component from being its own parent', () => {
      const result = ComponentPositioning.canMoveToParent('comp1', 'comp1', 'page1');
      expect(result.canMove).toBe(false);
      expect(result.reason).toContain('own parent');
    });

    it('should prevent moving to descendant', () => {
      const parent = registry.createInstance('test-component', {}, 'user1');
      const child = registry.createInstance('test-component', {}, 'user1');
      
      registry.updateInstance(parent.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 0 }
      }, 'user1');
      
      registry.updateInstance(child.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 0, parentId: parent.id }
      }, 'user1');

      const result = ComponentPositioning.canMoveToParent(parent.id, child.id, 'page1');
      expect(result.canMove).toBe(false);
      expect(result.reason).toContain('descendant');
    });

    it('should allow valid parent moves', () => {
      const comp1 = registry.createInstance('test-component', {}, 'user1');
      const comp2 = registry.createInstance('test-component', {}, 'user1');
      
      registry.updateInstance(comp1.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 0 }
      }, 'user1');
      
      registry.updateInstance(comp2.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 1 }
      }, 'user1');

      const result = ComponentPositioning.canMoveToParent(comp1.id, comp2.id, 'page1');
      expect(result.canMove).toBe(true);
    });
  });

  describe('Position Normalization', () => {
    it('should normalize positions with gaps', () => {
      const comp1 = registry.createInstance('test-component', {}, 'user1');
      const comp2 = registry.createInstance('test-component', {}, 'user1');
      const comp3 = registry.createInstance('test-component', {}, 'user1');
      
      // Create gaps in ordering
      registry.updateInstance(comp1.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 0 }
      }, 'user1');
      
      registry.updateInstance(comp2.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 5 }
      }, 'user1');
      
      registry.updateInstance(comp3.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 10 }
      }, 'user1');

      const operations = ComponentPositioning.normalizePositions('page1', 'main');
      
      expect(operations).toHaveLength(2); // comp2 and comp3 need adjustment
      expect(operations.find(op => op.componentId === comp2.id)?.newOrder).toBe(1);
      expect(operations.find(op => op.componentId === comp3.id)?.newOrder).toBe(2);
    });
  });
});