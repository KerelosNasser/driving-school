import { ComponentDefinition } from '../types/drag-drop';

export class ThumbnailGenerator {
  private static cache = new Map<string, string>();

  /**
   * Generate a thumbnail for a component
   */
  static generateThumbnail(component: ComponentDefinition): string {
    // Check cache first
    if (this.cache.has(component.id)) {
      return this.cache.get(component.id)!;
    }

    // Generate SVG thumbnail based on component type
    const thumbnail = this.createSVGThumbnail(component);
    
    // Cache the result
    this.cache.set(component.id, thumbnail);
    
    return thumbnail;
  }

  /**
   * Create SVG thumbnail for component
   */
  private static createSVGThumbnail(component: ComponentDefinition): string {
    const width = 120;
    const height = 80;
    
    let content = '';
    
    switch (component.category) {
      case 'text':
        content = this.createTextThumbnail();
        break;
      case 'media':
        content = this.createMediaThumbnail();
        break;
      case 'layout':
        content = this.createLayoutThumbnail();
        break;
      case 'interactive':
        content = this.createInteractiveThumbnail();
        break;
      default:
        content = this.createDefaultThumbnail();
    }

    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" rx="4"/>
        ${content}
        <text x="50%" y="90%" text-anchor="middle" font-family="system-ui" font-size="10" fill="#64748b">
          ${component.name}
        </text>
      </svg>
    `)}`;
  }

  private static createTextThumbnail(): string {
    return `
      <rect x="10" y="15" width="100" height="8" fill="#3b82f6" rx="2"/>
      <rect x="10" y="28" width="80" height="6" fill="#94a3b8" rx="1"/>
      <rect x="10" y="38" width="90" height="6" fill="#94a3b8" rx="1"/>
      <rect x="10" y="48" width="70" height="6" fill="#94a3b8" rx="1"/>
    `;
  }

  private static createMediaThumbnail(): string {
    return `
      <rect x="15" y="15" width="90" height="45" fill="#e2e8f0" stroke="#cbd5e1" rx="4"/>
      <circle cx="35" cy="30" r="8" fill="#94a3b8"/>
      <polygon points="55,25 55,45 75,35" fill="#94a3b8"/>
    `;
  }

  private static createLayoutThumbnail(): string {
    return `
      <rect x="10" y="15" width="45" height="45" fill="#ddd6fe" stroke="#c4b5fd" rx="2"/>
      <rect x="65" y="15" width="45" height="20" fill="#ddd6fe" stroke="#c4b5fd" rx="2"/>
      <rect x="65" y="40" width="45" height="20" fill="#ddd6fe" stroke="#c4b5fd" rx="2"/>
    `;
  }

  private static createInteractiveThumbnail(): string {
    return `
      <rect x="20" y="25" width="80" height="25" fill="#3b82f6" rx="12"/>
      <text x="60" y="40" text-anchor="middle" font-family="system-ui" font-size="12" fill="white">
        Button
      </text>
    `;
  }

  private static createDefaultThumbnail(): string {
    return `
      <rect x="20" y="20" width="80" height="35" fill="#f1f5f9" stroke="#cbd5e1" stroke-dasharray="3,3" rx="4"/>
      <text x="60" y="40" text-anchor="middle" font-family="system-ui" font-size="10" fill="#64748b">
        Component
      </text>
    `;
  }

  /**
   * Clear thumbnail cache
   */
  static clearCache() {
    this.cache.clear();
  }

  /**
   * Get cached thumbnail count
   */
  static getCacheSize(): number {
    return this.cache.size;
  }
}