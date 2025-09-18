// Theme system exports with performance optimizations
export * from './types';
export * from './engine';
export * from './extractor';
export * from './css-variables';
export * from './accessibility';
export * from './storage';
export * from './preview';
export * from './real-time-preview';
export * from './presets';

// Performance and optimization exports
export * from './performance-optimizer';
export * from './theme-cache';
export * from './error-recovery';
export * from './performance-dashboard';

// React components
export { default as PresetGallery } from './preset-gallery';
export { default as PresetSelector } from './preset-selector';
export { default as PresetCreator } from './preset-creator';

// React hooks
export * from './hooks/useRealTimePreview';
export * from './hooks/usePresets';

// Re-export main instances
export { themeEngine } from './engine';
export { themeExtractor } from './extractor';
export { cssVariableManager, initializeThemeVariables } from './css-variables';
export { accessibilityValidator } from './accessibility';
export { themeStorage } from './storage';
export { previewSystem } from './preview';
export { realTimePreviewManager } from './real-time-preview';
export { presetManager } from './presets';

// Performance and optimization instances
export { performanceOptimizer } from './performance-optimizer';
export { themeCache } from './theme-cache';
export { errorRecoverySystem } from './error-recovery';
export { performanceDashboard } from './performance-dashboard';