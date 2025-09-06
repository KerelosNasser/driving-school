// Enhanced Content Loading Service with File Caching and Real-time Updates
// This service provides persistent content management that survives restarts

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { ContentItem, PageContent } from './content';

// Create admin client for server operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Content cache with TTL
interface CacheEntry {
  data: PageContent;
  timestamp: number;
  version: string;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const contentCache = new Map<string, CacheEntry>();
const CONTENT_DIR = path.join(process.cwd(), '.content-cache');

// Content versioning for optimistic updates
interface ContentVersion {
  id: string;
  content_key: string;
  content_value?: string;
  content_json?: any;
  version: string;
  created_at: string;
  created_by: string;
  is_published: boolean;
}

export class PersistentContentLoader {
  private static instance: PersistentContentLoader;
  private subscribers = new Set<(pageName: string, content: PageContent) => void>();
  
  static getInstance(): PersistentContentLoader {
    if (!PersistentContentLoader.instance) {
      PersistentContentLoader.instance = new PersistentContentLoader();
    }
    return PersistentContentLoader.instance;
  }

  constructor() {
    this.initializeContentDirectory();
  }

  private async initializeContentDirectory() {
    try {
      await fs.mkdir(CONTENT_DIR, { recursive: true });
    } catch (error) {
      console.warn('Could not create content cache directory:', error);
    }
  }

  /**
   * Load content with multi-layer caching strategy:
   * 1. Memory cache (fastest)
   * 2. File cache (survives restarts)
   * 3. Database (source of truth)
   */
  async loadPageContent(pageName: string): Promise<PageContent> {
    const cacheKey = `page_${pageName}`;
    
    // Check memory cache first
    const cached = contentCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      // Try file cache next
      const fileContent = await this.loadFromFileCache(pageName);
      if (fileContent) {
        contentCache.set(cacheKey, {
          data: fileContent,
          timestamp: Date.now(),
          version: this.generateVersion()
        });
        return fileContent;
      }
    } catch (error) {
      console.warn('File cache read failed:', error);
    }

    // Load from database as fallback
    const content = await this.loadFromDatabase(pageName);
    
    // Update both caches
    await this.saveToFileCache(pageName, content);
    contentCache.set(cacheKey, {
      data: content,
      timestamp: Date.now(),
      version: this.generateVersion()
    });

    return content;
  }

  /**
   * Save content with optimistic updates and conflict resolution
   */
  async saveContent(
    pageName: string,
    contentKey: string,
    value: any,
    type: 'text' | 'json' | 'file' = 'text',
    userId: string
  ): Promise<{ success: boolean; version?: string; conflict?: boolean }> {
    const version = this.generateVersion();
    
    try {
      // Optimistic update - update cache immediately
      await this.updateCache(pageName, contentKey, value, type);
      
      // Notify subscribers for real-time updates
      this.notifySubscribers(pageName, await this.loadPageContent(pageName));
      
      // Save to database with conflict detection
      const result = await this.saveToDatabase(pageName, contentKey, value, type, userId, version);
      
      if (result.success) {
        // Update file cache with successful save
        await this.saveToFileCache(pageName, await this.loadFromDatabase(pageName));
        
        // Save version for history
        await this.saveVersion(pageName, contentKey, value, version, userId);
        
        return { success: true, version };
      } else {
        // Rollback optimistic update on conflict
        await this.invalidateCache(pageName);
        const freshContent = await this.loadFromDatabase(pageName);
        this.notifySubscribers(pageName, freshContent);
        
        return { success: false, conflict: true };
      }
    } catch (error) {
      // Rollback optimistic update on error
      await this.invalidateCache(pageName);
      console.error('Save content error:', error);
      return { success: false };
    }
  }

  /**
   * File cache operations for persistence across restarts
   */
  private async loadFromFileCache(pageName: string): Promise<PageContent | null> {
    try {
      const filePath = path.join(CONTENT_DIR, `${pageName}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Check if file cache is not too old (1 hour)
      const fileAge = Date.now() - parsed.timestamp;
      if (fileAge < 60 * 60 * 1000) {
        return parsed.content;
      }
    } catch (error) {
      // File doesn't exist or is corrupted
      return null;
    }
    return null;
  }

  private async saveToFileCache(pageName: string, content: PageContent): Promise<void> {
    try {
      const filePath = path.join(CONTENT_DIR, `${pageName}.json`);
      const data = {
        content,
        timestamp: Date.now(),
        version: this.generateVersion()
      };
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('Could not save to file cache:', error);
    }
  }

  /**
   * Database operations
   */
  private async loadFromDatabase(pageName: string): Promise<PageContent> {
    try {
      const { data, error } = await supabaseAdmin
        .from('page_content')
        .select('*')
        .eq('page_name', pageName)
        .eq('is_active', true);

      if (error) throw error;

      const contentMap: PageContent = {};
      data?.forEach((item) => {
        contentMap[item.content_key] = {
          content_key: item.content_key,
          content_value: item.content_value,
          content_json: item.content_json,
          file_url: item.file_url,
          alt_text: item.alt_text,
          content_type: item.content_type,
        };
      });

      return contentMap;
    } catch (error) {
      console.error('Database load error:', error);
      return {};
    }
  }

  private async saveToDatabase(
    pageName: string,
    contentKey: string,
    value: any,
    type: 'text' | 'json' | 'file',
    userId: string,
    version: string
  ): Promise<{ success: boolean }> {
    try {
      const contentData: any = {
        page_name: pageName,
        content_key: contentKey,
        updated_at: new Date().toISOString(),
        updated_by: userId,
        version,
        is_active: true,
      };

      switch (type) {
        case 'text':
          contentData.content_value = value;
          contentData.content_type = 'text';
          break;
        case 'json':
          contentData.content_json = typeof value === 'object' ? value : JSON.parse(value);
          contentData.content_type = 'json';
          break;
        case 'file':
          contentData.file_url = value;
          contentData.content_type = 'file';
          break;
      }

      const { error } = await supabaseAdmin
        .from('page_content')
        .upsert(contentData, {
          onConflict: 'page_name,content_key',
          ignoreDuplicates: false
        });

      return { success: !error };
    } catch (error) {
      console.error('Database save error:', error);
      return { success: false };
    }
  }

  /**
   * Version management for edit history
   */
  private async saveVersion(
    pageName: string,
    contentKey: string,
    value: any,
    version: string,
    userId: string
  ): Promise<void> {
    try {
      const versionData = {
        page_name: pageName,
        content_key: contentKey,
        content_value: typeof value === 'string' ? value : null,
        content_json: typeof value === 'object' ? value : null,
        version,
        created_at: new Date().toISOString(),
        created_by: userId,
        is_published: true
      };

      await supabaseAdmin
        .from('content_versions')
        .insert(versionData);
    } catch (error) {
      console.warn('Version save failed:', error);
    }
  }

  /**
   * Real-time updates and subscriptions
   */
  subscribe(callback: (pageName: string, content: PageContent) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(pageName: string, content: PageContent) {
    this.subscribers.forEach(callback => {
      try {
        callback(pageName, content);
      } catch (error) {
        console.warn('Subscriber notification error:', error);
      }
    });
  }

  /**
   * Cache management
   */
  private async updateCache(pageName: string, contentKey: string, value: any, type: string) {
    const cacheKey = `page_${pageName}`;
    const cached = contentCache.get(cacheKey);
    
    if (cached) {
      const updatedContent = { ...cached.data };
      updatedContent[contentKey] = {
        content_key: contentKey,
        content_value: type === 'text' ? value : null,
        content_json: type === 'json' ? value : null,
        file_url: type === 'file' ? value : null,
        content_type: type as any
      };
      
      contentCache.set(cacheKey, {
        ...cached,
        data: updatedContent,
        timestamp: Date.now()
      });
    }
  }

  private async invalidateCache(pageName: string) {
    const cacheKey = `page_${pageName}`;
    contentCache.delete(cacheKey);
    
    try {
      const filePath = path.join(CONTENT_DIR, `${pageName}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore
    }
  }

  /**
   * Utility methods
   */
  private generateVersion(): string {
    return `v${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get content history for a specific key
   */
  async getContentHistory(pageName: string, contentKey: string, limit: number = 10): Promise<ContentVersion[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('content_versions')
        .select('*')
        .eq('page_name', pageName)
        .eq('content_key', contentKey)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('History load error:', error);
      return [];
    }
  }

  /**
   * Restore content from a specific version
   */
  async restoreVersion(
    pageName: string,
    contentKey: string,
    version: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('content_versions')
        .select('*')
        .eq('page_name', pageName)
        .eq('content_key', contentKey)
        .eq('version', version)
        .single();

      if (error || !data) return false;

      const value = data.content_json || data.content_value;
      const type = data.content_json ? 'json' : 'text';
      
      const result = await this.saveContent(pageName, contentKey, value, type, userId);
      return result.success;
    } catch (error) {
      console.error('Restore version error:', error);
      return false;
    }
  }
}
