/**
 * Tests for the PermissionManager class
 */

import { PermissionManager } from '../../lib/permissions/PermissionManager';
import { UserRole, PermissionContext } from '../../lib/permissions/types';

describe('PermissionManager', () => {
  let permissionManager: PermissionManager;

  beforeEach(() => {
    permissionManager = new PermissionManager();
  });

  describe('checkPermission', () => {
    it('should allow admin to perform all operations', async () => {
      const context: PermissionContext = {
        userId: 'admin-user',
        userRole: 'admin',
        resource: 'content',
        operation: 'create'
      };

      const result = await permissionManager.checkPermission(context);
      expect(result.allowed).toBe(true);
    });

    it('should allow editor to update content but not create pages', async () => {
      const updateContext: PermissionContext = {
        userId: 'editor-user',
        userRole: 'editor',
        resource: 'content',
        operation: 'update'
      };

      const createPageContext: PermissionContext = {
        userId: 'editor-user',
        userRole: 'editor',
        resource: 'page',
        operation: 'create'
      };

      const updateResult = await permissionManager.checkPermission(updateContext);
      const createResult = await permissionManager.checkPermission(createPageContext);

      expect(updateResult.allowed).toBe(true);
      expect(createResult.allowed).toBe(false);
    });

    it('should deny viewer from making any changes', async () => {
      const context: PermissionContext = {
        userId: 'viewer-user',
        userRole: 'viewer',
        resource: 'content',
        operation: 'update'
      };

      const result = await permissionManager.checkPermission(context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Insufficient permissions');
    });

    it('should deny guest from all operations', async () => {
      const context: PermissionContext = {
        userId: 'guest-user',
        userRole: 'guest',
        resource: 'content',
        operation: 'read'
      };

      const result = await permissionManager.checkPermission(context);
      expect(result.allowed).toBe(false);
    });
  });

  describe('validateEditingOperation', () => {
    it('should validate component operations correctly', async () => {
      const adminResult = await permissionManager.validateEditingOperation(
        'admin-user',
        'admin',
        'create',
        'component'
      );

      const editorResult = await permissionManager.validateEditingOperation(
        'editor-user',
        'editor',
        'create',
        'component'
      );

      expect(adminResult.allowed).toBe(true);
      expect(editorResult.allowed).toBe(false);
    });

    it('should validate page operations correctly', async () => {
      const adminResult = await permissionManager.validateEditingOperation(
        'admin-user',
        'admin',
        'create',
        'page'
      );

      const editorResult = await permissionManager.validateEditingOperation(
        'editor-user',
        'editor',
        'update',
        'page'
      );

      expect(adminResult.allowed).toBe(true);
      expect(editorResult.allowed).toBe(true);
    });
  });

  describe('permission delegation', () => {
    it('should allow permission delegation from admin to editor', async () => {
      await permissionManager.delegatePermission(
        'admin-user',
        'editor-user',
        'page.create'
      );

      // Mock the getUserRole method to return admin for admin-user
      jest.spyOn(permissionManager as any, 'getUserRole').mockResolvedValue('admin');

      const context: PermissionContext = {
        userId: 'editor-user',
        userRole: 'editor',
        resource: 'page',
        operation: 'create'
      };

      const result = await permissionManager.checkPermission(context);
      expect(result.allowed).toBe(true);
    });

    it('should not allow delegation of permissions user does not have', async () => {
      // Mock the getUserRole method to return editor for editor-user
      jest.spyOn(permissionManager as any, 'getUserRole').mockResolvedValue('editor');

      await expect(
        permissionManager.delegatePermission(
          'editor-user',
          'viewer-user',
          'system.admin'
        )
      ).rejects.toThrow('cannot delegate permission they don\'t have');
    });
  });

  describe('custom permissions', () => {
    it('should allow granting custom permissions', async () => {
      await permissionManager.grantCustomPermission(
        'viewer-user',
        'content.update',
        'admin-user'
      );

      const context: PermissionContext = {
        userId: 'viewer-user',
        userRole: 'viewer',
        resource: 'content',
        operation: 'update'
      };

      const result = await permissionManager.checkPermission(context);
      expect(result.allowed).toBe(true);
    });

    it('should allow revoking custom permissions', async () => {
      // Grant permission first
      await permissionManager.grantCustomPermission(
        'viewer-user',
        'content.update',
        'admin-user'
      );

      // Then revoke it
      await permissionManager.revokeCustomPermission(
        'viewer-user',
        'content.update',
        'admin-user'
      );

      const context: PermissionContext = {
        userId: 'viewer-user',
        userRole: 'viewer',
        resource: 'content',
        operation: 'update'
      };

      const result = await permissionManager.checkPermission(context);
      expect(result.allowed).toBe(false);
    });
  });

  describe('effective permissions', () => {
    it('should return all effective permissions for a user', async () => {
      const permissions = await permissionManager.getEffectivePermissions('admin-user', 'admin');
      
      expect(permissions).toContain('content.create');
      expect(permissions).toContain('content.update');
      expect(permissions).toContain('page.create');
      expect(permissions).toContain('system.admin');
    });

    it('should include custom and delegated permissions', async () => {
      // Grant custom permission
      await permissionManager.grantCustomPermission(
        'editor-user',
        'system.audit',
        'admin-user'
      );

      const permissions = await permissionManager.getEffectivePermissions('editor-user', 'editor');
      
      expect(permissions).toContain('content.update');
      expect(permissions).toContain('system.audit');
    });
  });
});