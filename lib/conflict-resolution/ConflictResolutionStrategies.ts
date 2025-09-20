/**
 * ConflictResolutionStrategies - Implementation of different conflict resolution approaches
 * Includes accept remote, keep local, merge, and three-way merge with operational transformation
 */

import { 
  ConflictResolution, 
  ConflictItem, 
  MergeResult,
  ConflictClassification 
} from './types';

export interface ResolutionContext {
  userId: string;
  sessionId?: string;
  timestamp: string;
  userPreferences?: {
    defaultStrategy?: ConflictResolution['strategy'];
    autoResolveThreshold?: number;
  };
}

export class ConflictResolutionStrategies {
  /**
   * Accept remote changes - discard local changes and use remote version
   */
  async acceptRemoteChanges(
    conflict: ConflictItem,
    context: ResolutionContext
  ): Promise<ConflictResolution> {
    try {
      console.log(`Accepting remote changes for conflict ${conflict.id}`);
      
      return {
        strategy: 'accept_remote',
        resolvedValue: conflict.remoteVersion,
        resolvedBy: context.userId,
        resolvedAt: context.timestamp,
        notes: 'Local changes discarded in favor of remote version'
      };
    } catch (error) {
      throw new Error(`Failed to accept remote changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Keep local changes - override remote with local version
   */
  async keepLocalChanges(
    conflict: ConflictItem,
    context: ResolutionContext,
    forceOverride: boolean = false
  ): Promise<ConflictResolution> {
    try {
      console.log(`Keeping local changes for conflict ${conflict.id}`);
      
      // For keep local strategy, we need to ensure the server accepts the override
      if (!forceOverride) {
        // Validate that the user has permission to override
        const canOverride = await this.validateOverridePermission(conflict, context.userId);
        if (!canOverride) {
          throw new Error('Insufficient permissions to override remote changes');
        }
      }

      return {
        strategy: 'keep_local',
        resolvedValue: conflict.localVersion,
        resolvedBy: context.userId,
        resolvedAt: context.timestamp,
        notes: forceOverride ? 
          'Remote changes overridden by admin action' : 
          'Local changes preserved after validation'
      };
    } catch (error) {
      throw new Error(`Failed to keep local changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Simple merge for compatible changes
   */
  async mergeChanges(
    conflict: ConflictItem,
    context: ResolutionContext
  ): Promise<ConflictResolution> {
    try {
      console.log(`Attempting merge for conflict ${conflict.id}`);
      
      let mergeResult: MergeResult;

      if (conflict.type === 'content') {
        mergeResult = await this.mergeContentChanges(
          conflict.localVersion,
          conflict.remoteVersion,
          conflict.contentKey
        );
      } else {
        mergeResult = await this.mergeStructuralChanges(
          conflict.localVersion,
          conflict.remoteVersion,
          conflict.componentId
        );
      }

      if (!mergeResult.success) {
        throw new Error(`Merge failed: ${mergeResult.conflicts?.join(', ')}`);
      }

      return {
        strategy: 'merge',
        resolvedValue: mergeResult.mergedValue,
        mergeResult,
        resolvedBy: context.userId,
        resolvedAt: context.timestamp,
        notes: `Automatic merge completed${mergeResult.warnings?.length ? ` with ${mergeResult.warnings.length} warnings` : ''}`
      };
    } catch (error) {
      throw new Error(`Failed to merge changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Three-way merge with operational transformation for text content
   */
  async threeWayMerge(
    conflict: ConflictItem,
    context: ResolutionContext,
    baseVersion?: any
  ): Promise<ConflictResolution> {
    try {
      console.log(`Performing three-way merge for conflict ${conflict.id}`);
      
      // If no base version provided, try to fetch it
      if (!baseVersion) {
        baseVersion = await this.getBaseVersion(conflict);
      }

      let mergeResult: MergeResult;

      if (typeof conflict.localVersion === 'string' && typeof conflict.remoteVersion === 'string') {
        // Text-based three-way merge with operational transformation
        mergeResult = await this.performTextThreeWayMerge(
          baseVersion || '',
          conflict.localVersion,
          conflict.remoteVersion
        );
      } else if (typeof conflict.localVersion === 'object' && typeof conflict.remoteVersion === 'object') {
        // Object-based three-way merge
        mergeResult = await this.performObjectThreeWayMerge(
          baseVersion || {},
          conflict.localVersion,
          conflict.remoteVersion
        );
      } else {
        throw new Error('Incompatible types for three-way merge');
      }

      return {
        strategy: 'three_way_merge',
        resolvedValue: mergeResult.mergedValue,
        mergeResult,
        resolvedBy: context.userId,
        resolvedAt: context.timestamp,
        notes: `Three-way merge completed${mergeResult.conflicts?.length ? ` with ${mergeResult.conflicts.length} conflicts` : ''}`
      };
    } catch (error) {
      throw new Error(`Failed to perform three-way merge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auto-resolve conflicts based on classification
   */
  async autoResolve(
    conflict: ConflictItem,
    classification: ConflictClassification,
    context: ResolutionContext
  ): Promise<ConflictResolution | null> {
    if (!classification.autoResolvable) {
      return null;
    }

    try {
      switch (classification.suggestedStrategy) {
        case 'accept_remote':
          return await this.acceptRemoteChanges(conflict, context);
        
        case 'keep_local':
          return await this.keepLocalChanges(conflict, context);
        
        case 'merge':
          return await this.mergeChanges(conflict, context);
        
        case 'three_way_merge':
          return await this.threeWayMerge(conflict, context);
        
        default:
          return null;
      }
    } catch (error) {
      console.error('Auto-resolution failed:', error);
      return null;
    }
  }

  /**
   * Merge content changes (text, JSON, etc.)
   */
  private async mergeContentChanges(
    localValue: any,
    remoteValue: any,
    contentKey?: string
  ): Promise<MergeResult> {
    // String content merge
    if (typeof localValue === 'string' && typeof remoteValue === 'string') {
      return this.mergeTextContent(localValue, remoteValue);
    }

    // JSON/Object content merge
    if (typeof localValue === 'object' && typeof remoteValue === 'object') {
      return this.mergeObjectContent(localValue, remoteValue);
    }

    // Array content merge
    if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
      return this.mergeArrayContent(localValue, remoteValue);
    }

    // Incompatible types - cannot merge
    return {
      success: false,
      mergedValue: null,
      conflicts: ['Incompatible data types cannot be merged'],
      warnings: []
    };
  }

  /**
   * Merge structural changes (component positions, properties, etc.)
   */
  private async mergeStructuralChanges(
    localChange: any,
    remoteChange: any,
    componentId: string
  ): Promise<MergeResult> {
    const warnings: string[] = [];
    const conflicts: string[] = [];

    try {
      // Position changes
      if (localChange.position && remoteChange.position) {
        const positionMerge = this.mergePositions(localChange.position, remoteChange.position);
        if (!positionMerge.success) {
          conflicts.push('Position conflicts detected');
        }
      }

      // Property changes
      if (localChange.properties && remoteChange.properties) {
        const propMerge = this.mergeObjectContent(localChange.properties, remoteChange.properties);
        if (!propMerge.success) {
          conflicts.push('Property conflicts detected');
        }
      }

      // If no conflicts, merge successfully
      if (conflicts.length === 0) {
        return {
          success: true,
          mergedValue: {
            ...localChange,
            ...remoteChange,
            // Merge timestamp to show both changes
            mergedAt: new Date().toISOString()
          },
          conflicts: [],
          warnings
        };
      }

      return {
        success: false,
        mergedValue: null,
        conflicts,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        mergedValue: null,
        conflicts: [`Structural merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      };
    }
  }

  /**
   * Text content merge using simple line-based approach
   */
  private mergeTextContent(localText: string, remoteText: string): MergeResult {
    // Simple implementation - can be enhanced with more sophisticated algorithms
    const localLines = localText.split('\n');
    const remoteLines = remoteText.split('\n');
    
    // If texts are identical, no merge needed
    if (localText === remoteText) {
      return {
        success: true,
        mergedValue: localText,
        conflicts: [],
        warnings: []
      };
    }

    // Simple append strategy for now - can be enhanced
    const mergedText = localText + '\n' + remoteText;
    
    return {
      success: true,
      mergedValue: mergedText,
      conflicts: [],
      warnings: ['Simple text merge performed - manual review recommended']
    };
  }

  /**
   * Object content merge
   */
  private mergeObjectContent(localObj: any, remoteObj: any): MergeResult {
    const merged = { ...localObj };
    const conflicts: string[] = [];
    const warnings: string[] = [];

    for (const key in remoteObj) {
      if (key in localObj) {
        // Key exists in both - check for conflicts
        if (JSON.stringify(localObj[key]) !== JSON.stringify(remoteObj[key])) {
          if (typeof localObj[key] === 'object' && typeof remoteObj[key] === 'object') {
            // Recursive merge for nested objects
            const nestedMerge = this.mergeObjectContent(localObj[key], remoteObj[key]);
            if (nestedMerge.success) {
              merged[key] = nestedMerge.mergedValue;
              warnings.push(...nestedMerge.warnings || []);
            } else {
              conflicts.push(`Conflict in nested object: ${key}`);
            }
          } else {
            // Use remote value for conflicts (can be made configurable)
            merged[key] = remoteObj[key];
            warnings.push(`Conflict resolved by using remote value for: ${key}`);
          }
        }
      } else {
        // Key only exists in remote - add it
        merged[key] = remoteObj[key];
      }
    }

    return {
      success: conflicts.length === 0,
      mergedValue: merged,
      conflicts,
      warnings
    };
  }

  /**
   * Array content merge
   */
  private mergeArrayContent(localArray: any[], remoteArray: any[]): MergeResult {
    // Simple union merge - can be enhanced with more sophisticated strategies
    const merged = [...localArray];
    const warnings: string[] = [];

    for (const item of remoteArray) {
      // Check if item already exists (simple equality check)
      const exists = merged.some(existing => 
        JSON.stringify(existing) === JSON.stringify(item)
      );
      
      if (!exists) {
        merged.push(item);
      }
    }

    if (merged.length !== localArray.length) {
      warnings.push(`Array merge added ${merged.length - localArray.length} items from remote`);
    }

    return {
      success: true,
      mergedValue: merged,
      conflicts: [],
      warnings
    };
  }

  /**
   * Three-way text merge with operational transformation
   */
  private async performTextThreeWayMerge(
    base: string,
    local: string,
    remote: string
  ): Promise<MergeResult> {
    try {
      // Calculate operations from base to local and base to remote
      const localOps = this.calculateTextOperations(base, local);
      const remoteOps = this.calculateTextOperations(base, remote);

      // Transform operations to resolve conflicts
      const transformedOps = this.transformOperations(localOps, remoteOps);

      // Apply transformed operations to base
      const mergedText = this.applyOperations(base, transformedOps);

      return {
        success: true,
        mergedValue: mergedText,
        conflicts: [],
        warnings: transformedOps.conflicts.length > 0 ? 
          [`${transformedOps.conflicts.length} text conflicts auto-resolved`] : []
      };
    } catch (error) {
      return {
        success: false,
        mergedValue: null,
        conflicts: [`Three-way text merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Three-way object merge
   */
  private async performObjectThreeWayMerge(
    base: any,
    local: any,
    remote: any
  ): Promise<MergeResult> {
    const merged = { ...base };
    const conflicts: string[] = [];
    const warnings: string[] = [];

    // Get all keys from all versions
    const allKeys = new Set([
      ...Object.keys(base || {}),
      ...Object.keys(local || {}),
      ...Object.keys(remote || {})
    ]);

    for (const key of allKeys) {
      const baseValue = base?.[key];
      const localValue = local?.[key];
      const remoteValue = remote?.[key];

      // Key added in both local and remote
      if (baseValue === undefined && localValue !== undefined && remoteValue !== undefined) {
        if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
          merged[key] = localValue;
        } else {
          conflicts.push(`Key '${key}' added with different values in local and remote`);
          merged[key] = localValue; // Prefer local for now
        }
      }
      // Key modified in both local and remote
      else if (baseValue !== undefined && localValue !== undefined && remoteValue !== undefined) {
        if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
          merged[key] = localValue;
        } else if (JSON.stringify(baseValue) === JSON.stringify(localValue)) {
          // Only remote changed
          merged[key] = remoteValue;
        } else if (JSON.stringify(baseValue) === JSON.stringify(remoteValue)) {
          // Only local changed
          merged[key] = localValue;
        } else {
          // Both changed differently
          conflicts.push(`Key '${key}' modified differently in local and remote`);
          merged[key] = localValue; // Prefer local for now
        }
      }
      // Key deleted in one version
      else if (baseValue !== undefined && (localValue === undefined || remoteValue === undefined)) {
        if (localValue === undefined && remoteValue === undefined) {
          // Deleted in both - remove from merged
          delete merged[key];
        } else if (localValue === undefined) {
          // Deleted in local, check if remote modified
          if (JSON.stringify(baseValue) === JSON.stringify(remoteValue)) {
            delete merged[key]; // Respect deletion
          } else {
            conflicts.push(`Key '${key}' deleted locally but modified remotely`);
            merged[key] = remoteValue;
          }
        } else {
          // Deleted in remote, check if local modified
          if (JSON.stringify(baseValue) === JSON.stringify(localValue)) {
            delete merged[key]; // Respect deletion
          } else {
            conflicts.push(`Key '${key}' deleted remotely but modified locally`);
            merged[key] = localValue;
          }
        }
      }
      // Key only in local or remote
      else if (localValue !== undefined) {
        merged[key] = localValue;
      } else if (remoteValue !== undefined) {
        merged[key] = remoteValue;
      }
    }

    return {
      success: conflicts.length === 0,
      mergedValue: merged,
      conflicts,
      warnings
    };
  }

  /**
   * Simple position merge logic
   */
  private mergePositions(localPos: any, remotePos: any): { success: boolean; merged?: any } {
    // If positions are identical, no conflict
    if (JSON.stringify(localPos) === JSON.stringify(remotePos)) {
      return { success: true, merged: localPos };
    }

    // Simple strategy: prefer the position with higher order (later in sequence)
    if (localPos.order !== undefined && remotePos.order !== undefined) {
      return {
        success: true,
        merged: localPos.order > remotePos.order ? localPos : remotePos
      };
    }

    return { success: false };
  }

  /**
   * Calculate text operations (simplified implementation)
   */
  private calculateTextOperations(from: string, to: string): Array<{ type: 'insert' | 'delete' | 'retain'; text?: string; length?: number; position: number }> {
    // Simplified diff algorithm - in production, use a proper diff library
    const operations: Array<{ type: 'insert' | 'delete' | 'retain'; text?: string; length?: number; position: number }> = [];
    
    if (from === to) {
      return operations;
    }

    // Very basic implementation - replace entire text
    if (from.length > 0) {
      operations.push({ type: 'delete', length: from.length, position: 0 });
    }
    if (to.length > 0) {
      operations.push({ type: 'insert', text: to, position: 0 });
    }

    return operations;
  }

  /**
   * Transform operations for operational transformation
   */
  private transformOperations(
    localOps: Array<{ type: 'insert' | 'delete' | 'retain'; text?: string; length?: number; position: number }>,
    remoteOps: Array<{ type: 'insert' | 'delete' | 'retain'; text?: string; length?: number; position: number }>
  ): { operations: Array<{ type: 'insert' | 'delete' | 'retain'; text?: string; length?: number; position: number }>; conflicts: string[] } {
    // Simplified transformation - in production, use a proper OT library
    const conflicts: string[] = [];
    const operations = [...localOps, ...remoteOps];

    // Check for conflicts
    for (const localOp of localOps) {
      for (const remoteOp of remoteOps) {
        if (localOp.position === remoteOp.position && localOp.type !== remoteOp.type) {
          conflicts.push(`Operation conflict at position ${localOp.position}`);
        }
      }
    }

    return { operations, conflicts };
  }

  /**
   * Apply operations to text
   */
  private applyOperations(
    text: string,
    opsResult: { operations: Array<{ type: 'insert' | 'delete' | 'retain'; text?: string; length?: number; position: number }>; conflicts: string[] }
  ): string {
    let result = text;
    
    // Sort operations by position (reverse order for proper application)
    const sortedOps = opsResult.operations.sort((a, b) => b.position - a.position);

    for (const op of sortedOps) {
      switch (op.type) {
        case 'insert':
          if (op.text) {
            result = result.slice(0, op.position) + op.text + result.slice(op.position);
          }
          break;
        case 'delete':
          if (op.length) {
            result = result.slice(0, op.position) + result.slice(op.position + op.length);
          }
          break;
        // 'retain' operations don't modify the text
      }
    }

    return result;
  }

  /**
   * Get base version for three-way merge
   */
  private async getBaseVersion(conflict: ConflictItem): Promise<any> {
    try {
      const response = await fetch(`/api/content/base-version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageName: conflict.pageName,
          contentKey: conflict.contentKey,
          componentId: conflict.componentId
        })
      });

      if (!response.ok) {
        console.warn('Could not fetch base version, using empty base');
        return null;
      }

      const data = await response.json();
      return data.baseVersion;
    } catch (error) {
      console.warn('Error fetching base version:', error);
      return null;
    }
  }

  /**
   * Validate override permission
   */
  private async validateOverridePermission(conflict: ConflictItem, userId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/permissions/validate-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          conflictId: conflict.id,
          pageName: conflict.pageName
        })
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.canOverride === true;
    } catch (error) {
      console.error('Error validating override permission:', error);
      return false;
    }
  }
}