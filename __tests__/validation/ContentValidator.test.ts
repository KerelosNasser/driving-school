/**
 * Tests for the ContentValidator class
 */

import { ContentValidator } from '../../lib/validation/validator';
import { InputSanitizer } from '../../lib/validation/sanitizer';

describe('ContentValidator', () => {
  describe('validateComponent', () => {
    it('should validate valid component data', () => {
      const validComponent = {
        type: 'text-block',
        position: {
          pageId: 'page-1',
          sectionId: 'main',
          order: 1
        },
        props: {
          content: 'Hello world',
          fontSize: 16
        }
      };

      const result = ContentValidator.validateComponent(validComponent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject component with invalid type', () => {
      const invalidComponent = {
        type: '123-invalid',
        position: {
          pageId: 'page-1',
          sectionId: 'main',
          order: 1
        }
      };

      const result = ContentValidator.validateComponent(invalidComponent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should reject component with missing required fields', () => {
      const invalidComponent = {
        type: 'text-block'
        // missing position
      };

      const result = ContentValidator.validateComponent(invalidComponent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'position')).toBe(true);
    });

    it('should sanitize component props', () => {
      const componentWithUnsafeProps = {
        type: 'text-block',
        position: {
          pageId: 'page-1',
          sectionId: 'main',
          order: 1
        },
        props: {
          content: '<script>alert("xss")</script>Hello',
          url: 'javascript:alert("xss")'
        }
      };

      const result = ContentValidator.validateComponent(componentWithUnsafeProps);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.props.content).not.toContain('<script>');
      expect(result.sanitizedData?.props.url).toBe('');
    });
  });

  describe('validatePage', () => {
    it('should validate valid page data', () => {
      const validPage = {
        title: 'Test Page',
        slug: 'test-page',
        description: 'A test page',
        content: '<p>Page content</p>'
      };

      const result = ContentValidator.validatePage(validPage);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject page with invalid slug', () => {
      const invalidPage = {
        title: 'Test Page',
        slug: 'Test Page!@#',
        description: 'A test page'
      };

      const result = ContentValidator.validatePage(invalidPage);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'slug')).toBe(true);
    });

    it('should sanitize page content', () => {
      const pageWithUnsafeContent = {
        title: 'Test Page',
        slug: 'test-page',
        content: '<script>alert("xss")</script><p>Safe content</p>'
      };

      const result = ContentValidator.validatePage(pageWithUnsafeContent);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.content).not.toContain('<script>');
      expect(result.sanitizedData?.content).toContain('<p>Safe content</p>');
    });
  });

  describe('validateNavigation', () => {
    it('should validate valid navigation data', () => {
      const validNav = {
        displayName: 'Home',
        url: '/home',
        orderIndex: 1
      };

      const result = ContentValidator.validateNavigation(validNav);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject navigation with invalid order index', () => {
      const invalidNav = {
        displayName: 'Home',
        url: '/home',
        orderIndex: -1
      };

      const result = ContentValidator.validateNavigation(invalidNav);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'orderIndex')).toBe(true);
    });

    it('should sanitize navigation URL', () => {
      const navWithUnsafeUrl = {
        displayName: 'Home',
        url: 'javascript:alert("xss")',
        orderIndex: 1
      };

      const result = ContentValidator.validateNavigation(navWithUnsafeUrl);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.url).toBe('');
    });
  });

  describe('validateContent', () => {
    it('should validate valid content data', () => {
      const validContent = {
        key: 'site.title',
        value: 'My Website',
        type: 'text'
      };

      const result = ContentValidator.validateContent(validContent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject content with invalid key format', () => {
      const invalidContent = {
        key: '123-invalid-key',
        value: 'Some value'
      };

      const result = ContentValidator.validateContent(invalidContent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'key')).toBe(true);
    });

    it('should sanitize content value', () => {
      const contentWithUnsafeValue = {
        key: 'site.content',
        value: '<script>alert("xss")</script><p>Safe content</p>',
        type: 'text'
      };

      const result = ContentValidator.validateContent(contentWithUnsafeValue);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.value).not.toContain('<script>');
    });
  });
});

describe('InputSanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should remove dangerous script tags', () => {
      const unsafeHtml = '<p>Safe content</p><script>alert("xss")</script>';
      const sanitized = InputSanitizer.sanitizeHtml(unsafeHtml);
      
      expect(sanitized).toContain('<p>Safe content</p>');
      expect(sanitized).not.toContain('<script>');
    });

    it('should remove dangerous event handlers', () => {
      const unsafeHtml = '<p onclick="alert(\'xss\')">Click me</p>';
      const sanitized = InputSanitizer.sanitizeHtml(unsafeHtml);
      
      expect(sanitized).not.toContain('onclick');
    });

    it('should preserve safe HTML tags', () => {
      const safeHtml = '<p><strong>Bold</strong> and <em>italic</em> text</p>';
      const sanitized = InputSanitizer.sanitizeHtml(safeHtml);
      
      expect(sanitized).toBe(safeHtml);
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow safe URLs', () => {
      const safeUrls = [
        'https://example.com',
        'http://example.com',
        '/relative/path',
        './relative/path',
        'mailto:test@example.com'
      ];

      safeUrls.forEach(url => {
        const sanitized = InputSanitizer.sanitizeUrl(url);
        expect(sanitized).toBe(url);
      });
    });

    it('should block dangerous URLs', () => {
      const dangerousUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'vbscript:msgbox("xss")',
        'file:///etc/passwd'
      ];

      dangerousUrls.forEach(url => {
        const sanitized = InputSanitizer.sanitizeUrl(url);
        expect(sanitized).toBe('');
      });
    });
  });

  describe('sanitizeSlug', () => {
    it('should create valid slugs', () => {
      const testCases = [
        { input: 'Hello World', expected: 'hello-world' },
        { input: 'Test Page!@#', expected: 'test-page' },
        { input: 'Multiple---Hyphens', expected: 'multiple-hyphens' },
        { input: '-Leading and trailing-', expected: 'leading-and-trailing' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = InputSanitizer.sanitizeSlug(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('sanitizeComponentProps', () => {
    it('should sanitize nested object properties', () => {
      const unsafeProps = {
        content: '<script>alert("xss")</script>Hello',
        url: 'javascript:alert("xss")',
        nested: {
          htmlContent: '<p onclick="alert()">Click</p>',
          safeText: 'This is safe'
        }
      };

      const sanitized = InputSanitizer.sanitizeComponentProps(unsafeProps);
      
      expect(sanitized.content).not.toContain('<script>');
      expect(sanitized.url).toBe('');
      expect(sanitized.nested.htmlContent).not.toContain('onclick');
      expect(sanitized.nested.safeText).toBe('This is safe');
    });
  });
});