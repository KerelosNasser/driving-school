// Real-time preview system for theme changes without affecting live site
import { Theme, PreviewData, ComponentPreview } from './types';
import { cssVariableManager } from './css-variables';
import { previewSystem } from './preview';

export interface RealTimePreviewManager {
  initializePreview(containerId: string, theme: Theme): void;
  updatePreviewInRealTime(theme: Theme, containerId?: string): void;
  createIsolatedPreview(theme: Theme): HTMLElement;
  connectToThemeControls(controlsContainer: HTMLElement, previewContainer: HTMLElement): void;
  preserveCurrentDesign(): Theme;
  resetToCurrentDesign(): void;
  getPreviewContainer(containerId: string): HTMLElement | null;
  destroyPreview(containerId: string): void;
}

export class RealTimePreviewManagerImpl implements RealTimePreviewManager {
  private previewContainers: Map<string, HTMLElement> = new Map();
  private previewStyles: Map<string, HTMLStyleElement> = new Map();
  private currentDesignTheme: Theme | null = null;
  private activeTheme: Theme | null = null;
  private updateQueue: Array<() => void> = [];
  private isUpdating = false;
  private observers: Map<string, MutationObserver> = new Map();

  constructor() {
    this.initializeCurrentDesign();
  }

  /**
   * Initialize current design as baseline theme
   */
  private initializeCurrentDesign(): void {
    if (typeof window === 'undefined') return;

    // Extract current design patterns as the default theme
    this.currentDesignTheme = this.extractCurrentDesignTheme();
  }

  /**
   * Extract current design theme from existing CSS and DOM
   */
  private extractCurrentDesignTheme(): Theme {
    const computedStyle = typeof window !== 'undefined' 
      ? getComputedStyle(document.documentElement) 
      : null;

    // Default professional emerald/teal theme based on current design
    return {
      id: 'current-design-default',
      name: 'Current Professional Design',
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b'
        },
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a'
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        },
        semantic: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6'
        }
      },
      gradients: {
        hero: {
          name: 'Hero Gradient',
          direction: '135deg',
          colorStops: [
            { color: '#064e3b', position: 0 },
            { color: '#115e59', position: 50 },
            { color: '#1e3a8a', position: 100 }
          ],
          usage: 'hero'
        },
        card: {
          name: 'Card Gradient',
          direction: '135deg',
          colorStops: [
            { color: '#10b981', position: 0 },
            { color: '#0d9488', position: 100 }
          ],
          usage: 'card'
        },
        button: {
          name: 'Button Gradient',
          direction: '135deg',
          colorStops: [
            { color: '#10b981', position: 0 },
            { color: '#0d9488', position: 100 }
          ],
          usage: 'button'
        },
        background: {
          name: 'Background Gradient',
          direction: '135deg',
          colorStops: [
            { color: '#f9fafb', position: 0 },
            { color: '#ecfdf5', position: 100 }
          ],
          usage: 'background'
        },
        accent: {
          name: 'Accent Gradient',
          direction: '135deg',
          colorStops: [
            { color: '#ecfdf5', position: 0 },
            { color: '#ccfbf1', position: 100 }
          ],
          usage: 'accent'
        }
      },
      typography: {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          serif: ['Georgia', 'serif'],
          mono: ['Menlo', 'Monaco', 'Consolas', 'monospace']
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
          '5xl': '3rem',
          '6xl': '3.75rem'
        },
        fontWeight: {
          thin: '100',
          light: '300',
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700',
          extrabold: '800',
          black: '900'
        },
        lineHeight: {
          none: '1',
          tight: '1.25',
          snug: '1.375',
          normal: '1.5',
          relaxed: '1.625',
          loose: '2'
        }
      },
      effects: {
        backdropBlur: {
          sm: 'blur(4px)',
          md: 'blur(12px)',
          lg: 'blur(16px)',
          xl: 'blur(24px)'
        },
        boxShadow: {
          card: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          button: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          hero: '0 20px 25px -5px rgba(16, 185, 129, 0.1)'
        },
        borderRadius: {
          sm: '0.375rem',
          md: '0.5rem',
          lg: '0.75rem',
          xl: '1.5rem',
          full: '9999px'
        }
      },
      metadata: {
        name: 'Current Professional Design',
        description: 'Extracted from current emerald/teal professional design',
        author: 'EG Driving School',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['current', 'professional', 'emerald', 'teal', 'default']
      }
    };
  }

  /**
   * Initialize preview container with theme
   */
  initializePreview(containerId: string, theme: Theme): void {
    if (typeof window === 'undefined') return;

    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = 'theme-preview-container';
      document.body.appendChild(container);
    }

    // Create isolated preview environment
    const previewElement = this.createIsolatedPreview(theme);
    container.innerHTML = '';
    container.appendChild(previewElement);

    // Store container reference
    this.previewContainers.set(containerId, container);
    this.activeTheme = theme;

    // Set up mutation observer for dynamic updates
    this.setupMutationObserver(containerId, container);
  }

  /**
   * Update preview in real-time without affecting live site
   */
  updatePreviewInRealTime(theme: Theme, containerId?: string): void {
    if (typeof window === 'undefined') return;

    // Queue update to prevent excessive re-renders
    this.queueUpdate(() => {
      if (containerId) {
        this.updateSinglePreview(containerId, theme);
      } else {
        // Update all active previews
        this.previewContainers.forEach((container, id) => {
          this.updateSinglePreview(id, theme);
        });
      }
    });

    this.activeTheme = theme;
  }

  /**
   * Queue updates to prevent excessive re-renders
   */
  private queueUpdate(updateFn: () => void): void {
    this.updateQueue.push(updateFn);
    
    if (!this.isUpdating) {
      this.isUpdating = true;
      requestAnimationFrame(() => {
        this.processUpdateQueue();
      });
    }
  }

  /**
   * Process queued updates
   */
  private processUpdateQueue(): void {
    while (this.updateQueue.length > 0) {
      const update = this.updateQueue.shift();
      if (update) {
        update();
      }
    }
    this.isUpdating = false;
  }

  /**
   * Update a single preview container
   */
  private updateSinglePreview(containerId: string, theme: Theme): void {
    const container = this.previewContainers.get(containerId);
    if (!container) return;

    // Update styles without recreating the entire preview
    const styleElement = this.previewStyles.get(containerId);
    if (styleElement) {
      const previewData = previewSystem.generatePreview(theme);
      styleElement.textContent = this.generateIsolatedCSS(previewData.css, containerId);
    }

    // Update CSS custom properties in the preview scope
    this.updatePreviewVariables(container, theme);

    // Emit preview update event
    container.dispatchEvent(new CustomEvent('previewUpdated', {
      detail: { theme, containerId }
    }));
  }

  /**
   * Create isolated preview environment
   */
  createIsolatedPreview(theme: Theme): HTMLElement {
    const previewElement = document.createElement('div');
    previewElement.className = 'isolated-theme-preview';
    
    // Generate preview content
    const previewData = previewSystem.generatePreview(theme);
    
    // Create style element for this preview
    const styleElement = document.createElement('style');
    styleElement.textContent = this.generateIsolatedCSS(previewData.css, 'preview-' + Date.now());
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'preview-content-wrapper';
    contentContainer.innerHTML = previewData.html;
    
    // Assemble preview
    previewElement.appendChild(styleElement);
    previewElement.appendChild(contentContainer);
    
    // Store style reference
    const containerId = 'preview-' + Date.now();
    this.previewStyles.set(containerId, styleElement);
    
    return previewElement;
  }

  /**
   * Generate CSS scoped to preview container
   */
  private generateIsolatedCSS(css: string, containerId: string): string {
    // Scope all CSS rules to the preview container
    const scopedCSS = css.replace(
      /([^{}]+){([^{}]*)}/g,
      (match, selector, rules) => {
        // Don't scope :root selectors, but create preview-specific variables
        if (selector.trim().startsWith(':root')) {
          return `.isolated-theme-preview { ${rules} }`;
        }
        
        // Scope other selectors to the preview container
        const scopedSelector = selector
          .split(',')
          .map(s => `.isolated-theme-preview ${s.trim()}`)
          .join(', ');
        
        return `${scopedSelector} { ${rules} }`;
      }
    );

    return scopedCSS;
  }

  /**
   * Update CSS variables in preview scope only
   */
  private updatePreviewVariables(container: HTMLElement, theme: Theme): void {
    const variables = this.themeToVariables(theme);
    
    // Apply variables only to the preview container
    Object.entries(variables).forEach(([property, value]) => {
      container.style.setProperty(property, value);
    });
  }

  /**
   * Convert theme to CSS variables
   */
  private themeToVariables(theme: Theme): Record<string, string> {
    const variables: Record<string, string> = {};

    // Colors
    Object.entries(theme.colors.primary).forEach(([shade, color]) => {
      variables[`--theme-primary-${shade}`] = color;
    });

    Object.entries(theme.colors.secondary).forEach(([shade, color]) => {
      variables[`--theme-secondary-${shade}`] = color;
    });

    Object.entries(theme.colors.accent).forEach(([shade, color]) => {
      variables[`--theme-accent-${shade}`] = color;
    });

    Object.entries(theme.colors.neutral).forEach(([shade, color]) => {
      variables[`--theme-neutral-${shade}`] = color;
    });

    // Gradients
    Object.entries(theme.gradients).forEach(([key, gradient]) => {
      const stops = gradient.colorStops
        .map(stop => `${stop.color} ${stop.position}%`)
        .join(', ');
      variables[`--theme-gradient-${key}`] = `linear-gradient(${gradient.direction}, ${stops})`;
    });

    // Effects
    Object.entries(theme.effects.backdropBlur).forEach(([size, value]) => {
      variables[`--theme-backdrop-blur-${size}`] = value;
    });

    Object.entries(theme.effects.boxShadow).forEach(([type, value]) => {
      variables[`--theme-shadow-${type}`] = value;
    });

    Object.entries(theme.effects.borderRadius).forEach(([size, value]) => {
      variables[`--theme-radius-${size}`] = value;
    });

    // Typography
    variables['--theme-font-sans'] = theme.typography.fontFamily.sans.join(', ');
    variables['--theme-font-serif'] = theme.typography.fontFamily.serif.join(', ');
    variables['--theme-font-mono'] = theme.typography.fontFamily.mono.join(', ');

    return variables;
  }

  /**
   * Connect theme controls to preview updates
   */
  connectToThemeControls(controlsContainer: HTMLElement, previewContainer: HTMLElement): void {
    if (typeof window === 'undefined') return;

    // Set up event listeners for theme control changes
    const handleControlChange = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (target.matches('[data-theme-control]')) {
        const controlType = target.getAttribute('data-theme-control');
        const controlPath = target.getAttribute('data-theme-path');
        const value = this.getControlValue(target);
        
        if (controlType && controlPath && this.activeTheme) {
          const updatedTheme = this.updateThemeProperty(this.activeTheme, controlPath, value);
          this.updatePreviewInRealTime(updatedTheme);
        }
      }
    };

    // Listen for various input events
    ['input', 'change', 'click'].forEach(eventType => {
      controlsContainer.addEventListener(eventType, handleControlChange);
    });

    // Set up real-time color picker updates
    const colorInputs = controlsContainer.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
      input.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement;
        const path = target.getAttribute('data-theme-path');
        
        if (path && this.activeTheme) {
          const updatedTheme = this.updateThemeProperty(this.activeTheme, path, target.value);
          this.updatePreviewInRealTime(updatedTheme);
        }
      });
    });

    // Set up slider updates
    const sliders = controlsContainer.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
      slider.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement;
        const path = target.getAttribute('data-theme-path');
        
        if (path && this.activeTheme) {
          const value = this.transformSliderValue(target.value, target.getAttribute('data-transform'));
          const updatedTheme = this.updateThemeProperty(this.activeTheme, path, value);
          this.updatePreviewInRealTime(updatedTheme);
        }
      });
    });
  }

  /**
   * Get value from control element
   */
  private getControlValue(element: HTMLElement): any {
    if (element instanceof HTMLInputElement) {
      switch (element.type) {
        case 'color':
        case 'text':
        case 'range':
          return element.value;
        case 'checkbox':
          return element.checked;
        default:
          return element.value;
      }
    } else if (element instanceof HTMLSelectElement) {
      return element.value;
    }
    
    return element.textContent || '';
  }

  /**
   * Transform slider value based on data attribute
   */
  private transformSliderValue(value: string, transform: string | null): any {
    const numValue = parseFloat(value);
    
    switch (transform) {
      case 'px':
        return `${numValue}px`;
      case 'rem':
        return `${numValue}rem`;
      case 'blur':
        return `blur(${numValue}px)`;
      case 'opacity':
        return numValue / 100;
      default:
        return value;
    }
  }

  /**
   * Update theme property by path
   */
  private updateThemeProperty(theme: Theme, path: string, value: any): Theme {
    const pathParts = path.split('.');
    const updatedTheme = JSON.parse(JSON.stringify(theme)); // Deep clone
    
    let current = updatedTheme;
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
    
    // Update metadata
    updatedTheme.metadata.updatedAt = new Date().toISOString();
    
    return updatedTheme;
  }

  /**
   * Set up mutation observer for dynamic content
   */
  private setupMutationObserver(containerId: string, container: HTMLElement): void {
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          shouldUpdate = true;
        }
      });
      
      if (shouldUpdate && this.activeTheme) {
        this.updatePreviewInRealTime(this.activeTheme, containerId);
      }
    });
    
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    
    this.observers.set(containerId, observer);
  }

  /**
   * Preserve current design as baseline
   */
  preserveCurrentDesign(): Theme {
    if (!this.currentDesignTheme) {
      this.currentDesignTheme = this.extractCurrentDesignTheme();
    }
    return this.currentDesignTheme;
  }

  /**
   * Reset to current design
   */
  resetToCurrentDesign(): void {
    if (this.currentDesignTheme) {
      this.updatePreviewInRealTime(this.currentDesignTheme);
    }
  }

  /**
   * Get preview container by ID
   */
  getPreviewContainer(containerId: string): HTMLElement | null {
    return this.previewContainers.get(containerId) || null;
  }

  /**
   * Destroy preview and clean up resources
   */
  destroyPreview(containerId: string): void {
    const container = this.previewContainers.get(containerId);
    if (container) {
      container.remove();
      this.previewContainers.delete(containerId);
    }

    const styleElement = this.previewStyles.get(containerId);
    if (styleElement) {
      styleElement.remove();
      this.previewStyles.delete(containerId);
    }

    const observer = this.observers.get(containerId);
    if (observer) {
      observer.disconnect();
      this.observers.delete(containerId);
    }
  }

  /**
   * Get current active theme
   */
  getActiveTheme(): Theme | null {
    return this.activeTheme;
  }

  /**
   * Get current design theme (baseline)
   */
  getCurrentDesignTheme(): Theme | null {
    return this.currentDesignTheme;
  }

  /**
   * Create side-by-side comparison
   */
  createSideBySideComparison(currentTheme: Theme, modifiedTheme: Theme, containerId: string): void {
    if (typeof window === 'undefined') return;

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    container.className = 'side-by-side-comparison';

    // Create comparison layout
    const comparisonWrapper = document.createElement('div');
    comparisonWrapper.className = 'comparison-wrapper grid grid-cols-1 lg:grid-cols-2 gap-6';

    // Current theme preview
    const currentPreview = this.createIsolatedPreview(currentTheme);
    const currentWrapper = document.createElement('div');
    currentWrapper.className = 'current-preview';
    currentWrapper.innerHTML = `
      <div class="preview-header bg-blue-100 text-blue-800 p-3 rounded-t-lg font-semibold">
        Current: ${currentTheme.name}
      </div>
    `;
    currentWrapper.appendChild(currentPreview);

    // Modified theme preview
    const modifiedPreview = this.createIsolatedPreview(modifiedTheme);
    const modifiedWrapper = document.createElement('div');
    modifiedWrapper.className = 'modified-preview';
    modifiedWrapper.innerHTML = `
      <div class="preview-header bg-orange-100 text-orange-800 p-3 rounded-t-lg font-semibold">
        Modified: ${modifiedTheme.name}
      </div>
    `;
    modifiedWrapper.appendChild(modifiedPreview);

    comparisonWrapper.appendChild(currentWrapper);
    comparisonWrapper.appendChild(modifiedWrapper);
    container.appendChild(comparisonWrapper);
  }

  /**
   * Apply theme to live site (careful - this affects the actual site)
   */
  applyThemeToLiveSite(theme: Theme): void {
    if (typeof window === 'undefined') return;

    // This is the only method that affects the live site
    // All other methods work in isolated preview environments
    cssVariableManager.applyTheme(theme);
    
    // Emit global theme change event
    window.dispatchEvent(new CustomEvent('liveThemeChanged', {
      detail: { theme }
    }));
  }

  /**
   * Check if theme is different from current design
   */
  isDifferentFromCurrentDesign(theme: Theme): boolean {
    if (!this.currentDesignTheme) return true;
    
    return JSON.stringify(theme) !== JSON.stringify(this.currentDesignTheme);
  }

  /**
   * Get theme differences
   */
  getThemeDifferences(theme1: Theme, theme2: Theme): string[] {
    const differences: string[] = [];
    
    // Compare colors
    this.compareObjects(theme1.colors, theme2.colors, 'colors', differences);
    
    // Compare gradients
    this.compareObjects(theme1.gradients, theme2.gradients, 'gradients', differences);
    
    // Compare effects
    this.compareObjects(theme1.effects, theme2.effects, 'effects', differences);
    
    return differences;
  }

  /**
   * Compare objects recursively
   */
  private compareObjects(obj1: any, obj2: any, path: string, differences: string[]): void {
    Object.keys(obj1).forEach(key => {
      const currentPath = `${path}.${key}`;
      
      if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
        this.compareObjects(obj1[key], obj2[key], currentPath, differences);
      } else if (obj1[key] !== obj2[key]) {
        differences.push(`${currentPath}: ${obj1[key]} → ${obj2[key]}`);
      }
    });
  }
}

// Export singleton instance
export const realTimePreviewManager = new RealTimePreviewManagerImpl();

// Initialize on window load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    realTimePreviewManager.preserveCurrentDesign();
  });
}