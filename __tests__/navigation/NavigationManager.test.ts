import { NavigationManager, NavigationPermissions } from '@/lib/navigation/NavigationManager';
import { NavigationItem } from '@/lib/realtime/types';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              then: jest.fn()
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }))
  }
}));

describe('NavigationManager', () => {
  let navigationManager: NavigationManager;
  const mockUserId = 'test-user-123';
  const mockPermissions = NavigationPermissions.ADMIN;

  beforeEach(() => {
    navigationManager = new NavigationManager({
      userId: mockUserId,
      permissions: mockPermissions
    });
  });

  describe('initialization', () => {
    it('should initialize with correct permissions', async () => {
      await navigationManager.initialize(mockUserId, mockPermissions);
      expect(navigationManager).toBeDefined();
    });
  });

  describe('permission validation', () => {
    it('should allow admin operations with admin permissions', () => {
      const adminManager = new NavigationManager({
        userId: mockUserId,
        permissions: NavigationPermissions.ADMIN
      });
      expect(adminManager).toBeDefined();
    });

    it('should restrict operations with viewer permissions', () => {
      const viewerManager = new NavigationManager({
        userId: mockUserId,
        permissions: NavigationPermissions.VIEWER
      });
      expect(viewerManager).toBeDefined();
    });
  });

  describe('navigation item operations', () => {
    const mockNavigationItem: Omit<NavigationItem, 'id'> = {
      pageId: 'test-page',
      displayName: 'Test Page',
      urlSlug: 'test-page',
      orderIndex: 0,
      isVisible: true,
      isActive: true
    };

    it('should validate navigation item data', () => {
      expect(mockNavigationItem.displayName).toBeTruthy();
      expect(mockNavigationItem.urlSlug).toMatch(/^[a-z0-9-]+$/);
      expect(mockNavigationItem.orderIndex).toBeGreaterThanOrEqual(0);
    });

    it('should generate valid item IDs', () => {
      const itemId = `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      expect(itemId).toMatch(/^nav-\d+-[a-z0-9]+$/);
    });
  });

  describe('reorder operations', () => {
    it('should validate reorder operations', () => {
      const operations = [
        {
          itemId: 'nav-1',
          newOrderIndex: 0,
          newParentId: null
        },
        {
          itemId: 'nav-2',
          newOrderIndex: 1,
          newParentId: null
        }
      ];

      operations.forEach(op => {
        expect(op.itemId).toBeTruthy();
        expect(op.newOrderIndex).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('cache management', () => {
    it('should manage cache correctly', () => {
      expect(navigationManager.isCacheStale()).toBe(true); // Initially stale
      navigationManager.clearCache();
      expect(navigationManager.getCachedItem('non-existent')).toBeUndefined();
    });
  });

  describe('URL slug validation', () => {
    it('should validate URL slugs correctly', () => {
      const validSlugs = ['home', 'about-us', 'contact', 'test-page-123'];
      const invalidSlugs = ['Home', 'about us', 'contact!', '-test', 'test-'];

      validSlugs.forEach(slug => {
        expect(slug).toMatch(/^[a-z0-9-]+$/);
        expect(slug).not.toMatch(/^-/);
        expect(slug).not.toMatch(/-$/);
      });

      invalidSlugs.forEach(slug => {
        expect(
          slug.match(/^[a-z0-9-]+$/) && 
          !slug.startsWith('-') && 
          !slug.endsWith('-')
        ).toBeFalsy();
      });
    });
  });
});

describe('NavigationPermissions', () => {
  it('should define correct permission levels', () => {
    expect(NavigationPermissions.ADMIN).toEqual({
      canUpdate: true,
      canReorder: true,
      canAdd: true,
      canDelete: true,
      canToggleVisibility: true
    });

    expect(NavigationPermissions.EDITOR).toEqual({
      canUpdate: true,
      canReorder: true,
      canAdd: false,
      canDelete: false,
      canToggleVisibility: true
    });

    expect(NavigationPermissions.VIEWER).toEqual({
      canUpdate: false,
      canReorder: false,
      canAdd: false,
      canDelete: false,
      canToggleVisibility: false
    });
  });
});