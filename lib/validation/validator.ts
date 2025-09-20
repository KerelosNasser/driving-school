/**
 * Server-side validation utilities
 */

import { ValidationResult, ValidationError, ValidationRule, ValidationSchema } from './types';
import { InputSanitizer } from './sanitizer';

export class ContentValidator {
  /**
   * Validate data against a schema
   */
  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];
    let sanitizedData: any = {};

    // Check required fields and validate each rule
    for (const rule of schema.rules) {
      const value = data?.[rule.field];
      const fieldErrors = this.validateField(value, rule);
      errors.push(...fieldErrors);

      // Apply sanitization if no errors
      if (fieldErrors.length === 0 && rule.sanitizer) {
        sanitizedData[rule.field] = rule.sanitizer(value);
      } else if (fieldErrors.length === 0) {
        sanitizedData[rule.field] = value;
      }
    }

    // Check for extra fields if not allowed
    if (!schema.allowExtraFields && data && typeof data === 'object') {
      const allowedFields = new Set(schema.rules.map(r => r.field));
      for (const field of Object.keys(data)) {
        if (!allowedFields.has(field)) {
          errors.push({
            field,
            message: `Field '${field}' is not allowed`,
            code: 'EXTRA_FIELD',
            severity: 'error'
          });
        }
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      sanitizedData
    };
  }

  /**
   * Validate a single field against a rule
   */
  private static validateField(value: any, rule: ValidationRule): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: rule.field,
        message: `Field '${rule.field}' is required`,
        code: 'REQUIRED',
        severity: 'error'
      });
      return errors;
    }

    // Skip further validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return errors;
    }

    // Check type
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors.push({
          field: rule.field,
          message: `Field '${rule.field}' must be of type ${rule.type}`,
          code: 'INVALID_TYPE',
          severity: 'error'
        });
        return errors;
      }
    }

    // Check string-specific rules
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field: rule.field,
          message: `Field '${rule.field}' must be at least ${rule.minLength} characters`,
          code: 'MIN_LENGTH',
          severity: 'error'
        });
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field: rule.field,
          message: `Field '${rule.field}' must be at most ${rule.maxLength} characters`,
          code: 'MAX_LENGTH',
          severity: 'error'
        });
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field: rule.field,
          message: `Field '${rule.field}' has invalid format`,
          code: 'INVALID_FORMAT',
          severity: 'error'
        });
      }
    }

    // Check allowed values
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      errors.push({
        field: rule.field,
        message: `Field '${rule.field}' must be one of: ${rule.allowedValues.join(', ')}`,
        code: 'INVALID_VALUE',
        severity: 'error'
      });
    }

    // Custom validation
    if (rule.customValidator) {
      const customError = rule.customValidator(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return errors;
  }

  /**
   * Component validation schema
   */
  static getComponentSchema(): ValidationSchema {
    return {
      rules: [
        {
          field: 'type',
          required: true,
          type: 'string',
          minLength: 1,
          maxLength: 50,
          pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
          sanitizer: (value: string) => InputSanitizer.sanitizeText(value)
        },
        {
          field: 'position',
          required: true,
          type: 'object',
          customValidator: (value: any) => {
            if (!value.pageId || !value.sectionId || typeof value.order !== 'number') {
              return {
                field: 'position',
                message: 'Position must have pageId, sectionId, and order',
                code: 'INVALID_POSITION',
                severity: 'error'
              };
            }
            return null;
          }
        },
        {
          field: 'props',
          required: false,
          type: 'object',
          sanitizer: (value: any) => InputSanitizer.sanitizeComponentProps(value)
        }
      ],
      allowExtraFields: false
    };
  }

  /**
   * Page validation schema
   */
  static getPageSchema(): ValidationSchema {
    return {
      rules: [
        {
          field: 'title',
          required: true,
          type: 'string',
          minLength: 1,
          maxLength: 200,
          sanitizer: (value: string) => InputSanitizer.sanitizeText(value)
        },
        {
          field: 'slug',
          required: true,
          type: 'string',
          minLength: 1,
          maxLength: 100,
          pattern: /^[a-z0-9-]+$/,
          sanitizer: (value: string) => InputSanitizer.sanitizeSlug(value)
        },
        {
          field: 'description',
          required: false,
          type: 'string',
          maxLength: 500,
          sanitizer: (value: string) => InputSanitizer.sanitizeText(value)
        },
        {
          field: 'content',
          required: false,
          type: 'string',
          sanitizer: (value: string) => InputSanitizer.sanitizeHtml(value)
        }
      ],
      allowExtraFields: false
    };
  }

  /**
   * Navigation validation schema
   */
  static getNavigationSchema(): ValidationSchema {
    return {
      rules: [
        {
          field: 'displayName',
          required: true,
          type: 'string',
          minLength: 1,
          maxLength: 100,
          sanitizer: (value: string) => InputSanitizer.sanitizeText(value)
        },
        {
          field: 'url',
          required: true,
          type: 'string',
          minLength: 1,
          maxLength: 200,
          sanitizer: (value: string) => InputSanitizer.sanitizeUrl(value)
        },
        {
          field: 'orderIndex',
          required: true,
          type: 'number',
          customValidator: (value: number) => {
            if (!Number.isInteger(value) || value < 0) {
              return {
                field: 'orderIndex',
                message: 'Order index must be a non-negative integer',
                code: 'INVALID_ORDER',
                severity: 'error'
              };
            }
            return null;
          }
        }
      ],
      allowExtraFields: false
    };
  }

  /**
   * Content validation schema
   */
  static getContentSchema(): ValidationSchema {
    return {
      rules: [
        {
          field: 'key',
          required: true,
          type: 'string',
          minLength: 1,
          maxLength: 100,
          pattern: /^[a-zA-Z][a-zA-Z0-9._-]*$/,
          sanitizer: (value: string) => InputSanitizer.sanitizeText(value)
        },
        {
          field: 'value',
          required: true,
          sanitizer: (value: any) => {
            if (typeof value === 'string') {
              return InputSanitizer.sanitizeHtml(value);
            }
            return InputSanitizer.sanitizeJson(value);
          }
        },
        {
          field: 'type',
          required: false,
          type: 'string',
          allowedValues: ['text', 'json', 'file'],
          sanitizer: (value: string) => InputSanitizer.sanitizeText(value)
        }
      ],
      allowExtraFields: false
    };
  }

  /**
   * Validate component data
   */
  static validateComponent(data: any): ValidationResult {
    return this.validate(data, this.getComponentSchema());
  }

  /**
   * Validate page data
   */
  static validatePage(data: any): ValidationResult {
    return this.validate(data, this.getPageSchema());
  }

  /**
   * Validate navigation data
   */
  static validateNavigation(data: any): ValidationResult {
    return this.validate(data, this.getNavigationSchema());
  }

  /**
   * Validate content data
   */
  static validateContent(data: any): ValidationResult {
    return this.validate(data, this.getContentSchema());
  }
}