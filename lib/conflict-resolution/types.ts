/**
 * Types and interfaces for the conflict resolution system
 */

export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflictType?: 'version_mismatch' | 'concurrent_edit' | 'structure_conflict';
  currentVersion?: string;
  expectedVersion?: string;
  conflictedBy?: string;
  conflictedAt?: string;
  metadata?: ConflictMetadata;
}

export interface ConflictMetadata {
  who: string;
  when: string;
  what: string;
  changeType: 'content' | 'structure' | 'position' | 'properties';
  componentId?: string;
  contentKey?: string;
  pageName: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ConflictItem {
  id: string;
  type: 'content' | 'structure';
  componentId: string;
  contentKey?: string;
  pageName: string;
  localVersion: any;
  remoteVersion: any;
  conflictedAt: string;
  conflictedBy: string;
  metadata: ConflictMetadata;
  status: 'pending' | 'resolving' | 'resolved';
}

export interface ConflictResolution {
  strategy: 'accept_remote' | 'keep_local' | 'merge' | 'three_way_merge';
  resolvedValue?: any;
  mergeResult?: MergeResult;
  resolvedBy: string;
  resolvedAt: string;
  notes?: string;
}

export interface MergeResult {
  success: boolean;
  mergedValue: any;
  conflicts?: string[];
  warnings?: string[];
}

export interface VersionInfo {
  version: string;
  timestamp: string;
  userId: string;
  sessionId?: string;
  checksum?: string;
}

export interface ContentVersion {
  contentKey: string;
  pageName: string;
  version: string;
  value: any;
  contentType: 'text' | 'json' | 'file';
  createdBy: string;
  createdAt: string;
  checksum: string;
}

export interface StructuralChange {
  type: 'component_add' | 'component_move' | 'component_delete' | 'page_create' | 'nav_update';
  componentId?: string;
  pageName: string;
  oldPosition?: any;
  newPosition?: any;
  properties?: Record<string, any>;
}

export interface ConflictDetectionOptions {
  enableVersionChecking: boolean;
  enableChecksumValidation: boolean;
  enableSessionTracking: boolean;
  conflictTimeoutMs: number;
  maxConflictHistory: number;
}

export interface ConflictClassification {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'content' | 'structure' | 'permission' | 'concurrent';
  autoResolvable: boolean;
  requiresUserInput: boolean;
  suggestedStrategy: ConflictResolution['strategy'];
}