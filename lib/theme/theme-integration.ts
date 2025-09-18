/**
 * Theme Integration Utilities
 * 
 * This module provides utilities for integrating the theme system with existing components.
 * It maps current Tailwind classes to theme CSS variables for seamless theme switching.
 */

// Theme class mappings for existing components
export const themeClassMappings = {
  // Background gradients
  'bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900': 'theme-gradient-hero',
  'bg-gradient-to-r from-emerald-500 to-teal-600': 'theme-gradient-button',
  'bg-gradient-to-r from-emerald-600 to-teal-700': 'theme-gradient-button hover:opacity-90',
  'bg-gradient-to-br from-gray-50 to-emerald-50/30': 'theme-gradient-background',
  
  // Colors
  'text-emerald-400': 'theme-text-primary',
  'text-emerald-500': 'theme-text-primary',
  'text-emerald-600': 'theme-text-primary',
  'text-teal-600': 'theme-text-secondary',
  'bg-emerald-500': 'theme-bg-primary',
  'bg-emerald-600': 'theme-bg-primary hover:opacity-90',
  'bg-teal-600': 'theme-bg-secondary',
  'border-emerald-400': 'theme-border-primary',
  'border-emerald-500': 'theme-border-primary',
  
  // Effects
  'backdrop-blur-sm': 'theme-backdrop-blur-sm',
  'backdrop-blur-md': 'theme-backdrop-blur-md',
  'shadow-2xl': 'theme-shadow-card',
  'rounded-2xl': 'theme-rounded-xl',
  'rounded-3xl': 'theme-rounded-xl',
  'rounded-xl': 'theme-rounded-lg',
};

/**
 * Converts existing Tailwind classes to theme-aware classes
 */
export function convertToThemeClasses(className: string): string {
  let convertedClass = className;
  
  // Replace mapped classes
  Object.entries(themeClassMappings).forEach(([original, themed]) => {
    convertedClass = convertedClass.replace(new RegExp(original, 'g'), themed);
  });
  
  return convertedClass;
}

/**
 * Generates CSS custom properties for a theme
 */
export function generateThemeCSS(theme: any): string {
  const cssVariables: string[] = [];
  
  // Primary colors
  if (theme.colors?.primary) {
    Object.entries(theme.colors.primary).forEach(([shade, color]) => {
      cssVariables.push(`--theme-primary-${shade}: ${color};`);
    });
  }
  
  // Secondary colors
  if (theme.colors?.secondary) {
    Object.entries(theme.colors.secondary).forEach(([shade, color]) => {
      cssVariables.push(`--theme-secondary-${shade}: ${color};`);
    });
  }
  
  // Gradients
  if (theme.gradients) {
    Object.entries(theme.gradients).forEach(([name, gradient]: [string, any]) => {
      cssVariables.push(`--theme-gradient-${name}: ${gradient.css};`);
    });
  }
  
  // Effects
  if (theme.effects) {
    if (theme.effects.backdropBlur) {
      Object.entries(theme.effects.backdropBlur).forEach(([size, value]) => {
        cssVariables.push(`--theme-backdrop-blur-${size}: blur(${value});`);
      });
    }
    
    if (theme.effects.boxShadow) {
      Object.entries(theme.effects.boxShadow).forEach(([name, value]) => {
        cssVariables.push(`--theme-shadow-${name}: ${value};`);
      });
    }
    
    if (theme.effects.borderRadius) {
      Object.entries(theme.effects.borderRadius).forEach(([size, value]) => {
        cssVariables.push(`--theme-radius-${size}: ${value};`);
      });
    }
  }
  
  return `:root {\n  ${cssVariables.join('\n  ')}\n}`;
}

/**
 * Applies theme to the document by updating CSS custom properties
 */
export function applyThemeToDocument(theme: any): void {
  const root = document.documentElement;
  
  // Apply primary colors
  if (theme.colors?.primary) {
    Object.entries(theme.colors.primary).forEach(([shade, color]) => {
      root.style.setProperty(`--theme-primary-${shade}`, color as string);
    });
  }
  
  // Apply secondary colors
  if (theme.colors?.secondary) {
    Object.entries(theme.colors.secondary).forEach(([shade, color]) => {
      root.style.setProperty(`--theme-secondary-${shade}`, color as string);
    });
  }
  
  // Apply accent colors
  if (theme.colors?.accent) {
    Object.entries(theme.colors.accent).forEach(([shade, color]) => {
      root.style.setProperty(`--theme-accent-${shade}`, color as string);
    });
  }
  
  // Apply gradients
  if (theme.gradients) {
    Object.entries(theme.gradients).forEach(([name, gradient]: [string, any]) => {
      root.style.setProperty(`--theme-gradient-${name}`, gradient.css || gradient);
    });
  }
  
  // Apply effects
  if (theme.effects) {
    if (theme.effects.backdropBlur) {
      Object.entries(theme.effects.backdropBlur).forEach(([size, value]) => {
        root.style.setProperty(`--theme-backdrop-blur-${size}`, `blur(${value})`);
      });
    }
    
    if (theme.effects.boxShadow) {
      Object.entries(theme.effects.boxShadow).forEach(([name, value]) => {
        root.style.setProperty(`--theme-shadow-${name}`, value as string);
      });
    }
    
    if (theme.effects.borderRadius) {
      Object.entries(theme.effects.borderRadius).forEach(([size, value]) => {
        root.style.setProperty(`--theme-radius-${size}`, value as string);
      });
    }
  }
}

/**
 * Creates a theme-aware className utility
 */
export function createThemeClassName(baseClasses: string, themeOverrides?: string): string {
  const converted = convertToThemeClasses(baseClasses);
  return themeOverrides ? `${converted} ${themeOverrides}` : converted;
}

/**
 * Hook for theme-aware styling in components
 */
export function useThemeClasses(classes: string): string {
  return convertToThemeClasses(classes);
}

/**
 * Validates that theme variables are properly loaded
 */
export function validateThemeVariables(): boolean {
  if (typeof window === 'undefined') return true; // SSR
  
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  // Check for essential theme variables
  const essentialVars = [
    '--theme-primary-500',
    '--theme-secondary-500',
    '--theme-gradient-hero',
    '--theme-backdrop-blur-md',
    '--theme-shadow-card'
  ];
  
  return essentialVars.every(varName => {
    const value = computedStyle.getPropertyValue(varName).trim();
    return value !== '';
  });
}

/**
 * Gets current theme values from CSS custom properties
 */
export function getCurrentThemeValues(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  const themeValues: Record<string, string> = {};
  
  // Get all CSS custom properties that start with --theme-
  const allProperties = Array.from(document.styleSheets)
    .flatMap(sheet => {
      try {
        return Array.from(sheet.cssRules);
      } catch {
        return [];
      }
    })
    .filter(rule => rule instanceof CSSStyleRule)
    .flatMap(rule => Array.from((rule as CSSStyleRule).style))
    .filter(prop => prop.startsWith('--theme-'));
  
  allProperties.forEach(prop => {
    const value = computedStyle.getPropertyValue(prop).trim();
    if (value) {
      themeValues[prop] = value;
    }
  });
  
  return themeValues;
}

/**
 * Resets theme to default values
 */
export function resetThemeToDefault(): void {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  // Remove all theme custom properties to fall back to defaults
  const themeProps = getCurrentThemeValues();
  Object.keys(themeProps).forEach(prop => {
    root.style.removeProperty(prop);
  });
}