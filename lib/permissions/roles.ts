/**
 * Role definitions and permission mappings
 */

import { RoleDefinition, UserRole, Permission } from './types';

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  admin: {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: [
      // Content permissions
      'content.create',
      'content.read',
      'content.update',
      'content.delete',
      // Component permissions
      'component.create',
      'component.read',
      'component.update',
      'component.delete',
      'component.move',
      // Page permissions
      'page.create',
      'page.read',
      'page.update',
      'page.delete',
      'page.publish',
      // Navigation permissions
      'navigation.create',
      'navigation.read',
      'navigation.update',
      'navigation.delete',
      'navigation.reorder',
      // System permissions
      'system.admin',
      'system.audit',
      'system.manage_users',
      'system.manage_permissions'
    ]
  },
  
  editor: {
    name: 'editor',
    displayName: 'Editor',
    description: 'Can edit existing content but cannot create or delete pages',
    permissions: [
      // Content permissions
      'content.read',
      'content.update',
      // Component permissions
      'component.read',
      'component.update',
      'component.move',
      // Page permissions
      'page.read',
      'page.update',
      // Navigation permissions
      'navigation.read',
      'navigation.update'
    ]
  },
  
  viewer: {
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Can view edit mode but cannot make changes',
    permissions: [
      // Content permissions
      'content.read',
      // Component permissions
      'component.read',
      // Page permissions
      'page.read',
      // Navigation permissions
      'navigation.read'
    ]
  },
  
  guest: {
    name: 'guest',
    displayName: 'Guest',
    description: 'No editing permissions',
    permissions: []
  }
};

/**
 * Get all permissions for a role, including inherited permissions
 */
export function getRolePermissions(role: UserRole): Permission[] {
  const roleDefinition = ROLE_DEFINITIONS[role];
  if (!roleDefinition) {
    return [];
  }
  
  let permissions = [...roleDefinition.permissions];
  
  // Add inherited permissions
  if (roleDefinition.inherits) {
    for (const inheritedRole of roleDefinition.inherits) {
      permissions = [...permissions, ...getRolePermissions(inheritedRole)];
    }
  }
  
  // Remove duplicates
  return [...new Set(permissions)];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * Get the minimum role required for a permission
 */
export function getMinimumRoleForPermission(permission: Permission): UserRole | null {
  const roles: UserRole[] = ['guest', 'viewer', 'editor', 'admin'];
  
  for (const role of roles) {
    if (roleHasPermission(role, permission)) {
      return role;
    }
  }
  
  return null;
}

/**
 * Check if one role is higher than another
 */
export function isRoleHigherThan(role1: UserRole, role2: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    guest: 0,
    viewer: 1,
    editor: 2,
    admin: 3
  };
  
  return roleHierarchy[role1] > roleHierarchy[role2];
}