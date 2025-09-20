import { 
  ComponentDefinition, 
  ComponentInstance, 
  ComponentValidationResult,
  ComponentSchema,
  ComponentPropertySchema,
  ComponentPosition
} from './types';

/**
 * Component Validator - Handles validation of component definitions, instances, and props
 */
export class ComponentValidator {
  /**
   * Validate a complete component definition
   */
  public static validateDefinition(definition: ComponentDefinition): ComponentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!definition.id || typeof definition.id !== 'string') {
      errors.push('Component ID is required and must be a string');
    }

    if (!definition.name || typeof definition.name !== 'string') {
      errors.push('Component name is required and must be a string');
    }

    if (!definition.category || typeof definition.category !== 'string') {
      errors.push('Component category is required and must be a string');
    }

    // Category validation
    const validCategories = ['text', 'media', 'layout', 'interactive'];
    if (definition.category && !validCategories.includes(definition.category)) {
      errors.push(`Invalid category: ${definition.category}. Must be one of: ${validCategories.join(', ')}`);
    }

    // Schema validation
    if (!definition.schema) {
      errors.push('Component schema is required');
    } else {
      const schemaValidation = this.validateSchema(definition.schema);
      if (!schemaValidation.isValid) {
        errors.push(...schemaValidation.errors);
      }
    }

    // Default props validation
    if (definition.defaultProps && typeof definition.defaultProps !== 'object') {
      errors.push('Default props must be an object');
    }

    // Icon validation
    if (!definition.icon || typeof definition.icon !== 'string') {
      warnings.push('Component icon should be specified');
    }

    // Description validation
    if (!definition.description || typeof definition.description !== 'string') {
      warnings.push('Component description should be specified');
    }

    // Component references validation
    if (!definition.previewComponent || typeof definition.previewComponent !== 'string') {
      errors.push('Preview component reference is required');
    }

    if (!definition.editComponent || typeof definition.editComponent !== 'string') {
      errors.push('Edit component reference is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate component schema structure
   */
  public static validateSchema(schema: ComponentSchema): ComponentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Root schema validation
    if (schema.type !== 'object') {
      errors.push('Component schema must be of type "object"');
    }

    if (!schema.properties || typeof schema.properties !== 'object') {
      errors.push('Component schema must have properties object');
    } else {
      // Validate each property
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const propValidation = this.validatePropertySchema(propName, propSchema);
        if (!propValidation.isValid) {
          errors.push(...propValidation.errors);
        }
        warnings.push(...propValidation.warnings);
      }
    }

    // Required fields validation
    if (schema.required && !Array.isArray(schema.required)) {
      errors.push('Schema required field must be an array');
    }

    if (schema.required) {
      for (const requiredField of schema.required) {
        if (typeof requiredField !== 'string') {
          errors.push('Required field names must be strings');
        } else if (!schema.properties[requiredField]) {
          errors.push(`Required field "${requiredField}" not found in properties`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate individual property schema
   */
  public static validatePropertySchema(
    propName: string, 
    schema: ComponentPropertySchema
  ): ComponentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Type validation
    const validTypes = ['string', 'number', 'boolean', 'array', 'object'];
    if (!schema.type || !validTypes.includes(schema.type)) {
      errors.push(`Property "${propName}" must have a valid type: ${validTypes.join(', ')}`);
    }

    // Title validation
    if (!schema.title || typeof schema.title !== 'string') {
      errors.push(`Property "${propName}" must have a title`);
    }

    // Description validation
    if (schema.description && typeof schema.description !== 'string') {
      warnings.push(`Property "${propName}" description should be a string`);
    }

    // Enum validation
    if (schema.enum && !Array.isArray(schema.enum)) {
      errors.push(`Property "${propName}" enum must be an array`);
    }

    // Format validation for strings
    if (schema.type === 'string' && schema.format) {
      const validFormats = ['email', 'url', 'date', 'time', 'datetime', 'color', 'password'];
      if (!validFormats.includes(schema.format)) {
        warnings.push(`Property "${propName}" has unknown format: ${schema.format}`);
      }
    }

    // Array items validation
    if (schema.type === 'array' && schema.items) {
      const itemsValidation = this.validatePropertySchema(`${propName}[]`, schema.items);
      if (!itemsValidation.isValid) {
        errors.push(...itemsValidation.errors);
      }
    }

    // Object properties validation
    if (schema.type === 'object' && schema.properties) {
      for (const [nestedPropName, nestedSchema] of Object.entries(schema.properties)) {
        const nestedValidation = this.validatePropertySchema(
          `${propName}.${nestedPropName}`, 
          nestedSchema
        );
        if (!nestedValidation.isValid) {
          errors.push(...nestedValidation.errors);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate component props against definition
   */
  public static validateProps(
    definition: ComponentDefinition,
    props: Record<string, any>
  ): ComponentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedProps: Record<string, any> = { ...definition.defaultProps };

    // Validate each provided prop
    for (const [propName, propValue] of Object.entries(props)) {
      const propSchema = definition.schema.properties[propName];
      
      if (!propSchema) {
        warnings.push(`Unknown property: ${propName}`);
        continue;
      }

      const validation = this.validatePropertyValue(propName, propValue, propSchema);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      } else {
        sanitizedProps[propName] = validation.sanitizedProps?.[propName] ?? propValue;
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
  public static validatePropertyValue(
    propName: string,
    value: any,
    schema: ComponentPropertySchema
  ): ComponentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedProps: Record<string, any> = {};

    // Handle null/undefined values
    if (value === null || value === undefined) {
      if (schema.default !== undefined) {
        sanitizedProps[propName] = schema.default;
      } else {
        errors.push(`Property "${propName}" cannot be null or undefined`);
      }
      return { isValid: errors.length === 0, errors, warnings, sanitizedProps };
    }

    // Type-specific validation and sanitization
    switch (schema.type) {
      case 'string':
        if (typeof value !== 'string') {
          sanitizedProps[propName] = String(value);
          warnings.push(`Property "${propName}" converted to string`);
        } else {
          sanitizedProps[propName] = value;
        }

        // Format validation
        if (schema.format && sanitizedProps[propName]) {
          const formatValidation = this.validateStringFormat(propName, sanitizedProps[propName], schema.format);
          if (!formatValidation.isValid) {
            errors.push(...formatValidation.errors);
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            errors.push(`Property "${propName}" must be a valid number`);
          } else {
            sanitizedProps[propName] = numValue;
            warnings.push(`Property "${propName}" converted to number`);
          }
        } else {
          sanitizedProps[propName] = value;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          sanitizedProps[propName] = Boolean(value);
          warnings.push(`Property "${propName}" converted to boolean`);
        } else {
          sanitizedProps[propName] = value;
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`Property "${propName}" must be an array`);
        } else {
          sanitizedProps[propName] = value;
          
          // Validate array items if schema is provided
          if (schema.items) {
            const itemErrors: string[] = [];
            const sanitizedItems: any[] = [];
            
            value.forEach((item, index) => {
              const itemValidation = this.validatePropertyValue(
                `${propName}[${index}]`,
                item,
                schema.items!
              );
              if (!itemValidation.isValid) {
                itemErrors.push(...itemValidation.errors);
              } else {
                sanitizedItems.push(itemValidation.sanitizedProps?.[`${propName}[${index}]`] ?? item);
              }
            });
            
            if (itemErrors.length > 0) {
              errors.push(...itemErrors);
            } else {
              sanitizedProps[propName] = sanitizedItems;
            }
          }
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null) {
          errors.push(`Property "${propName}" must be an object`);
        } else {
          sanitizedProps[propName] = value;
          
          // Validate nested properties if schema is provided
          if (schema.properties) {
            const nestedErrors: string[] = [];
            const sanitizedNested: Record<string, any> = {};
            
            for (const [nestedProp, nestedValue] of Object.entries(value)) {
              const nestedSchema = schema.properties[nestedProp];
              if (nestedSchema) {
                const nestedValidation = this.validatePropertyValue(
                  `${propName}.${nestedProp}`,
                  nestedValue,
                  nestedSchema
                );
                if (!nestedValidation.isValid) {
                  nestedErrors.push(...nestedValidation.errors);
                } else {
                  sanitizedNested[nestedProp] = nestedValidation.sanitizedProps?.[`${propName}.${nestedProp}`] ?? nestedValue;
                }
              } else {
                sanitizedNested[nestedProp] = nestedValue;
              }
            }
            
            if (nestedErrors.length > 0) {
              errors.push(...nestedErrors);
            } else {
              sanitizedProps[propName] = sanitizedNested;
            }
          }
        }
        break;
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(sanitizedProps[propName])) {
      errors.push(`Property "${propName}" must be one of: ${schema.enum.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedProps
    };
  }

  /**
   * Validate string format
   */
  private static validateStringFormat(
    propName: string,
    value: string,
    format: string
  ): ComponentValidationResult {
    const errors: string[] = [];

    switch (format) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`Property "${propName}" must be a valid email address`);
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push(`Property "${propName}" must be a valid URL`);
        }
        break;

      case 'color':
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!colorRegex.test(value)) {
          errors.push(`Property "${propName}" must be a valid hex color`);
        }
        break;

      case 'date':
        if (isNaN(Date.parse(value))) {
          errors.push(`Property "${propName}" must be a valid date`);
        }
        break;

      // Add more format validations as needed
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Validate component position
   */
  public static validatePosition(position: ComponentPosition): ComponentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

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
      errors,
      warnings
    };
  }

  /**
   * Validate component instance
   */
  public static validateInstance(
    instance: ComponentInstance,
    definition?: ComponentDefinition
  ): ComponentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic instance validation
    if (!instance.id || typeof instance.id !== 'string') {
      errors.push('Instance ID is required and must be a string');
    }

    if (!instance.type || typeof instance.type !== 'string') {
      errors.push('Instance type is required and must be a string');
    }

    // Position validation
    const positionValidation = this.validatePosition(instance.position);
    if (!positionValidation.isValid) {
      errors.push(...positionValidation.errors);
    }

    // Props validation against definition
    if (definition) {
      const propsValidation = this.validateProps(definition, instance.props);
      if (!propsValidation.isValid) {
        errors.push(...propsValidation.errors);
      }
      warnings.push(...propsValidation.warnings);
    }

    // Metadata validation
    if (!instance.createdBy || typeof instance.createdBy !== 'string') {
      errors.push('Instance createdBy is required and must be a string');
    }

    if (!instance.createdAt || isNaN(Date.parse(instance.createdAt))) {
      errors.push('Instance createdAt is required and must be a valid date');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}