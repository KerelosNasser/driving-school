// Theme system types and interfaces
export interface ColorStop {
  color: string;
  position: number;
}

export interface GradientConfig {
  name: string;
  direction: string;
  colorStops: ColorStop[];
  usage: 'hero' | 'card' | 'button' | 'background' | 'accent';
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  neutral: ColorScale;
  semantic: SemanticColors;
}

export interface GradientSet {
  hero: GradientConfig;
  card: GradientConfig;
  button: GradientConfig;
  background: GradientConfig;
  accent: GradientConfig;
}

export interface FontSizeScale {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
}

export interface FontWeightScale {
  thin: string;
  light: string;
  normal: string;
  medium: string;
  semibold: string;
  bold: string;
  extrabold: string;
  black: string;
}

export interface LineHeightScale {
  none: string;
  tight: string;
  snug: string;
  normal: string;
  relaxed: string;
  loose: string;
}

export interface TypographyConfig {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  fontSize: FontSizeScale;
  fontWeight: FontWeightScale;
  lineHeight: LineHeightScale;
}

export interface EffectConfig {
  backdropBlur: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  boxShadow: {
    card: string;
    button: string;
    modal: string;
    hero: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
}

export interface ThemeMetadata {
  name: string;
  description: string;
  author: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Theme {
  id: string;
  name: string;
  colors: ColorPalette;
  gradients: GradientSet;
  typography: TypographyConfig;
  effects: EffectConfig;
  metadata: ThemeMetadata;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface PreviewData {
  html: string;
  css: string;
  components: ComponentPreview[];
}

export interface ComponentPreview {
  component: 'hero' | 'card' | 'form' | 'button' | 'navigation';
  html: string;
  styles: string;
}

export interface ComparisonData {
  current: Theme;
  modified: Theme;
  differences: string[];
}

// Theme extractor interfaces
export interface ExtractedPattern {
  type: 'gradient' | 'color' | 'shadow' | 'blur' | 'radius';
  value: string;
  usage: string;
  frequency: number;
}

export interface ExtractionResult {
  patterns: ExtractedPattern[];
  theme: Theme;
  confidence: number;
}