'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useEditMode } from '@/contexts/editModeContext';

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

    // Emergency Contact
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

const defaultGlobalContent: GlobalContent = {
    business_name: 'EG Driving School',
    business_phone: '0431512095',
    business_email: 'info@egdrivingschool.com',
    business_address: 'Brisbane, Queensland, Australia',

    instructor_name: 'Emael Ghobrial',
    instructor_phone: '0431512095',
    instructor_email: 'info@egdrivingschool.com',
    instructor_bio_short: 'Experienced driving instructor with 15+ years of teaching.',

    operating_hours: '7:00 AM - 7:00 PM',
    operating_days: 'Monday - Sunday',

    booking_advance_days: 14,
    default_lesson_duration: 60,
    service_radius_km: 50,
};

const GlobalContentContext = createContext<GlobalContentContextType | undefined>(undefined);

export function GlobalContentProvider({ children }: { children: ReactNode }) {
    const [content, setContent] = useState<GlobalContent>(defaultGlobalContent);
    const [isLoading, setIsLoading] = useState(true);
    const { saveContent, isAdmin } = useEditMode();

    const fetchGlobalContent = async () => {
        try {
            const response = await fetch('/api/admin/content?page=global');
            if (response.ok) {
                const { data } = await response.json();
                const contentMap: Partial<GlobalContent> = {};

                data.forEach((item: any) => {
                    const key = item.content_key as keyof GlobalContent;
                    if (item.content_type === 'json') {
                        contentMap[key] = item.content_json;
                    } else if (item.content_type === 'text') {
                        contentMap[key] = item.content_value;
                    }
                });

                setContent(prev => ({ ...prev, ...contentMap }));
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