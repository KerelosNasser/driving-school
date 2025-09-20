/**
 * React hook for permission management
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { permissionManager } from './PermissionManager';
import { 
  UserRole, 
  Permission, 
  PermissionCheckResult, 
  PermissionContext,
  Resource,
  Operation
} from './types';

interface UsePermissionsReturn {
  userRole: UserRole;
  hasPermission: (resource: Resource, operation: Operation) => boolean;
  checkPermission: (resource: Resource, operation: Operation, resourceId?: string) => Promise<PermissionCheckResult>;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canAdmin: boolean;
  isLoading: boolean;
  effectivePermissions: Permission[];
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [effectivePermissions, setEffectivePermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine user role from Clerk user data
  const getUserRole = useCallback((): UserRole => {
    if (!isLoaded || !user) return 'guest';
    
    // Check user metadata for role
    const role = user.publicMetadata?.role as UserRole;
    if (role && ['admin', 'editor', 'viewer', 'guest'].includes(role)) {
      return role;
    }
    
    // Default role logic (can be customized)
    if (process.env.NODE_ENV === 'development') {
      return 'admin'; // Allow admin in development
    }
    
    return 'guest';
  }, [user, isLoaded]);

  // Load user permissions
  const loadPermissions = useCallback(async () => {
    if (!isLoaded) return;
    
    setIsLoading(true);
    try {
      const role = getUserRole();
      setUserRole(role);
      
      if (user) {
        const permissions = await permissionManager.getEffectivePermissions(user.id, role);
        setEffectivePermissions(permissions);
      } else {
        setEffectivePermissions([]);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setEffectivePermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoaded, getUserRole]);

  // Load permissions on mount and when user changes
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Check if user has a specific permission
  const hasPermission = useCallback((resource: Resource, operation: Operation): boolean => {
    const permission = `${resource}.${operation}` as Permission;
    return effectivePermissions.includes(permission);
  }, [effectivePermissions]);

  // Async permission check with full context
  const checkPermission = useCallback(async (
    resource: Resource, 
    operation: Operation, 
    resourceId?: string
  ): Promise<PermissionCheckResult> => {
    if (!user) {
      return {
        allowed: false,
        reason: 'User not authenticated'
      };
    }

    const context: PermissionContext = {
      userId: user.id,
      userRole,
      resource,
      operation,
      resourceId
    };

    return permissionManager.checkPermission(context);
  }, [user, userRole]);

  // Convenience permission checks
  const canEdit = hasPermission('content', 'update') || 
                  hasPermission('component', 'update') || 
                  hasPermission('page', 'update');
                  
  const canCreate = hasPermission('content', 'create') || 
                   hasPermission('component', 'create') || 
                   hasPermission('page', 'create');
                   
  const canDelete = hasPermission('content', 'delete') || 
                   hasPermission('component', 'delete') || 
                   hasPermission('page', 'delete');
                   
  const canAdmin = hasPermission('system', 'admin');

  // Refresh permissions (useful after role changes)
  const refreshPermissions = useCallback(async () => {
    permissionManager.clearUserCache(user?.id);
    await loadPermissions();
  }, [user?.id, loadPermissions]);

  return {
    userRole,
    hasPermission,
    checkPermission,
    canEdit,
    canCreate,
    canDelete,
    canAdmin,
    isLoading,
    effectivePermissions,
    refreshPermissions
  };
}

/**
 * Hook for checking a specific permission
 */
export function usePermission(resource: Resource, operation: Operation) {
  const { hasPermission, checkPermission, isLoading } = usePermissions();
  
  const allowed = hasPermission(resource, operation);
  
  const checkAsync = useCallback((resourceId?: string) => {
    return checkPermission(resource, operation, resourceId);
  }, [checkPermission, resource, operation]);

  return {
    allowed,
    check: checkAsync,
    isLoading
  };
}

/**
 * Hook for role-based conditional rendering
 */
export function useRoleAccess(minimumRole: UserRole) {
  const { userRole, isLoading } = usePermissions();
  
  const roleHierarchy: Record<UserRole, number> = {
    guest: 0,
    viewer: 1,
    editor: 2,
    admin: 3
  };
  
  const hasAccess = roleHierarchy[userRole] >= roleHierarchy[minimumRole];
  
  return {
    hasAccess,
    userRole,
    isLoading
  };
}