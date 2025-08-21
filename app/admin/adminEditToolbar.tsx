'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Edit3,
    Save,
    EyeOff,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {useEditMode} from "@/contexts/editModeContext";

export function AdminEditToolbar() {
    const { isEditMode, toggleEditMode, isAdmin, isSaving } = useEditMode();
    const [isCollapsed] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);

    if (!isAdmin) return null;

    return (
        <>
            {/* Fixed Toolbar */}
            <motion.div
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 shadow-lg"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-white font-medium text-sm">Admin Panel</span>
                                <Badge variant="secondary" className="text-xs">
                                    {isEditMode ? 'Edit Mode' : 'Preview Mode'}
                                </Badge>
                            </div>

                            {isSaving && (
                                <div className="flex items-center space-x-2 text-yellow-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Saving...</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Quick Actions */}
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-slate-800"
                                    onClick={() => setShowQuickActions(!showQuickActions)}
                                >

                                </Button>

                            </div>

                            {/* Main Toggle Button */}
                            <Button
                                onClick={toggleEditMode}
                                size="sm"
                                className={`${
                                    isEditMode
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                }`}
                                disabled={isSaving}
                            >
                                {isEditMode ? (
                                    <>
                                        <EyeOff className="h-4 w-4 mr-1" />
                                        Exit Edit
                                    </>
                                ) : (
                                    <>
                                        <Edit3 className="h-4 w-4 mr-1" />
                                        Edit Page
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Expanded Toolbar Content */}
                    <AnimatePresence>
                        {!isCollapsed && isEditMode && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-700 py-3 overflow-hidden"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <span className="text-white text-sm font-medium">Edit Tools:</span>
                                        <div className="flex space-x-2">
                                            <Badge variant="outline" className="text-xs text-white border-slate-600">
                                                Click any text to edit
                                            </Badge>
                                            <Badge variant="outline" className="text-xs text-white border-slate-600">
                                                Hover components for actions
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-black border-slate-600 "
                                        >
                                            <Save className="h-4 w-4 mr-1" />
                                            Save All Changes
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Spacer to prevent content overlap */}
            <div className="h-16"></div>

            {/* Edit Mode Overlay Styles */}
            {isEditMode && (
                <style jsx global>{`

                `}</style>
            )}
        </>
    );
}