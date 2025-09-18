'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Palette, 
  Type, 
  Layout, 
  Eye, 
  Save, 
  RotateCcw,
  Monitor,
  Smartphone,
  Tablet,
  Sun,
  Moon,
  Settings,
  Code,
  Brush,
  Sparkles,
  Layers,
  Plus,
  Minus,
  Copy,
  Star,
  Download,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { Theme, GradientConfig, ColorStop } from '@/lib/theme/types';
import { ColorPicker } from './ColorPicker';
import { PresetGallery } from '@/lib/theme/preset-gallery';
import { PresetCreator } from '@/lib/theme/preset-creator';
import { usePresets } from '@/lib/theme/hooks/usePresets';

interface ThemeCustomizerProps {
  initialConfig?: Theme | null;
  onPreview?: (config: Theme) => void;
  onSave?: (config: Theme) => void;
}

export function ThemeCustomizer({ initialConfig, onPreview, onSave }: ThemeCustomizerProps) {
  const [config, setConfig] = useState<Theme>(initialConfig || {
    id: 'default-theme',
    name: 'Default Professional Theme',
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
        900: '#064e3b'
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
        900: '#134e4a'
      },
      accent: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f'
      },
      neutral: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a'
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
          { color: '#134e4a', position: 50 },
          { color: '#1e3a8a', position: 100 }
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
          { color: '#10b981', position: 0 },
          { color: '#14b8a6', position: 100 }
        ],
        usage: 'button'
      },
      background: {
        name: 'Background Gradient',
        direction: '135deg',
        colorStops: [
          { color: '#f8fafc', position: 0 },
          { color: '#ecfdf5', position: 100 }
        ],
        usage: 'background'
      },
      accent: {
        name: 'Accent Gradient',
        direction: '135deg',
        colorStops: [
          { color: '#f59e0b', position: 0 },
          { color: '#d97706', position: 100 }
        ],
        usage: 'accent'
      }
    },
    typography: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Monaco', 'Consolas', 'monospace']
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
        card: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        button: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        hero: '0 20px 25px -5px rgba(16, 185, 129, 0.1)'
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1.5rem',
        full: '9999px'
      }
    },
    metadata: {
      name: 'Default Professional Theme',
      description: 'Professional emerald/teal theme extracted from current design',
      author: 'EG Driving School',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['professional', 'emerald', 'teal', 'default']
    }
  });
  
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeSection, setActiveSection] = useState('presets');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPresetCreator, setShowPresetCreator] = useState(false);
  
  // Use presets hook
  const {
    presets,
    categories,
    selectedPreset,
    isLoading: presetsLoading,
    applyPreset,
    createCustomPreset
  } = usePresets(config.id);

  // Update config when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      setHasUnsavedChanges(false);
    }
  }, [initialConfig]);

  // Available font options
  const fontOptions = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: '"Open Sans", sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Playfair Display', value: '"Playfair Display", serif' },
    { name: 'Merriweather', value: 'Merriweather, serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' }
  ];

  // Color presets based on current emerald/teal design
  const colorPresets = [
    {
      name: 'Current Professional (Emerald/Teal)',
      primary: '#10b981',
      secondary: '#14b8a6',
      accent: '#f59e0b'
    },
    {
      name: 'Professional Blue',
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#f59e0b'
    },
    {
      name: 'Modern Purple',
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      accent: '#06b6d4'
    },
    {
      name: 'Warm Orange',
      primary: '#f97316',
      secondary: '#ea580c',
      accent: '#8b5cf6'
    },
    {
      name: 'Corporate Navy',
      primary: '#1e40af',
      secondary: '#1e3a8a',
      accent: '#10b981'
    }
  ];

  // Update config and mark as unsaved
  const updateConfig = useCallback((updates: Partial<Theme>) => {
    setConfig(prev => {
      const newConfig = { 
        ...prev, 
        ...updates,
        metadata: {
          ...prev.metadata,
          updatedAt: new Date().toISOString()
        }
      };
      if (onPreview) {
        onPreview(newConfig);
      }
      return newConfig;
    });
    setHasUnsavedChanges(true);
  }, [onPreview]);

  // Update nested config
  const updateNestedConfig = useCallback((section: keyof Theme, updates: Record<string, any>) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        [section]: { ...(prev[section] as Record<string, any>), ...updates },
        metadata: {
          ...prev.metadata,
          updatedAt: new Date().toISOString()
        }
      };
      if (onPreview) {
        onPreview(newConfig);
      }
      return newConfig;
    });
    setHasUnsavedChanges(true);
  }, [onPreview]);

  // Apply color preset
  const applyColorPreset = useCallback((preset: typeof colorPresets[0]) => {
    // Generate color scales from the preset colors
    const generateColorScale = (baseColor: string) => ({
      50: lightenColor(baseColor, 0.95),
      100: lightenColor(baseColor, 0.9),
      200: lightenColor(baseColor, 0.8),
      300: lightenColor(baseColor, 0.6),
      400: lightenColor(baseColor, 0.3),
      500: baseColor,
      600: darkenColor(baseColor, 0.1),
      700: darkenColor(baseColor, 0.2),
      800: darkenColor(baseColor, 0.3),
      900: darkenColor(baseColor, 0.4)
    });

    const newColors = {
      ...config.colors,
      primary: generateColorScale(preset.primary),
      secondary: generateColorScale(preset.secondary),
      accent: generateColorScale(preset.accent)
    };

    // Update gradients to use new colors
    const newGradients = {
      ...config.gradients,
      hero: {
        ...config.gradients.hero,
        colorStops: [
          { color: newColors.primary[900], position: 0 },
          { color: newColors.secondary[800], position: 50 },
          { color: newColors.primary[800], position: 100 }
        ]
      },
      card: {
        ...config.gradients.card,
        colorStops: [
          { color: newColors.primary[500], position: 0 },
          { color: newColors.secondary[600], position: 100 }
        ]
      },
      button: {
        ...config.gradients.button,
        colorStops: [
          { color: newColors.primary[500], position: 0 },
          { color: newColors.secondary[600], position: 100 }
        ]
      }
    };

    updateConfig({ colors: newColors, gradients: newGradients });
    toast.success(`Applied ${preset.name} color scheme`);
  }, [updateConfig, config.colors, config.gradients]);

  // Gradient editing functions
  const updateGradient = useCallback((gradientKey: keyof typeof config.gradients, updates: Partial<GradientConfig>) => {
    const newGradients = {
      ...config.gradients,
      [gradientKey]: {
        ...config.gradients[gradientKey],
        ...updates
      }
    };
    updateConfig({ gradients: newGradients });
  }, [config.gradients, updateConfig]);

  const addColorStop = useCallback((gradientKey: keyof typeof config.gradients) => {
    const gradient = config.gradients[gradientKey];
    const newStop: ColorStop = {
      color: '#10b981',
      position: 50
    };
    const newColorStops = [...gradient.colorStops, newStop].sort((a, b) => a.position - b.position);
    updateGradient(gradientKey, { colorStops: newColorStops });
  }, [config.gradients, updateGradient]);

  const removeColorStop = useCallback((gradientKey: keyof typeof config.gradients, index: number) => {
    const gradient = config.gradients[gradientKey];
    if (gradient.colorStops.length <= 2) {
      toast.error('Gradient must have at least 2 color stops');
      return;
    }
    const newColorStops = gradient.colorStops.filter((_, i) => i !== index);
    updateGradient(gradientKey, { colorStops: newColorStops });
  }, [config.gradients, updateGradient]);

  const updateColorStop = useCallback((gradientKey: keyof typeof config.gradients, index: number, updates: Partial<ColorStop>) => {
    const gradient = config.gradients[gradientKey];
    const newColorStops = gradient.colorStops.map((stop, i) => 
      i === index ? { ...stop, ...updates } : stop
    ).sort((a, b) => a.position - b.position);
    updateGradient(gradientKey, { colorStops: newColorStops });
  }, [config.gradients, updateGradient]);

  // Color utility functions
  const lightenColor = (color: string, amount: number): string => {
    // Simple color lightening - in production, use a proper color library
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * amount));
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * amount));
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const darkenColor = (color: string, amount: number): string => {
    // Simple color darkening - in production, use a proper color library
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * amount));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * amount));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Save theme
  const saveTheme = useCallback(async () => {
    try {
      if (onSave) {
        await onSave(config);
      }
      setHasUnsavedChanges(false);
      toast.success('Theme saved successfully');
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('Failed to save theme');
    }
  }, [config, onSave]);

  // Reset to defaults - using current professional emerald/teal design
  const resetToDefaults = useCallback(() => {
    const defaultTheme: Theme = {
      id: 'default-theme',
      name: 'Default Professional Theme',
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
          900: '#064e3b'
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
          900: '#134e4a'
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        },
        semantic: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6'
        }
      },
      gradients: config.gradients,
      typography: config.typography,
      effects: config.effects,
      metadata: {
        ...config.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    
    setConfig(defaultTheme);
    setHasUnsavedChanges(true);
    toast.success('Reset to default professional theme');
  }, [config.gradients, config.typography, config.effects, config.metadata]);

  // Generate CSS variables
  const generateCSSVariables = useCallback(() => {
    const generateGradientCSS = (gradient: GradientConfig) => {
      const stops = gradient.colorStops
        .map(stop => `${stop.color} ${stop.position}%`)
        .join(', ');
      return `linear-gradient(${gradient.direction}, ${stops})`;
    };

    return `
:root {
  /* Primary Colors */
  --theme-primary-50: ${config.colors.primary[50]};
  --theme-primary-100: ${config.colors.primary[100]};
  --theme-primary-200: ${config.colors.primary[200]};
  --theme-primary-300: ${config.colors.primary[300]};
  --theme-primary-400: ${config.colors.primary[400]};
  --theme-primary-500: ${config.colors.primary[500]};
  --theme-primary-600: ${config.colors.primary[600]};
  --theme-primary-700: ${config.colors.primary[700]};
  --theme-primary-800: ${config.colors.primary[800]};
  --theme-primary-900: ${config.colors.primary[900]};
  
  /* Secondary Colors */
  --theme-secondary-50: ${config.colors.secondary[50]};
  --theme-secondary-100: ${config.colors.secondary[100]};
  --theme-secondary-200: ${config.colors.secondary[200]};
  --theme-secondary-300: ${config.colors.secondary[300]};
  --theme-secondary-400: ${config.colors.secondary[400]};
  --theme-secondary-500: ${config.colors.secondary[500]};
  --theme-secondary-600: ${config.colors.secondary[600]};
  --theme-secondary-700: ${config.colors.secondary[700]};
  --theme-secondary-800: ${config.colors.secondary[800]};
  --theme-secondary-900: ${config.colors.secondary[900]};
  
  /* Accent Colors */
  --theme-accent-50: ${config.colors.accent[50]};
  --theme-accent-100: ${config.colors.accent[100]};
  --theme-accent-200: ${config.colors.accent[200]};
  --theme-accent-300: ${config.colors.accent[300]};
  --theme-accent-400: ${config.colors.accent[400]};
  --theme-accent-500: ${config.colors.accent[500]};
  --theme-accent-600: ${config.colors.accent[600]};
  --theme-accent-700: ${config.colors.accent[700]};
  --theme-accent-800: ${config.colors.accent[800]};
  --theme-accent-900: ${config.colors.accent[900]};
  
  /* Neutral Colors */
  --theme-neutral-50: ${config.colors.neutral[50]};
  --theme-neutral-100: ${config.colors.neutral[100]};
  --theme-neutral-200: ${config.colors.neutral[200]};
  --theme-neutral-300: ${config.colors.neutral[300]};
  --theme-neutral-400: ${config.colors.neutral[400]};
  --theme-neutral-500: ${config.colors.neutral[500]};
  --theme-neutral-600: ${config.colors.neutral[600]};
  --theme-neutral-700: ${config.colors.neutral[700]};
  --theme-neutral-800: ${config.colors.neutral[800]};
  --theme-neutral-900: ${config.colors.neutral[900]};
  
  /* Semantic Colors */
  --theme-success: ${config.colors.semantic.success};
  --theme-warning: ${config.colors.semantic.warning};
  --theme-error: ${config.colors.semantic.error};
  --theme-info: ${config.colors.semantic.info};
  
  /* Gradients */
  --theme-gradient-hero: ${generateGradientCSS(config.gradients.hero)};
  --theme-gradient-card: ${generateGradientCSS(config.gradients.card)};
  --theme-gradient-button: ${generateGradientCSS(config.gradients.button)};
  --theme-gradient-background: ${generateGradientCSS(config.gradients.background)};
  --theme-gradient-accent: ${generateGradientCSS(config.gradients.accent)};
  
  /* Typography */
  --theme-font-sans: ${config.typography.fontFamily.sans.join(', ')};
  --theme-font-serif: ${config.typography.fontFamily.serif.join(', ')};
  --theme-font-mono: ${config.typography.fontFamily.mono.join(', ')};
  
  /* Effects */
  --theme-backdrop-blur-sm: ${config.effects.backdropBlur.sm};
  --theme-backdrop-blur-md: ${config.effects.backdropBlur.md};
  --theme-backdrop-blur-lg: ${config.effects.backdropBlur.lg};
  --theme-backdrop-blur-xl: ${config.effects.backdropBlur.xl};
  
  --theme-shadow-card: ${config.effects.boxShadow.card};
  --theme-shadow-button: ${config.effects.boxShadow.button};
  --theme-shadow-modal: ${config.effects.boxShadow.modal};
  --theme-shadow-hero: ${config.effects.boxShadow.hero};
  
  --theme-radius-sm: ${config.effects.borderRadius.sm};
  --theme-radius-md: ${config.effects.borderRadius.md};
  --theme-radius-lg: ${config.effects.borderRadius.lg};
  --theme-radius-xl: ${config.effects.borderRadius.xl};
  --theme-radius-full: ${config.effects.borderRadius.full};
}
    `.trim();
  }, [config]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brush className="h-5 w-5" />
                <span>Theme Customizer</span>
              </CardTitle>
              <CardDescription>
                Customize your website's appearance with live preview
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Preview mode toggles */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                  className="px-2"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('tablet')}
                  className="px-2"
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                  className="px-2"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
              
              <Button variant="outline" onClick={resetToDefaults}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              
              <Button 
                onClick={saveTheme}
                disabled={!hasUnsavedChanges}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Theme</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customization Panel */}
            <div className="lg:col-span-1 space-y-6">
              <Tabs value={activeSection} onValueChange={setActiveSection}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="presets" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Presets
                  </TabsTrigger>
                  <TabsTrigger value="colors" className="text-xs">
                    <Palette className="h-3 w-3 mr-1" />
                    Colors
                  </TabsTrigger>
                  <TabsTrigger value="gradients" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Gradients
                  </TabsTrigger>
                  <TabsTrigger value="typography" className="text-xs">
                    <Type className="h-3 w-3 mr-1" />
                    Typography
                  </TabsTrigger>
                  <TabsTrigger value="effects" className="text-xs">
                    <Layers className="h-3 w-3 mr-1" />
                    Effects
                  </TabsTrigger>
                </TabsList>
                
                {/* Presets Tab */}
                <TabsContent value="presets" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Theme Presets</h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPresetCreator(true)}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create
                        </Button>
                      </div>
                    </div>
                    
                    {presetsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                        <span className="ml-2 text-sm text-gray-600">Loading presets...</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {categories.map((category) => (
                          <div key={category.id} className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">{category.name}</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {category.presets.map((preset) => (
                                <Button
                                  key={preset.id}
                                  variant={selectedPreset?.id === preset.id ? "default" : "outline"}
                                  onClick={async () => {
                                    try {
                                      await applyPreset(preset);
                                      setConfig(preset.theme);
                                      setHasUnsavedChanges(true);
                                      toast.success(`Applied ${preset.name} preset`);
                                    } catch (error) {
                                      toast.error('Failed to apply preset');
                                    }
                                  }}
                                  className="h-auto p-3 flex items-center justify-between"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div 
                                      className="w-6 h-6 rounded border"
                                      style={{ background: preset.thumbnail }}
                                    />
                                    <div className="text-left">
                                      <div className="text-sm font-medium">{preset.name}</div>
                                      <div className="text-xs text-gray-500">{preset.description}</div>
                                    </div>
                                  </div>
                                  {selectedPreset?.id === preset.id && (
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                  )}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {/* Colors Tab */}
                <TabsContent value="colors" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Color Presets</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {colorPresets.map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          onClick={() => applyColorPreset(preset)}
                          className="h-auto p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex space-x-1">
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-200"
                                style={{ backgroundColor: preset.primary }}
                              />
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-200"
                                style={{ backgroundColor: preset.secondary }}
                              />
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-200"
                                style={{ backgroundColor: preset.accent }}
                              />
                            </div>
                            <span className="text-sm font-medium">{preset.name}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Color Scales</h3>
                    
                    {/* Primary Colors */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Primary Colors</Label>
                      <div className="grid grid-cols-5 gap-1">
                        {Object.entries(config.colors.primary).map(([shade, color]) => (
                          <div key={shade} className="space-y-1">
                            <Label className="text-xs text-gray-500">{shade}</Label>
                            <div className="flex flex-col space-y-1">
                              <Input
                                type="color"
                                value={color}
                                onChange={(e) => updateNestedConfig('colors', {
                                  primary: { ...config.colors.primary, [shade]: e.target.value }
                                })}
                                className="w-full h-8 p-1 rounded"
                              />
                              <Input
                                type="text"
                                value={color}
                                onChange={(e) => updateNestedConfig('colors', {
                                  primary: { ...config.colors.primary, [shade]: e.target.value }
                                })}
                                className="w-full text-xs font-mono"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Secondary Colors */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Secondary Colors</Label>
                      <div className="grid grid-cols-5 gap-1">
                        {Object.entries(config.colors.secondary).map(([shade, color]) => (
                          <div key={shade} className="space-y-1">
                            <Label className="text-xs text-gray-500">{shade}</Label>
                            <div className="flex flex-col space-y-1">
                              <Input
                                type="color"
                                value={color}
                                onChange={(e) => updateNestedConfig('colors', {
                                  secondary: { ...config.colors.secondary, [shade]: e.target.value }
                                })}
                                className="w-full h-8 p-1 rounded"
                              />
                              <Input
                                type="text"
                                value={color}
                                onChange={(e) => updateNestedConfig('colors', {
                                  secondary: { ...config.colors.secondary, [shade]: e.target.value }
                                })}
                                className="w-full text-xs font-mono"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Semantic Colors */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Semantic Colors</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(config.colors.semantic).map(([key, color]) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs capitalize">{key}</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={color}
                                onChange={(e) => updateNestedConfig('colors', {
                                  semantic: { ...config.colors.semantic, [key]: e.target.value }
                                })}
                                className="w-10 h-8 p-1 rounded"
                              />
                              <Input
                                type="text"
                                value={color}
                                onChange={(e) => updateNestedConfig('colors', {
                                  semantic: { ...config.colors.semantic, [key]: e.target.value }
                                })}
                                className="flex-1 text-xs font-mono"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Gradients Tab */}
                <TabsContent value="gradients" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Gradient Editor</h3>
                    
                    {Object.entries(config.gradients).map(([key, gradient]) => (
                      <div key={key} className="space-y-3 p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium capitalize">{key} Gradient</Label>
                          <Badge variant="outline" className="text-xs">
                            {gradient.usage}
                          </Badge>
                        </div>
                        
                        {/* Gradient Preview */}
                        <div 
                          className="w-full h-12 rounded-lg border border-gray-200"
                          style={{
                            background: `linear-gradient(${gradient.direction}, ${gradient.colorStops
                              .map(stop => `${stop.color} ${stop.position}%`)
                              .join(', ')})`
                          }}
                        />
                        
                        {/* Direction Control */}
                        <div className="space-y-2">
                          <Label className="text-xs">Direction</Label>
                          <Select
                            value={gradient.direction}
                            onValueChange={(value) => updateGradient(key as keyof typeof config.gradients, { direction: value })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0deg">0° (Top to Bottom)</SelectItem>
                              <SelectItem value="45deg">45° (Diagonal)</SelectItem>
                              <SelectItem value="90deg">90° (Left to Right)</SelectItem>
                              <SelectItem value="135deg">135° (Diagonal)</SelectItem>
                              <SelectItem value="180deg">180° (Bottom to Top)</SelectItem>
                              <SelectItem value="225deg">225° (Diagonal)</SelectItem>
                              <SelectItem value="270deg">270° (Right to Left)</SelectItem>
                              <SelectItem value="315deg">315° (Diagonal)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Color Stops */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Color Stops</Label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addColorStop(key as keyof typeof config.gradients)}
                              className="h-6 px-2"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {gradient.colorStops.map((stop, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <ColorPicker
                                  color={stop.color}
                                  onChange={(color) => updateColorStop(
                                    key as keyof typeof config.gradients, 
                                    index, 
                                    { color }
                                  )}
                                  className="flex-1"
                                />
                                <Input
                                  type="number"
                                  value={stop.position}
                                  onChange={(e) => updateColorStop(
                                    key as keyof typeof config.gradients, 
                                    index, 
                                    { position: parseInt(e.target.value) || 0 }
                                  )}
                                  className="w-16 text-xs"
                                  min="0"
                                  max="100"
                                />
                                <span className="text-xs text-gray-500">%</span>
                                {gradient.colorStops.length > 2 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeColorStop(key as keyof typeof config.gradients, index)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Typography Tab */}
                <TabsContent value="typography" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Font Families</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Sans Serif Font</Label>
                        <Select
                          value={config.typography.fontFamily.sans[0]}
                          onValueChange={(value) => updateNestedConfig('typography', {
                            fontFamily: {
                              ...config.typography.fontFamily,
                              sans: [value, ...config.typography.fontFamily.sans.slice(1)]
                            }
                          })}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map((font) => (
                              <SelectItem key={font.value} value={font.name}>
                                <span style={{ fontFamily: font.value }}>{font.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Serif Font</Label>
                        <Select
                          value={config.typography.fontFamily.serif[0]}
                          onValueChange={(value) => updateNestedConfig('typography', {
                            fontFamily: {
                              ...config.typography.fontFamily,
                              serif: [value, 'serif']
                            }
                          })}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Georgia">
                              <span style={{ fontFamily: 'Georgia, serif' }}>Georgia</span>
                            </SelectItem>
                            <SelectItem value="Times New Roman">
                              <span style={{ fontFamily: 'Times New Roman, serif' }}>Times New Roman</span>
                            </SelectItem>
                            <SelectItem value="Playfair Display">
                              <span style={{ fontFamily: 'Playfair Display, serif' }}>Playfair Display</span>
                            </SelectItem>
                            <SelectItem value="Merriweather">
                              <span style={{ fontFamily: 'Merriweather, serif' }}>Merriweather</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Font Sizes</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(config.typography.fontSize).map(([size, value]) => (
                        <div key={size} className="space-y-1">
                          <Label className="text-xs capitalize">{size}</Label>
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) => updateNestedConfig('typography', {
                              fontSize: { ...config.typography.fontSize, [size]: e.target.value }
                            })}
                            className="text-xs font-mono"
                            placeholder="1rem"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Line Heights</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(config.typography.lineHeight).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-xs capitalize">{key}</Label>
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) => updateNestedConfig('typography', {
                              lineHeight: { ...config.typography.lineHeight, [key]: e.target.value }
                            })}
                            className="text-xs font-mono"
                            placeholder="1.5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Typography Preview</h3>
                    <div 
                      className="p-4 border border-gray-200 rounded-lg space-y-2"
                      style={{ fontFamily: config.typography.fontFamily.sans.join(', ') }}
                    >
                      <h1 className="text-2xl font-bold" style={{ fontSize: config.typography.fontSize['2xl'], lineHeight: config.typography.lineHeight.tight }}>
                        Heading 1 - EG Driving School
                      </h1>
                      <h2 className="text-xl font-semibold" style={{ fontSize: config.typography.fontSize.xl, lineHeight: config.typography.lineHeight.snug }}>
                        Heading 2 - Professional Lessons
                      </h2>
                      <p className="text-base" style={{ fontSize: config.typography.fontSize.base, lineHeight: config.typography.lineHeight.normal }}>
                        Body text - Learn to drive with confidence. Our experienced instructors provide comprehensive driving lessons tailored to your needs.
                      </p>
                      <p className="text-sm text-gray-600" style={{ fontSize: config.typography.fontSize.sm, lineHeight: config.typography.lineHeight.relaxed }}>
                        Small text - Additional information and details about our services.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Effects Tab */}
                <TabsContent value="effects" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Backdrop Blur Effects</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(config.effects.backdropBlur).map(([size, value]) => (
                        <div key={size} className="space-y-2">
                          <Label className="text-xs capitalize">{size} Blur</Label>
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) => updateNestedConfig('effects', {
                              backdropBlur: { ...config.effects.backdropBlur, [size]: e.target.value }
                            })}
                            className="text-xs font-mono"
                            placeholder="blur(12px)"
                          />
                          <div 
                            className="w-full h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded relative overflow-hidden"
                          >
                            <div 
                              className="absolute inset-0 bg-white/20"
                              style={{ backdropFilter: value }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Box Shadows</h3>
                    <div className="space-y-3">
                      {Object.entries(config.effects.boxShadow).map(([type, value]) => (
                        <div key={type} className="space-y-2">
                          <Label className="text-xs capitalize">{type} Shadow</Label>
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) => updateNestedConfig('effects', {
                              boxShadow: { ...config.effects.boxShadow, [type]: e.target.value }
                            })}
                            className="text-xs font-mono"
                            placeholder="0 4px 6px rgba(0,0,0,0.1)"
                          />
                          <div 
                            className="w-full h-12 bg-white border border-gray-200 rounded-lg"
                            style={{ boxShadow: value }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Border Radius</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(config.effects.borderRadius).map(([size, value]) => (
                        <div key={size} className="space-y-2">
                          <Label className="text-xs capitalize">{size} Radius</Label>
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) => updateNestedConfig('effects', {
                              borderRadius: { ...config.effects.borderRadius, [size]: e.target.value }
                            })}
                            className="text-xs font-mono"
                            placeholder="0.5rem"
                          />
                          <div 
                            className="w-full h-8 bg-gradient-to-r from-emerald-500 to-teal-600"
                            style={{ borderRadius: value }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Effects Preview</h3>
                    <div className="space-y-3">
                      {/* Card with backdrop blur */}
                      <div 
                        className="relative p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg overflow-hidden"
                        style={{ borderRadius: config.effects.borderRadius.lg }}
                      >
                        <div 
                          className="absolute inset-0 bg-white/20"
                          style={{ backdropFilter: config.effects.backdropBlur.md }}
                        />
                        <div className="relative">
                          <h4 className="text-white font-semibold">Card with Backdrop Blur</h4>
                          <p className="text-white/90 text-sm">Professional design with modern effects</p>
                        </div>
                      </div>
                      
                      {/* Button with shadow */}
                      <button 
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium"
                        style={{ 
                          borderRadius: config.effects.borderRadius.md,
                          boxShadow: config.effects.boxShadow.button
                        }}
                      >
                        Button with Shadow
                      </button>
                      
                      {/* Hero card */}
                      <div 
                        className="p-6 bg-white"
                        style={{ 
                          borderRadius: config.effects.borderRadius.xl,
                          boxShadow: config.effects.boxShadow.hero
                        }}
                      >
                        <h4 className="font-semibold text-gray-800">Hero Card</h4>
                        <p className="text-gray-600 text-sm">With professional shadow effects</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                

              </Tabs>
            </div>
            
            {/* Live Preview */}
            <div className="lg:col-span-2">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-3 border-b">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Live Preview</span>
                    <Badge variant="outline" className="text-xs">
                      {previewMode}
                    </Badge>
                  </div>
                </div>
                
                <div 
                  className={`bg-white transition-all duration-300 ${
                    previewMode === 'mobile' ? 'max-w-sm mx-auto' :
                    previewMode === 'tablet' ? 'max-w-2xl mx-auto' : 'w-full'
                  }`}
                  style={{
                    fontFamily: config.typography.fontFamily.sans.join(', '),
                    lineHeight: config.typography.lineHeight.normal
                  }}
                >
                  {/* Inject theme CSS variables */}
                  <style>
                    {generateCSSVariables()}
                  </style>
                  
                  {/* Preview content with applied theme */}
                  <div className="p-6 min-h-96 bg-gradient-to-br from-gray-50 to-emerald-50">
                    {/* Hero Section */}
                    <div 
                      className="p-6 rounded-xl mb-6 text-white relative overflow-hidden"
                      style={{ 
                        background: `linear-gradient(${config.gradients.hero.direction}, ${config.gradients.hero.colorStops
                          .map(stop => `${stop.color} ${stop.position}%`)
                          .join(', ')})`,
                        borderRadius: config.effects.borderRadius.xl,
                        boxShadow: config.effects.boxShadow.hero
                      }}
                    >
                      <div 
                        className="absolute inset-0 bg-white/10"
                        style={{ backdropFilter: config.effects.backdropBlur.sm }}
                      />
                      <div className="relative">
                        <h1 
                          className="text-3xl font-bold mb-2"
                          style={{ 
                            fontFamily: config.typography.fontFamily.sans.join(', '),
                            fontSize: config.typography.fontSize['3xl'],
                            lineHeight: config.typography.lineHeight.tight
                          }}
                        >
                          EG Driving School
                        </h1>
                        <p style={{ fontSize: config.typography.fontSize.lg }}>
                          Professional driving lessons in Brisbane
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Service Card */}
                      <div 
                        className="p-4 bg-white/80 backdrop-blur-sm relative overflow-hidden"
                        style={{ 
                          borderRadius: config.effects.borderRadius.lg,
                          boxShadow: config.effects.boxShadow.card,
                          backdropFilter: config.effects.backdropBlur.md
                        }}
                      >
                        <h2 
                          className="text-xl font-semibold mb-2"
                          style={{ 
                            fontFamily: config.typography.fontFamily.sans.join(', '),
                            fontSize: config.typography.fontSize.xl,
                            color: config.colors.primary[700]
                          }}
                        >
                          Our Services
                        </h2>
                        <p 
                          className="text-gray-600"
                          style={{ 
                            fontSize: config.typography.fontSize.base,
                            lineHeight: config.typography.lineHeight.relaxed
                          }}
                        >
                          We offer comprehensive driving lessons for all skill levels with modern teaching methods.
                        </p>
                      </div>
                      
                      {/* Buttons */}
                      <div className="flex space-x-3">
                        <button
                          className="px-6 py-3 text-white font-medium transition-all hover:scale-105"
                          style={{ 
                            background: `linear-gradient(${config.gradients.button.direction}, ${config.gradients.button.colorStops
                              .map(stop => `${stop.color} ${stop.position}%`)
                              .join(', ')})`,
                            borderRadius: config.effects.borderRadius.md,
                            boxShadow: config.effects.boxShadow.button,
                            fontSize: config.typography.fontSize.base
                          }}
                        >
                          Book Now
                        </button>
                        <button
                          className="px-6 py-3 font-medium border-2 transition-all hover:scale-105"
                          style={{ 
                            borderColor: config.colors.primary[500],
                            color: config.colors.primary[700],
                            borderRadius: config.effects.borderRadius.md,
                            fontSize: config.typography.fontSize.base
                          }}
                        >
                          Learn More
                        </button>
                      </div>
                      
                      {/* Stats Cards */}
                      <div className="grid grid-cols-3 gap-3 mt-6">
                        {[
                          { label: 'Students', value: '500+' },
                          { label: 'Pass Rate', value: '95%' },
                          { label: 'Experience', value: '10+ Years' }
                        ].map((stat, index) => (
                          <div 
                            key={index}
                            className="p-3 text-center bg-white/60 backdrop-blur-sm"
                            style={{ 
                              borderRadius: config.effects.borderRadius.lg,
                              backdropFilter: config.effects.backdropBlur.sm
                            }}
                          >
                            <div 
                              className="text-lg font-bold"
                              style={{ 
                                color: config.colors.primary[600],
                                fontSize: config.typography.fontSize.lg
                              }}
                            >
                              {stat.value}
                            </div>
                            <div 
                              className="text-sm text-gray-600"
                              style={{ fontSize: config.typography.fontSize.sm }}
                            >
                              {stat.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CSS Export Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-800">Generated CSS Variables</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generateCSSVariables());
                  toast.success('CSS variables copied to clipboard');
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy CSS
              </Button>
            </div>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-40 font-mono">
              {generateCSSVariables()}
            </pre>
          </div>
        </CardContent>
      </Card>
      
      {/* Preset Creator Modal */}
      <PresetCreator
        theme={config}
        isOpen={showPresetCreator}
        onClose={() => setShowPresetCreator(false)}
        onPresetCreated={(preset) => {
          toast.success(`Created preset: ${preset.name}`);
          setShowPresetCreator(false);
        }}
      />
    </div>
  );
}