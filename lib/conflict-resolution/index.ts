/**
 * Conflict Resolution System
 * 
 * This module provides a complete conflict resolution system for real-time collaborative editing.
 * It includes conflict detection, resolution strategies, and UI components.
 */

// Core classes
export { ConcurrencyErrorResolver } from './ConcurrencyErrorResolver';
export { ConflictResolutionStrategies } from './ConflictResolutionStrategies';

// Types and interfaces
export type {
  ConflictDetectionResult,
  ConflictMetadata,
  ConflictItem,
  ConflictResolution,
  MergeResult,
  VersionInfo,
  ContentVersion,
  StructuralChange,
  ConflictDetectionOptions,
  ConflictClassification
} from './types';

// Helper function to create a configured conflict resolver
export function createConflictResolver(options?: Partial<import('./types').ConflictDetectionOptions>) {
  return new ConcurrencyErrorResolver(options);
}

// Helper function to create resolution strategies handler
export function createResolutionStrategies() {
  return new ConflictResolutionStrategies();
}

// Utility function to classify conflicts
export function classifyConflict(
  conflict: import('./types').ConflictItem,
  resolver: ConcurrencyErrorResolver
): import('./types').ConflictClassification {
  return resolver.classifyConflict(conflict);
}