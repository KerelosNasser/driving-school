// Demo script showing theme persistence and application functionality
import { themePersistence, themeApplication } from './persistence';
import { Theme } from './types';

// Demo themes
const emeraldTheme: Theme = {
  id: 'emerald-professional',
  name: 'Emerald Professional',
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
      900: '#064e3b',
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
      900: '#134e4a',
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
      900: '#1e3a8a',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  gradients: {
    hero: {
      name: 'Hero Gradient',
      direction: '135deg',
      colorStops: [
        { color: '#064e3b', position: 0 },
        { color: '#115e59', position: 50 },
        { color: '#1e3a8a', position: 100 },
      ],
      usage: 'hero',
    },
    card: {
      name: 'Card Gradient',
      direction: '135deg',
      colorStops: [
        { color: '#10b981', position: 0 },
        { color: '#0d9488', position: 100 },
      ],
      usage: 'card',
    },
    button: {
      name: 'Button Gradient',
      direction: '135deg',
      colorStops: [
        { color: '#10b981', position: 0 },
        { color: '#0d9488', position: 100 },
      ],
      usage: 'button',
    },
    background: {
      name: 'Background Gradient',
      direction: '135deg',
      colorStops: [
        { color: '#f9fafb', position: 0 },
        { color: '#ecfdf5', position: 100 },
      ],
      usage: 'background',
    },
    accent: {
      name: 'Accent Gradient',
      direction: '135deg',
      colorStops: [
        { color: '#ecfdf5', position: 0 },
        { color: '#ccfbf1', position: 100 },
      ],
      usage: 'accent',
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Georgia', 'serif'],
      mono: ['Menlo', 'Monaco', 'Consolas', 'monospace'],
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
      '6xl': '3.75rem',
    },
    fontWeight: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },
  effects: {
    backdropBlur: {
      sm: 'blur(4px)',
      md: 'blur(12px)',
      lg: 'blur(16px)',
      xl: 'blur(24px)',
    },
    boxShadow: {
      card: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      button: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      hero: '0 20px 25px -5px rgba(16, 185, 129, 0.1)',
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1.5rem',
      full: '9999px',
    },
  },
  metadata: {
    name: 'Emerald Professional',
    description: 'Professional emerald and teal theme based on current design',
    author: 'Theme System',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['professional', 'emerald', 'default'],
  },
};

const warmOrangeTheme: Theme = {
  ...emeraldTheme,
  id: 'warm-orange',
  name: 'Warm Orange',
  colors: {
    ...emeraldTheme.colors,
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    secondary: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
    },
  },
  gradients: {
    ...emeraldTheme.gradients,
    hero: {
      name: 'Warm Hero Gradient',
      direction: '135deg',
      colorStops: [
        { color: '#7c2d12', position: 0 },
        { color: '#9a3412', position: 50 },
        { color: '#713f12', position: 100 },
      ],
      usage: 'hero',
    },
    card: {
      name: 'Warm Card Gradient',
      direction: '135deg',
      colorStops: [
        { color: '#f97316', position: 0 },
        { color: '#eab308', position: 100 },
      ],
      usage: 'card',
    },
    button: {
      name: 'Warm Button Gradient',
      direction: '135deg',
      colorStops: [
        { color: '#f97316', position: 0 },
        { color: '#ea580c', position: 100 },
      ],
      usage: 'button',
    },
  },
  metadata: {
    ...emeraldTheme.metadata,
    name: 'Warm Orange',
    description: 'Warm orange theme variation for seasonal campaigns',
    tags: ['warm', 'orange', 'seasonal'],
  },
};

// Demo functions
export class ThemePersistenceDemo {
  private logStep(step: number, description: string) {
    console.log(`\n🔸 Step ${step}: ${description}`);
  }

  private logSuccess(message: string) {
    console.log(`✅ ${message}`);
  }

  private logError(message: string) {
    console.log(`❌ ${message}`);
  }

  private logInfo(message: string) {
    console.log(`ℹ️  ${message}`);
  }

  async runDemo() {
    console.log('🎨 Theme Persistence and Application Demo');
    console.log('==========================================\n');

    try {
      // Step 1: Initialize theme system
      this.logStep(1, 'Initialize theme system');
      const initialTheme = await themeApplication.initialize();
      if (initialTheme) {
        this.logSuccess(`Initialized with theme: ${initialTheme.name}`);
      } else {
        this.logInfo('No stored theme found, will use default');
      }

      // Step 2: Apply emerald theme
      this.logStep(2, 'Apply emerald professional theme');
      const emeraldResult = await themeApplication.applyTheme(emeraldTheme);
      if (emeraldResult.success) {
        this.logSuccess(`Applied theme: ${emeraldResult.appliedTheme?.name}`);
        this.logInfo('CSS variables updated for emerald color scheme');
      } else {
        this.logError(`Failed to apply theme: ${emeraldResult.errors?.join(', ')}`);
        return;
      }

      // Step 3: Save the theme
      this.logStep(3, 'Save emerald theme');
      const saveResult = await themePersistence.saveTheme(emeraldTheme, 'Demo save');
      if (saveResult) {
        this.logSuccess('Theme saved successfully');
        this.logInfo('Theme persisted to storage and browser localStorage');
      } else {
        this.logError('Failed to save theme');
      }

      // Step 4: Apply warm orange theme
      this.logStep(4, 'Apply warm orange theme');
      const orangeResult = await themeApplication.applyTheme(warmOrangeTheme);
      if (orangeResult.success) {
        this.logSuccess(`Applied theme: ${orangeResult.appliedTheme?.name}`);
        this.logInfo('CSS variables updated for warm orange color scheme');
        this.logInfo(`Rollback available: ${orangeResult.rollbackAvailable ? 'Yes' : 'No'}`);
      } else {
        this.logError(`Failed to apply theme: ${orangeResult.errors?.join(', ')}`);
        return;
      }

      // Step 5: Show rollback history
      this.logStep(5, 'Check rollback history');
      const history = themePersistence.getRollbackHistory();
      if (history.length > 0) {
        this.logSuccess(`Found ${history.length} theme(s) in rollback history:`);
        history.forEach((entry, index) => {
          const date = new Date(entry.timestamp).toLocaleString();
          console.log(`   ${index + 1}. ${entry.theme.name} - ${entry.reason} (${date})`);
        });
      } else {
        this.logInfo('No rollback history available');
      }

      // Step 6: Rollback to previous theme
      this.logStep(6, 'Rollback to previous theme');
      const rollbackResult = await themeApplication.rollback();
      if (rollbackResult.success) {
        this.logSuccess(`Rolled back to: ${rollbackResult.appliedTheme?.name}`);
        this.logInfo('CSS variables reverted to previous theme');
      } else {
        this.logError(`Rollback failed: ${rollbackResult.errors?.join(', ')}`);
      }

      // Step 7: Save and apply utility
      this.logStep(7, 'Test save and apply utility');
      const saveAndApplyResult = await themeApplication.saveAndApplyTheme(warmOrangeTheme);
      if (saveAndApplyResult) {
        this.logSuccess('Save and apply completed successfully');
        this.logInfo('Theme applied and saved in one operation');
      } else {
        this.logError('Save and apply failed');
      }

      // Step 8: Load theme by ID
      this.logStep(8, 'Load theme by ID');
      const loadResult = await themeApplication.loadAndApplyTheme(emeraldTheme.id);
      if (loadResult.success) {
        this.logSuccess(`Loaded and applied: ${loadResult.appliedTheme?.name}`);
      } else {
        this.logError(`Load failed: ${loadResult.errors?.join(', ')}`);
      }

      // Step 9: Show current theme
      this.logStep(9, 'Get current theme');
      const currentTheme = themeApplication.getCurrentTheme();
      if (currentTheme) {
        this.logSuccess(`Current theme: ${currentTheme.name}`);
        this.logInfo(`Theme ID: ${currentTheme.id}`);
        this.logInfo(`Primary color: ${currentTheme.colors.primary[500]}`);
        this.logInfo(`Created: ${new Date(currentTheme.metadata.createdAt).toLocaleDateString()}`);
      } else {
        this.logInfo('No current theme set');
      }

      // Step 10: Demonstrate event handling
      this.logStep(10, 'Demonstrate theme change events');
      if (typeof window !== 'undefined') {
        const eventPromise = new Promise<void>((resolve) => {
          const handler = (event: CustomEvent) => {
            this.logSuccess(`Theme change event received: ${event.detail.theme.name}`);
            window.removeEventListener('themeChanged', handler as EventListener);
            resolve();
          };
          window.addEventListener('themeChanged', handler as EventListener);
        });

        await themeApplication.applyTheme(emeraldTheme);
        await eventPromise;
      } else {
        this.logInfo('Window not available, skipping event demo');
      }

      console.log('\n🎉 Demo completed successfully!');
      console.log('\n📋 Demo Summary:');
      console.log('   ✅ Theme system initialization');
      console.log('   ✅ Theme application with CSS variable updates');
      console.log('   ✅ Theme persistence to storage');
      console.log('   ✅ Rollback functionality with history');
      console.log('   ✅ Save and apply utility');
      console.log('   ✅ Theme loading by ID');
      console.log('   ✅ Current theme retrieval');
      console.log('   ✅ Theme change event handling');

    } catch (error) {
      this.logError(`Demo failed with error: ${error}`);
      console.error('Stack trace:', error);
    }
  }

  // Utility method to demonstrate specific features
  async demonstrateFeature(feature: string) {
    console.log(`\n🔍 Demonstrating: ${feature}\n`);

    switch (feature) {
      case 'instant-application':
        await this.demonstrateInstantApplication();
        break;
      case 'rollback':
        await this.demonstrateRollback();
        break;
      case 'persistence':
        await this.demonstratePersistence();
        break;
      case 'events':
        await this.demonstrateEvents();
        break;
      default:
        this.logError(`Unknown feature: ${feature}`);
    }
  }

  private async demonstrateInstantApplication() {
    this.logInfo('Applying themes with instant CSS variable updates...');
    
    await themeApplication.applyTheme(emeraldTheme);
    this.logSuccess('Emerald theme applied instantly');
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await themeApplication.applyTheme(warmOrangeTheme);
    this.logSuccess('Warm orange theme applied instantly');
    
    this.logInfo('Notice how themes switch without page reload!');
  }

  private async demonstrateRollback() {
    this.logInfo('Setting up rollback scenario...');
    
    // Apply multiple themes
    await themeApplication.applyTheme(emeraldTheme);
    await themeApplication.applyTheme(warmOrangeTheme);
    
    const history = themePersistence.getRollbackHistory();
    this.logInfo(`Rollback history has ${history.length} entries`);
    
    // Rollback
    const result = await themeApplication.rollback();
    if (result.success) {
      this.logSuccess(`Rolled back to: ${result.appliedTheme?.name}`);
    }
  }

  private async demonstratePersistence() {
    this.logInfo('Testing persistence across browser sessions...');
    
    // Save theme
    await themePersistence.saveTheme(emeraldTheme, 'Persistence demo');
    this.logSuccess('Theme saved to localStorage');
    
    // Clear current theme
    themePersistence.clearPersistenceData();
    this.logInfo('Current theme cleared');
    
    // Initialize from storage
    const restored = await themeApplication.initialize();
    if (restored) {
      this.logSuccess(`Theme restored from storage: ${restored.name}`);
    }
  }

  private async demonstrateEvents() {
    if (typeof window === 'undefined') {
      this.logInfo('Window not available, cannot demonstrate events');
      return;
    }

    this.logInfo('Setting up theme change event listener...');
    
    const eventHandler = (event: CustomEvent) => {
      this.logSuccess(`Event received: Theme changed to ${event.detail.theme.name}`);
    };
    
    window.addEventListener('themeChanged', eventHandler as EventListener);
    
    // Apply theme to trigger event
    await themeApplication.applyTheme(warmOrangeTheme);
    
    // Cleanup
    window.removeEventListener('themeChanged', eventHandler as EventListener);
    this.logInfo('Event listener removed');
  }
}

// Export demo instance
export const persistenceDemo = new ThemePersistenceDemo();

// Export themes for use in other demos
export { emeraldTheme, warmOrangeTheme };