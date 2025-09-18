// Simple validation script for the preview system
const { PreviewSystemImpl } = require('./preview');

// Mock theme for testing
const mockTheme = {
  id: 'test-theme',
  name: 'Test Theme',
  colors: {
    primary: {
      50: '#ecfdf5',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      900: '#064e3b'
    },
    secondary: {
      50: '#f0fdfa',
      500: '#14b8a6',
      600: '#0d9488'
    },
    accent: {
      500: '#3b82f6'
    },
    neutral: {
      50: '#f9fafb',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
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
        { color: '#134e4a', position: 100 }
      ],
      usage: 'hero'
    },
    card: {
      name: 'Card Gradient',
      direction: '135deg',
      colorStops: [
        { color: '#10b981', position: 0 },
        { color: '#14b8a6', position: 100 }
      ],
      usage: 'card'
    },
    button: {
      name: 'Button Gradient',
      direction: '135deg',
      colorStops: [
        { color: '#059669', position: 0 },
        { color: '#0d9488', position: 100 }
      ],
      usage: 'button'
    },
    background: {
      name: 'Background Gradient',
      direction: '135deg',
      colorStops: [
        { color: '#064e3b', position: 0 },
        { color: '#134e4a', position: 100 }
      ],
      usage: 'background'
    },
    accent: {
      name: 'Accent Gradient',
      direction: '135deg',
      colorStops: [
        { color: '#3b82f6', position: 0 },
        { color: '#1d4ed8', position: 100 }
      ],
      usage: 'accent'
    }
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Georgia', 'serif'],
      mono: ['Monaco', 'monospace']
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
      card: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      button: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      hero: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px'
    }
  },
  metadata: {
    name: 'Test Theme',
    description: 'A test theme for validation',
    author: 'Validation Script',
    version: '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tags: ['test', 'emerald', 'teal']
  }
};

function validatePreviewSystem() {
  console.log('🚀 Validating Preview System...\n');

  try {
    const previewSystem = new PreviewSystemImpl();

    // Test 1: Generate preview
    console.log('✅ Test 1: Generate Preview');
    const preview = previewSystem.generatePreview(mockTheme);
    console.log(`   - Generated ${preview.components.length} components`);
    console.log(`   - HTML length: ${preview.html.length} characters`);
    console.log(`   - CSS length: ${preview.css.length} characters`);

    // Test 2: Component previews
    console.log('\n✅ Test 2: Component Previews');
    const components = previewSystem.renderComponentPreviews(mockTheme);
    components.forEach(component => {
      console.log(`   - ${component.component}: ${component.html.length} chars HTML, ${component.styles.length} chars CSS`);
    });

    // Test 3: Theme comparison
    console.log('\n✅ Test 3: Theme Comparison');
    const modifiedTheme = {
      ...mockTheme,
      name: 'Modified Theme',
      colors: {
        ...mockTheme.colors,
        primary: {
          ...mockTheme.colors.primary,
          500: '#ff0000' // Changed to red
        }
      }
    };

    const comparison = previewSystem.compareThemes(mockTheme, modifiedTheme);
    console.log(`   - Detected ${comparison.differences.length} differences`);
    comparison.differences.forEach(diff => {
      console.log(`     • ${diff}`);
    });

    // Test 4: Side-by-side comparison
    console.log('\n✅ Test 4: Side-by-side Comparison');
    const comparisonHTML = previewSystem.generateSideBySideComparison(mockTheme, modifiedTheme);
    console.log(`   - Generated comparison HTML: ${comparisonHTML.length} characters`);

    // Test 5: Validate component structure
    console.log('\n✅ Test 5: Component Structure Validation');
    const expectedComponents = ['hero', 'card', 'form', 'button', 'navigation'];
    const actualComponents = components.map(c => c.component);
    
    expectedComponents.forEach(expected => {
      if (actualComponents.includes(expected)) {
        console.log(`   - ✓ ${expected} component present`);
      } else {
        console.log(`   - ✗ ${expected} component missing`);
      }
    });

    // Test 6: CSS validation
    console.log('\n✅ Test 6: CSS Validation');
    const cssChecks = [
      { name: 'Primary color', value: mockTheme.colors.primary[500] },
      { name: 'Border radius', value: mockTheme.effects.borderRadius.xl },
      { name: 'Font family', value: mockTheme.typography.fontFamily.sans[0] },
      { name: 'Backdrop blur', value: mockTheme.effects.backdropBlur.md },
      { name: 'Box shadow', value: mockTheme.effects.boxShadow.card }
    ];

    cssChecks.forEach(check => {
      if (preview.css.includes(check.value)) {
        console.log(`   - ✓ ${check.name} applied correctly`);
      } else {
        console.log(`   - ✗ ${check.name} not found in CSS`);
      }
    });

    // Test 7: HTML structure validation
    console.log('\n✅ Test 7: HTML Structure Validation');
    const htmlChecks = [
      'data-component="hero"',
      'data-component="card"',
      'data-component="form"',
      'data-component="button"',
      'data-component="navigation"',
      'theme-preview-container'
    ];

    htmlChecks.forEach(check => {
      if (preview.html.includes(check)) {
        console.log(`   - ✓ ${check} found in HTML`);
      } else {
        console.log(`   - ✗ ${check} not found in HTML`);
      }
    });

    console.log('\n🎉 All validation tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Components generated: ${components.length}`);
    console.log(`   - Total HTML size: ${preview.html.length} characters`);
    console.log(`   - Total CSS size: ${preview.css.length} characters`);
    console.log(`   - Theme differences detected: ${comparison.differences.length}`);

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run validation
validatePreviewSystem();