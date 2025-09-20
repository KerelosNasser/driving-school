import { ComponentRegistryManager } from '../ComponentRegistry';
import { ComponentDefinition, ComponentSchema } from '../types';

describe('ComponentRegistry', () => {
  let registry: ComponentRegistryManager;

  beforeEach(() => {
    registry = ComponentRegistryManager.getInstance();
    registry.clear();
  });

  describe('Component Definition Registration', () => {
    it('should register a valid component definition', () => {
      const definition: ComponentDefinition = {
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

      expect(() => registry.registerComponent(definition)).not.toThrow();
      expect(registry.getDefinition('test-text')).toEqual(definition);
    });

    it('should reject invalid component definition', () => {
      const invalidDefinition = {
        id: '',
        name: 'Invalid Component'
        // Missing required fields
      } as ComponentDefinition;

      expect(() => registry.registerComponent(invalidDefinition)).toThrow();
    });

    it('should get definitions by category', () => {
      const textDef: ComponentDefinition = {
        id: 'text-1',
        name: 'Text 1',
        category: 'text',
        icon: 'Type',
        description: 'Text component',
        defaultProps: {},
        schema: { type: 'object', properties: {} },
        previewComponent: 'TextPreview',
        editComponent: 'TextEdit',
        version: '1.0.0',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const mediaDef: ComponentDefinition = {
        id: 'image-1',
        name: 'Image 1',
        category: 'media',
        icon: 'Image',
        description: 'Image component',
        defaultProps: {},
        schema: { type: 'object', properties: {} },
        previewComponent: 'ImagePreview',
        editComponent: 'ImageEdit',
        version: '1.0.0',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      registry.registerComponent(textDef);
      registry.registerComponent(mediaDef);

      const textComponents = registry.getDefinitions('text');
      expect(textComponents).toHaveLength(1);
      expect(textComponents[0].id).toBe('text-1');

      const allComponents = registry.getDefinitions();
      expect(allComponents).toHaveLength(2);
    });
  });

  describe('Component Instance Management', () => {
    beforeEach(() => {
      const definition: ComponentDefinition = {
        id: 'test-component',
        name: 'Test Component',
        category: 'text',
        icon: 'Type',
        description: 'Test component',
        defaultProps: { text: 'Default' },
        schema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              title: 'Text',
              description: 'Text content'
            }
          }
        },
        previewComponent: 'TestPreview',
        editComponent: 'TestEdit',
        version: '1.0.0',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      registry.registerComponent(definition);
    });

    it('should create component instance', () => {
      const instance = registry.createInstance('test-component', { text: 'Hello' }, 'user1');
      
      expect(instance.id).toBeDefined();
      expect(instance.type).toBe('test-component');
      expect(instance.props.text).toBe('Hello');
      expect(instance.createdBy).toBe('user1');
    });

    it('should update component instance', () => {
      const instance = registry.createInstance('test-component', { text: 'Hello' }, 'user1');
      const updated = registry.updateInstance(instance.id, { props: { text: 'Updated' } }, 'user2');
      
      expect(updated.props.text).toBe('Updated');
      expect(updated.lastModifiedBy).toBe('user2');
    });

    it('should delete component instance', () => {
      const instance = registry.createInstance('test-component', {}, 'user1');
      const deleted = registry.deleteInstance(instance.id);
      
      expect(deleted).toBe(true);
      expect(registry.getInstance(instance.id)).toBeUndefined();
    });

    it('should get instances for page', () => {
      const instance1 = registry.createInstance('test-component', {}, 'user1');
      const instance2 = registry.createInstance('test-component', {}, 'user1');
      
      // Update positions
      registry.updateInstance(instance1.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 1 }
      }, 'user1');
      
      registry.updateInstance(instance2.id, {
        position: { pageId: 'page1', sectionId: 'main', order: 2 }
      }, 'user1');

      const pageInstances = registry.getInstancesForPage('page1');
      expect(pageInstances).toHaveLength(2);
      expect(pageInstances[0].position.order).toBe(1);
      expect(pageInstances[1].position.order).toBe(2);
    });
  });

  describe('Props Validation', () => {
    beforeEach(() => {
      const definition: ComponentDefinition = {
        id: 'validation-test',
        name: 'Validation Test',
        category: 'text',
        icon: 'Type',
        description: 'Component for testing validation',
        defaultProps: { text: 'Default', count: 0 },
        schema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              title: 'Text Content'
            },
            count: {
              type: 'number',
              title: 'Count'
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled'
            }
          },
          required: ['text']
        },
        previewComponent: 'ValidationPreview',
        editComponent: 'ValidationEdit',
        version: '1.0.0',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      registry.registerComponent(definition);
    });

    it('should validate and sanitize props', () => {
      const definition = registry.getDefinition('validation-test')!;
      const validation = registry.validateComponentProps(definition, {
        text: 'Hello',
        count: '5', // String that should be converted to number
        enabled: 'true' // String that should be converted to boolean
      });

      expect(validation.isValid).toBe(true);
      expect(validation.sanitizedProps?.count).toBe(5);
      expect(validation.sanitizedProps?.enabled).toBe(true);
    });

    it('should reject invalid props', () => {
      const definition = registry.getDefinition('validation-test')!;
      const validation = registry.validateComponentProps(definition, {
        count: 'not-a-number'
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Required property missing: text');
    });
  });
});