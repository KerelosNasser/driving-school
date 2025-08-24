'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, Image as ImageIcon, Link, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useEditMode } from "@/contexts/editModeContext";

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
    const [tempSrc, setTempSrc] = useState(src);
    const [tempAlt, setTempAlt] = useState(alt);
    const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageClick = () => {
        if (!isEditMode || isSaving) return;
        setTempSrc(currentSrc);
        setTempAlt(currentAlt);
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
            formData.append('altText', tempAlt || `Image for ${contentKey}`);

            const response = await fetch('/api/admin/upload-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const result = await response.json();
            setTempSrc(result.url);

            if (result.alt && result.alt !== tempAlt) {
                setTempAlt(result.alt);
            }

            toast.success('Image uploaded successfully');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!tempSrc.trim()) {
            toast.error('Please provide an image URL or upload a file');
            return;
        }

        try {
            // Save both image URL and alt text
            const imageData = {
                url: tempSrc.trim(),
                alt: tempAlt.trim() || `Image for ${contentKey}`
            };

            await saveContent(contentKey, imageData, 'json');

            // Update local state
            setCurrentSrc(tempSrc);
            setCurrentAlt(tempAlt);

            setShowEditModal(false);
            toast.success('Image updated successfully');
        } catch (error) {
            console.error('Error saving image:', error);
            toast.error('Failed to save image');
        }
    };

    const handleCancel = () => {
        setTempSrc(currentSrc);
        setTempAlt(currentAlt);
        setShowEditModal(false);
    };

    // Render the actual image
    const renderImage = () => {
        const imageProps = {
            src: currentSrc,
            alt: currentAlt,
            className: `${className} ${isEditMode ? 'transition-all duration-200' : ''} ${isHovered && isEditMode ? 'opacity-80' : ''}`,
            priority,
            sizes,
            onError: (e: any) => {
                console.error('Image failed to load:', currentSrc);
                // Optionally set a fallback image here
            }
        };

        if (fill) {
            return <Image {...imageProps} fill />;
        } else {
            return <Image {...imageProps} width={width} height={height} />;
        }
    };

    if (!isEditMode) {
        return renderImage();
    }

    return (
        <>
            <div
                className="relative group cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleImageClick}
            >
                {renderImage()}

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
                        onClick={handleCancel}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold">Edit Image</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleCancel}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {/* Current Image Preview */}
                                <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100">
                                    {tempSrc ? (
                                        <Image
                                            src={tempSrc}
                                            alt={tempAlt}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            onError={() => {
                                                console.error('Preview image failed to load:', tempSrc);
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            <ImageIcon className="h-12 w-12 mb-2" />
                                            <p>No image selected</p>
                                        </div>
                                    )}
                                </div>

                                {/* Upload Mode Selector */}
                                <div className="flex gap-2">
                                    <Button
                                        variant={uploadMode === 'url' ? 'default' : 'outline'}
                                        onClick={() => setUploadMode('url')}
                                        className="flex-1"
                                    >
                                        <Link className="h-4 w-4 mr-2" />
                                        URL
                                    </Button>
                                    <Button
                                        variant={uploadMode === 'file' ? 'default' : 'outline'}
                                        onClick={() => setUploadMode('file')}
                                        className="flex-1"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload
                                    </Button>
                                </div>

                                {/* Image Source Input */}
                                {uploadMode === 'url' ? (
                                    <div>
                                        <Label htmlFor="image-url">Image URL</Label>
                                        <Input
                                            id="image-url"
                                            type="url"
                                            value={tempSrc}
                                            onChange={(e) => setTempSrc(e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="mt-1"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <Label>Upload Image</Label>
                                        <div className="mt-1">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/jpg,image/gif"
                                                onChange={handleFileSelect}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                disabled={isUploading}
                                            />
                                            {isUploading && (
                                                <div className="mt-2 text-sm text-blue-600 flex items-center">
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Uploading...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Alt Text Input */}
                                <div>
                                    <Label htmlFor="image-alt">Alt Text (for accessibility)</Label>
                                    <Input
                                        id="image-alt"
                                        value={tempAlt}
                                        onChange={(e) => setTempAlt(e.target.value)}
                                        placeholder="Describe the image for screen readers"
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Help visually impaired users understand what's in the image
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={handleSave}
                                        className="flex-1"
                                        disabled={!tempSrc.trim() || isUploading}
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                    <Button variant="outline" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                </div>

                                <p className="text-xs text-gray-500 text-center">
                                    Max file size: 10MB • Supported: JPG, PNG, WebP, GIF
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}