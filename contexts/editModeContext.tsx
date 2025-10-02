'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { 
  getRealtimeClient, 
  getPresenceTracker, 
  getEventRouter,
  RealtimeClient,
  PresenceTracker,
  EditorPresence,
  ConflictItem,
  ConflictResolution,
  ComponentPosition,
  NewPageData,
  NavigationItem,
  RealtimeEvent,
  ContentChangeEventData
} from '../lib/realtime';
import { permissionManager } from '../lib/permissions/PermissionManager';
import { UserRole, Resource, Operation } from '../lib/permissions/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'conflict' | 'error';

interface EditModeContextType {
    // Existing properties
    isEditMode: boolean;
    toggleEditMode: () => void;
    saveContent: (key: string, value: any, type?: 'text' | 'json' | 'file', page?: string) => Promise<boolean>;
    isAdmin: boolean;
    isSaving: boolean;
    saveState: SaveState;
    
    // New real-time properties
    isConnected: boolean;
    activeEditors: EditorPresence[];
    conflictedItems: ConflictItem[];
    
    // New collaborative methods
    subscribeToPage: (pageName: string) => Promise<void>;
    unsubscribeFromPage: (pageName: string) => Promise<void>;
    broadcastPresence: (componentId: string, action: 'editing' | 'idle') => Promise<void>;
    resolveConflict: (conflictId: string, resolution: ConflictResolution) => Promise<void>;
    
    // Component management
    addComponent: (componentType: string, position: ComponentPosition) => Promise<string>;
    moveComponent: (componentId: string, newPosition: ComponentPosition) => Promise<void>;
    deleteComponent: (componentId: string) => Promise<void>;
    
    // Page management
    createPage: (pageData: NewPageData) => Promise<string>;
    updateNavigation: (navItems: NavigationItem[]) => Promise<void>;
    
    // Navigation management
    createNavigationItem: (itemData: Omit<NavigationItem, 'id'>) => Promise<string>;
    updateNavigationItem: (itemId: string, updates: Partial<Omit<NavigationItem, 'id'>>) => Promise<void>;
    deleteNavigationItem: (itemId: string) => Promise<void>;
    reorderNavigationItems: (operations: Array<{itemId: string; newOrderIndex: number; newParentId?: string}>) => Promise<void>;
    
    // Permission management
    userRole: UserRole;
    hasPermission: (resource: Resource, operation: Operation) => boolean;
    validateComponentPermission: (action: 'add' | 'move' | 'delete', componentIdOrType: string) => Promise<boolean>;
    validatePagePermission: (action: 'create' | 'update' | 'delete') => Promise<boolean>;
    validateNavigationPermission: (action: 'update' | 'reorder') => Promise<boolean>;
    toggleNavigationVisibility: (itemId: string, isVisible: boolean) => Promise<void>;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export function EditModeProvider({ children }: { children: ReactNode }) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveState, setSaveState] = useState<SaveState>('idle');
    const [isConnected, setIsConnected] = useState(false);
    const [activeEditors, setActiveEditors] = useState<EditorPresence[]>([]);
    const [conflictedItems, setConflictedItems] = useState<ConflictItem[]>([]);
    const { user, isLoaded } = useUser();
    const searchParams = useSearchParams();
    
    // Real-time infrastructure refs
    const realtimeClientRef = useRef<RealtimeClient | null>(null);
    const presenceTrackerRef = useRef<PresenceTracker | null>(null);
    const currentPageRef = useRef<string | null>(null);
    const eventRouterRef = useRef<ReturnType<typeof getEventRouter> | null>(null);
    
    // Version tracking and optimistic updates
    const contentVersionsRef = useRef<Map<string, string>>(new Map());
    const optimisticUpdatesRef = useRef<Map<string, { originalValue: any; newValue: any; timestamp: number }>>(new Map());

    // Get user role from Clerk metadata
    const getUserRole = useCallback((): UserRole => {
        if (!isLoaded || !user) return 'guest';
        
        const role = user.publicMetadata?.role as UserRole;
        if (role && ['admin', 'editor', 'viewer', 'guest'].includes(role)) {
            return role;
        }
        
        // Default role logic
        if (process.env.NODE_ENV === 'development') {
            return 'admin'; // Allow admin in development
        }
        
        return 'guest';
    }, [user, isLoaded]);

    const userRole = getUserRole();
    const isAdmin = userRole === 'admin';

    // Enhanced permission validation using PermissionManager
    const validateComponentPermission = useCallback(async (
        action: 'add' | 'move' | 'delete', 
        componentIdOrType: string
    ): Promise<boolean> => {
        if (!user) return false;
        
        const operationMap: Record<string, Operation> = {
            'add': 'create',
            'move': 'move',
            'delete': 'delete'
        };
        
        const result = await permissionManager.checkPermission({
            userId: user.id,
            userRole,
            resource: 'component',
            operation: operationMap[action],
            resourceId: componentIdOrType
        });
        
        return result.allowed;
    }, [user, userRole]);

    const validatePagePermission = useCallback(async (
        action: 'create' | 'update' | 'delete'
    ): Promise<boolean> => {
        if (!user) return false;
        
        const result = await permissionManager.checkPermission({
            userId: user.id,
            userRole,
            resource: 'page',
            operation: action
        });
        
        return result.allowed;
    }, [user, userRole]);

    const validateNavigationPermission = useCallback(async (
        action: 'update' | 'reorder'
    ): Promise<boolean> => {
        if (!user) return false;
        
        const operationMap: Record<string, Operation> = {
            'update': 'update',
            'reorder': 'reorder'
        };
        
        const result = await permissionManager.checkPermission({
            userId: user.id,
            userRole,
            resource: 'navigation',
            operation: operationMap[action]
        });
        
        return result.allowed;
    }, [user, userRole]);

    // Synchronous permission checks for immediate UI updates
    const hasPermission = useCallback((resource: Resource, operation: Operation): boolean => {
        if (!user) return false;
        
        // Use role-based permissions for immediate checks
        const permission = `${resource}.${operation}`;
        
        // Admin has all permissions
        if (userRole === 'admin') return true;
        
        // Editor permissions
        if (userRole === 'editor') {
            return [
                'content.read', 'content.update',
                'component.read', 'component.update', 'component.move',
                'page.read', 'page.update',
                'navigation.read', 'navigation.update'
            ].includes(permission);
        }
        
        // Viewer permissions
        if (userRole === 'viewer') {
            return [
                'content.read', 'component.read', 'page.read', 'navigation.read'
            ].includes(permission);
        }
        
        return false;
    }, [user, userRole]);

    // Helper functions for component operations
    const getCurrentComponentPosition = useCallback(async (componentId: string): Promise<ComponentPosition> => {
        // This would typically fetch from API or local state
        // For now, return a default position
        return {
            pageId: currentPageRef.current || 'home',
            sectionId: 'main',
            order: 0
        };
    }, []);

    const getComponentInfo = useCallback(async (componentId: string): Promise<{ position: ComponentPosition; type: string } | null> => {
        // This would typically fetch from API or local state
        // For now, return a default info
        return {
            position: {
                pageId: currentPageRef.current || 'home',
                sectionId: 'main',
                order: 0
            },
            type: 'unknown'
        };
    }, []);

    // Initialize real-time infrastructure
    useEffect(() => {
        if (!isAdmin || !isLoaded || !user) return;

        const initializeRealtime = async () => {
            try {
                // Initialize real-time client
                realtimeClientRef.current = getRealtimeClient({
                    maxRetries: 5,
                    baseDelay: 1000,
                    maxDelay: 10000
                });

                // Initialize event router
                eventRouterRef.current = getEventRouter();

                // Initialize presence tracker
                presenceTrackerRef.current = getPresenceTracker(realtimeClientRef.current, {
                    heartbeatInterval: 30000,
                    cleanupInterval: 60000,
                    presenceTimeout: 120000
                });

                // Set up connection status listeners
                realtimeClientRef.current.on('statusChange', (status) => {
                    setIsConnected(status === 'connected');
                    if (status === 'connected') {
                        console.log('Real-time connection established');
                    } else if (status === 'disconnected') {
                        console.log('Real-time connection lost');
                        toast.warning('Connection lost. Attempting to reconnect...');
                    } else if (status === 'error') {
                        console.error('Real-time connection error');
                        toast.error('Connection error. Please refresh the page.');
                    }
                });

                // Set up presence tracking listeners
                presenceTrackerRef.current.on('presenceStateChanged', (state) => {
                    setActiveEditors(Object.values(state));
                });

                presenceTrackerRef.current.on('userJoined', (presence) => {
                    toast.success(`${presence.userName} joined the editing session`);
                });

                presenceTrackerRef.current.on('userLeft', (presence) => {
                    toast.info(`${presence.userName} left the editing session`);
                });

                // Set up conflict detection event handler
                eventRouterRef.current.register('conflict_detected', (event, data) => {
                    const conflictData = data as any;
                    setConflictedItems(prev => [...prev, conflictData.conflict]);
                    toast.error(`Conflict detected: ${conflictData.conflict.componentId}`);
                });

                // Connect to real-time
                await realtimeClientRef.current.connect();
                
            } catch (error) {
                console.error('Failed to initialize real-time infrastructure:', error);
                toast.error('Failed to initialize collaborative editing');
            }
        };

        initializeRealtime();

        // Cleanup on unmount
        return () => {
            if (presenceTrackerRef.current) {
                presenceTrackerRef.current.destroy();
            }
            if (realtimeClientRef.current) {
                realtimeClientRef.current.disconnect();
            }
        };
    }, [isAdmin, isLoaded, user]);

    // Check for edit mode URL parameter
    useEffect(() => {
        if (isAdmin && searchParams.get('editMode') === 'true') {
            setIsEditMode(true);
            toast.success('Edit mode enabled from admin panel');
        }
    }, [isAdmin, searchParams]);

    const toggleEditMode = () => {
        if (!isAdmin) {
            toast.error('You need admin privileges to edit content');
            return;
        }
        setIsEditMode(!isEditMode);
        if (!isEditMode) {
            toast.success('Edit mode enabled - Click any text to edit');
        } else {
            toast.success('Edit mode disabled');
        }
    };

    useEffect(() => {
        console.log('isEditMode changed:', isEditMode);
    }, [isEditMode]);

    // Page subscription methods
    const subscribeToPage = useCallback(async (pageName: string): Promise<void> => {
        if (!isAdmin || !user || !presenceTrackerRef.current) {
            throw new Error('Cannot subscribe to page: not authorized or not initialized');
        }

        try {
            // Join the page presence
            await presenceTrackerRef.current.joinPage(pageName, {
                userId: user.id,
                userName: user.fullName || user.firstName || 'Anonymous',
                avatar: user.imageUrl,
                action: 'idle'
            });

            currentPageRef.current = pageName;
            console.log(`Subscribed to page: ${pageName}`);
        } catch (error) {
            console.error('Failed to subscribe to page:', error);
            throw error;
        }
    }, [isAdmin, user]);

    const unsubscribeFromPage = useCallback(async (pageName: string): Promise<void> => {
        if (!presenceTrackerRef.current) {
            return;
        }

        try {
            await presenceTrackerRef.current.leavePage(pageName);
            if (currentPageRef.current === pageName) {
                currentPageRef.current = null;
            }
            console.log(`Unsubscribed from page: ${pageName}`);
        } catch (error) {
            console.error('Failed to unsubscribe from page:', error);
            throw error;
        }
    }, []);

    const broadcastPresence = useCallback(async (componentId: string, action: 'editing' | 'idle'): Promise<void> => {
        if (!presenceTrackerRef.current || !currentPageRef.current) {
            return;
        }

        try {
            await presenceTrackerRef.current.updatePresence(currentPageRef.current, {
                componentId: action === 'editing' ? componentId : undefined,
                action
            });
        } catch (error) {
            console.error('Failed to broadcast presence:', error);
        }
    }, []);

    const resolveConflict = useCallback(async (conflictId: string, resolution: ConflictResolution): Promise<void> => {
        if (!isAdmin) {
            throw new Error('Unauthorized: Admin access required');
        }

        try {
            const response = await fetch('/api/conflicts/resolve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conflictId,
                    resolution
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to resolve conflict: ${response.statusText}`);
            }

            // Remove resolved conflict from state
            setConflictedItems(prev => prev.filter(item => item.id !== conflictId));
            toast.success('Conflict resolved successfully');
        } catch (error) {
            console.error('Failed to resolve conflict:', error);
            toast.error('Failed to resolve conflict');
            throw error;
        }
    }, [isAdmin]);    
// Handle save conflicts
    const handleSaveConflict = async (
        contentKey: string,
        key: string,
        value: any,
        type: 'text' | 'json' | 'file',
        page: string,
        conflictData: any
    ): Promise<void> => {
        setSaveState('conflict');
        
        // Create conflict item
        const conflict: ConflictItem = {
            id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'content',
            componentId: key,
            localVersion: value,
            remoteVersion: conflictData.currentValue,
            conflictedAt: new Date().toISOString(),
            conflictedBy: conflictData.lastModifiedBy || 'Unknown'
        };

        setConflictedItems(prev => [...prev, conflict]);
        
        // Rollback optimistic update
        await rollbackOptimisticUpdate(contentKey);
        
        toast.error(`Conflict detected: ${conflictData.message || 'Content was modified by another user'}`);
    };

    // Rollback optimistic update
    const rollbackOptimisticUpdate = async (contentKey: string): Promise<void> => {
        const optimisticUpdate = optimisticUpdatesRef.current.get(contentKey);
        if (optimisticUpdate) {
            console.log('Rolling back optimistic update for:', contentKey);
            
            // Here you would typically update the UI to show the original value
            // This would require a callback or event system to notify components
            // For now, we'll just clear the optimistic update
            optimisticUpdatesRef.current.delete(contentKey);
            
            // You could emit an event here to notify components to refresh their data
            if (eventRouterRef.current && currentPageRef.current && user) {
                const rollbackEvent: RealtimeEvent = {
                    id: `rollback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'content_change',
                    pageName: currentPageRef.current,
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    version: 'rollback',
                    data: {
                        contentKey: contentKey.split(':')[1], // Remove page prefix
                        oldValue: optimisticUpdate.newValue,
                        newValue: optimisticUpdate.originalValue,
                        contentType: 'text' // Default, could be improved
                    } as ContentChangeEventData
                };

                await eventRouterRef.current.route(rollbackEvent);
            }
        }
    };

    const saveContent = async (
        key: string,
        value: any,
        type: 'text' | 'json' | 'file' = 'text',
        page: string = 'home'
    ): Promise<boolean> => {
        if (!isAdmin) {
            toast.error('Unauthorized: Admin access required');
            return false;
        }

        // Skip saving empty/placeholder values
        if (type === 'text' && (!value || value.trim() === '' || value === 'Click to edit...' || value.includes('Enter your'))) {
            console.log('Skipping save for empty/placeholder value:', key, value);
            return true;
        }

        // For JSON type, validate the data
        if (type === 'json') {
            if (value === null || value === undefined) {
                console.log('Skipping save for null/undefined JSON value:', key);
                return true;
            }

            // If it's an array (like gallery images), validate it has content
            if (Array.isArray(value) && value.length === 0) {
                console.log('Allowing save of empty array for reset:', key);
                // Allow empty arrays to be saved for reset purposes
            }
        }

        const contentKey = `${page}:${key}`;
        const currentVersion = contentVersionsRef.current.get(contentKey) || '1';
        const nextVersion = String(parseInt(currentVersion) + 1);

        // Store original value for potential rollback
        const originalValue = optimisticUpdatesRef.current.get(contentKey)?.originalValue;
        if (!optimisticUpdatesRef.current.has(contentKey)) {
            // First optimistic update - store the original value
            optimisticUpdatesRef.current.set(contentKey, {
                originalValue: value, // This should be the current displayed value
                newValue: value,
                timestamp: Date.now()
            });
        } else {
            // Update the new value but keep the original
            const existing = optimisticUpdatesRef.current.get(contentKey)!;
            optimisticUpdatesRef.current.set(contentKey, {
                ...existing,
                newValue: value,
                timestamp: Date.now()
            });
        }

        setIsSaving(true);
        setSaveState('saving');

        try {
            console.log('Saving content with optimistic update:', { key, value, type, page, version: nextVersion });

            // Broadcast content change event for real-time sync
            if (eventRouterRef.current && currentPageRef.current && user) {
                const event: RealtimeEvent = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'content_change',
                    pageName: currentPageRef.current,
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    version: nextVersion,
                    data: {
                        contentKey: key,
                        oldValue: originalValue,
                        newValue: value,
                        contentType: type
                    } as ContentChangeEventData
                };

                await eventRouterRef.current.route(event);
            }

            // Try the new persistent API first, fallback to legacy
            let response = await fetch('/api/content/persistent', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key,
                    value,
                    type,
                    page,
                    version: currentVersion, // Send current version for conflict detection
                    expectedVersion: currentVersion
                }),
            });

            // If persistent API is not available, fallback to legacy API
            if (response.status === 404) {
                response = await fetch('/api/admin/content', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        key,
                        value,
                        type,
                        page,
                        version: currentVersion,
                        expectedVersion: currentVersion
                    }),
                });
            }

            // Check content type before parsing
            const contentType = response.headers.get('content-type');
            console.log('Response status:', response.status);
            console.log('Response content-type:', contentType);

            if (!response.ok) {
                // Handle conflict specifically
                if (response.status === 409) {
                    const errorData = await response.json();
                    await handleSaveConflict(contentKey, key, value, type, page, errorData);
                    return false;
                }

                // Handle other non-200 responses
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

                if (contentType && contentType.includes('application/json')) {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.details || errorData.error || errorMessage;
                    } catch (jsonError) {
                        console.error('Failed to parse error JSON:', jsonError);
                    }
                } else {
                    const errorText = await response.text();
                    console.error('Non-JSON error response:', errorText.substring(0, 200) + '...');

                    if (response.status === 404) {
                        errorMessage = 'API endpoint not found.';
                    } else if (response.status === 405) {
                        errorMessage = 'Method not allowed.';
                    } else if (response.status === 401 || response.status === 403) {
                        errorMessage = 'Authentication/authorization failed.';
                    }
                }

                throw new Error(errorMessage);
            }

            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                console.error('Expected JSON but got:', contentType);
                console.error('Response body:', responseText.substring(0, 200) + '...');
                throw new Error('Server returned non-JSON response.');
            }

            const responseData = await response.json();
            console.log('Content saved successfully:', responseData);

            // Update version tracking
            contentVersionsRef.current.set(contentKey, responseData.version || nextVersion);
            
            // Clear optimistic update since save was successful
            optimisticUpdatesRef.current.delete(contentKey);

            setSaveState('saved');

            // More descriptive success messages based on content type
            let successMessage = `Saved: ${key.replace(/_/g, ' ')}`;
            if (type === 'json' && Array.isArray(value)) {
                successMessage = `Updated ${key.replace(/_/g, ' ')} (${value.length} items)`;
            } else if (type === 'file') {
                successMessage = `Image updated: ${key.replace(/_/g, ' ')}`;
            }

            toast.success(successMessage);

            const event = new CustomEvent('content-changed', {
                detail: {
                    contentKey: key,
                    newValue: value,
                },
            });
            window.dispatchEvent(event);
            
            // Reset save state after a delay
            setTimeout(() => setSaveState('idle'), 2000);
            
            return true;

        } catch (error) {
            console.error('Error saving content:', error);
            
            // Rollback optimistic update
            await rollbackOptimisticUpdate(contentKey);
            
            setSaveState('error');
            
            const errorMessage = error instanceof Error ? error.message : 'Failed to save content';

            // More specific error messages
            if (errorMessage.includes('authentication') || errorMessage.includes('authorization')) {
                toast.error('Session expired. Please refresh and try again.');
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                toast.error('Network error. Please check your connection.');
            } else {
                toast.error(`Save failed: ${errorMessage}`);
            }
            
            // Reset save state after a delay
            setTimeout(() => setSaveState('idle'), 3000);
            
            return false;
        } finally {
            setIsSaving(false);
        }
    };    
// Component management methods with real-time sync
    const addComponent = useCallback(async (componentType: string, position: ComponentPosition): Promise<string> => {
        if (!hasPermission('component', 'create')) {
            throw new Error('Unauthorized: Component creation permission required');
        }

        // Validate permissions for component operations
        if (!(await validateComponentPermission('add', componentType))) {
            throw new Error('Insufficient permissions to add this component type');
        }

        const componentId = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Optimistic update - broadcast event immediately
            if (eventRouterRef.current && currentPageRef.current && user) {
                const event: RealtimeEvent = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'component_add',
                    pageName: currentPageRef.current,
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    data: {
                        componentId,
                        componentType,
                        position,
                        props: {}
                    }
                };

                await eventRouterRef.current.route(event);
            }

            const response = await fetch('/api/components', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    componentId,
                    componentType,
                    position,
                    userId: user?.id
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to add component: ${response.statusText}`);
            }

            const result = await response.json();
            toast.success(`Component added: ${componentType}`);
            return result.componentId || componentId;
        } catch (error) {
            console.error('Failed to add component:', error);
            toast.error('Failed to add component');
            throw error;
        }
    }, [isAdmin, user, validateComponentPermission]);

    const moveComponent = useCallback(async (componentId: string, newPosition: ComponentPosition): Promise<void> => {
        if (!hasPermission('component', 'move')) {
            throw new Error('Unauthorized: Component move permission required');
        }

        // Validate permissions for component operations
        if (!(await validateComponentPermission('move', componentId))) {
            throw new Error('Insufficient permissions to move this component');
        }

        // Get current position for rollback if needed
        const oldPosition = await getCurrentComponentPosition(componentId);

        try {
            // Optimistic update - broadcast event immediately
            if (eventRouterRef.current && currentPageRef.current && user) {
                const event: RealtimeEvent = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'component_move',
                    pageName: currentPageRef.current,
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    data: {
                        componentId,
                        oldPosition,
                        newPosition
                    }
                };

                await eventRouterRef.current.route(event);
            }

            const response = await fetch(`/api/components/${componentId}/move`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newPosition,
                    userId: user?.id
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to move component: ${response.statusText}`);
            }

            toast.success('Component moved successfully');
        } catch (error) {
            console.error('Failed to move component:', error);
            toast.error('Failed to move component');
            throw error;
        }
    }, [isAdmin, user, validateComponentPermission, getCurrentComponentPosition]);

    const deleteComponent = useCallback(async (componentId: string): Promise<void> => {
        if (!hasPermission('component', 'delete')) {
            throw new Error('Unauthorized: Component delete permission required');
        }

        // Validate permissions for component operations
        if (!(await validateComponentPermission('delete', componentId))) {
            throw new Error('Insufficient permissions to delete this component');
        }

        // Get component info for the event
        const componentInfo = await getComponentInfo(componentId);

        try {
            // Optimistic update - broadcast event immediately
            if (eventRouterRef.current && currentPageRef.current && user && componentInfo) {
                const event: RealtimeEvent = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'component_delete',
                    pageName: currentPageRef.current,
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    data: {
                        componentId,
                        position: componentInfo.position,
                        componentType: componentInfo.type
                    }
                };

                await eventRouterRef.current.route(event);
            }

            const response = await fetch(`/api/components/${componentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.id
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to delete component: ${response.statusText}`);
            }

            toast.success('Component deleted successfully');
        } catch (error) {
            console.error('Failed to delete component:', error);
            toast.error('Failed to delete component');
            throw error;
        }
    }, [isAdmin, user, validateComponentPermission, getComponentInfo]);

    // Page management methods with real-time sync
    const createPage = useCallback(async (pageData: NewPageData): Promise<string> => {
        if (!hasPermission('page', 'create')) {
            throw new Error('Unauthorized: Page creation permission required');
        }

        // Validate permissions for page operations
        if (!(await validatePagePermission('create'))) {
            throw new Error('Insufficient permissions to create pages');
        }

        const pageId = `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Create navigation item for the new page
            const navigationItem: NavigationItem = {
                id: `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                pageId,
                displayName: pageData.title,
                urlSlug: pageData.urlSlug,
                orderIndex: pageData.navigationOrder || 999,
                isVisible: pageData.isVisible ?? true,
                isActive: true
            };

            // Optimistic update - broadcast event immediately
            if (eventRouterRef.current && currentPageRef.current && user) {
                const event: RealtimeEvent = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'page_create',
                    pageName: currentPageRef.current,
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    data: {
                        pageId,
                        pageData,
                        navigationItem
                    }
                };

                await eventRouterRef.current.route(event);
            }

            const response = await fetch('/api/pages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...pageData,
                    pageId,
                    navigationItem,
                    userId: user?.id
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create page: ${response.statusText}`);
            }

            const result = await response.json();
            toast.success(`Page created: ${pageData.title}`);
            return result.pageId || pageId;
        } catch (error) {
            console.error('Failed to create page:', error);
            toast.error('Failed to create page');
            throw error;
        }
    }, [isAdmin, user, validatePagePermission]);

    const updateNavigation = useCallback(async (navItems: NavigationItem[]): Promise<void> => {
        if (!hasPermission('navigation', 'update')) {
            throw new Error('Unauthorized: Navigation update permission required');
        }

        // Validate permissions for navigation operations
        if (!(await validateNavigationPermission('update'))) {
            throw new Error('Insufficient permissions to update navigation');
        }

        try {
            // Determine change type and affected items
            const changeType = 'reorder'; // This could be more sophisticated
            const affectedItemIds = navItems.map(item => item.id);

            // Optimistic update - broadcast event immediately
            if (eventRouterRef.current && currentPageRef.current && user) {
                const event: RealtimeEvent = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'nav_update',
                    pageName: currentPageRef.current,
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    data: {
                        items: navItems,
                        changeType,
                        affectedItemIds
                    }
                };

                await eventRouterRef.current.route(event);
            }

            const response = await fetch('/api/navigation', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: navItems,
                    userId: user?.id
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update navigation: ${response.statusText}`);
            }

            toast.success('Navigation updated successfully');
        } catch (error) {
            console.error('Failed to update navigation:', error);
            toast.error('Failed to update navigation');
            throw error;
        }
    }, [isAdmin, user, validateNavigationPermission]);

    // Navigation management methods
    const createNavigationItem = useCallback(async (itemData: Omit<NavigationItem, 'id'>): Promise<string> => {
        if (!isAdmin) {
            throw new Error('Unauthorized: Admin access required');
        }

        if (!validateNavigationPermission('update')) {
            throw new Error('Insufficient permissions to create navigation items');
        }

        const itemId = `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Optimistic update - broadcast event immediately
            if (eventRouterRef.current && user) {
                const event: RealtimeEvent = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'nav_update',
                    pageName: 'navigation',
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    data: {
                        items: [{ ...itemData, id: itemId }],
                        changeType: 'add',
                        affectedItemIds: [itemId]
                    }
                };

                await eventRouterRef.current.route(event);
            }

            const response = await fetch('/api/navigation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...itemData,
                    userId: user?.id
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create navigation item: ${response.statusText}`);
            }

            const result = await response.json();
            toast.success('Navigation item created successfully');
            return result.item?.id || itemId;
        } catch (error) {
            console.error('Failed to create navigation item:', error);
            toast.error('Failed to create navigation item');
            throw error;
        }
    }, [isAdmin, user, validateNavigationPermission]);

    const updateNavigationItem = useCallback(async (itemId: string, updates: Partial<Omit<NavigationItem, 'id'>>): Promise<void> => {
        if (!isAdmin) {
            throw new Error('Unauthorized: Admin access required');
        }

        if (!validateNavigationPermission('update')) {
            throw new Error('Insufficient permissions to update navigation items');
        }

        try {
            // Optimistic update - broadcast event immediately
            if (eventRouterRef.current && user) {
                const event: RealtimeEvent = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'nav_update',
                    pageName: 'navigation',
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    data: {
                        items: [{ ...updates, id: itemId }],
                        changeType: 'update',
                        affectedItemIds: [itemId]
                    }
                };

                await eventRouterRef.current.route(event);
            }

            const response = await fetch(`/api/navigation/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...updates,
                    userId: user?.id
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update navigation item: ${response.statusText}`);
            }

            toast.success('Navigation item updated successfully');
        } catch (error) {
            console.error('Failed to update navigation item:', error);
            toast.error('Failed to update navigation item');
            throw error;
        }
    }, [isAdmin, user, validateNavigationPermission]);

    const deleteNavigationItem = useCallback(async (itemId: string): Promise<void> => {
        if (!isAdmin) {
            throw new Error('Unauthorized: Admin access required');
        }

        if (!validateNavigationPermission('update')) {
            throw new Error('Insufficient permissions to delete navigation items');
        }

        try {
            // Optimistic update - broadcast event immediately
            if (eventRouterRef.current && user) {
                const event: RealtimeEvent = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'nav_update',
                    pageName: 'navigation',
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    data: {
                        items: [],
                        changeType: 'remove',
                        affectedItemIds: [itemId]
                    }
                };

                await eventRouterRef.current.route(event);
            }

            const response = await fetch(`/api/navigation/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.id
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to delete navigation item: ${response.statusText}`);
            }

            toast.success('Navigation item deleted successfully');
        } catch (error) {
            console.error('Failed to delete navigation item:', error);
            toast.error('Failed to delete navigation item');
            throw error;
        }
    }, [isAdmin, user, validateNavigationPermission]);

    const reorderNavigationItems = useCallback(async (operations: Array<{itemId: string; newOrderIndex: number; newParentId?: string}>): Promise<void> => {
        if (!isAdmin) {
            throw new Error('Unauthorized: Admin access required');
        }

        if (!validateNavigationPermission('reorder')) {
            throw new Error('Insufficient permissions to reorder navigation items');
        }

        try {
            // Optimistic update - broadcast event immediately
            if (eventRouterRef.current && user) {
                const event: RealtimeEvent = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'nav_update',
                    pageName: 'navigation',
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    data: {
                        items: [],
                        changeType: 'reorder',
                        affectedItemIds: operations.map(op => op.itemId)
                    }
                };

                await eventRouterRef.current.route(event);
            }

            const response = await fetch('/api/navigation/reorder', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operations,
                    userId: user?.id
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to reorder navigation items: ${response.statusText}`);
            }

            toast.success('Navigation items reordered successfully');
        } catch (error) {
            console.error('Failed to reorder navigation items:', error);
            toast.error('Failed to reorder navigation items');
            throw error;
        }
    }, [isAdmin, user, validateNavigationPermission]);

    const toggleNavigationVisibility = useCallback(async (itemId: string, isVisible: boolean): Promise<void> => {
        if (!isAdmin) {
            throw new Error('Unauthorized: Admin access required');
        }

        if (!validateNavigationPermission('update')) {
            throw new Error('Insufficient permissions to change navigation visibility');
        }

        try {
            // Optimistic update - broadcast event immediately
            if (eventRouterRef.current && user) {
                const event: RealtimeEvent = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'nav_update',
                    pageName: 'navigation',
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    data: {
                        items: [{ id: itemId, isVisible }],
                        changeType: 'update',
                        affectedItemIds: [itemId]
                    }
                };

                await eventRouterRef.current.route(event);
            }

            const response = await fetch(`/api/navigation/${itemId}/visibility`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isVisible,
                    userId: user?.id
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to toggle navigation visibility: ${response.statusText}`);
            }

            toast.success(`Navigation item ${isVisible ? 'shown' : 'hidden'} successfully`);
        } catch (error) {
            console.error('Failed to toggle navigation visibility:', error);
            toast.error('Failed to toggle navigation visibility');
            throw error;
        }
    }, [isAdmin, user, validateNavigationPermission]);

    return (
        <EditModeContext.Provider value={{
            // Existing properties
            isEditMode,
            toggleEditMode,
            saveContent,
            isAdmin,
            isSaving,
            saveState,
            
            // New real-time properties
            isConnected,
            activeEditors,
            conflictedItems,
            
            // New collaborative methods
            subscribeToPage,
            unsubscribeFromPage,
            broadcastPresence,
            resolveConflict,
            
            // Component management
            addComponent,
            moveComponent,
            deleteComponent,
            
            // Page management
            createPage,
            updateNavigation,
            
            // Navigation management
            createNavigationItem,
            updateNavigationItem,
            deleteNavigationItem,
            reorderNavigationItems,
            toggleNavigationVisibility,
            
            // Permission management
            userRole,
            hasPermission,
            validateComponentPermission,
            validatePagePermission,
            validateNavigationPermission
        }}>
            {children}
        </EditModeContext.Provider>
    );
}

export function useEditMode() {
    const context = useContext(EditModeContext);
    if (context === undefined) {
        throw new Error('useEditMode must be used within an EditModeProvider');
    }
    return context;
}