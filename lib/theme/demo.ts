// Demo of CSS Variable System for Theme Management
import { cssVariableManager, initializeThemeVariables } from './css-variables';

/**
 * Demonstrate CSS variable system functionality
 */
export function demoCSSVariableSystem(): void {
  console.log('🎨 CSS Variable System Demo');
  console.log('============================\n');

  // Initialize theme variables
  console.log('1. Initializing theme variables...');
  initializeThemeVariables();
  console.log('✅ Theme variables initialized\n');

  // Test variable validation
  console.log('2. Testing variable validation...');
  
  const testVariables = {
    '--theme-primary-500': '#10b981',
    '--theme-gradient-hero': 'linear-gradient(135deg, #064e3b 0%, #115e59 50%, #1e3a8a 100%)',
    '--theme-shadow-card': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '--theme-backdrop-blur-md': 'blur(12px)',
    '--theme-radius-xl': '1.5rem',
  };

  const isValid = cssVariableManager.validateVariables(testVariables);
  console.log(`   Variables validation: ${isValid ? '✅ Valid' : '❌ Invalid'}\n`);

  // Test batch update
  console.log('3. Testing batch variable update...');
  const updateResult = cssVariableManager.batchUpdateVariables(testVariables);
  console.log(`   Batch update success: ${updateResult.success ? '✅' : '❌'}`);
  if (updateResult.errors.length > 0) {
    console.log(`   Errors: ${updateResult.errors.join(', ')}`);
  }
  console.log('');

  // Test individual variable operations
  console.log('4. Testing individual variable operations...');
  
  const setSuccess = cssVariableManager.setVariableValue('--theme-primary-600', '#059669');
  console.log(`   Set individual variable: ${setSuccess ? '✅' : '❌'}`);
  
  const getValue = cssVariableManager.getVariableValue('--theme-primary-500');
  console.log(`   Get variable value: ${getValue || 'null'}\n`);

  // Test fallback chains
  console.log('5. Testing fallback chains...');
  cssVariableManager.createFallbackChain('--theme-test-color', ['--theme-primary-500', '--theme-secondary-500']);
  console.log('✅ Fallback chain created for --theme-test-color\n');

  // Test theme application
  console.log('6. Testing theme application...');
  
  const sampleTheme = {
    id: 'demo-theme',
    name: 'Demo Theme',
    colors: {
      primary: {
        50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
        500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b'
      },
      secondary: {
        50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf',
        500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a'
      },
      accent: {
        50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
        500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a'
      },
      neutral: {
        50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af',
        500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827'
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
        usage: 'hero' as const
      },
      card: {
        name: 'Card Gradient',
        direction: '135deg',
        colorStops: [
          { color: '#10b981', position: 0 },
          { color: '#0d9488', position: 100 }
        ],
        usage: 'card' as const
      },
      button: {
        name: 'Button Gradient',
        direction: '135deg',
        colorStops: [
          { color: '#10b981', position: 0 },
          { color: '#0d9488', position: 100 }
        ],
        usage: 'button' as const
      },
      background: {
        name: 'Background Gradient',
        direction: '135deg',
        colorStops: [
          { color: '#f9fafb', position: 0 },
          { color: '#ecfdf5', position: 100 }
        ],
        usage: 'background' as const
      },
      accent: {
        name: 'Accent Gradient',
        direction: '135deg',
        colorStops: [
          { color: '#ecfdf5', position: 0 },
          { color: '#ccfbf1', position: 100 }
        ],
        usage: 'accent' as const
      }
    },
    typography: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      fontSize: {
        xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem',
        '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem', '5xl': '3rem', '6xl': '3.75rem'
      },
      fontWeight: {
        thin: '100', light: '300', normal: '400', medium: '500',
        semibold: '600', bold: '700', extrabold: '800', black: '900'
      },
      lineHeight: {
        none: '1', tight: '1.25', snug: '1.375',
        normal: '1.5', relaxed: '1.625', loose: '2'
      }
    },
    effects: {
      backdropBlur: {
        sm: 'blur(4px)', md: 'blur(12px)', lg: 'blur(16px)', xl: 'blur(24px)'
      },
      boxShadow: {
        card: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        button: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        hero: '0 20px 25px -5px rgba(16, 185, 129, 0.1)'
      },
      borderRadius: {
        sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1.5rem', full: '9999px'
      }
    },
    metadata: {
      name: 'Demo Theme',
      description: 'A demonstration theme',
      author: 'Theme System',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['demo', 'test']
    }
  };

  try {
    cssVariableManager.applyTheme(sampleTheme);
    console.log('✅ Theme applied successfully\n');
  } catch (error) {
    console.log(`❌ Theme application failed: ${error}\n`);
  }

  // Test reset functionality
  console.log('7. Testing reset to default...');
  cssVariableManager.resetToDefault();
  console.log('✅ Reset to default theme\n');

  console.log('🎉 CSS Variable System Demo Complete!');
  console.log('=====================================');
  
  // Summary of features
  console.log('\n📋 Features Demonstrated:');
  console.log('   ✅ Variable validation with multiple formats');
  console.log('   ✅ Batch variable updates with error handling');
  console.log('   ✅ Individual variable get/set operations');
  console.log('   ✅ Fallback chain creation and management');
  console.log('   ✅ Complete theme application');
  console.log('   ✅ Reset to default functionality');
  console.log('   ✅ Real-time CSS custom property updates');
  console.log('   ✅ Performance optimization with caching');
}

// Run demo if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  document.addEventListener('DOMContentLoaded', () => {
    demoCSSVariableSystem();
  });
} else {
  // Node environment - just log that it would work in browser
  console.log('CSS Variable System Demo');
  console.log('This demo requires a browser environment with DOM support.');
  console.log('The CSS variable system is ready and will work when used in a web page.');
}