/**
 * Unit tests for RealtimeClient
 * Tests real-time event handling, synchronization, and connection management
 */

import { RealtimeClient } from '../../lib/realtime/RealtimeClient';
import { RealtimeEvent, RealtimeEventData } from '../../lib/realtime/types';

// Mock Supabase client
const mockSupabaseClient = {
  channel: jest.fn(),
  removeChannel: jest.fn(),
  getChannels: jest.fn(() => [])
};

const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
  unsubscribe: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  track: jest.fn().mockReturnThis(),
  untrack: jest.fn().mockReturnThis()
};

// Mock WebSocket for connection testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Mock send implementation
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('RealtimeClient', () => {
  let client: RealtimeClient;
  let mockEventHandler: jest.Mock;

  beforeEach(() => {
    mockSupabaseClient.channel.mockReturnValue(mockChannel);
    mockChannel.on.mockClear();
    mockChannel.subscribe.mockClear();
    mockChannel.unsubscribe.mockClear();
    mockChannel.send.mockClear();
    mockChannel.track.mockClear();
    mockChannel.untrack.mockClear();

    client = new RealtimeClient(mockSupabaseClient as any, {
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 1000
    });

    mockEventHandler = jest.fn();
  });

  afterEach(() => {
    client.disconnect();
  });

  describe('connection management', () => {
    it('should initialize with disconnected status', () => {
      expect(client.getStatus()).toBe('disconnected');
      expect(client.isConnected()).toBe(false);
    });

    it('should connect successfully', async () => {
      const statusChanges: string[] = [];
      client.on('statusChange', (status) => statusChanges.push(status));

      await client.connect();

      expect(client.getStatus()).toBe('connected');
      expect(client.isConnected()).toBe(true);
      expect(statusChanges).toContain('connecting');
      expect(statusChanges).toContain('connected');
    });

    it('should handle connection errors', async () => {
      // Mock channel subscription to fail
      mockChannel.subscribe.mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      const statusChanges: string[] = [];
      client.on('statusChange', (status) => statusChanges.push(status));

      await expect(client.connect()).rejects.toThrow('Connection failed');
      expect(statusChanges).toContain('error');
    });

    it('should disconnect properly', async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);

      const statusChanges: string[] = [];
      client.on('statusChange', (status) => statusChanges.push(status));

      client.disconnect();

      expect(client.isConnected()).toBe(false);
      expect(statusChanges).toContain('disconnected');
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });

    it('should retry connection on failure', async () => {
      let attemptCount = 0;
      mockChannel.subscribe.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Connection failed');
        }
        return mockChannel;
      });

      await client.connect();

      expect(attemptCount).toBe(3);
      expect(client.isConnected()).toBe(true);
    });

    it('should respect max retry limit', async () => {
      mockChannel.subscribe.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      await expect(client.connect()).rejects.toThrow();
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should implement exponential backoff', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = jest.fn((callback, delay) => {
        delays.push(delay as number);
        return originalSetTimeout(callback, 0); // Execute immediately for testing
      }) as any;

      mockChannel.subscribe.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      try {
        await client.connect();
      } catch (error) {
        // Expected to fail
      }

      expect(delays).toEqual([100, 200, 400]); // Exponential backoff
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should register and emit events', () => {
      client.on('test-event', mockEventHandler);
      client.emit('test-event', { data: 'test' });

      expect(mockEventHandler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should unregister event handlers', () => {
      client.on('test-event', mockEventHandler);
      client.off('test-event', mockEventHandler);
      client.emit('test-event', { data: 'test' });

      expect(mockEventHandler).not.toHaveBeenCalled();
    });

    it('should handle multiple event handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      client.on('test-event', handler1);
      client.on('test-event', handler2);
      client.emit('test-event', { data: 'test' });

      expect(handler1).toHaveBeenCalledWith({ data: 'test' });
      expect(handler2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should handle event handler errors gracefully', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = jest.fn();

      client.on('test-event', errorHandler);
      client.on('test-event', normalHandler);

      // Should not throw
      expect(() => client.emit('test-event', { data: 'test' })).not.toThrow();
      expect(normalHandler).toHaveBeenCalled();
    });
  });

  describe('message sending', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should send messages when connected', async () => {
      const event: RealtimeEvent = {
        id: 'test-event-1',
        type: 'content_change',
        pageName: 'home',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: { contentKey: 'title', newValue: 'New Title' }
      };

      await client.sendEvent(event);

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'realtime_event',
        payload: event
      });
    });

    it('should queue messages when disconnected', async () => {
      client.disconnect();

      const event: RealtimeEvent = {
        id: 'test-event-1',
        type: 'content_change',
        pageName: 'home',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: { contentKey: 'title', newValue: 'New Title' }
      };

      // Should not throw when disconnected
      await expect(client.sendEvent(event)).resolves.not.toThrow();

      // Message should be queued
      expect(mockChannel.send).not.toHaveBeenCalled();

      // Reconnect and verify queued message is sent
      await client.connect();
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'realtime_event',
        payload: event
      });
    });

    it('should handle send errors gracefully', async () => {
      mockChannel.send.mockImplementationOnce(() => {
        throw new Error('Send failed');
      });

      const event: RealtimeEvent = {
        id: 'test-event-1',
        type: 'content_change',
        pageName: 'home',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: { contentKey: 'title', newValue: 'New Title' }
      };

      await expect(client.sendEvent(event)).rejects.toThrow('Send failed');
    });

    it('should validate events before sending', async () => {
      const invalidEvent = {
        id: 'test-event-1',
        // Missing required fields
        type: 'content_change'
      } as RealtimeEvent;

      await expect(client.sendEvent(invalidEvent)).rejects.toThrow();
    });
  });

  describe('subscription management', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should subscribe to page events', async () => {
      await client.subscribeToPage('home');

      expect(mockChannel.on).toHaveBeenCalledWith(
        'broadcast',
        expect.objectContaining({
          event: 'realtime_event'
        }),
        expect.any(Function)
      );
    });

    it('should unsubscribe from page events', async () => {
      await client.subscribeToPage('home');
      await client.unsubscribeFromPage('home');

      // Should handle unsubscription gracefully
      expect(client.getSubscriptions()).not.toContain('home');
    });

    it('should handle multiple page subscriptions', async () => {
      await client.subscribeToPage('home');
      await client.subscribeToPage('about');

      expect(client.getSubscriptions()).toContain('home');
      expect(client.getSubscriptions()).toContain('about');
    });

    it('should not duplicate subscriptions', async () => {
      await client.subscribeToPage('home');
      await client.subscribeToPage('home'); // Duplicate

      const subscriptions = client.getSubscriptions();
      const homeSubscriptions = subscriptions.filter(sub => sub === 'home');
      expect(homeSubscriptions).toHaveLength(1);
    });
  });

  describe('presence tracking', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should track user presence', async () => {
      const presence = {
        userId: 'user-1',
        userName: 'Test User',
        componentId: 'comp-123',
        action: 'editing' as const
      };

      await client.trackPresence('home', presence);

      expect(mockChannel.track).toHaveBeenCalledWith(presence);
    });

    it('should untrack user presence', async () => {
      await client.untrackPresence('home');

      expect(mockChannel.untrack).toHaveBeenCalled();
    });

    it('should handle presence updates', async () => {
      const presenceHandler = jest.fn();
      client.on('presenceUpdate', presenceHandler);

      // Simulate presence update from Supabase
      const mockPresenceUpdate = {
        joins: { 'user-1': { userId: 'user-1', userName: 'Test User' } },
        leaves: {}
      };

      // Find the presence callback and call it
      const presenceCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'presence'
      )?.[2];

      if (presenceCallback) {
        presenceCallback({ event: 'sync', payload: mockPresenceUpdate });
      }

      expect(presenceHandler).toHaveBeenCalled();
    });
  });

  describe('message validation', () => {
    it('should validate event structure', () => {
      const validEvent: RealtimeEvent = {
        id: 'test-event-1',
        type: 'content_change',
        pageName: 'home',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: { contentKey: 'title', newValue: 'New Title' }
      };

      expect(() => (client as any).validateEvent(validEvent)).not.toThrow();
    });

    it('should reject invalid events', () => {
      const invalidEvent = {
        id: 'test-event-1',
        type: 'invalid_type',
        // Missing required fields
      };

      expect(() => (client as any).validateEvent(invalidEvent)).toThrow();
    });

    it('should sanitize event data', () => {
      const event: RealtimeEvent = {
        id: 'test-event-1',
        type: 'content_change',
        pageName: 'home',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          contentKey: 'title',
          newValue: '<script>alert("xss")</script>Safe content'
        }
      };

      const sanitized = (client as any).sanitizeEvent(event);
      expect(sanitized.data.newValue).not.toContain('<script>');
      expect(sanitized.data.newValue).toContain('Safe content');
    });
  });

  describe('error handling and recovery', () => {
    it('should handle channel errors', async () => {
      await client.connect();

      const errorHandler = jest.fn();
      client.on('error', errorHandler);

      // Simulate channel error
      const errorCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'system'
      )?.[2];

      if (errorCallback) {
        errorCallback({ event: 'error', payload: { message: 'Channel error' } });
      }

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should attempt reconnection on connection loss', async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);

      // Simulate connection loss
      const closeCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'system'
      )?.[2];

      if (closeCallback) {
        closeCallback({ event: 'close', payload: {} });
      }

      // Should attempt to reconnect
      expect(client.getStatus()).toBe('connecting');
    });

    it('should handle malformed messages gracefully', async () => {
      await client.connect();

      const messageHandler = jest.fn();
      client.on('message', messageHandler);

      // Simulate malformed message
      const broadcastCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'broadcast'
      )?.[2];

      if (broadcastCallback) {
        // Send malformed payload
        broadcastCallback({
          event: 'realtime_event',
          payload: 'invalid json'
        });
      }

      // Should not crash and should not call message handler
      expect(messageHandler).not.toHaveBeenCalled();
    });
  });

  describe('performance and optimization', () => {
    it('should debounce rapid events', async () => {
      await client.connect();

      const events = Array.from({ length: 10 }, (_, i) => ({
        id: `test-event-${i}`,
        type: 'content_change' as const,
        pageName: 'home',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: { contentKey: 'title', newValue: `Title ${i}` }
      }));

      // Send events rapidly
      await Promise.all(events.map(event => client.sendEvent(event)));

      // Should debounce and send fewer messages
      expect(mockChannel.send).toHaveBeenCalledTimes(1);
    });

    it('should batch similar events', async () => {
      await client.connect();

      const events = [
        {
          id: 'test-event-1',
          type: 'content_change' as const,
          pageName: 'home',
          userId: 'user-1',
          timestamp: new Date().toISOString(),
          version: '1.0',
          data: { contentKey: 'title', newValue: 'Title 1' }
        },
        {
          id: 'test-event-2',
          type: 'content_change' as const,
          pageName: 'home',
          userId: 'user-1',
          timestamp: new Date().toISOString(),
          version: '1.0',
          data: { contentKey: 'title', newValue: 'Title 2' }
        }
      ];

      // Enable batching
      (client as any).enableBatching = true;

      await Promise.all(events.map(event => client.sendEvent(event)));

      // Should batch similar events
      expect(mockChannel.send).toHaveBeenCalledTimes(1);
      const sentPayload = mockChannel.send.mock.calls[0][0].payload;
      expect(Array.isArray(sentPayload)).toBe(true);
    });

    it('should limit message queue size', async () => {
      // Disconnect to queue messages
      client.disconnect();

      const maxQueueSize = 100;
      const events = Array.from({ length: maxQueueSize + 10 }, (_, i) => ({
        id: `test-event-${i}`,
        type: 'content_change' as const,
        pageName: 'home',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: { contentKey: 'title', newValue: `Title ${i}` }
      }));

      // Queue more events than the limit
      await Promise.all(events.map(event => client.sendEvent(event)));

      // Reconnect and check that only the most recent events are sent
      await client.connect();

      expect(mockChannel.send).toHaveBeenCalledTimes(maxQueueSize);
    });
  });
});