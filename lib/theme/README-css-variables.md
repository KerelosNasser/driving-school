# CSS Variable System for Real-Time Theme Switching

This document describes the CSS Variable System implementation for the Theme Management System, which enables real-time theme switching without page reloads.

## Overview

The CSS Variable System provides:
- **Real-time theme switching** using CSS custom properties
- **Comprehensive validation** for colors, gradients, shadows, and effects
- **Fallback mechanisms** for browser compatibility and error recovery
- **Performance optimization** with caching and batch updates
- **Type-safe interfaces** for all theme operations

## Architecture

### Core Components

1. **CSSVariableManager** - Main interface for managing CSS variables
2. **CSS Custom Properties** - Defined in `globals.css` for all theme elements
3. **Validation System** - Ensures CSS values are valid before application
4. **Fallback Chains** - Provides graceful degradation for unsupported values

### CSS Variable Structure

All theme variables follow a consistent naming convention:

```css
/* Colors */
--theme-primary-{shade}     /* 50, 100, 200, ..., 900 */
--theme-secondary-{shade}
--theme-accent-{shade}
--theme-neutral-{shade}

/* Gradients */
--theme-gradient-hero
--theme-gradient-card
--theme-gradient-button
--theme-gradient-background
--theme-gradient-accent

/* Effects */
--theme-backdrop-blur-{size}    /* sm, md, lg, xl */
--theme-shadow-{type}           /* card, button, modal, hero */
--theme-radius-{size}           /* sm, md, lg, xl, full */

/* Typography */
--theme-font-{family}           /* sans, serif, mono */
--theme-text-{size}             /* xs, sm, base, lg, xl, 2xl, ... */
--theme-font-{weight}           /* thin, light, normal, ... */
--theme-leading-{height}        /* none, tight, snug, ... */
```

## Usage Examples

### Basic Variable Updates

```typescript
import { cssVariableManager } from '@/lib/theme/css-variables';

// Update a single variable
cssVariableManager.setVariableValue('--theme-primary-500', '#10b981');

// Update multiple variables
cssVariableManager.updateVariables({
  '--theme-primary-500': '#10b981',
  '--theme-gradient-hero': 'linear-gradient(135deg, #064e3b, #115e59)',
});

// Get current variable value
const primaryColor = cssVariableManager.getVariableValue('--theme-primary-500');
```

### Batch Updates with Error Handling

```typescript
const result = cssVariableManager.batchUpdateVariables({
  '--theme-primary-500': '#10b981',
  '--theme-invalid-prop': 'invalid-value', // This will fail validation
});

if (!result.success) {
  console.log('Errors:', result.errors);
}
```

### Theme Application

```typescript
import { themeEngine } from '@/lib/theme/engine';

// Apply a complete theme
const theme = await themeEngine.loadTheme('my-theme-id');
themeEngine.applyTheme(theme);

// The CSS variables are automatically updated
```

### React Hook Usage

```tsx
import { useCSSVariable } from '@/lib/theme/examples/css-variables-usage';

function MyComponent() {
  const [primaryColor, setPrimaryColor] = useCSSVariable('--theme-primary-500');
  
  return (
    <div>
      <input
        type="color"
        value={primaryColor || '#10b981'}
        onChange={(e) => setPrimaryColor(e.target.value)}
      />
      <div style={{ backgroundColor: primaryColor }}>
        Dynamic background color
      </div>
    </div>
  );
}
```

## CSS Utility Classes

The system provides utility classes that use CSS variables:

```css
/* Color utilities */
.theme-bg-primary { background-color: var(--theme-primary-500); }
.theme-text-primary { color: var(--theme-primary-500); }
.theme-border-primary { border-color: var(--theme-primary-500); }

/* Gradient utilities */
.theme-gradient-hero { background: var(--theme-gradient-hero); }
.theme-gradient-card { background: var(--theme-gradient-card); }

/* Effect utilities */
.theme-backdrop-blur-md { backdrop-filter: var(--theme-backdrop-blur-md); }
.theme-shadow-card { box-shadow: var(--theme-shadow-card); }
.theme-rounded-xl { border-radius: var(--theme-radius-xl); }
```

### Usage in Components

```tsx
function HeroSection() {
  return (
    <div className="theme-gradient-hero theme-rounded-xl theme-shadow-hero p-8">
      <h1 className="text-white text-4xl font-bold">
        Hero Section with Theme Variables
      </h1>
    </div>
  );
}
```

## Validation System

The system validates CSS values before applying them:

### Supported Formats

**Colors:**
- Hex: `#ff0000`, `#f00`, `#ff000080`
- RGB: `rgb(255, 0, 0)`, `rgba(255, 0, 0, 0.5)`
- HSL: `hsl(0, 100%, 50%)`, `hsla(0, 100%, 50%, 0.5)`
- OKLCH: `oklch(0.5 0.2 180)`
- Named: `transparent`, `currentColor`, `red`, etc.

**Gradients:**
- Linear: `linear-gradient(to right, #ff0000, #00ff00)`
- Radial: `radial-gradient(circle, #ff0000 0%, #00ff00 100%)`
- Conic: `conic-gradient(from 0deg, #ff0000, #00ff00)`

**Shadows:**
- Basic: `0 4px 6px rgba(0, 0, 0, 0.1)`
- Inset: `inset 0 2px 4px rgba(0, 0, 0, 0.1)`
- Multiple: `0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)`

**Blur:**
- Standard: `blur(4px)`, `blur(0.5rem)`

**Border Radius:**
- Length: `4px`, `0.5rem`, `1em`
- Percentage: `50%`
- Special: `9999px`, `full`

## Fallback Mechanisms

### Automatic Fallbacks

The system provides automatic fallbacks for:

1. **Invalid values** - Reverts to default theme values
2. **Unsupported properties** - Uses closest supported alternative
3. **Browser compatibility** - Provides standard CSS fallbacks

### Custom Fallback Chains

```typescript
// Create a fallback chain
cssVariableManager.createFallbackChain(
  '--theme-primary-500',
  ['--theme-primary-400', '--theme-primary-600', '#10b981']
);
```

### Accessibility Fallbacks

```css
/* High contrast mode */
@media (prefers-contrast: high) {
  .theme-backdrop-blur-md {
    backdrop-filter: none;
    background-color: var(--theme-neutral-100);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .theme-gradient-hero {
    background: var(--theme-primary-500);
  }
}
```

## Performance Optimization

### Caching

- **Validation results** are cached to avoid repeated computation
- **Variable values** are cached for quick access
- **Batch updates** minimize DOM operations

### Efficient Updates

```typescript
// Batch multiple updates together
const variables = {
  '--theme-primary-500': '#10b981',
  '--theme-secondary-500': '#14b8a6',
  '--theme-gradient-hero': 'linear-gradient(...)',
};

// Single DOM update for all variables
cssVariableManager.batchUpdateVariables(variables);
```

## Browser Support

### CSS Custom Properties
- **Modern browsers**: Full support
- **IE 11**: Polyfill available
- **Fallback**: Static CSS classes

### Feature Detection

```typescript
// Check if CSS custom properties are supported
const supportsCustomProperties = CSS.supports('color', 'var(--test)');

if (!supportsCustomProperties) {
  // Use fallback implementation
  console.warn('CSS custom properties not supported, using fallback');
}
```

## Error Handling

### Validation Errors

```typescript
const result = cssVariableManager.batchUpdateVariables({
  '--theme-primary-500': 'invalid-color',
});

if (!result.success) {
  result.errors.forEach(error => {
    console.error('Validation error:', error);
  });
}
```

### Runtime Errors

```typescript
try {
  cssVariableManager.setVariableValue('--theme-primary-500', '#10b981');
} catch (error) {
  console.error('Failed to set CSS variable:', error);
  // Fallback to default value
  cssVariableManager.resetToDefault();
}
```

## Integration with Existing Components

### Tailwind CSS Integration

The CSS variables work seamlessly with existing Tailwind classes:

```tsx
function Card() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-2xl p-6">
      {/* Existing Tailwind classes */}
      <div className="theme-bg-primary theme-rounded-lg p-4">
        {/* Theme variable classes */}
      </div>
    </div>
  );
}
```

### Gradual Migration

You can gradually migrate existing components:

```tsx
// Before
<div className="bg-emerald-500 rounded-xl shadow-lg">

// After
<div className="theme-bg-primary theme-rounded-xl theme-shadow-card">
```

## Testing

### Unit Tests

```typescript
import { cssVariableManager } from '@/lib/theme/css-variables';

describe('CSS Variable Manager', () => {
  test('validates colors correctly', () => {
    expect(cssVariableManager.validateVariables({
      '--theme-primary-500': '#10b981'
    })).toBe(true);
  });

  test('handles invalid values gracefully', () => {
    const result = cssVariableManager.batchUpdateVariables({
      '--theme-primary-500': 'invalid-color'
    });
    expect(result.success).toBe(false);
  });
});
```

### Visual Testing

```typescript
// Test theme switching
const originalTheme = themeEngine.getCurrentTheme();
themeEngine.applyTheme(testTheme);

// Verify CSS variables are updated
const primaryColor = cssVariableManager.getVariableValue('--theme-primary-500');
expect(primaryColor).toBe('#10b981');

// Restore original theme
themeEngine.applyTheme(originalTheme);
```

## Best Practices

### 1. Use Semantic Variable Names

```css
/* Good */
--theme-primary-500
--theme-gradient-hero
--theme-shadow-card

/* Avoid */
--color-1
--grad-1
--shadow-big
```

### 2. Provide Fallbacks

```css
.my-component {
  background: #10b981; /* Fallback */
  background: var(--theme-primary-500, #10b981);
}
```

### 3. Validate Before Applying

```typescript
// Always validate before applying
if (cssVariableManager.validateVariables(newVariables)) {
  cssVariableManager.updateVariables(newVariables);
} else {
  console.error('Invalid theme variables');
}
```

### 4. Use Batch Updates

```typescript
// Efficient: Single DOM update
cssVariableManager.batchUpdateVariables({
  '--theme-primary-500': '#10b981',
  '--theme-secondary-500': '#14b8a6',
});

// Inefficient: Multiple DOM updates
cssVariableManager.setVariableValue('--theme-primary-500', '#10b981');
cssVariableManager.setVariableValue('--theme-secondary-500', '#14b8a6');
```

### 5. Handle Errors Gracefully

```typescript
try {
  cssVariableManager.applyTheme(theme);
} catch (error) {
  console.error('Theme application failed:', error);
  // Fallback to default theme
  cssVariableManager.resetToDefault();
}
```

## Troubleshooting

### Common Issues

1. **Variables not updating**: Check if DOM is ready
2. **Invalid values**: Use validation before applying
3. **Performance issues**: Use batch updates
4. **Browser compatibility**: Provide CSS fallbacks

### Debug Mode

```typescript
// Enable debug logging
cssVariableManager.setDebugMode(true);

// Check current variables
console.log(cssVariableManager.getComputedVariables());
```

## Future Enhancements

- **CSS-in-JS integration** for styled-components
- **Theme interpolation** for smooth transitions
- **Variable scoping** for component-level themes
- **Performance monitoring** and optimization
- **Advanced validation** with color theory checks