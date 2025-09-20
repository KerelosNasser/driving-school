import { 
  ComponentDefinition, 
  ComponentInstance, 
  ComponentRegistry, 
  ComponentValidationResult,
  ComponentSchema,
  ComponentPropertySchema
} from './types';

/**
 * Component Registry - Manages available component definitions and instances
 */
export class ComponentRegistryManager implements ComponentRegistry {
  public definitions: Map<string, ComponentDefinition> = new Map();
  public instances: Map<string, ComponentInstance> = new Map();
  
  private static instance: ComponentRegistryManager;
  private initialized = false;

  private constructor() {}

  public static getInstance(): ComponentRegistryManager {
    if (!ComponentRegistryManager.instance) {
      ComponentRegistryManager.instance = new ComponentRegistryManager();
    }
    return ComponentRegistryManager.instance;
  }

  /**
   * Initialize the registry with default component definitions
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load component definitions from API or default set
      await this.loadDefaultComponents();
      this.initialized = true;
      console.log('Component registry initialized with', this.definitions.size, 'definitions');
    } catch (error) {
      console.error('Failed to initialize component registry:', error);
      throw error;
    }
  }

  /**
   * Register a new component definition
   */
  public registerComponent(definition: ComponentDefinition): void {
    // Validate the definition
    const validation = this.validateComponentDefinition(definition);
    if (!validation.isValid) {
      throw new Error(`Invalid component definition: ${validation.errors.join(', ')}`);
    }

    this.definitions.set(definition.id, definition);
    console.log(`Registered component: ${definition.name} (${definition.id})`);
  }

  /**
   * Get a component definition by ID
   */
  public getDefinition(componentId: string): ComponentDefinition | undefined {
    return this.definitions.get(componentId);
  }

  /**
   * Get all component definitions, optionally filtered by category
   */
  public getDefinitions(category?: string): ComponentDefinition[] {
    const definitions = Array.from(this.definitions.values());
    
    if (category) {
      return definitions.filter(def => def.category === category && def.isActive);
    }
    
    return definitions.filter(def => def.isActive);
  }

  /**
   * Get definitions grouped by category
   */
  public getDefinitionsByCategory(): Record<string, ComponentDefinition[]> {
    const definitions = this.getDefinitions();
    const grouped: Record<string, ComponentDefinition[]> = {};

    definitions.forEach(def => {
      if (!grouped[def.category]) {
        grouped[def.category] = [];
      }
      grouped[def.category].push(def);
    });

    return grouped;
  }

  /**
   * Create a new component instance
   */
  public createInstance(
    componentType: string,
    props: Record<string, any> = {},
    userId: string
  ): ComponentInstance {
    const definition = this.getDefinition(componentType);
    if (!definition) {
      throw new Error(`Component type not found: ${componentType}`);
    }

    // Validate and sanitize props
    const validation = this.validateComponentProps(definition, props);
    if (!validation.isValid) {
      throw new Error(`Invalid component props: ${validation.errors.join(', ')}`);
    }

    const instance: ComponentInstance = {
      id: this.generateInstanceId(),
      type: componentType,
      position: {
        pageId: '',
        sectionId: '',
        order: 0
      },
      props: validation.sanitizedProps || { ...definition.defaultProps, ...props },
      version: '1.0',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      lastModifiedBy: userId,
      lastModifiedAt: new Date().toISOString(),
      isActive: true
    };

    this.instances.set(instance.id, instance);
    return instance;
  }

  /**
   * Get a component instance by ID
   */
  public getInstance(instanceId: string): ComponentInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Update a component instance
   */
  public updateInstance(
    instanceId: string,
    updates: Partial<ComponentInstance>,
    userId: string
  ): ComponentInstance {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Component instance not found: ${instanceId}`);
    }

    // If props are being updated, validate them
    if (updates.props) {
      const definition = this.getDefinition(instance.type);
      if (definition) {
        const validation = this.validateComponentProps(definition, updates.props);
        if (!validation.isValid) {
          throw new Error(`Invalid component props: ${validation.errors.join(', ')}`);
        }
        updates.props = validation.sanitizedProps || updates.props;
      }
    }

    const updatedInstance: ComponentInstance = {
      ...instance,
      ...updates,
      lastModifiedBy: userId,
      lastModifiedAt: new Date().toISOString()
    };

    this.instances.set(instanceId, updatedInstance);
    return updatedInstance;
  }

  /**
   * Delete a component instance
   */
  public deleteInstance(instanceId: string): boolean {
    return this.instances.delete(instanceId);
  }

  /**
   * Get all instances for a specific page
   */
  public getInstancesForPage(pageId: string): ComponentInstance[] {
    return Array.from(this.instances.values())
      .filter(instance => instance.position.pageId === pageId && instance.isActive)
      .sort((a, b) => a.position.order - b.position.order);
  }

  /**
   * Validate component definition
   */
  private validateComponentDefinition(definition: ComponentDefinition): ComponentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!definition.id) errors.push('Component ID is required');
    if (!definition.name) errors.push('Component name is required');
    if (!definition.category) errors.push('Component category is required');
    if (!definition.schema) errors.push('Component schema is required');

    // Category validation
    const validCategories = ['text', 'media', 'layout', 'interactive'];
    if (definition.category && !validCategories.includes(definition.category)) {
      errors.push(`Invalid category: ${definition.category}`);
    }

    // Schema validation
    if (definition.schema && !this.validateSchema(definition.schema)) {
      errors.push('Invalid component schema');
    }

    // Check for duplicate IDs
    if (definition.id && this.definitions.has(definition.id)) {
      warnings.push(`Component with ID ${definition.id} already exists`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate component props against schema
   */
  public validateComponentProps(
    definition: ComponentDefinition,
    props: Record<string, any>
  ): ComponentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedProps: Record<string, any> = { ...definition.defaultProps };

    // Validate each property against schema
    for (const [key, value] of Object.entries(props)) {
      const propertySchema = definition.schema.properties[key];
      
      if (!propertySchema) {
        warnings.push(`Unknown property: ${key}`);
        continue;
      }

      const validation = this.validateProperty(key, value, propertySchema);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      } else {
        sanitizedProps[key] = validation.sanitizedValue !== undefined ? validation.sanitizedValue : value;
      }
    }

    // Check required properties
    if (definition.schema.required) {
      for (const requiredProp of definition.schema.required) {
        if (!(requiredProp in props) && !(requiredProp in definition.defaultProps)) {
          errors.push(`Required property missing: ${requiredProp}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedProps
    };
  }

  /**
   * Validate a single property value
   */
  private validateProperty(
    key: string,
    value: any,
    schema: ComponentPropertySchema
  ): { isValid: boolean; errors: string[]; sanitizedValue?: any } {
    const errors: string[] = [];
    let sanitizedValue = value;

    // Type validation
    switch (schema.type) {
      case 'string':
        if (typeof value !== 'string') {
          sanitizedValue = String(value);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          const num = Number(value);
          if (isNaN(num)) {
            errors.push(`${key} must be a number`);
          } else {
            sanitizedValue = num;
          }
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          sanitizedValue = Boolean(value);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${key} must be an array`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null) {
          errors.push(`${key} must be an object`);
        }
        break;
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${key} must be one of: ${schema.enum.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue
    };
  }

  /**
   * Validate component schema structure
   */
  private validateSchema(schema: ComponentSchema): boolean {
    if (schema.type !== 'object') return false;
    if (!schema.properties || typeof schema.properties !== 'object') return false;
    
    // Validate each property schema
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (!this.validatePropertySchema(propSchema)) {
        console.warn(`Invalid property schema for ${key}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Validate property schema structure
   */
  private validatePropertySchema(schema: ComponentPropertySchema): boolean {
    const validTypes = ['string', 'number', 'boolean', 'array', 'object'];
    return validTypes.includes(schema.type) && typeof schema.title === 'string';
  }

  /**
   * Generate unique instance ID
   */
  private generateInstanceId(): string {
    return `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load default component definitions
   */
  private async loadDefaultComponents(): Promise<void> {
    // Import default components
    const { DEFAULT_COMPONENTS } = await import('./defaultComponents');
    
    // Register each default component
    for (const definition of DEFAULT_COMPONENTS) {
      try {
        this.registerComponent(definition);
      } catch (error) {
        console.error(`Failed to register component ${definition.id}:`, error);
      }
    }
    
    console.log(`Loaded ${DEFAULT_COMPONENTS.length} default components`);
  }

  /**
   * Clear all definitions and instances (for testing)
   */
  public clear(): void {
    this.definitions.clear();
    this.instances.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const componentRegistry = ComponentRegistryManager.getInstance();