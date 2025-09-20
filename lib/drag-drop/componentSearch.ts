import { ComponentDefinition } from '../types/drag-drop';

export interface SearchFilters {
  query?: string;
  category?: string;
  sortBy?: 'name' | 'category' | 'usage' | 'recent';
  tags?: string[];
  minUsage?: number;
  maxUsage?: number;
}

export interface SearchResult {
  component: ComponentDefinition;
  relevanceScore: number;
  matchedFields: string[];
}

export class ComponentSearchEngine {
  private static instance: ComponentSearchEngine;
  private searchIndex: Map<string, Set<string>> = new Map();
  private usageData: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): ComponentSearchEngine {
    if (!ComponentSearchEngine.instance) {
      ComponentSearchEngine.instance = new ComponentSearchEngine();
    }
    return ComponentSearchEngine.instance;
  }

  /**
   * Index components for search
   */
  indexComponents(components: ComponentDefinition[]): void {
    this.searchIndex.clear();
    
    components.forEach(component => {
      const searchTerms = new Set<string>();
      
      // Index name
      this.addSearchTerms(searchTerms, component.name);
      
      // Index description
      if (component.description) {
        this.addSearchTerms(searchTerms, component.description);
      }
      
      // Index category
      searchTerms.add(component.category.toLowerCase());
      
      // Index schema properties (for advanced search)
      if (component.schema?.properties) {
        Object.keys(component.schema.properties).forEach(prop => {
          searchTerms.add(prop.toLowerCase());
        });
      }
      
      this.searchIndex.set(component.id, searchTerms);
    });
  }

  /**
   * Update usage data for sorting
   */
  updateUsageData(usageData: Record<string, number>): void {
    this.usageData.clear();
    Object.entries(usageData).forEach(([componentId, usage]) => {
      this.usageData.set(componentId, usage);
    });
  }

  /**
   * Search components with relevance scoring
   */
  search(
    components: ComponentDefinition[], 
    filters: SearchFilters
  ): SearchResult[] {
    let results: SearchResult[] = [];

    // If no query, return all components with basic scoring
    if (!filters.query || filters.query.trim() === '') {
      results = components.map(component => ({
        component,
        relevanceScore: this.calculateBaseScore(component),
        matchedFields: []
      }));
    } else {
      // Perform text search
      const queryTerms = this.tokenize(filters.query);
      
      results = components
        .map(component => {
          const searchTerms = this.searchIndex.get(component.id) || new Set();
          const { score, matchedFields } = this.calculateRelevanceScore(
            queryTerms, 
            searchTerms, 
            component
          );
          
          return {
            component,
            relevanceScore: score,
            matchedFields
          };
        })
        .filter(result => result.relevanceScore > 0);
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      results = results.filter(result => 
        result.component.category === filters.category
      );
    }

    // Apply usage filters
    if (filters.minUsage !== undefined || filters.maxUsage !== undefined) {
      results = results.filter(result => {
        const usage = this.usageData.get(result.component.id) || 0;
        const meetsMin = filters.minUsage === undefined || usage >= filters.minUsage;
        const meetsMax = filters.maxUsage === undefined || usage <= filters.maxUsage;
        return meetsMin && meetsMax;
      });
    }

    // Apply sorting
    this.sortResults(results, filters.sortBy || 'relevance');

    return results;
  }

  /**
   * Get search suggestions based on partial query
   */
  getSuggestions(partialQuery: string, limit: number = 5): string[] {
    if (partialQuery.length < 2) return [];

    const suggestions = new Set<string>();
    const queryLower = partialQuery.toLowerCase();

    // Collect matching terms from search index
    this.searchIndex.forEach(terms => {
      terms.forEach(term => {
        if (term.includes(queryLower) && term !== queryLower) {
          suggestions.add(term);
        }
      });
    });

    return Array.from(suggestions)
      .sort((a, b) => {
        // Prioritize terms that start with the query
        const aStarts = a.startsWith(queryLower);
        const bStarts = b.startsWith(queryLower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.length - b.length; // Shorter terms first
      })
      .slice(0, limit);
  }

  /**
   * Get popular search terms
   */
  getPopularSearchTerms(): string[] {
    // In a real implementation, this would track actual search queries
    return [
      'text', 'image', 'button', 'layout', 'form', 
      'gallery', 'video', 'map', 'heading', 'paragraph'
    ];
  }

  /**
   * Tokenize search query
   */
  private tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 0)
      .map(term => term.replace(/[^\w]/g, ''));
  }

  /**
   * Add search terms from text
   */
  private addSearchTerms(searchTerms: Set<string>, text: string): void {
    const tokens = this.tokenize(text);
    tokens.forEach(token => {
      if (token.length > 1) { // Skip single characters
        searchTerms.add(token);
        
        // Add partial matches for better search
        if (token.length > 3) {
          for (let i = 2; i < token.length; i++) {
            searchTerms.add(token.substring(0, i));
          }
        }
      }
    });
  }

  /**
   * Calculate relevance score for a component
   */
  private calculateRelevanceScore(
    queryTerms: string[], 
    searchTerms: Set<string>, 
    component: ComponentDefinition
  ): { score: number; matchedFields: string[] } {
    let score = 0;
    const matchedFields: string[] = [];

    queryTerms.forEach(queryTerm => {
      // Exact match in name (highest score)
      if (component.name.toLowerCase().includes(queryTerm)) {
        score += 10;
        matchedFields.push('name');
      }

      // Exact match in category
      if (component.category.toLowerCase().includes(queryTerm)) {
        score += 8;
        matchedFields.push('category');
      }

      // Exact match in description
      if (component.description?.toLowerCase().includes(queryTerm)) {
        score += 6;
        matchedFields.push('description');
      }

      // Partial matches in search terms
      searchTerms.forEach(searchTerm => {
        if (searchTerm.includes(queryTerm)) {
          score += 3;
        } else if (queryTerm.includes(searchTerm)) {
          score += 2;
        }
      });
    });

    // Boost score based on usage
    const usage = this.usageData.get(component.id) || 0;
    score += Math.min(usage * 0.1, 5); // Cap usage boost at 5 points

    return { score, matchedFields: [...new Set(matchedFields)] };
  }

  /**
   * Calculate base score for components without search query
   */
  private calculateBaseScore(component: ComponentDefinition): number {
    let score = 1; // Base score

    // Boost based on usage
    const usage = this.usageData.get(component.id) || 0;
    score += usage * 0.2;

    // Boost common component types
    const commonTypes = ['text', 'layout', 'interactive'];
    if (commonTypes.includes(component.category)) {
      score += 2;
    }

    return score;
  }

  /**
   * Sort search results
   */
  private sortResults(results: SearchResult[], sortBy: string): void {
    results.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.component.name.localeCompare(b.component.name);
        
        case 'category':
          const categoryCompare = a.component.category.localeCompare(b.component.category);
          return categoryCompare !== 0 ? categoryCompare : 
                 a.component.name.localeCompare(b.component.name);
        
        case 'usage':
          const usageA = this.usageData.get(a.component.id) || 0;
          const usageB = this.usageData.get(b.component.id) || 0;
          return usageB - usageA;
        
        case 'recent':
          // In a real implementation, this would sort by last used date
          return b.relevanceScore - a.relevanceScore;
        
        case 'relevance':
        default:
          return b.relevanceScore - a.relevanceScore;
      }
    });
  }

  /**
   * Clear search index
   */
  clear(): void {
    this.searchIndex.clear();
    this.usageData.clear();
  }
}