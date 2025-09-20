/**
 * Permission system types for role-based access control
 */

export type UserRole = 'admin' | 'editor' | 'viewer' | 'guest';

export type Permission = 
  // Content permissions
  | 'content.create'
  | 'content.read'
  | 'content.update'
  | 'content.delete'
  // Component permissions
  | 'component.create'
  | 'component.read'
  | 'component.update'
  | 'component.delete'
  | 'component.move'
  // Page permissions
  | 'page.create'
  | 'page.read'
  | 'page.update'
  | 'page.delete'
  | 'page.publish'
  // Navigation permissions
  | 'navigation.create'
  | 'navigation.read'
  | 'navigation.update'
  | 'navigation.delete'
  | 'navigation.reorder'
  // System permissions
  | 'system.admin'
  | 'system.audit'
  | 'system.manage_users'
  | 'system.manage_permissions';

export type Operation = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'move'
  | 'publish'
  | 'reorder'
  | 'admin'
  | 'audit'
  | 'manage_users'
  | 'manage_permissions';

export type Resource = 
  | 'content'
  | 'component'
  | 'page'
  | 'navigation'
  | 'system';

export interface PermissionRule {
  resource: Resource;
  operation: Operation;
  allowed: boolean;
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  type: 'owner' | 'role' | 'custom';
  value?: any;
  validator?: (context: PermissionContext) => boolean;
}

export interface PermissionContext {
  userId: string;
  userRole: UserRole;
  resource: Resource;
  operation: Operation;
  resourceId?: string;
  resourceOwnerId?: string;
  metadata?: Record<string, any>;
}

export interface RoleDefinition {
  name: UserRole;
  displayName: string;
  description: string;
  permissions: Permission[];
  inherits?: UserRole[];
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
}

export interface UserPermissions {
  userId: string;
  role: UserRole;
  customPermissions?: Permission[];
  delegatedPermissions?: DelegatedPermission[];
}

export interface DelegatedPermission {
  permission: Permission;
  delegatedBy: string;
  delegatedAt: string;
  expiresAt?: string;
  conditions?: PermissionCondition[];
}