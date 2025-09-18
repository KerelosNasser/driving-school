// Theme system initialization
import { themeEngine } from './engine';
import { initializeThemeVariables, cssVariableManager } from './css-variables';

/**
 * Initialize the theme system
 * Call this once when the app starts
 */
export function initializeThemeSystem(): void {
  try {
    // Initialize CSS variables with default theme
    initializeThemeVariables();
    
    // Apply default theme
    const defaultTheme = themeEngine.getDefaultTheme();
    themeEngine.applyTheme(defaultTheme);
    
    console.log('✅ Theme system initialized with default theme:', defaultTheme.name);
    
    // Set up theme change event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('themeChanged', (event: CustomEvent) => {
        console.log('🎨 Theme changed to:', event.detail.theme.name);
      });
    }
  } catch (error) {
    console.error('❌ Failed to initialize theme system:', error);
    
    // Fallback: ensure CSS variables are at least set to defaults
    if (typeof window !== 'undefined') {
      initializeThemeVariables();
    }
  }
}

/**
 * Get the current theme system status
 */
export function getThemeSystemStatus(): {
  initialized: boolean;
  currentTheme: string | null;
  variablesLoaded: boolean;
} {
  const currentTheme = themeEngine.getCurrentTheme();
  
  return {
    initialized: currentTheme !== null,
    currentTheme: currentTheme?.name || null,
    variablesLoaded: typeof window !== 'undefined' && 
      !!cssVariableManager.getVariableValue('--theme-primary-500')
  };
}

/**
 * Reinitialize theme system (useful for hot reloading)
 */
export function reinitializeThemeSystem(): void {
  console.log('🔄 Reinitializing theme system...');
  
  // Reset to defaults first
  if (typeof window !== 'undefined') {
    cssVariableManager.resetToDefault();
  }
  
  // Initialize again
  initializeThemeSystem();
}

/**
 * Initialize theme system on client side
 */
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThemeSystem);
  } else {
    // DOM is already ready
    initializeThemeSystem();
  }
  
  // Handle page visibility changes (useful for PWAs)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const status = getThemeSystemStatus();
      if (!status.variablesLoaded) {
        console.log('🔄 Reinitializing theme system after page became visible');
        reinitializeThemeSystem();
      }
    }
  });
}