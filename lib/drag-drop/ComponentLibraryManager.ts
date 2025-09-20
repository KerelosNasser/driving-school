import { ComponentDefinition } from '../types/drag-drop';

export interface ComponentUsageStats {
  componentId: string;
  usageCount: number;
  lastUsed: string;
  averageUsagePerWeek: number;
}

export interface ComponentRecommendation {
  component: ComponentDefinition;
  score: number;
  reason: string;
}

export class ComponentLibraryManager {
  private static instance: ComponentLibraryManager;
  private components: Map<string, ComponentDefinition> = new Map();
  private usageStats: Map<string, ComponentUsageStats> = new Map();
  private categories: Set<string> = new Set();

  private constructor() {}

  static getInstance(): ComponentLibraryManager {
    if (!ComponentLibraryManager.instance) {
      ComponentLibraryManager.instance = new ComponentLibraryManager();
    }
    return ComponentLibraryManager.instance;
  }

  /**
   * Register a component definition
   */
  registerComponent(component: ComponentDefinition): void {
    this.components.set(component.id, component);
    this.categories.add(component.category);
    
    // Initialize usage stats if not exists
    if (!this.usageStats.has(component.id)) {
      this.usageStats.set(component.id, {
        componentId: component.id,
        usageCount: 0,
        lastUsed: new Date().toISOString(),
        averageUsagePerWeek: 0
      });
    }
  }

  /**
   * Register multiple components
   */
  registerComponents(components: ComponentDefinition[]): void {
    components.forEach(component => this.registerComponent(component));
  }

  /**
   * Get a component by ID
   */
  getComponent(id: string): ComponentDefinition | undefined {
    return this.components.get(id);
  }

  /**
   * Get all components
   */
  getAllComponents(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: string): ComponentDefinition[] {
    return this.getAllComponents().filter(comp => comp.category === category);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories);
  }

  /**
   * Search components
   */
  searchComponents(query: string): ComponentDefinition[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllComponents().filter(component => 
      component.name.toLowerCase().includes(lowercaseQuery) ||
      component.description?.toLowerCase().includes(lowercaseQuery) ||
      component.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Filter components
   */
  filterComponents(filters: {
    category?: string;
    search?: string;
    sortBy?: 'name' | 'category' | 'usage';
  }): ComponentDefinition[] {
    let filtered = this.getAllComponents();

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(comp => comp.category === filters.category);
    }

    // Apply search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(comp => 
        comp.name.toLowerCase().includes(query) ||
        comp.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'usage':
            const usageA = this.getUsageStats(a.id)?.usageCount || 0;
            const usageB = this.getUsageStats(b.id)?.usageCount || 0;
            return usageB - usageA;
          case 'category':
          default:
            return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
        }
      });
    }

    return filtered;
  }

  /**
   * Record component usage
   */
  recordUsage(componentId: string): void {
    const stats = this.usageStats.get(componentId);
    if (stats) {
      stats.usageCount++;
      stats.lastUsed = new Date().toISOString();
      this.calculateAverageUsage(componentId);
    }
  }

  /**
   * Get usage statistics for a component
   */
  getUsageStats(componentId: string): ComponentUsageStats | undefined {
    return this.usageStats.get(componentId);
  }

  /**
   * Get all usage statistics
   */
  getAllUsageStats(): ComponentUsageStats[] {
    return Array.from(this.usageStats.values());
  }

  /**
   * Get most used components
   */
  getMostUsedComponents(limit: number = 10): ComponentDefinition[] {
    const sortedStats = this.getAllUsageStats()
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);

    return sortedStats
      .map(stats => this.getComponent(stats.componentId))
      .filter((comp): comp is ComponentDefinition => comp !== undefined);
  }

  /**
   * Get component recommendations based on usage patterns
   */
  getRecommendations(limit: number = 5): ComponentRecommendation[] {
    const recommendations: ComponentRecommendation[] = [];
    const allComponents = this.getAllComponents();

    allComponents.forEach(component => {
      const stats = this.getUsageStats(component.id);
      let score = 0;
      let reason = '';

      if (stats) {
        // Score based on usage frequency
        score += stats.usageCount * 0.4;
        
        // Score based on recent usage
        const daysSinceLastUsed = this.getDaysSince(stats.lastUsed);
        if (daysSinceLastUsed < 7) {
          score += 20;
          reason = 'Recently used';
        } else if (daysSinceLastUsed < 30) {
          score += 10;
          reason = 'Used this month';
        }

        // Score based on average weekly usage
        score += stats.averageUsagePerWeek * 5;

        // Boost score for highly used components
        if (stats.usageCount > 10) {
          score += 15;
          reason = reason || 'Frequently used';
        }
      } else {
        // New components get a small boost
        score = 5;
        reason = 'New component';
      }

      // Category-based recommendations
      if (component.category === 'text') {
        score += 5; // Text components are commonly used
      } else if (component.category === 'layout') {
        score += 3; // Layout components are structural
      }

      recommendations.push({
        component,
        score,
        reason: reason || 'Available component'
      });
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get components that work well together
   */
  getComplementaryComponents(componentId: string): ComponentDefinition[] {
    const component = this.getComponent(componentId);
    if (!component) return [];

    const complementary: ComponentDefinition[] = [];

    // Define complementary relationships
    const relationships: Record<string, string[]> = {
      'text-heading': ['text-paragraph', 'layout-section'],
      'text-paragraph': ['text-heading', 'media-image'],
      'media-image': ['text-paragraph', 'text-heading'],
      'interactive-button': ['text-heading', 'text-paragraph'],
      'layout-section': ['text-heading', 'text-paragraph', 'media-image'],
      'layout-columns': ['text-paragraph', 'media-image', 'interactive-button']
    };

    const relatedIds = relationships[componentId] || [];
    relatedIds.forEach(id => {
      const relatedComponent = this.getComponent(id);
      if (relatedComponent) {
        complementary.push(relatedComponent);
      }
    });

    return complementary;
  }

  /**
   * Calculate average usage per week
   */
  private calculateAverageUsage(componentId: string): void {
    const stats = this.usageStats.get(componentId);
    if (!stats) return;

    // Simple calculation - in a real app, you'd track usage over time
    const weeksActive = Math.max(1, this.getWeeksSince(stats.lastUsed));
    stats.averageUsagePerWeek = stats.usageCount / weeksActive;
  }

  /**
   * Get days since a date
   */
  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get weeks since a date
   */
  private getWeeksSince(dateString: string): number {
    return Math.ceil(this.getDaysSince(dateString) / 7);
  }

  /**
   * Export component library data
   */
  exportLibrary(): {
    components: ComponentDefinition[];
    usageStats: ComponentUsageStats[];
    categories: string[];
  } {
    return {
      components: this.getAllComponents(),
      usageStats: this.getAllUsageStats(),
      categories: this.getCategories()
    };
  }

  /**
   * Import component library data
   */
  importLibrary(data: {
    components: ComponentDefinition[];
    usageStats?: ComponentUsageStats[];
    categories?: string[];
  }): void {
    // Clear existing data
    this.components.clear();
    this.usageStats.clear();
    this.categories.clear();

    // Import components
    this.registerComponents(data.components);

    // Import usage stats
    if (data.usageStats) {
      data.usageStats.forEach(stats => {
        this.usageStats.set(stats.componentId, stats);
      });
    }

    // Import categories
    if (data.categories) {
      data.categories.forEach(category => {
        this.categories.add(category);
      });
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.components.clear();
    this.usageStats.clear();
    this.categories.clear();
  }
}