/**
 * PermissionManager - Core class for role-based access control
 */

import { 
  UserRole, 
  Permission, 
  PermissionContext, 
  PermissionCheckResult, 
  UserPermissions,
  DelegatedPermission,
  Resource,
  Operation
} from './types';
import { getRolePermissions, roleHasPermission, getMinimumRoleForPermission } from './roles';

export class PermissionManager {
  private userPermissionsCache = new Map<string, UserPermissions>();
  private delegatedPermissions = new Map<string, DelegatedPermission[]>();

  /**
   * Check if a user has permission to perform an operation on a resource
   */
  async checkPermission(context: PermissionContext): Promise<PermissionCheckResult> {
    try {
      const { userId, userRole, resource, operation } = context;
      
      // Build the permission string
      const permission = `${resource}.${operation}` as Permission;
      
      // Get user permissions
      const userPermissions = await this.getUserPermissions(userId, userRole);
      
      // Check role-based permissions
      if (this.hasRolePermission(userPermissions.role, permission)) {
        return { allowed: true };
      }
      
      // Check custom permissions
      if (userPermissions.customPermissions?.includes(permission)) {
        return { allowed: true };
      }
      
      // Check delegated permissions
      if (await this.hasDelegatedPermission(userId, permission, context)) {
        return { allowed: true };
      }
      
      // Permission denied
      const requiredRole = getMinimumRoleForPermission(permission);
      return {
        allowed: false,
        reason: `Insufficient permissions. Required: ${permission}`,
        requiredRole: requiredRole || undefined,
        requiredPermission: permission
      };
      
    } catch (error) {
      console.error('Permission check failed:', error);
      return {
        allowed: false,
        reason: 'Permission check failed due to system error'
      };
    }
  }

  /**
   * Check multiple permissions at once
   */
  async checkPermissions(
    contexts: PermissionContext[]
  ): Promise<Record<string, PermissionCheckResult>> {
    const results: Record<string, PermissionCheckResult> = {};
    
    for (const context of contexts) {
      const key = `${context.resource}.${context.operation}`;
      results[key] = await this.checkPermission(context);
    }
    
    return results;
  }

  /**
   * Validate if user can perform a specific editing operation
   */
  async validateEditingOperation(
    userId: string,
    userRole: UserRole,
    operation: 'create' | 'update' | 'delete' | 'move',
    resourceType: 'content' | 'component' | 'page' | 'navigation',
    resourceId?: string
  ): Promise<PermissionCheckResult> {
    const context: PermissionContext = {
      userId,
      userRole,
      resource: resourceType,
      operation,
      resourceId
    };
    
    return this.checkPermission(context);
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string, role: UserRole): Promise<UserPermissions> {
    // Check cache first
    const cached = this.userPermissionsCache.get(userId);
    if (cached && cached.role === role) {
      return cached;
    }
    
    // Build user permissions
    const userPermissions: UserPermissions = {
      userId,
      role,
      customPermissions: await this.getCustomPermissions(userId),
      delegatedPermissions: await this.getDelegatedPermissions(userId)
    };
    
    // Cache the result
    this.userPermissionsCache.set(userId, userPermissions);
    
    return userPermissions;
  }

  /**
   * Grant a custom permission to a user
   */
  async grantCustomPermission(
    userId: string,
    permission: Permission,
    grantedBy: string
  ): Promise<void> {
    // In a real implementation, this would persist to database
    // For now, we'll use in-memory storage
    const userPermissions = this.userPermissionsCache.get(userId);
    if (userPermissions) {
      if (!userPermissions.customPermissions) {
        userPermissions.customPermissions = [];
      }
      if (!userPermissions.customPermissions.includes(permission)) {
        userPermissions.customPermissions.push(permission);
      }
    }
    
    console.log(`Granted permission ${permission} to user ${userId} by ${grantedBy}`);
  }

  /**
   * Revoke a custom permission from a user
   */
  async revokeCustomPermission(
    userId: string,
    permission: Permission,
    revokedBy: string
  ): Promise<void> {
    const userPermissions = this.userPermissionsCache.get(userId);
    if (userPermissions?.customPermissions) {
      userPermissions.customPermissions = userPermissions.customPermissions.filter(
        p => p !== permission
      );
    }
    
    console.log(`Revoked permission ${permission} from user ${userId} by ${revokedBy}`);
  }

  /**
   * Delegate a permission to another user
   */
  async delegatePermission(
    fromUserId: string,
    toUserId: string,
    permission: Permission,
    expiresAt?: string
  ): Promise<void> {
    // Verify the delegating user has the permission
    const fromUserRole = await this.getUserRole(fromUserId);
    if (!roleHasPermission(fromUserRole, permission)) {
      throw new Error(`User ${fromUserId} cannot delegate permission they don't have: ${permission}`);
    }
    
    const delegatedPermission: DelegatedPermission = {
      permission,
      delegatedBy: fromUserId,
      delegatedAt: new Date().toISOString(),
      expiresAt
    };
    
    const existing = this.delegatedPermissions.get(toUserId) || [];
    existing.push(delegatedPermission);
    this.delegatedPermissions.set(toUserId, existing);
    
    console.log(`Delegated permission ${permission} from ${fromUserId} to ${toUserId}`);
  }

  /**
   * Clear user permissions cache
   */
  clearUserCache(userId?: string): void {
    if (userId) {
      this.userPermissionsCache.delete(userId);
    } else {
      this.userPermissionsCache.clear();
    }
  }

  /**
   * Get user's effective permissions (role + custom + delegated)
   */
  async getEffectivePermissions(userId: string, role: UserRole): Promise<Permission[]> {
    const userPermissions = await this.getUserPermissions(userId, role);
    
    let permissions = getRolePermissions(role);
    
    // Add custom permissions
    if (userPermissions.customPermissions) {
      permissions = [...permissions, ...userPermissions.customPermissions];
    }
    
    // Add valid delegated permissions
    if (userPermissions.delegatedPermissions) {
      const validDelegated = userPermissions.delegatedPermissions.filter(dp => {
        return !dp.expiresAt || new Date(dp.expiresAt) > new Date();
      });
      permissions = [...permissions, ...validDelegated.map(dp => dp.permission)];
    }
    
    // Remove duplicates
    return [...new Set(permissions)];
  }

  // Private helper methods

  private hasRolePermission(role: UserRole, permission: Permission): boolean {
    return roleHasPermission(role, permission);
  }

  private async getCustomPermissions(userId: string): Promise<Permission[]> {
    // In a real implementation, this would query the database
    // For now, return empty array
    return [];
  }

  private async getDelegatedPermissions(userId: string): Promise<DelegatedPermission[]> {
    const delegated = this.delegatedPermissions.get(userId) || [];
    
    // Filter out expired permissions
    return delegated.filter(dp => {
      return !dp.expiresAt || new Date(dp.expiresAt) > new Date();
    });
  }

  private async hasDelegatedPermission(
    userId: string,
    permission: Permission,
    context: PermissionContext
  ): Promise<boolean> {
    const delegated = await this.getDelegatedPermissions(userId);
    
    return delegated.some(dp => {
      if (dp.permission !== permission) return false;
      
      // Check conditions if any
      if (dp.conditions) {
        return dp.conditions.every(condition => {
          switch (condition.type) {
            case 'owner':
              return context.resourceOwnerId === userId;
            case 'role':
              return context.userRole === condition.value;
            case 'custom':
              return condition.validator ? condition.validator(context) : true;
            default:
              return true;
          }
        });
      }
      
      return true;
    });
  }

  private async getUserRole(userId: string): Promise<UserRole> {
    // In a real implementation, this would query the database
    // For now, we'll check the cache or default to 'guest'
    const cached = this.userPermissionsCache.get(userId);
    return cached?.role || 'guest';
  }
}

// Singleton instance
export const permissionManager = new PermissionManager();