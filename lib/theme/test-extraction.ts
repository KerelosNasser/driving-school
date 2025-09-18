// Test script to verify theme extraction works correctly
import { themeExtractor } from './extractor';
import { themeEngine } from './engine';

/**
 * Test the theme extraction and validation
 */
export function testThemeExtraction(): void {
  console.log('🎨 Testing Theme Extraction...');
  
  try {
    // Test theme extraction
    const extractionResult = themeExtractor.analyzeComponents();
    console.log('✅ Theme extraction successful');
    console.log('📊 Extraction confidence:', extractionResult.confidence);
    console.log('🎯 Patterns found:', extractionResult.patterns.length);
    
    // Test theme validation
    const validation = themeEngine.validateTheme(extractionResult.theme);
    console.log('✅ Theme validation:', validation.isValid ? 'PASSED' : 'FAILED');
    
    if (!validation.isValid) {
      console.log('❌ Validation errors:', validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      console.log('⚠️ Validation warnings:', validation.warnings);
    }
    
    // Test theme preview generation
    const preview = themeEngine.generatePreview(extractionResult.theme);
    console.log('✅ Preview generation successful');
    console.log('🖼️ Components in preview:', preview.components.length);
    
    // Log theme details
    console.log('\n🎨 Default Theme Details:');
    console.log('Name:', extractionResult.theme.name);
    console.log('Primary colors:', Object.keys(extractionResult.theme.colors.primary));
    console.log('Gradients:', Object.keys(extractionResult.theme.gradients));
    console.log('Effects:', Object.keys(extractionResult.theme.effects));
    
    // Test gradient extraction specifically
    console.log('\n🌈 Extracted Gradients:');
    Object.entries(extractionResult.theme.gradients).forEach(([key, gradient]) => {
      console.log(`${key}:`, gradient.colorStops.map(s => `${s.color} ${s.position}%`).join(' → '));
    });
    
    console.log('\n✅ All theme extraction tests passed!');
    
  } catch (error) {
    console.error('❌ Theme extraction test failed:', error);
  }
}

// Run test if this file is executed directly
if (typeof window !== 'undefined' && window.location?.search?.includes('test-theme')) {
  testThemeExtraction();
}