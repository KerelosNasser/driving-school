// CSS Variable validation utilities
export class CSSVariableValidator {
  /**
   * Validate color values (hex, rgb, hsl, etc.)
   */
  static validateColor(value: string): boolean {
    // Check for common color formats
    const colorFormats = [
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, // Hex
      /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, // RGB
      /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/, // RGBA
      /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/, // HSL
      /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/, // HSLA
      /^oklch\([^)]+\)$/, // OKLCH (modern CSS)
    ];

    // Check against known formats first
    if (colorFormats.some(format => format.test(value))) {
      return true;
    }

    // CSS named colors
    const namedColors = ['transparent', 'currentColor', 'inherit', 'initial', 'unset'];
    if (namedColors.includes(value.toLowerCase())) {
      return true;
    }

    return false;
  }

  /**
   * Validate gradient values
   */
  static validateGradient(value: string): boolean {
    // Check for gradient function syntax
    const gradientTypes = ['linear-gradient', 'radial-gradient', 'conic-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient'];
    
    const hasValidType = gradientTypes.some(type => value.includes(type));
    if (!hasValidType) return false;

    // Check for proper parentheses
    const openParens = (value.match(/\(/g) || []).length;
    const closeParens = (value.match(/\)/g) || []).length;
    if (openParens !== closeParens) return false;

    // Check for at least one color
    const hasColor = /(?:#[0-9a-fA-F]{3,8}|rgb|hsl|oklch|\b(?:red|blue|green|white|black|transparent)\b)/.test(value);
    
    return hasColor;
  }

  /**
   * Validate shadow values
   */
  static validateShadow(value: string): boolean {
    if (value === 'none') return true;
    
    // Enhanced shadow validation
    // Format: [inset] <offset-x> <offset-y> [<blur-radius>] [<spread-radius>] <color>
    const shadowPattern = /^(?:inset\s+)?(?:[-\d.]+(?:px|rem|em|%)\s+){2,4}(?:#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\)|oklch\([^)]+\)|\w+)(?:\s*,\s*(?:inset\s+)?(?:[-\d.]+(?:px|rem|em|%)\s+){2,4}(?:#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\)|oklch\([^)]+\)|\w+))*$/;
    
    return shadowPattern.test(value.trim());
  }

  /**
   * Validate blur values
   */
  static validateBlur(value: string): boolean {
    // Check for blur function
    if (!value.includes('blur(')) return false;
    
    // Extract blur value
    const blurMatch = value.match(/blur\(([\d.]+(?:px|rem|em)?)\)/);
    if (!blurMatch) return false;
    
    const blurValue = parseFloat(blurMatch[1]);
    return !isNaN(blurValue) && blurValue >= 0;
  }

  /**
   * Validate border radius values
   */
  static validateRadius(value: string): boolean {
    // Handle special cases
    if (value === '9999px' || value === 'full') return true;
    
    // Check for valid CSS length units
    const lengthPattern = /^[\d.]+(?:px|rem|em|%|vh|vw|vmin|vmax)?$/;
    
    // Handle multiple values (e.g., "10px 20px")
    const values = value.split(/\s+/);
    if (values.length > 4) return false; // Max 4 values for border-radius
    
    return values.every(v => lengthPattern.test(v));
  }

  /**
   * Validate CSS property name
   */
  static validatePropertyName(property: string): boolean {
    return property.startsWith('--') && property.length > 2;
  }

  /**
   * Validate CSS variable value is not empty
   */
  static validateNotEmpty(value: string): boolean {
    return value && value.trim() !== '';
  }
}

// Test the validation functions
export function testCSSVariableValidation(): void {
  console.log('Testing CSS Variable Validation...');

  // Test colors
  const validColors = ['#ff0000', '#f00', 'rgb(255, 0, 0)', 'rgba(255, 0, 0, 0.5)', 'transparent'];
  const invalidColors = ['', 'invalid-color', '#gg0000'];

  console.log('Color validation tests:');
  validColors.forEach(color => {
    const result = CSSVariableValidator.validateColor(color);
    console.log(`  ${color}: ${result ? '✅' : '❌'}`);
  });

  invalidColors.forEach(color => {
    const result = CSSVariableValidator.validateColor(color);
    console.log(`  ${color || '(empty)'}: ${result ? '❌ (should be false)' : '✅'}`);
  });

  // Test gradients
  const validGradients = [
    'linear-gradient(to right, #ff0000, #00ff00)',
    'radial-gradient(circle, #ff0000 0%, #00ff00 100%)',
  ];
  const invalidGradients = ['', 'not-a-gradient', 'linear-gradient('];

  console.log('\nGradient validation tests:');
  validGradients.forEach(gradient => {
    const result = CSSVariableValidator.validateGradient(gradient);
    console.log(`  ${gradient}: ${result ? '✅' : '❌'}`);
  });

  invalidGradients.forEach(gradient => {
    const result = CSSVariableValidator.validateGradient(gradient);
    console.log(`  ${gradient || '(empty)'}: ${result ? '❌ (should be false)' : '✅'}`);
  });

  // Test shadows
  const validShadows = [
    'none',
    '0 4px 6px rgba(0, 0, 0, 0.1)',
    'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
  ];
  const invalidShadows = ['', 'invalid shadow'];

  console.log('\nShadow validation tests:');
  validShadows.forEach(shadow => {
    const result = CSSVariableValidator.validateShadow(shadow);
    console.log(`  ${shadow}: ${result ? '✅' : '❌'}`);
  });

  invalidShadows.forEach(shadow => {
    const result = CSSVariableValidator.validateShadow(shadow);
    console.log(`  ${shadow || '(empty)'}: ${result ? '❌ (should be false)' : '✅'}`);
  });

  // Test blur
  const validBlurs = ['blur(4px)', 'blur(0.5rem)'];
  const invalidBlurs = ['', 'blur()', 'not-blur(4px)'];

  console.log('\nBlur validation tests:');
  validBlurs.forEach(blur => {
    const result = CSSVariableValidator.validateBlur(blur);
    console.log(`  ${blur}: ${result ? '✅' : '❌'}`);
  });

  invalidBlurs.forEach(blur => {
    const result = CSSVariableValidator.validateBlur(blur);
    console.log(`  ${blur || '(empty)'}: ${result ? '❌ (should be false)' : '✅'}`);
  });

  // Test radius
  const validRadii = ['4px', '0.5rem', '50%', '9999px', 'full'];
  const invalidRadii = ['', 'invalid', '-5px'];

  console.log('\nRadius validation tests:');
  validRadii.forEach(radius => {
    const result = CSSVariableValidator.validateRadius(radius);
    console.log(`  ${radius}: ${result ? '✅' : '❌'}`);
  });

  invalidRadii.forEach(radius => {
    const result = CSSVariableValidator.validateRadius(radius);
    console.log(`  ${radius || '(empty)'}: ${result ? '❌ (should be false)' : '✅'}`);
  });

  console.log('\n✅ CSS Variable validation tests completed!');
}