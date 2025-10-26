'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useEditMode } from '@/contexts/editModeContext';
import defaultGlobalContentJson from '@/data/global-content.json';

interface GlobalContent {
    // Business Information
    business_name: string;
    business_phone: string;
    business_email: string;
    business_address: string;

    // Instructor Information
    instructor_name: string;
    instructor_phone: string;
    instructor_email: string;
    instructor_bio_short: string;

    // Social Media
    facebook_url?: string;
    instagram_url?: string;
    linkedin_url?: string;

    // Operating Hours
    operating_hours: string;
    operating_days: string;

    emergency_contact?: string;

    // Other Global Settings
    booking_advance_days: number;
    default_lesson_duration: number;
    service_radius_km: number;
}

interface GlobalContentContextType {
    content: GlobalContent;
    updateGlobalContent: (key: keyof GlobalContent, value: any) => Promise<void>;
    isLoading: boolean;
    refreshContent: () => Promise<void>;
}

// Load default global content from a JSON file so repetitive data is centralized.
// This keeps instructor and business contact info in one place for easier editing.
const defaultGlobalContent: GlobalContent = defaultGlobalContentJson as GlobalContent;

const GlobalContentContext = createContext<GlobalContentContextType | undefined>(undefined);

export function GlobalContentProvider({ children }: { children: ReactNode }) {
    const [content, setContent] = useState<GlobalContent>(defaultGlobalContent);
    const [isLoading, setIsLoading] = useState(true);
    const { saveContent, isAdmin } = useEditMode();

    const fetchGlobalContent = async () => {
        try {
            const response = await fetch('/api/admin/content?page=global').catch(() => null);
            if (response && response.ok) {
                const { data } = await response.json();
                const contentMap: Partial<GlobalContent> = {};

                if (data && Array.isArray(data)) {
                    data.forEach((item: any) => {
                        const key = item.content_key as keyof GlobalContent;
                        if (item.content_type === 'json') {
                            // @ts-ignore
                            contentMap[key] = item.content_json as any;
                        } else if (item.content_type === 'text') {
                            // @ts-ignore
                            contentMap[key] = item.content_value as any;
                        }
                    });
                }

                setContent(prev => ({ ...prev, ...contentMap }));
            } else {
                // On failure, keep defaults and log
                console.warn('Global content fetch failed; using defaults');
            }
        } catch (error) {
            console.error('Error fetching global content:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGlobalContent();
    }, []);

    const updateGlobalContent = async (key: keyof GlobalContent, value: any) => {
        if (!isAdmin) return;

        setContent(prev => ({ ...prev, [key]: value }));

        const type = typeof value === 'object' ? 'json' : 'text';
        await saveContent(key, value, type,);
    };

    const refreshContent = async () => {
        setIsLoading(true);
        await fetchGlobalContent();
    };

    return (
        <GlobalContentContext.Provider value={{
            content,
            updateGlobalContent,
            isLoading,
            refreshContent
        }}>
            {children}
        </GlobalContentContext.Provider>
    );
}

export function useGlobalContent() {
    const context = useContext(GlobalContentContext);
    if (context === undefined) {
        throw new Error('useGlobalContent must be used within a GlobalContentProvider');
    }
    return context;
}
