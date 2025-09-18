'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Palette, 
  Wand2, 
  Eye, 
  Save, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Type,
  Layers,
  Settings,
  Lightbulb,
  Target,
  Brush
} from 'lucide-react';
import { toast } from 'sonner';
import { Theme, ColorScale, GradientConfig, ColorStop } from '@/lib/theme/types';
import { themeEngine } from '@/lib/theme/engine';
import { ColorPicker } from './ColorPicker';
import ThemePreview from './ThemePreview';

interface CustomThemeCreatorProps {
  onThemeCreated?: (theme: Theme) => void;
  onCancel?: () => void;
  baseTheme?: Theme;
}

interface CreationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  category: string;
  tags: string[];
}

export function CustomThemeCreator({
  onThemeCreated,
  onCancel,
  baseTheme
}: CustomThemeCreatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(false);

  // Form data
  const [themeInfo, setThemeInfo] = useState({
    name: '',
    description: '',
    author: '',
    tags: '',
    category: 'custom'
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customColors, setCustomColors] = useState({
    primary: '#10b981',
    secondary: '#14b8a6',
    accent: '#f59e0b'
  });

  // Creation steps
  const steps: CreationStep[] = [
    {
      id: 'info',
      title: 'Theme Information',
      description: 'Basic information about your theme',
      icon: <Settings className="h-5 w-5" />,
      completed: false
    },
    {
      id: 'template',
      title: 'Choose Template',
      description: 'Select a starting point for your theme',
      icon: <Target className="h-5 w-5" />,
      completed: false
    },
    {
      id: 'colors',
      title: 'Customize Colors',
      description: 'Define your color palette',
      icon: <Palette className="h-5 w-5" />,
      completed: false
    },
    {
      id: 'preview',
      title: 'Preview & Save',
      description: 'Review and save your theme',
      icon: <Eye className="h-5 w-5" />,
      completed: false
    }
  ];

  // Theme templates
  const templates: ThemeTemplate[] = [
    {
      id: 'professional',
      name: 'Professional Emerald',
      description: 'Clean and professional with emerald/teal colors',
      colors: { primary: '#10b981', secondary: '#14b8a6', accent: '#f59e0b' },
      category: 'business',
      tags: ['professional', 'emerald', 'clean']
    },
    {
      id: 'modern-blue',
      name: 'Modern Blue',
      description: 'Contemporary blue theme for tech-focused brands',
      colors: { primary: '#3b82f6', secondary: '#1e40af', accent: '#f59e0b' },
      category: 'modern',
      tags: ['modern', 'blue', 'tech']
    },
    {
      id: 'warm-orange',
      name: 'Warm Orange',
      description: 'Friendly and approachable orange theme',
      colors: { primary: '#f97316', secondary: '#ea580c', accent: '#8b5cf6' },
      category: 'friendly',
      tags: ['warm', 'orange', 'friendly']
    },
    {
      id: 'elegant-purple',
      name: 'Elegant Purple',
      description: 'Sophisticated purple theme for premium brands',
      colors: { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#06b6d4' },
      category: 'premium',
      tags: ['elegant', 'purple', 'premium']
    },
    {
      id: 'nature-green',
      name: 'Nature Green',
      description: 'Fresh green theme inspired by nature',
      colors: { primary: '#22c55e', secondary: '#16a34a', accent: '#eab308' },
      category: 'nature',
      tags: ['nature', 'green', 'fresh']
    },
    {
      id: 'corporate-navy',
      name: 'Corporate Navy',
      description: 'Traditional navy theme for corporate environments',
      colors: { primary: '#1e40af', secondary: '#1e3a8a', accent: '#10b981' },
      category: 'corporate',
      tags: ['corporate', 'navy', 'traditional']
    }
  ];

  // Initialize with base theme or default
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const initialTheme = baseTheme || themeEngine.getDefaultTheme();
        setTheme(initialTheme);
        
        // Set initial colors from theme
        setCustomColors({
          primary: initialTheme.colors.primary[500],
          secondary: initialTheme.colors.secondary[500],
          accent: initialTheme.colors.accent[500]
        });
      } catch (error) {
        console.error('Failed to initialize theme:', error);
        toast.error('Failed to initialize theme creator');
      }
    };

    initializeTheme();
  }, [baseTheme]);

  // Generate color scale from base color
  const generateColorScale = useCallback((baseColor: string): ColorScale => {
    // Simple color scale generation (in production, use a proper color library)
    const lightenColor = (color: string, amount: number): string => {
      const hex = color.replace('#', '');
      const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * amount));
      const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * amount));
      const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * amount));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    const darkenColor = (color: string, amount: number): string => {
      const hex = color.replace('#', '');
      const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * amount));
      const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * amount));
      const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * amount));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    return {
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
    };
  }, []);

  // Apply template
  const applyTemplate = useCallback((template: ThemeTemplate) => {
    if (!theme) return;

    const updatedColors = {
      primary: template.colors.primary,
      secondary: template.colors.secondary,
      accent: template.colors.accent
    };

    setCustomColors(updatedColors);
    setSelectedTemplate(template.id);

    // Update theme with template colors
    const newTheme: Theme = {
      ...theme,
      colors: {
        ...theme.colors,
        primary: generateColorScale(template.colors.primary),
        secondary: generateColorScale(template.colors.secondary),
        accent: generateColorScale(template.colors.accent)
      },
      gradients: {
        ...theme.gradients,
        hero: {
          ...theme.gradients.hero,
          colorStops: [
            { color: generateColorScale(template.colors.primary)[900], position: 0 },
            { color: generateColorScale(template.colors.secondary)[800], position: 50 },
            { color: generateColorScale(template.colors.primary)[800], position: 100 }
          ]
        },
        card: {
          ...theme.gradients.card,
          colorStops: [
            { color: template.colors.primary, position: 0 },
            { color: template.colors.secondary, position: 100 }
          ]
        },
        button: {
          ...theme.gradients.button,
          colorStops: [
            { color: template.colors.primary, position: 0 },
            { color: template.colors.secondary, position: 100 }
          ]
        }
      }
    };

    setTheme(newTheme);
  }, [theme, generateColorScale]);

  // Update custom colors
  const updateCustomColors = useCallback((colorKey: keyof typeof customColors, color: string) => {
    if (!theme) return;

    const newCustomColors = { ...customColors, [colorKey]: color };
    setCustomColors(newCustomColors);

    // Update theme
    const newTheme: Theme = {
      ...theme,
      colors: {
        ...theme.colors,
        [colorKey]: generateColorScale(color)
      }
    };

    // Update gradients to use new colors
    if (colorKey === 'primary' || colorKey === 'secondary') {
      newTheme.gradients = {
        ...newTheme.gradients,
        hero: {
          ...newTheme.gradients.hero,
          colorStops: [
            { color: generateColorScale(newCustomColors.primary)[900], position: 0 },
            { color: generateColorScale(newCustomColors.secondary)[800], position: 50 },
            { color: generateColorScale(newCustomColors.primary)[800], position: 100 }
          ]
        },
        card: {
          ...newTheme.gradients.card,
          colorStops: [
            { color: newCustomColors.primary, position: 0 },
            { color: newCustomColors.secondary, position: 100 }
          ]
        },
        button: {
          ...newTheme.gradients.button,
          colorStops: [
            { color: newCustomColors.primary, position: 0 },
            { color: newCustomColors.secondary, position: 100 }
          ]
        }
      };
    }

    setTheme(newTheme);
  }, [theme, customColors, generateColorScale]);

  // Navigate steps
  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Save theme
  const saveTheme = useCallback(async () => {
    if (!theme || !themeInfo.name.trim()) {
      toast.error('Theme name is required');
      return;
    }

    try {
      setLoading(true);

      const finalTheme: Theme = {
        ...theme,
        id: `custom-${Date.now()}`,
        name: themeInfo.name.trim(),
        metadata: {
          name: themeInfo.name.trim(),
          description: themeInfo.description.trim() || 'Custom theme created with Theme Creator',
          author: themeInfo.author.trim() || 'Theme Creator',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [
            ...themeInfo.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            'custom',
            'created',
            themeInfo.category
          ]
        }
      };

      await themeEngine.saveTheme(finalTheme);
      
      toast.success(`Theme "${finalTheme.name}" created successfully!`);
      
      if (onThemeCreated) {
        onThemeCreated(finalTheme);
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
      toast.error('Failed to save theme');
    } finally {
      setLoading(false);
    }
  }, [theme, themeInfo, onThemeCreated]);

  // Validate current step
  const isStepValid = useCallback((stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Info step
        return themeInfo.name.trim().length > 0;
      case 1: // Template step
        return selectedTemplate.length > 0 || Object.values(customColors).every(color => color.length > 0);
      case 2: // Colors step
        return Object.values(customColors).every(color => /^#[0-9A-F]{6}$/i.test(color));
      case 3: // Preview step
        return theme !== null;
      default:
        return false;
    }
  }, [themeInfo, selectedTemplate, customColors, theme]);

  if (!theme) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-600">Initializing theme creator...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Wand2 className="h-5 w-5" />
                <span>Custom Theme Creator</span>
              </CardTitle>
              <CardDescription>
                Create a custom theme with guided steps
              </CardDescription>
            </div>
            
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index === currentStep 
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : index < currentStep || isStepValid(index)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                        : 'border-gray-300 bg-gray-50 text-gray-400'
                  }`}>
                    {index < currentStep || (index === currentStep && isStepValid(index)) ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      index < currentStep ? 'bg-emerald-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
              <p className="text-gray-600">{steps[currentStep].description}</p>
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Theme Information */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme-name">Theme Name *</Label>
                      <Input
                        id="theme-name"
                        value={themeInfo.name}
                        onChange={(e) => setThemeInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My Awesome Theme"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="theme-author">Author</Label>
                      <Input
                        id="theme-author"
                        value={themeInfo.author}
                        onChange={(e) => setThemeInfo(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="Your Name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="theme-category">Category</Label>
                      <Select
                        value={themeInfo.category}
                        onValueChange={(value) => setThemeInfo(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="nature">Nature</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme-description">Description</Label>
                      <Textarea
                        id="theme-description"
                        value={themeInfo.description}
                        onChange={(e) => setThemeInfo(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="A beautiful theme for..."
                        rows={4}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="theme-tags">Tags (comma-separated)</Label>
                      <Input
                        id="theme-tags"
                        value={themeInfo.tags}
                        onChange={(e) => setThemeInfo(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="modern, professional, blue"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Tips for naming your theme</h4>
                      <ul className="text-sm text-blue-700 mt-1 space-y-1">
                        <li>• Use descriptive names that reflect the theme's purpose</li>
                        <li>• Include the main color or style (e.g., "Professional Blue", "Warm Orange")</li>
                        <li>• Keep it concise but memorable</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Choose Template */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Choose a Starting Template</h3>
                  <p className="text-gray-600">Select a template as the foundation for your custom theme</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === template.id ? 'ring-2 ring-emerald-500 bg-emerald-50' : ''
                      }`}
                      onClick={() => applyTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-1">
                            <div 
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: template.colors.primary }}
                            />
                            <div 
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: template.colors.secondary }}
                            />
                            <div 
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: template.colors.accent }}
                            />
                          </div>
                          
                          {selectedTemplate === template.id && (
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          )}
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Customize Colors */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Customize Your Colors</h3>
                  <p className="text-gray-600">Fine-tune the color palette for your theme</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Primary Color */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-medium">Primary Color</h4>
                      <p className="text-sm text-gray-600">Main brand color</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-center">
                        <div 
                          className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                          style={{ backgroundColor: customColors.primary }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          type="color"
                          value={customColors.primary}
                          onChange={(e) => updateCustomColors('primary', e.target.value)}
                          className="w-full h-12"
                        />
                        <Input
                          type="text"
                          value={customColors.primary}
                          onChange={(e) => updateCustomColors('primary', e.target.value)}
                          className="font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-medium">Secondary Color</h4>
                      <p className="text-sm text-gray-600">Complementary color</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-center">
                        <div 
                          className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                          style={{ backgroundColor: customColors.secondary }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          type="color"
                          value={customColors.secondary}
                          onChange={(e) => updateCustomColors('secondary', e.target.value)}
                          className="w-full h-12"
                        />
                        <Input
                          type="text"
                          value={customColors.secondary}
                          onChange={(e) => updateCustomColors('secondary', e.target.value)}
                          className="font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-medium">Accent Color</h4>
                      <p className="text-sm text-gray-600">Highlight color</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-center">
                        <div 
                          className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                          style={{ backgroundColor: customColors.accent }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          type="color"
                          value={customColors.accent}
                          onChange={(e) => updateCustomColors('accent', e.target.value)}
                          className="w-full h-12"
                        />
                        <Input
                          type="text"
                          value={customColors.accent}
                          onChange={(e) => updateCustomColors('accent', e.target.value)}
                          className="font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Color Harmony Tips */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-800">Color Harmony Tips</h4>
                      <ul className="text-sm text-purple-700 mt-1 space-y-1">
                        <li>• Use colors that complement each other for better visual appeal</li>
                        <li>• Ensure sufficient contrast for accessibility</li>
                        <li>• Consider your brand identity and target audience</li>
                        <li>• Test colors in different lighting conditions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Preview & Save */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Preview Your Theme</h3>
                  <p className="text-gray-600">Review your custom theme before saving</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Theme Summary */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Theme Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-700">Name:</span>
                          <span className="ml-2 text-gray-600">{themeInfo.name}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Author:</span>
                          <span className="ml-2 text-gray-600">{themeInfo.author || 'Theme Creator'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Category:</span>
                          <span className="ml-2 text-gray-600 capitalize">{themeInfo.category}</span>
                        </div>
                        
                        <div className="pt-2">
                          <span className="font-medium text-gray-700">Colors:</span>
                          <div className="flex space-x-2 mt-1">
                            <div 
                              className="w-8 h-8 rounded border border-gray-200"
                              style={{ backgroundColor: customColors.primary }}
                              title="Primary"
                            />
                            <div 
                              className="w-8 h-8 rounded border border-gray-200"
                              style={{ backgroundColor: customColors.secondary }}
                              title="Secondary"
                            />
                            <div 
                              className="w-8 h-8 rounded border border-gray-200"
                              style={{ backgroundColor: customColors.accent }}
                              title="Accent"
                            />
                          </div>
                        </div>
                        
                        {themeInfo.tags && (
                          <div className="pt-2">
                            <span className="font-medium text-gray-700">Tags:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {themeInfo.tags.split(',').map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Theme Preview */}
                  <div className="lg:col-span-2">
                    <ThemePreview 
                      theme={theme}
                      showControls={false}
                      className="border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={saveTheme}
                disabled={!isStepValid(currentStep) || loading}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{loading ? 'Saving...' : 'Create Theme'}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}