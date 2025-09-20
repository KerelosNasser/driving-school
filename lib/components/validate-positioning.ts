/**
 * Simple validation script to test component positioning system
 */
import { ComponentRegistryManager } from './ComponentRegistry';
import { ComponentPositioning } from './ComponentPositioning';
import { PositionManager } from './PositionManager';
import { ComponentPosition } from './types';

export function validateComponentPositioning(): boolean {
  console.log('🧪 Testing Component Positioning System...');
  
  try {
    // Test 1: Registry setup
    console.log('1. Setting up test registry...');
    const registry = ComponentRegistryManager.getInstance();
    registry.clear();
    
    // Register test component
    registry.registerComponent({
      id: 'test-component',
      name: 'Test Component',
      category: 'text',
      icon: 'Test',
      description: 'Test component for positioning',
      defaultProps: {},
      schema: { type: 'object', properties: {} },
      previewComponent: 'TestPreview',
      editComponent: 'TestEdit',
      version: '1.0.0',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Test registry setup complete');

    // Test 2: Position validation
    console.log('2. Testing position validation...');
    const validPosition: ComponentPosition = {
      pageId: 'test-page',
      sectionId: 'main',
      order: 0
    };
    
    const validation = ComponentPositioning.validatePosition(validPosition);
    if (!validation.isValid) {
      throw new Error(`Position validation failed: ${validation.errors.join(', ')}`);
    }
    console.log('✅ Position validation passed');

    // Test 3: Component creation and positioning
    console.log('3. Testing component creation and positioning...');
    const comp1 = registry.createInstance('test-component', {}, 'test-user');
    const comp2 = registry.createInstance('test-component', {}, 'test-user');
    const comp3 = registry.createInstance('test-component', {}, 'test-user');

    // Set initial positions
    registry.updateInstance(comp1.id, {
      position: { pageId: 'test-page', sectionId: 'main', order: 0 }
    }, 'test-user');
    
    registry.updateInstance(comp2.id, {
      position: { pageId: 'test-page', sectionId: 'main', order: 1 }
    }, 'test-user');
    
    registry.updateInstance(comp3.id, {
      position: { pageId: 'test-page', sectionId: 'main', order: 2 }
    }, 'test-user');
    console.log('✅ Component creation and positioning successful');

    // Test 4: Insert position calculation
    console.log('4. Testing insert position calculation...');
    const existingComponents = [
      registry.getInstance(comp1.id)!,
      registry.getInstance(comp2.id)!,
      registry.getInstance(comp3.id)!
    ];

    const insertPosition: ComponentPosition = {
      pageId: 'test-page',
      sectionId: 'main',
      order: 1
    };

    const insertCalc = ComponentPositioning.calculateInsertPosition(insertPosition, existingComponents);
    if (insertCalc.newOrder !== 1 || insertCalc.affectedComponents.length === 0) {
      throw new Error('Insert position calculation failed');
    }
    console.log('✅ Insert position calculation successful');

    // Test 5: Move position calculation
    console.log('5. Testing move position calculation...');
    const currentPos = { pageId: 'test-page', sectionId: 'main', order: 0 };
    const newPos = { pageId: 'test-page', sectionId: 'main', order: 2 };

    const moveCalc = ComponentPositioning.calculateMovePosition(
      comp1.id,
      currentPos,
      newPos,
      existingComponents
    );
    
    if (moveCalc.newOrder !== 2 || moveCalc.affectedComponents.length === 0) {
      throw new Error('Move position calculation failed');
    }
    console.log('✅ Move position calculation successful');

    // Test 6: Hierarchy building
    console.log('6. Testing hierarchy building...');
    const hierarchy = ComponentPositioning.buildHierarchy('test-page');
    if (hierarchy.length !== 3) {
      throw new Error(`Expected 3 root components, got ${hierarchy.length}`);
    }
    console.log('✅ Hierarchy building successful');

    // Test 7: Next order calculation
    console.log('7. Testing next order calculation...');
    const nextOrder = ComponentPositioning.getNextOrder('test-page', 'main');
    if (nextOrder !== 3) {
      throw new Error(`Expected next order 3, got ${nextOrder}`);
    }
    console.log('✅ Next order calculation successful');

    // Test 8: Circular reference prevention
    console.log('8. Testing circular reference prevention...');
    const canMove = ComponentPositioning.canMoveToParent(comp1.id, comp1.id, 'test-page');
    if (canMove.canMove) {
      throw new Error('Should prevent component from being its own parent');
    }
    console.log('✅ Circular reference prevention successful');

    // Test 9: Position normalization
    console.log('9. Testing position normalization...');
    // Create gaps in ordering
    registry.updateInstance(comp2.id, {
      position: { pageId: 'test-page', sectionId: 'main', order: 5 }
    }, 'test-user');
    
    registry.updateInstance(comp3.id, {
      position: { pageId: 'test-page', sectionId: 'main', order: 10 }
    }, 'test-user');

    const normalizeOps = ComponentPositioning.normalizePositions('test-page', 'main');
    if (normalizeOps.length !== 2) {
      throw new Error(`Expected 2 normalization operations, got ${normalizeOps.length}`);
    }
    console.log('✅ Position normalization successful');

    // Test 10: Position manager
    console.log('10. Testing position manager...');
    const positionManager = new PositionManager();
    const stats = positionManager.getPositionStats('test-page');
    if (stats.totalComponents !== 3) {
      throw new Error(`Expected 3 components in stats, got ${stats.totalComponents}`);
    }
    console.log('✅ Position manager successful');

    console.log('🎉 All component positioning tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Component positioning test failed:', error);
    return false;
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateComponentPositioning();
}