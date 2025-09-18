// Theme preset system with professional variations
import { Theme, ColorPalette, GradientSet, EffectConfig, TypographyConfig, ThemeMetadata } from './types';
import { themeExtractor } from './extractor';

export interface PresetTheme {
  id: string;
  name: string;
  description: string;
  category: 'default' | 'seasonal' | 'branded' | 'custom';
  thumbnail?: string;
  theme: Theme;
}

export interface PresetCategory {
  id: string;
  name: string;
  description: string;
  presets: PresetTheme[];
}

export interface PresetManager {
  getDefaultPreset(): PresetTheme;
  getAllPresets(): PresetCategory[];
  getPresetsByCategory(category: string): PresetTheme[];
  getPresetById(id: string): PresetTheme | null;
  createCustomPreset(theme: Theme, name: string, description: string): PresetTheme;
  saveCustomPreset(preset: PresetTheme): Promise<boolean>;
  deleteCustomPreset(id: string): Promise<boolean>;
  generateThumbnail(theme: Theme): string;
}

class PresetManagerImpl implements PresetManager {
  private presets: Map<string, PresetTheme> = new Map();
  private categories: PresetCategory[] = [];

  constructor() {
    this.initializePresets();
  }

  /**
   * Initialize all preset themes based on current design
   */
  private initializePresets(): void {
    // Get the default theme as base
    const defaultTheme = themeExtractor.generateDefaultTheme();
    
    // Create default preset
    const defaultPreset = this.createDefaultPreset(defaultTheme);
    this.presets.set(defaultPreset.id, defaultPreset);

    // Create seasonal presets
    const seasonalPresets = this.createSeasonalPresets(defaultTheme);
    seasonalPresets.forEach(preset => this.presets.set(preset.id, preset));

    // Create branded presets
    const brandedPresets = this.createBrandedPresets(defaultTheme);
    brandedPresets.forEach(preset => this.presets.set(preset.id, preset));

    // Organize into categories
    this.categories = [
      {
        id: 'default',
        name: 'Default',
        description: 'The current professional design preserved as default',
        presets: [defaultPreset]
      },
      {
        id: 'seasonal',
        name: 'Seasonal Themes',
        description: 'Seasonal variations maintaining professional quality',
        presets: seasonalPresets
      },
      {
        id: 'branded',
        name: 'Branded Themes',
        description: 'Professional color schemes for different branding needs',
        presets: brandedPresets
      },
      {
        id: 'custom',
        name: 'Custom Themes',
        description: 'User-created custom themes',
        presets: []
      }
    ];
  }

  /**
   * Create the default professional preset
   */
  private createDefaultPreset(baseTheme: Theme): PresetTheme {
    return {
      id: 'default-professional',
      name: 'Default Professional',
      description: 'The current emerald/teal professional design',
      category: 'default',
      thumbnail: this.generateThumbnail(baseTheme),
      theme: {
        ...baseTheme,
        id: 'default-professional',
        name: 'Default Professional',
        metadata: {
          ...baseTheme.metadata,
          name: 'Default Professional',
          description: 'The current emerald/teal professional design preserved as default',
          tags: ['default', 'professional', 'emerald', 'teal']
        }
      }
    };
  }

  /**
   * Create seasonal theme variations
   */
  private createSeasonalPresets(baseTheme: Theme): PresetTheme[] {
    const presets: PresetTheme[] = [];

    // Spring Green - Fresh and vibrant
    const springTheme = this.createSeasonalVariation(baseTheme, 'spring', {
      primary: this.generateColorScale('#22c55e'), // Green-500 base
      secondary: this.generateColorScale('#84cc16'), // Lime-500 base
      accent: this.generateColorScale('#10b981') // Emerald-500 base
    });
    presets.push({
      id: 'seasonal-spring',
      name: 'Spring Green',
      description: 'Fresh spring colors with vibrant greens',
      category: 'seasonal',
      thumbnail: this.generateThumbnail(springTheme),
      theme: springTheme
    });

    // Summer Ocean - Cool blues and teals
    const summerTheme = this.createSeasonalVariation(baseTheme, 'summer', {
      primary: this.generateColorScale('#0ea5e9'), // Sky-500 base
      secondary: this.generateColorScale('#06b6d4'), // Cyan-500 base
      accent: this.generateColorScale('#14b8a6') // Teal-500 base
    });
    presets.push({
      id: 'seasonal-summer',
      name: 'Summer Ocean',
      description: 'Cool ocean blues perfect for summer',
      category: 'seasonal',
      thumbnail: this.generateThumbnail(summerTheme),
      theme: summerTheme
    });

    // Autumn Warmth - Warm oranges and reds
    const autumnTheme = this.createSeasonalVariation(baseTheme, 'autumn', {
      primary: this.generateColorScale('#ea580c'), // Orange-600 base
      secondary: this.generateColorScale('#dc2626'), // Red-600 base
      accent: this.generateColorScale('#d97706') // Amber-600 base
    });
    presets.push({
      id: 'seasonal-autumn',
      name: 'Autumn Warmth',
      description: 'Warm autumn colors with rich oranges',
      category: 'seasonal',
      thumbnail: this.generateThumbnail(autumnTheme),
      theme: autumnTheme
    });

    // Winter Elegance - Cool grays and blues
    const winterTheme = this.createSeasonalVariation(baseTheme, 'winter', {
      primary: this.generateColorScale('#475569'), // Slate-600 base
      secondary: this.generateColorScale('#1e40af'), // Blue-700 base
      accent: this.generateColorScale('#0f172a') // Slate-900 base
    });
    presets.push({
      id: 'seasonal-winter',
      name: 'Winter Elegance',
      description: 'Elegant winter colors with cool tones',
      category: 'seasonal',
      thumbnail: this.generateThumbnail(winterTheme),
      theme: winterTheme
    });

    return presets;
  }

  /**
   * Create branded theme variations
   */
  private createBrandedPresets(baseTheme: Theme): PresetTheme[] {
    const presets: PresetTheme[] = [];

    // Corporate Blue - Professional business theme
    const corporateTheme = this.createBrandedVariation(baseTheme, 'corporate', {
      primary: this.generateColorScale('#1d4ed8'), // Blue-700 base
      secondary: this.generateColorScale('#1e40af'), // Blue-700 base
      accent: this.generateColorScale('#3730a3') // Indigo-700 base
    });
    presets.push({
      id: 'branded-corporate',
      name: 'Corporate Blue',
      description: 'Professional corporate blue theme',
      category: 'branded',
      thumbnail: this.generateThumbnail(corporateTheme),
      theme: corporateTheme
    });

    // Luxury Purple - Premium and sophisticated
    const luxuryTheme = this.createBrandedVariation(baseTheme, 'luxury', {
      primary: this.generateColorScale('#7c3aed'), // Violet-600 base
      secondary: this.generateColorScale('#9333ea'), // Purple-600 base
      accent: this.generateColorScale('#6366f1') // Indigo-500 base
    });
    presets.push({
      id: 'branded-luxury',
      name: 'Luxury Purple',
      description: 'Premium purple theme for luxury branding',
      category: 'branded',
      thumbnail: this.generateThumbnail(luxuryTheme),
      theme: luxuryTheme
    });

    // Energy Orange - Dynamic and energetic
    const energyTheme = this.createBrandedVariation(baseTheme, 'energy', {
      primary: this.generateColorScale('#f97316'), // Orange-500 base
      secondary: this.generateColorScale('#eab308'), // Yellow-500 base
      accent: this.generateColorScale('#dc2626') // Red-600 base
    });
    presets.push({
      id: 'branded-energy',
      name: 'Energy Orange',
      description: 'Dynamic orange theme for energetic brands',
      category: 'branded',
      thumbnail: this.generateThumbnail(energyTheme),
      theme: energyTheme
    });

    // Nature Green - Eco-friendly and natural
    const natureTheme = this.createBrandedVariation(baseTheme, 'nature', {
      primary: this.generateColorScale('#16a34a'), // Green-600 base
      secondary: this.generateColorScale('#65a30d'), // Lime-600 base
      accent: this.generateColorScale('#059669') // Emerald-600 base
    });
    presets.push({
      id: 'branded-nature',
      name: 'Nature Green',
      description: 'Natural green theme for eco-friendly brands',
      category: 'branded',
      thumbnail: this.generateThumbnail(natureTheme),
      theme: natureTheme
    });

    return presets;
  }

  /**
   * Create a seasonal variation of the base theme
   */
  private createSeasonalVariation(baseTheme: Theme, season: string, colors: Partial<ColorPalette>): Theme {
    return {
      ...baseTheme,
      id: `seasonal-${season}`,
      name: `${season.charAt(0).toUpperCase() + season.slice(1)} Theme`,
      colors: {
        ...baseTheme.colors,
        ...colors,
        neutral: baseTheme.colors.neutral, // Keep neutral colors consistent
        semantic: baseTheme.colors.semantic // Keep semantic colors consistent
      },
      gradients: this.updateGradientsForColors(baseTheme.gradients, colors),
      metadata: {
        ...baseTheme.metadata,
        name: `${season.charAt(0).toUpperCase() + season.slice(1)} Theme`,
        description: `Seasonal ${season} variation of the professional theme`,
        tags: ['seasonal', season, 'professional']
      }
    };
  }

  /**
   * Create a branded variation of the base theme
   */
  private createBrandedVariation(baseTheme: Theme, brand: string, colors: Partial<ColorPalette>): Theme {
    return {
      ...baseTheme,
      id: `branded-${brand}`,
      name: `${brand.charAt(0).toUpperCase() + brand.slice(1)} Theme`,
      colors: {
        ...baseTheme.colors,
        ...colors,
        neutral: baseTheme.colors.neutral, // Keep neutral colors consistent
        semantic: baseTheme.colors.semantic // Keep semantic colors consistent
      },
      gradients: this.updateGradientsForColors(baseTheme.gradients, colors),
      metadata: {
        ...baseTheme.metadata,
        name: `${brand.charAt(0).toUpperCase() + brand.slice(1)} Theme`,
        description: `Professional ${brand} branded theme variation`,
        tags: ['branded', brand, 'professional']
      }
    };
  }

  /**
   * Update gradients to use new color palette
   */
  private updateGradientsForColors(baseGradients: GradientSet, colors: Partial<ColorPalette>): GradientSet {
    const updatedGradients = { ...baseGradients };

    if (colors.primary) {
      // Update hero gradient with new primary colors
      updatedGradients.hero = {
        ...baseGradients.hero,
        colorStops: [
          { color: colors.primary[900], position: 0 },
          { color: colors.secondary?.[800] || colors.primary[800], position: 50 },
          { color: colors.accent?.[900] || colors.primary[700], position: 100 }
        ]
      };

      // Update button gradient
      updatedGradients.button = {
        ...baseGradients.button,
        colorStops: [
          { color: colors.primary[500], position: 0 },
          { color: colors.secondary?.[600] || colors.primary[600], position: 100 }
        ]
      };

      // Update card gradient
      updatedGradients.card = {
        ...baseGradients.card,
        colorStops: [
          { color: colors.primary[50], position: 0 },
          { color: colors.primary[100], position: 100 }
        ]
      };

      // Update background gradient
      updatedGradients.background = {
        ...baseGradients.background,
        colorStops: [
          { color: colors.primary[900], position: 0 },
          { color: colors.primary[800], position: 100 }
        ]
      };

      // Update accent gradient
      updatedGradients.accent = {
        ...baseGradients.accent,
        colorStops: [
          { color: colors.accent?.[500] || colors.primary[500], position: 0 },
          { color: colors.accent?.[600] || colors.primary[600], position: 100 }
        ]
      };
    }

    return updatedGradients;
  }

  /**
   * Generate a color scale from a base color
   */
  private generateColorScale(baseColor: string): ColorScale {
    // This is a simplified color scale generation
    // In a real implementation, you'd use a proper color manipulation library
    return {
      50: this.lightenColor(baseColor, 0.95),
      100: this.lightenColor(baseColor, 0.9),
      200: this.lightenColor(baseColor, 0.8),
      300: this.lightenColor(baseColor, 0.6),
      400: this.lightenColor(baseColor, 0.4),
      500: baseColor,
      600: this.darkenColor(baseColor, 0.1),
      700: this.darkenColor(baseColor, 0.2),
      800: this.darkenColor(baseColor, 0.3),
      900: this.darkenColor(baseColor, 0.4)
    };
  }

  /**
   * Lighten a color by a percentage
   */
  private lightenColor(color: string, amount: number): string {
    // Simple color lightening - in production use a proper color library
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const newR = Math.min(255, Math.round(r + (255 - r) * amount));
    const newG = Math.min(255, Math.round(g + (255 - g) * amount));
    const newB = Math.min(255, Math.round(b + (255 - b) * amount));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Darken a color by a percentage
   */
  private darkenColor(color: string, amount: number): string {
    // Simple color darkening - in production use a proper color library
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const newR = Math.max(0, Math.round(r * (1 - amount)));
    const newG = Math.max(0, Math.round(g * (1 - amount)));
    const newB = Math.max(0, Math.round(b * (1 - amount)));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Get the default preset
   */
  getDefaultPreset(): PresetTheme {
    return this.presets.get('default-professional')!;
  }

  /**
   * Get all presets organized by category
   */
  getAllPresets(): PresetCategory[] {
    // Update custom category with any saved custom presets
    const customCategory = this.categories.find(c => c.id === 'custom');
    if (customCategory) {
      customCategory.presets = Array.from(this.presets.values())
        .filter(p => p.category === 'custom');
    }

    return this.categories;
  }

  /**
   * Get presets by category
   */
  getPresetsByCategory(category: string): PresetTheme[] {
    return Array.from(this.presets.values())
      .filter(preset => preset.category === category);
  }

  /**
   * Get a specific preset by ID
   */
  getPresetById(id: string): PresetTheme | null {
    return this.presets.get(id) || null;
  }

  /**
   * Create a custom preset from a theme
   */
  createCustomPreset(theme: Theme, name: string, description: string): PresetTheme {
    const customId = `custom-${Date.now()}`;
    
    const customPreset: PresetTheme = {
      id: customId,
      name,
      description,
      category: 'custom',
      thumbnail: this.generateThumbnail(theme),
      theme: {
        ...theme,
        id: customId,
        name,
        metadata: {
          ...theme.metadata,
          name,
          description,
          tags: [...(theme.metadata.tags || []), 'custom'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    };

    this.presets.set(customId, customPreset);
    return customPreset;
  }

  /**
   * Save a custom preset (placeholder for persistence)
   */
  async saveCustomPreset(preset: PresetTheme): Promise<boolean> {
    try {
      // In a real implementation, this would save to storage
      // For now, just keep in memory
      this.presets.set(preset.id, preset);
      
      // Update the custom category
      const customCategory = this.categories.find(c => c.id === 'custom');
      if (customCategory) {
        const existingIndex = customCategory.presets.findIndex(p => p.id === preset.id);
        if (existingIndex >= 0) {
          customCategory.presets[existingIndex] = preset;
        } else {
          customCategory.presets.push(preset);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to save custom preset:', error);
      return false;
    }
  }

  /**
   * Delete a custom preset
   */
  async deleteCustomPreset(id: string): Promise<boolean> {
    try {
      const preset = this.presets.get(id);
      if (!preset || preset.category !== 'custom') {
        return false;
      }

      this.presets.delete(id);
      
      // Remove from custom category
      const customCategory = this.categories.find(c => c.id === 'custom');
      if (customCategory) {
        customCategory.presets = customCategory.presets.filter(p => p.id !== id);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete custom preset:', error);
      return false;
    }
  }

  /**
   * Generate a thumbnail representation of a theme
   */
  generateThumbnail(theme: Theme): string {
    // Generate a simple CSS gradient as thumbnail
    const heroGradient = theme.gradients.hero;
    const gradientStops = heroGradient.colorStops
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');
    
    return `linear-gradient(${heroGradient.direction}, ${gradientStops})`;
  }

  /**
   * Search presets by name or tags
   */
  searchPresets(query: string): PresetTheme[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.presets.values()).filter(preset => 
      preset.name.toLowerCase().includes(searchTerm) ||
      preset.description.toLowerCase().includes(searchTerm) ||
      preset.theme.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get preset statistics
   */
  getPresetStats() {
    const stats = {
      total: this.presets.size,
      byCategory: {} as Record<string, number>
    };

    this.categories.forEach(category => {
      stats.byCategory[category.id] = this.getPresetsByCategory(category.id).length;
    });

    return stats;
  }

  /**
   * Export preset for sharing
   */
  exportPreset(id: string): string | null {
    const preset = this.presets.get(id);
    if (!preset) return null;

    return JSON.stringify(preset, null, 2);
  }

  /**
   * Import preset from export data
   */
  importPreset(exportData: string): PresetTheme | null {
    try {
      const preset: PresetTheme = JSON.parse(exportData);
      
      // Validate preset structure
      if (!preset.id || !preset.name || !preset.theme) {
        throw new Error('Invalid preset format');
      }

      // Generate new ID to avoid conflicts
      const newId = `imported-${Date.now()}`;
      preset.id = newId;
      preset.theme.id = newId;
      preset.category = 'custom';

      this.presets.set(newId, preset);
      return preset;
    } catch (error) {
      console.error('Failed to import preset:', error);
      return null;
    }
  }
}

// Export singleton instance
export const presetManager = new PresetManagerImpl();

// Export types for use in other modules
export type { PresetTheme, PresetCategory, PresetManager };