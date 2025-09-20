/**
 * Unit tests for ConcurrencyErrorResolver
 * Tests conflict detection algorithms, version comparison, and metadata collection
 */

import { ConcurrencyErrorResolver } from '../../lib/conflict-resolution/ConcurrencyErrorResolver';
import { ConflictDetectionOptions, StructuralChange, ConflictItem } from '../../lib/conflict-resolution/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('ConcurrencyErrorResolver', () => {
  let resolver: ConcurrencyErrorResolver;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    resolver = new ConcurrencyErrorResolver({
      enableVersionChecking: true,
      enableChecksumValidation: true,
      enableSessionTracking: true,
      conflictTimeoutMs: 30000,
      maxConflictHistory: 100
    });
    
    mockFetch.mockClear();
  });

  afterEach(() => {
    resolver.clearCache();
  });

  describe('detectConflict', () => {
    it('should detect version mismatch conflicts', async () => {
      // Mock API response for current version
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: '2.0',
          userId: 'user-2',
          timestamp: '2023-01-01T12:00:00Z',
          checksum: 'abc123'
        })
      } as Response);

      const result = await resolver.detectConflict(
        'home',
        'hero_title',
        '1.0', // Expected version
        'New title',
        'user-1',
        'session-1'
      );

      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('version_mismatch');
      expect(result.currentVersion).toBe('2.0');
      expect(result.expectedVersion).toBe('1.0');
      expect(result.conflictedBy).toBe('user-2');
    });

    it('should not detect conflict when versions match', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: '1.0',
          userId: 'user-1',
          timestamp: '2023-01-01T12:00:00Z',
          checksum: 'abc123'
        })
      } as Response);

      const result = await resolver.detectConflict(
        'home',
        'hero_title',
        '1.0',
        'New title',
        'user-1',
        'session-1'
      );

      expect(result.hasConflict).toBe(false);
    });

    it('should detect checksum mismatch conflicts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: '1.0',
          userId: 'user-1',
          timestamp: '2023-01-01T12:00:00Z',
          checksum: 'different-checksum'
        })
      } as Response);

      const result = await resolver.detectConflict(
        'home',
        'hero_title',
        '1.0',
        'Modified content', // This will generate a different checksum
        'user-1',
        'session-1'
      );

      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('concurrent_edit');
    });

    it('should handle non-existent content gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      const result = await resolver.detectConflict(
        'home',
        'new_content',
        '1.0',
        'New content',
        'user-1',
        'session-1'
      );

      expect(result.hasConflict).toBe(false);
    });

    it('should detect session conflicts', async () => {
      // Mock current version response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: '1.0',
          userId: 'user-1',
          timestamp: '2023-01-01T12:00:00Z',
          checksum: 'abc123'
        })
      } as Response);

      // Mock active sessions response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            userId: 'user-2',
            lastActivity: '2023-01-01T12:05:00Z',
            sessionId: 'session-2'
          }
        ])
      } as Response);

      const result = await resolver.detectConflict(
        'home',
        'hero_title',
        '1.0',
        'New title',
        'user-1',
        'session-1'
      );

      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('concurrent_edit');
      expect(result.conflictedBy).toBe('user-2');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(resolver.detectConflict(
        'home',
        'hero_title',
        '1.0',
        'New title',
        'user-1',
        'session-1'
      )).rejects.toThrow('Conflict detection failed: Network error');
    });
  });

  describe('detectStructuralConflict', () => {
    it('should detect concurrent structural changes', async () => {
      const change: StructuralChange = {
        pageName: 'home',
        componentId: 'comp-123',
        type: 'move',
        timestamp: '2023-01-01T12:00:00Z',
        userId: 'user-1',
        data: { newPosition: { pageId: 'home', sectionId: 'main', order: 1 } }
      };

      // Mock recent changes response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            userId: 'user-2',
            timestamp: '2023-01-01T11:59:30Z', // 30 seconds ago
            type: 'move'
          }
        ])
      } as Response);

      const result = await resolver.detectStructuralConflict(change, {}, 'user-1', 'session-1');

      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('structure_conflict');
      expect(result.conflictedBy).toBe('user-2');
    });

    it('should not detect conflict for old changes', async () => {
      const change: StructuralChange = {
        pageName: 'home',
        componentId: 'comp-123',
        type: 'move',
        timestamp: '2023-01-01T12:00:00Z',
        userId: 'user-1',
        data: { newPosition: { pageId: 'home', sectionId: 'main', order: 1 } }
      };

      // Mock recent changes response with old timestamp
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            userId: 'user-2',
            timestamp: '2023-01-01T11:00:00Z', // 1 hour ago
            type: 'move'
          }
        ])
      } as Response);

      const result = await resolver.detectStructuralConflict(change, {}, 'user-1', 'session-1');

      expect(result.hasConflict).toBe(false);
    });

    it('should handle API errors in structural conflict detection', async () => {
      const change: StructuralChange = {
        pageName: 'home',
        componentId: 'comp-123',
        type: 'move',
        timestamp: '2023-01-01T12:00:00Z',
        userId: 'user-1',
        data: {}
      };

      mockFetch.mockRejectedValueOnce(new Error('API error'));

      await expect(resolver.detectStructuralConflict(change, {}, 'user-1', 'session-1'))
        .rejects.toThrow('Structural conflict detection failed: API error');
    });
  });

  describe('classifyConflict', () => {
    it('should classify high similarity text conflicts as low severity', () => {
      const conflict: ConflictItem = {
        id: 'conflict-1',
        type: 'content',
        componentId: 'comp-123',
        localVersion: 'Hello world!',
        remoteVersion: 'Hello world.',
        conflictedAt: '2023-01-01T12:00:00Z',
        conflictedBy: 'user-2'
      };

      const classification = resolver.classifyConflict(conflict);

      expect(classification.severity).toBe('low');
      expect(classification.autoResolvable).toBe(true);
      expect(classification.requiresUserInput).toBe(false);
      expect(classification.suggestedStrategy).toBe('merge');
    });

    it('should classify low similarity text conflicts as high severity', () => {
      const conflict: ConflictItem = {
        id: 'conflict-1',
        type: 'content',
        componentId: 'comp-123',
        localVersion: 'Completely different text',
        remoteVersion: 'Totally unrelated content',
        conflictedAt: '2023-01-01T12:00:00Z',
        conflictedBy: 'user-2'
      };

      const classification = resolver.classifyConflict(conflict);

      expect(classification.severity).toBe('high');
      expect(classification.autoResolvable).toBe(false);
      expect(classification.requiresUserInput).toBe(true);
      expect(classification.suggestedStrategy).toBe('keep_local');
    });

    it('should classify object conflicts with structural changes as high severity', () => {
      const conflict: ConflictItem = {
        id: 'conflict-1',
        type: 'content',
        componentId: 'comp-123',
        localVersion: { title: 'Hello', content: 'World' },
        remoteVersion: { title: 'Hello', description: 'World', newField: 'Added' },
        conflictedAt: '2023-01-01T12:00:00Z',
        conflictedBy: 'user-2'
      };

      const classification = resolver.classifyConflict(conflict);

      expect(classification.severity).toBe('high');
      expect(classification.suggestedStrategy).toBe('keep_local');
    });

    it('should classify structural conflicts as high severity', () => {
      const conflict: ConflictItem = {
        id: 'conflict-1',
        type: 'structure',
        componentId: 'comp-123',
        localVersion: { type: 'delete' },
        remoteVersion: { type: 'move' },
        conflictedAt: '2023-01-01T12:00:00Z',
        conflictedBy: 'user-2'
      };

      const classification = resolver.classifyConflict(conflict);

      expect(classification.severity).toBe('high');
      expect(classification.category).toBe('structure');
      expect(classification.requiresUserInput).toBe(true);
    });

    it('should classify position conflicts as auto-resolvable', () => {
      const conflict: ConflictItem = {
        id: 'conflict-1',
        type: 'structure',
        componentId: 'comp-123',
        localVersion: { type: 'position' },
        remoteVersion: { type: 'position' },
        conflictedAt: '2023-01-01T12:00:00Z',
        conflictedBy: 'user-2',
        metadata: { changeType: 'position' }
      };

      const classification = resolver.classifyConflict(conflict);

      expect(classification.autoResolvable).toBe(true);
      expect(classification.requiresUserInput).toBe(false);
      expect(classification.suggestedStrategy).toBe('accept_remote');
    });
  });

  describe('conflict history management', () => {
    it('should add conflicts to history', () => {
      const conflict: ConflictItem = {
        id: 'conflict-1',
        type: 'content',
        componentId: 'comp-123',
        localVersion: 'local',
        remoteVersion: 'remote',
        conflictedAt: '2023-01-01T12:00:00Z',
        conflictedBy: 'user-2'
      };

      resolver.addToHistory('comp-123', conflict);
      const history = resolver.getConflictHistory('comp-123');

      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(conflict);
    });

    it('should limit history size', () => {
      const resolver = new ConcurrencyErrorResolver({ maxConflictHistory: 2 });
      
      for (let i = 0; i < 5; i++) {
        const conflict: ConflictItem = {
          id: `conflict-${i}`,
          type: 'content',
          componentId: 'comp-123',
          localVersion: `local-${i}`,
          remoteVersion: `remote-${i}`,
          conflictedAt: '2023-01-01T12:00:00Z',
          conflictedBy: 'user-2'
        };
        resolver.addToHistory('comp-123', conflict);
      }

      const history = resolver.getConflictHistory('comp-123');
      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('conflict-4'); // Most recent
      expect(history[1].id).toBe('conflict-3');
    });
  });

  describe('utility methods', () => {
    it('should calculate string similarity correctly', () => {
      // Access private method through type assertion for testing
      const resolver = new ConcurrencyErrorResolver() as any;
      
      expect(resolver.calculateStringSimilarity('hello', 'hello')).toBe(1.0);
      expect(resolver.calculateStringSimilarity('hello', 'hallo')).toBeGreaterThan(0.8);
      expect(resolver.calculateStringSimilarity('hello', 'world')).toBeLessThan(0.5);
      expect(resolver.calculateStringSimilarity('', '')).toBe(1.0);
    });

    it('should calculate Levenshtein distance correctly', () => {
      const resolver = new ConcurrencyErrorResolver() as any;
      
      expect(resolver.levenshteinDistance('hello', 'hello')).toBe(0);
      expect(resolver.levenshteinDistance('hello', 'hallo')).toBe(1);
      expect(resolver.levenshteinDistance('hello', 'world')).toBe(4);
      expect(resolver.levenshteinDistance('', 'hello')).toBe(5);
    });

    it('should detect structural differences in objects', () => {
      const resolver = new ConcurrencyErrorResolver() as any;
      
      expect(resolver.hasStructuralDifferences({ a: 1 }, { a: 1 })).toBe(false);
      expect(resolver.hasStructuralDifferences({ a: 1 }, { a: 2 })).toBe(false); // Same structure
      expect(resolver.hasStructuralDifferences({ a: 1 }, { b: 1 })).toBe(true); // Different keys
      expect(resolver.hasStructuralDifferences({ a: 1 }, { a: 1, b: 2 })).toBe(true); // Additional key
    });

    it('should calculate checksums consistently', () => {
      const resolver = new ConcurrencyErrorResolver() as any;
      
      const checksum1 = resolver.calculateChecksum('hello world');
      const checksum2 = resolver.calculateChecksum('hello world');
      const checksum3 = resolver.calculateChecksum('hello world!');
      
      expect(checksum1).toBe(checksum2);
      expect(checksum1).not.toBe(checksum3);
    });
  });

  describe('cache management', () => {
    it('should cache version information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: '1.0',
          userId: 'user-1',
          timestamp: '2023-01-01T12:00:00Z',
          checksum: 'abc123'
        })
      } as Response);

      // First call should fetch from API
      await resolver.detectConflict('home', 'hero_title', '1.0');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await resolver.detectConflict('home', 'hero_title', '1.0');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should clear cache when requested', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '1.0',
          userId: 'user-1',
          timestamp: '2023-01-01T12:00:00Z',
          checksum: 'abc123'
        })
      } as Response);

      // First call
      await resolver.detectConflict('home', 'hero_title', '1.0');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      resolver.clearCache();

      // Second call should fetch again
      await resolver.detectConflict('home', 'hero_title', '1.0');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});