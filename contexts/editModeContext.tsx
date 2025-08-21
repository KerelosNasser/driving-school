'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface EditModeContextType {
    isEditMode: boolean;
    toggleEditMode: () => void;
    saveContent: (key: string, value: any, type?: 'text' | 'json' | 'file') => Promise<boolean>;
    isAdmin: boolean;
    isSaving: boolean;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export function EditModeProvider({ children }: { children: ReactNode }) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { user, isLoaded } = useUser();

    // Check if user is admin - you can customize this logic
    const isAdmin = isLoaded && (
        user?.publicMetadata?.role === 'admin' ||
        process.env.NODE_ENV === 'development' // Allow in development
    );

    useEffect(() => {
        // Only allow edit mode for admins
        if (!isAdmin && isEditMode) {
            setIsEditMode(false);
        }
    }, [isAdmin, isEditMode]);

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

    const saveContent = async (key: string, value: any, type: 'text' | 'json' | 'file' = 'text'): Promise<boolean> => {
        if (!isAdmin) {
            toast.error('Unauthorized: Admin access required');
            return false;
        }

        if (!value || value.trim() === '' || value === 'Click to edit...' || value === 'Enter your...') {
            console.log('Skipping save for empty/placeholder value:', key, value);
            return true;
        }

        setIsSaving(true);
        try {
            console.log('Saving content:', { key, value, type });

            const response = await fetch('/api/admin/content', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key,
                    value,
                    type,
                    page: 'home'
                }),
            });

            // Check content type before parsing
            const contentType = response.headers.get('content-type');
            console.log('Response status:', response.status);
            console.log('Response content-type:', contentType);

            if (!response.ok) {
                // Handle non-200 responses
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

                if (contentType && contentType.includes('application/json')) {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.details || errorData.error || errorMessage;
                    } catch (jsonError) {
                        console.error('Failed to parse error JSON:', jsonError);
                    }
                } else {
                    // If it's HTML or other content, read as text for debugging
                    const errorText = await response.text();
                    console.error('Non-JSON error response:', errorText.substring(0, 200) + '...');

                    if (response.status === 404) {
                        errorMessage = 'API endpoint not found. Please check if /api/admin/content exists.';
                    } else if (response.status === 405) {
                        errorMessage = 'Method not allowed. The API might not support PUT requests.';
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
                throw new Error('Server returned non-JSON response. Check your API endpoint.');
            }

            const responseData = await response.json();
            console.log('Content saved successfully:', responseData);
            toast.success(`Saved: ${key.replace(/_/g, ' ')}`);
            return true;

        } catch (error) {
            console.error('Error saving content:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to save content';
            toast.error(`Save failed: ${errorMessage}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <EditModeContext.Provider value={{
            isEditMode,
            toggleEditMode,
            saveContent,
            isAdmin,
            isSaving
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