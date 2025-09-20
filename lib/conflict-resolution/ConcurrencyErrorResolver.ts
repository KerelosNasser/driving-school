/**
 * ConcurrencyErrorResolver - Core conflict detection engine
 * Handles version comparison, conflict identification, and metadata collection
 */

import { 
  ConflictDetectionResult, 
  ConflictMetadata, 
  ConflictItem, 
  VersionInfo, 
  ContentVersion,
  StructuralChange,
  ConflictDetectionOptions,
  ConflictClassification
} from './types';

export class ConcurrencyErrorResolver {
  private options: ConflictDetectionOptions;
  private versionCache: Map<string, VersionInfo> = new Map();
  private conflictHistory: Map<string, ConflictItem[]> = new Map();

  constructor(options: Partial<ConflictDetectionOptions> = {}) {
    this.options = {
      enableVersionChecking: true,
      enableChecksumValidation: true,
      enableSessionTracking: true,
      conflictTimeoutMs: 30000, // 30 seconds
      maxConflictHistory: 100,
      ...options
    };
  }

  /**
   * Detect conflicts for content changes
   */
  async detectConflict(
    pageName: string,
    contentKey: string,
    expectedVersion: string,
    currentValue?: any,
    userId?: string,
    sessionId?: string
  ): Promise<ConflictDetectionResult> {
    try {
      // Get current version from database/cache
      const currentVersion = await this.getCurrentVersion(pageName, contentKey);
      
      if (!currentVersion) {
        // No existing version, no conflict
        return { hasConflict: false };
      }

      // Version mismatch detection
      if (this.options.enableVersionChecking && currentVersion.version !== expectedVersion) {
        const metadata = await this.collectConflictMetadata(
          pageName,
          contentKey,
          'content',
          currentVersion.userId,
          currentVersion.timestamp,
          'Version mismatch detected'
        );

        return {
          hasConflict: true,
          conflictType: 'version_mismatch',
          currentVersion: currentVersion.version,
          expectedVersion,
          conflictedBy: currentVersion.userId,
          conflictedAt: currentVersion.timestamp,
          metadata
        };
      }

      // Checksum validation for data integrity
      if (this.options.enableChecksumValidation && currentValue) {
        const currentChecksum = this.calculateChecksum(currentValue);
        if (currentVersion.checksum && currentVersion.checksum !== currentChecksum) {
          const metadata = await this.collectConflictMetadata(
            pageName,
            contentKey,
            'content',
            currentVersion.userId,
            currentVersion.timestamp,
            'Data integrity check failed'
          );

          return {
            hasConflict: true,
            conflictType: 'concurrent_edit',
            currentVersion: currentVersion.version,
            expectedVersion,
            conflictedBy: currentVersion.userId,
            conflictedAt: currentVersion.timestamp,
            metadata
          };
        }
      }

      // Session-based conflict detection
      if (this.options.enableSessionTracking && sessionId) {
        const sessionConflict = await this.detectSessionConflict(
          pageName,
          contentKey,
          sessionId,
          userId
        );

        if (sessionConflict.hasConflict) {
          return sessionConflict;
        }
      }

      return { hasConflict: false };

    } catch (error) {
      console.error('Error detecting conflict:', error);
      throw new Error(`Conflict detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect structural conflicts (component operations)
   */
  async detectStructuralConflict(
    change: StructuralChange,
    expectedState?: any,
    userId?: string,
    sessionId?: string
  ): Promise<ConflictDetectionResult> {
    try {
      const { pageName, componentId, type } = change;
      
      // Check for concurrent structural changes
      const recentChanges = await this.getRecentStructuralChanges(pageName, componentId);
      
      if (recentChanges.length > 0) {
        const lastChange = recentChanges[0];
        const timeDiff = Date.now() - new Date(lastChange.timestamp).getTime();
        
        // If there was a recent change within the conflict timeout
        if (timeDiff < this.options.conflictTimeoutMs) {
          const metadata = await this.collectConflictMetadata(
            pageName,
            componentId || 'unknown',
            'structure',
            lastChange.userId,
            lastChange.timestamp,
            `Concurrent ${type} operation detected`
          );

          return {
            hasConflict: true,
            conflictType: 'structure_conflict',
            conflictedBy: lastChange.userId,
            conflictedAt: lastChange.timestamp,
            metadata
          };
        }
      }

      return { hasConflict: false };

    } catch (error) {
      console.error('Error detecting structural conflict:', error);
      throw new Error(`Structural conflict detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Classify conflict type and severity
   */
  classifyConflict(conflictItem: ConflictItem): ConflictClassification {
    const { type, localVersion, remoteVersion, metadata } = conflictItem;

    // Determine severity based on conflict type and content
    let severity: ConflictClassification['severity'] = 'medium';
    let autoResolvable = false;
    let requiresUserInput = true;
    let suggestedStrategy: ConflictClassification['suggestedStrategy'] = 'accept_remote';

    if (type === 'content') {
      // Text content conflicts
      if (typeof localVersion === 'string' && typeof remoteVersion === 'string') {
        const similarity = this.calculateStringSimilarity(localVersion, remoteVersion);
        
        if (similarity > 0.9) {
          severity = 'low';
          autoResolvable = true;
          requiresUserInput = false;
          suggestedStrategy = 'merge';
        } else if (similarity > 0.7) {
          severity = 'medium';
          suggestedStrategy = 'three_way_merge';
        } else {
          severity = 'high';
          suggestedStrategy = 'keep_local';
        }
      }
      
      // JSON/Object conflicts
      else if (typeof localVersion === 'object' && typeof remoteVersion === 'object') {
        const hasStructuralChanges = this.hasStructuralDifferences(localVersion, remoteVersion);
        
        if (hasStructuralChanges) {
          severity = 'high';
          suggestedStrategy = 'keep_local';
        } else {
          severity = 'medium';
          autoResolvable = true;
          requiresUserInput = false;
          suggestedStrategy = 'merge';
        }
      }
    } else if (type === 'structure') {
      // Structural conflicts are generally more serious
      severity = 'high';
      
      if (metadata.changeType === 'position') {
        // Position conflicts might be auto-resolvable
        autoResolvable = true;
        requiresUserInput = false;
        suggestedStrategy = 'accept_remote';
      } else {
        // Component add/delete conflicts need user input
        requiresUserInput = true;
        suggestedStrategy = 'keep_local';
      }
    }

    return {
      severity,
      category: type === 'content' ? 'content' : 'structure',
      autoResolvable,
      requiresUserInput,
      suggestedStrategy
    };
  }

  /**
   * Get current version information
   */
  private async getCurrentVersion(pageName: string, contentKey: string): Promise<VersionInfo | null> {
    const cacheKey = `${pageName}:${contentKey}`;
    
    // Check cache first
    if (this.versionCache.has(cacheKey)) {
      return this.versionCache.get(cacheKey)!;
    }

    try {
      // Fetch from API
      const response = await fetch(`/api/content/version?page=${encodeURIComponent(pageName)}&key=${encodeURIComponent(contentKey)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Content doesn't exist yet
        }
        throw new Error(`Failed to fetch version: ${response.statusText}`);
      }

      const versionInfo: VersionInfo = await response.json();
      
      // Cache the result
      this.versionCache.set(cacheKey, versionInfo);
      
      return versionInfo;
    } catch (error) {
      console.error('Error fetching current version:', error);
      return null;
    }
  }

  /**
   * Get recent structural changes for conflict detection
   */
  private async getRecentStructuralChanges(pageName: string, componentId?: string): Promise<Array<{ userId: string; timestamp: string; type: string }>> {
    try {
      const params = new URLSearchParams({
        page: pageName,
        since: new Date(Date.now() - this.options.conflictTimeoutMs).toISOString()
      });
      
      if (componentId) {
        params.append('componentId', componentId);
      }

      const response = await fetch(`/api/content/recent-changes?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recent changes: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching recent changes:', error);
      return [];
    }
  }

  /**
   * Detect session-based conflicts
   */
  private async detectSessionConflict(
    pageName: string,
    contentKey: string,
    sessionId: string,
    userId?: string
  ): Promise<ConflictDetectionResult> {
    try {
      const response = await fetch('/api/edit-sessions/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageName, contentKey, excludeSession: sessionId })
      });

      if (!response.ok) {
        return { hasConflict: false };
      }

      const activeSessions = await response.json();
      
      if (activeSessions.length > 0) {
        const conflictingSession = activeSessions[0];
        const metadata = await this.collectConflictMetadata(
          pageName,
          contentKey,
          'content',
          conflictingSession.userId,
          conflictingSession.lastActivity,
          'Concurrent editing session detected'
        );

        return {
          hasConflict: true,
          conflictType: 'concurrent_edit',
          conflictedBy: conflictingSession.userId,
          conflictedAt: conflictingSession.lastActivity,
          metadata
        };
      }

      return { hasConflict: false };
    } catch (error) {
      console.error('Error detecting session conflict:', error);
      return { hasConflict: false };
    }
  }

  /**
   * Collect comprehensive conflict metadata
   */
  private async collectConflictMetadata(
    pageName: string,
    componentId: string,
    changeType: ConflictMetadata['changeType'],
    conflictedBy: string,
    conflictedAt: string,
    description: string
  ): Promise<ConflictMetadata> {
    return {
      who: conflictedBy,
      when: conflictedAt,
      what: description,
      changeType,
      componentId,
      pageName,
      sessionId: this.getCurrentSessionId(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ipAddress: await this.getCurrentUserIP()
    };
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: any): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Calculate string similarity for conflict classification
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance for string comparison
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Check for structural differences in objects
   */
  private hasStructuralDifferences(obj1: any, obj2: any): boolean {
    if (typeof obj1 !== typeof obj2) return true;
    if (obj1 === null || obj2 === null) return obj1 !== obj2;
    if (typeof obj1 !== 'object') return obj1 !== obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return true;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return true;
      if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
        if (this.hasStructuralDifferences(obj1[key], obj2[key])) return true;
      }
    }
    
    return false;
  }

  /**
   * Get current session ID (implementation depends on session management)
   */
  private getCurrentSessionId(): string | undefined {
    // This would typically come from your session management system
    // For now, return undefined or implement based on your session strategy
    return typeof window !== 'undefined' ? 
      sessionStorage.getItem('editSessionId') || undefined : 
      undefined;
  }

  /**
   * Get current user IP (for audit purposes)
   */
  private async getCurrentUserIP(): Promise<string | undefined> {
    try {
      // This would typically be handled server-side for security
      // Client-side IP detection is not reliable and can be spoofed
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Clear version cache (useful for testing or manual refresh)
   */
  public clearCache(): void {
    this.versionCache.clear();
  }

  /**
   * Get conflict history for a specific item
   */
  public getConflictHistory(key: string): ConflictItem[] {
    return this.conflictHistory.get(key) || [];
  }

  /**
   * Add conflict to history
   */
  public addToHistory(key: string, conflict: ConflictItem): void {
    const history = this.conflictHistory.get(key) || [];
    history.unshift(conflict);
    
    // Limit history size
    if (history.length > this.options.maxConflictHistory) {
      history.splice(this.options.maxConflictHistory);
    }
    
    this.conflictHistory.set(key, history);
  }
}