/**
 * Simple validation script to test component library infrastructure
 */
import { ComponentRegistryManager } from './ComponentRegistry';
import { ComponentValidator } from './ComponentValidator';
import { ComponentDefinition } from './types';

export function validateComponentLibraryInfrastructure(): boolean {
  console.log('🧪 Testing Component Library Infrastructure...');
  
  try {
    // Test 1: Registry initialization
    console.log('1. Testing registry initialization...');
    const registry = ComponentRegistryManager.getInstance();
    registry.clear();
    console.log('✅ Registry initialized successfully');

    // Test 2: Component definition validation
    console.log('2. Testing component definition validation...');
    const testDefinition: ComponentDefinition = {
      id: 'test-text',
      name: 'Test Text Component',
      category: 'text',
      icon: 'Type',
      description: 'A test text component',
      defaultProps: { text: 'Default text' },
      schema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            title: 'Text Content',
            description: 'The text to display'
          }
        },
        required: ['text']
      },
      previewComponent: 'TestTextPreview',
      editComponent: 'TestTextEdit',
      version: '1.0.0',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const validation = ComponentValidator.validateDefinition(testDefinition);
    if (!validation.isValid) {
      throw new Error(`Definition validation failed: ${validation.errors.join(', ')}`);
    }
    console.log('✅ Component definition validation passed');

    // Test 3: Component registration
    console.log('3. Testing component registration...');
    registry.registerComponent(testDefinition);
    const retrieved = registry.getDefinition('test-text');
    if (!retrieved || retrieved.id !== 'test-text') {
      throw new Error('Component registration failed');
    }
    console.log('✅ Component registration successful');

    // Test 4: Instance creation
    console.log('4. Testing instance creation...');
    const instance = registry.createInstance('test-text', { text: 'Hello World' }, 'test-user');
    if (!instance || instance.type !== 'test-text') {
      throw new Error('Instance creation failed');
    }
    console.log('✅ Instance creation successful');

    // Test 5: Props validation
    console.log('5. Testing props validation...');
    const propsValidation = registry.validateComponentProps(testDefinition, {
      text: 'Valid text',
      unknownProp: 'should warn'
    });
    if (!propsValidation.isValid) {
      throw new Error(`Props validation failed: ${propsValidation.errors.join(', ')}`);
    }
    if (propsValidation.warnings.length === 0) {
      console.log('⚠️  Expected warning for unknown prop, but none found');
    }
    console.log('✅ Props validation successful');

    // Test 6: Instance management
    console.log('6. Testing instance management...');
    const updated = registry.updateInstance(instance.id, { 
      props: { text: 'Updated text' } 
    }, 'test-user');
    if (updated.props.text !== 'Updated text') {
      throw new Error('Instance update failed');
    }
    
    const deleted = registry.deleteInstance(instance.id);
    if (!deleted) {
      throw new Error('Instance deletion failed');
    }
    console.log('✅ Instance management successful');

    console.log('🎉 All component library infrastructure tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Component library infrastructure test failed:', error);
    return false;
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateComponentLibraryInfrastructure();
}