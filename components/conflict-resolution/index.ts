/**
 * Conflict Resolution UI Components
 * 
 * This module provides React components for handling conflict resolution in the
 * real-time collaborative editing system.
 */

export { ConflictDialog } from './ConflictDialog';
export { ConflictDiffView } from './ConflictDiffView';
export { ConflictNotification, ConflictIndicator } from './ConflictNotification';

// Re-export types for convenience
export type {
  ConflictItem,
  ConflictResolution,
  ConflictClassification,
  ConflictMetadata,
  MergeResult
} from '@/lib/conflict-resolution/types';