'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X,Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {useEditMode} from "@/contexts/editModeContext";

interface EditableImageProps {
    src: string;
    alt: string;
    contentKey: string;
    width?: number;
    height?: number;
    className?: string;
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
}

export function EditableImage({
                                  src,
                                  alt,
                                  contentKey,
                                  width,
                                  height,
                                  className = '',
                                  fill = false,
                                  priority = false,
                                  sizes
                              }: EditableImageProps) {
    const { isEditMode, saveContent, isSaving } = useEditMode();
    const [isHovered, setIsHovered] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);
    const [currentAlt, setCurrentAlt] = useState(alt);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageClick = () => {
        if (!isEditMode || isSaving) return;
        setShowEditModal(true);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        uploadImage(file);
    };

    const uploadImage = async (file: File) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('contentKey', contentKey);

            const response = await fetch('/api/admin/upload-image', {
                method: 'POST',
                body: formData,
            });
            const { url, alt: generatedAlt } = await response.json();

            // Save the image URL and alt text
            await saveContent(`${contentKey}_url`, url, 'file');
            if (generatedAlt) {
                await saveContent(`${contentKey}_alt`, generatedAlt);
                setCurrentAlt(generatedAlt);
            }

            setCurrentSrc(url);
            toast.success('Image updated successfully');
            setShowEditModal(false);
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleAltTextSave = async (newAlt: string) => {
        if (newAlt !== currentAlt) {
            await saveContent(`${contentKey}_alt`, newAlt);
            setCurrentAlt(newAlt);
            toast.success('Alt text updated');
        }
    };

    if (!isEditMode) {
        const ImageComponent = fill ? (
            <Image
                src={currentSrc}
                alt={currentAlt}
                fill
                className={className}
                priority={priority}
                sizes={sizes}
            />
        ) : (
            <Image
                src={currentSrc}
                alt={currentAlt}
                width={width}
                height={height}
                className={className}
                priority={priority}
                sizes={sizes}
            />
        );
        return ImageComponent;
    }

    return (
        <>
            <div
                className="relative group cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleImageClick}
            >
                {fill ? (
                    <Image
                        src={currentSrc}
                        alt={currentAlt}
                        fill
                        className={`${className} transition-all duration-200 ${isHovered ? 'opacity-80' : ''}`}
                        priority={priority}
                        sizes={sizes}
                    />
                ) : (
                    <Image
                        src={currentSrc}
                        alt={currentAlt}
                        width={width}
                        height={height}
                        className={`${className} transition-all duration-200 ${isHovered ? 'opacity-80' : ''}`}
                        priority={priority}
                        sizes={sizes}
                    />
                )}

                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg"
                        >
                            <div className="text-white text-center">
                                <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm font-medium">Click to edit image</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Edit Image</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {/* Current Image Preview */}
                                <div className="relative h-32 w-full rounded-lg overflow-hidden bg-gray-100">
                                    <Image
                                        src={currentSrc}
                                        alt={currentAlt}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* Alt Text Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Alt Text
                                    </label>
                                    <input
                                        type="text"
                                        value={currentAlt}
                                        onChange={(e) => setCurrentAlt(e.target.value)}
                                        onBlur={(e) => handleAltTextSave(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Describe the image..."
                                    />
                                </div>

                                {/* Upload Button */}
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="w-full"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4 mr-2" />
                                                Upload New Image
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Max file size: 5MB. Supported formats: JPG, PNG, WebP
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}