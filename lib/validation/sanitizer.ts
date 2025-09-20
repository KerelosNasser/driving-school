/**
 * Input sanitization utilities to prevent XSS and other attacks
 */

import DOMPurify from 'isomorphic-dompurify';

export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Configure DOMPurify for safe HTML
    const config = {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'
      ],
      ALLOW_DATA_ATTR: false,
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'iframe'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus']
    };

    return DOMPurify.sanitize(input, config);
  }

  /**
   * Sanitize plain text by removing/escaping dangerous characters
   */
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Sanitize URL to prevent javascript: and data: protocols
   */
  static sanitizeUrl(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    const url = input.trim().toLowerCase();
    
    // Block dangerous protocols
    if (url.startsWith('javascript:') || 
        url.startsWith('data:') || 
        url.startsWith('vbscript:') ||
        url.startsWith('file:')) {
      return '';
    }

    // Allow only http, https, mailto, and relative URLs
    if (url.startsWith('http://') || 
        url.startsWith('https://') || 
        url.startsWith('mailto:') ||
        url.startsWith('/') ||
        url.startsWith('./') ||
        url.startsWith('../') ||
        !url.includes(':')) {
      return input.trim();
    }

    return '';
  }

  /**
   * Sanitize component properties
   */
  static sanitizeComponentProps(props: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(props)) {
      // Sanitize key name
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
      
      if (typeof value === 'string') {
        // Determine sanitization method based on key name
        if (key.toLowerCase().includes('html') || key.toLowerCase().includes('content')) {
          sanitized[sanitizedKey] = this.sanitizeHtml(value);
        } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('href') || key.toLowerCase().includes('src')) {
          sanitized[sanitizedKey] = this.sanitizeUrl(value);
        } else {
          sanitized[sanitizedKey] = this.sanitizeText(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          sanitized[sanitizedKey] = value.map(item => 
            typeof item === 'string' ? this.sanitizeText(item) : item
          );
        } else {
          sanitized[sanitizedKey] = this.sanitizeComponentProps(value);
        }
      } else {
        sanitized[sanitizedKey] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize page data
   */
  static sanitizePageData(pageData: any): any {
    if (!pageData || typeof pageData !== 'object') {
      return {};
    }

    return {
      title: this.sanitizeText(pageData.title || ''),
      slug: this.sanitizeSlug(pageData.slug || ''),
      description: this.sanitizeText(pageData.description || ''),
      content: this.sanitizeHtml(pageData.content || ''),
      metadata: pageData.metadata ? this.sanitizeComponentProps(pageData.metadata) : {}
    };
  }

  /**
   * Sanitize URL slug
   */
  static sanitizeSlug(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 100); // Limit length
  }

  /**
   * Sanitize navigation item data
   */
  static sanitizeNavigationData(navData: any): any {
    if (!navData || typeof navData !== 'object') {
      return {};
    }

    return {
      displayName: this.sanitizeText(navData.displayName || ''),
      url: this.sanitizeUrl(navData.url || ''),
      description: this.sanitizeText(navData.description || ''),
      metadata: navData.metadata ? this.sanitizeComponentProps(navData.metadata) : {}
    };
  }

  /**
   * Remove potentially dangerous file extensions
   */
  static sanitizeFileName(fileName: string): string {
    if (typeof fileName !== 'string') {
      return '';
    }

    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
      '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh'
    ];

    let sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '');
    
    for (const ext of dangerousExtensions) {
      if (sanitized.toLowerCase().endsWith(ext)) {
        sanitized = sanitized.substring(0, sanitized.length - ext.length) + '.txt';
        break;
      }
    }

    return sanitized.substring(0, 255); // Limit length
  }

  /**
   * Validate and sanitize JSON data
   */
  static sanitizeJson(input: any, maxDepth: number = 10): any {
    if (maxDepth <= 0) {
      return null;
    }

    if (input === null || input === undefined) {
      return input;
    }

    if (typeof input === 'string') {
      return this.sanitizeText(input);
    }

    if (typeof input === 'number' || typeof input === 'boolean') {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeJson(item, maxDepth - 1));
    }

    if (typeof input === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(input)) {
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
        sanitized[sanitizedKey] = this.sanitizeJson(value, maxDepth - 1);
      }
      return sanitized;
    }

    return null;
  }
}