// Navigation management system
export { 
  NavigationManager, 
  createNavigationManager,
  NavigationPermissions
} from './NavigationManager';

export type {
  NavigationPermissions as NavigationPermissionsType,
  NavigationManagerConfig,
  NavigationOperationResult,
  NavigationReorderOperation
} from './NavigationManager';

// Re-export navigation-related types from realtime
export type { NavigationItem, NavigationUpdateEventData } from '../realtime/types';