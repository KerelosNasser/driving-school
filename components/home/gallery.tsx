"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Upload, X, Link, Check } from 'lucide-react';
import { useEditMode } from '@/contexts/editModeContext';
import { EditableText } from '@/components/ui/editable-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  title: string;
  isUploaded?: boolean;
}

interface GalleryProps {
  title?: string;
  subtitle?: string;
  images?: GalleryImage[];
}

interface ImageEditModalProps {
  image: GalleryImage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (image: GalleryImage) => void;
  onDelete?: (id: number) => void;
  isNew?: boolean;
}

const ImageEditModal = ({ image, isOpen, onClose, onSave, onDelete, isNew = false }: ImageEditModalProps) => {
  const [editedImage, setEditedImage] = useState<GalleryImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');

  useEffect(() => {
    setEditedImage(image);
  }, [image]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contentKey', `gallery_image_${Date.now()}`);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      setEditedImage(prev => prev ? {
        ...prev,
        src: result.url,
        alt: result.alt || prev.alt,
        isUploaded: true
      } : null);

      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (editedImage) {
      onSave(editedImage);
      onClose();
    }
  };

  const handleDelete = () => {
    if (editedImage && onDelete) {
      onDelete(editedImage.id);
      onClose();
    }
  };

  if (!isOpen || !editedImage) return null;

  return (
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
          onClick={onClose}
      >
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              {isNew ? 'Add New Image' : 'Edit Image'}
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Image Preview */}
            <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100">
              {editedImage.src ? (
                  <Image
                      src={editedImage.src}
                      alt={editedImage.alt}
                      fill
                      className="object-cover"
                  />
              ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No image selected
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
                      value={editedImage.src}
                      onChange={(e) => setEditedImage(prev => prev ? { ...prev, src: e.target.value } : null)}
                      placeholder="https://example.com/image.jpg"
                      className="mt-1"
                  />
                </div>
            ) : (
                <div>
                  <Label>Upload Image</Label>
                  <div className="mt-1">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={isUploading}
                    />
                    {isUploading && (
                        <div className="mt-2 text-sm text-blue-600">Uploading...</div>
                    )}
                  </div>
                </div>
            )}

            {/* Image Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-title">Title</Label>
                <Input
                    id="image-title"
                    value={editedImage.title}
                    onChange={(e) => setEditedImage(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="Enter image title"
                    className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="image-alt">Alt Text</Label>
                <Input
                    id="image-alt"
                    value={editedImage.alt}
                    onChange={(e) => setEditedImage(prev => prev ? { ...prev, alt: e.target.value } : null)}
                    placeholder="Describe the image for accessibility"
                    className="mt-1"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
              {!isNew && onDelete && (
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
  );
};

export function Gallery({
                          title = 'Our Learning Experience',
                          subtitle = 'See our students and instructors in action.',
                          images: initialImages
                        }: GalleryProps) {
  const { isEditMode, saveContent } = useEditMode();
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isNewImage, setIsNewImage] = useState(false);

  useEffect(() => {
    const fallbackImages: GalleryImage[] = [
      {
        id: 1,
        src: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Professional driving instruction",
        title: "Professional Instruction"
      },
      {
        id: 2,
        src: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Modern driving school vehicles",
        title: "Modern Vehicles"
      },
      {
        id: 3,
        src: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Student practicing parking maneuvers",
        title: "Practical Training"
      }
    ];

    if (initialImages && Array.isArray(initialImages) && initialImages.length > 0) {
      setGalleryImages(initialImages);
    } else {
      setGalleryImages(fallbackImages);
    }
  }, [initialImages]);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying || galleryImages.length === 0 || isEditMode) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, galleryImages.length, isEditMode]);

  const saveGalleryImages = async (updatedImages: GalleryImage[]) => {
    await saveContent('gallery_images', updatedImages, 'json');
  };

  const handleAddImage = () => {
    const newImage: GalleryImage = {
      id: Date.now(),
      src: '',
      alt: '',
      title: 'New Image',
    };
    setEditingImage(newImage);
    setIsNewImage(true);
    setShowEditModal(true);
  };

  const handleEditImage = (image: GalleryImage) => {
    setEditingImage(image);
    setIsNewImage(false);
    setShowEditModal(true);
  };

  const handleSaveImage = async (updatedImage: GalleryImage) => {
    let updatedImages: GalleryImage[];

    if (isNewImage) {
      updatedImages = [...galleryImages, updatedImage];
    } else {
      updatedImages = galleryImages.map(img =>
          img.id === updatedImage.id ? updatedImage : img
      );
    }

    setGalleryImages(updatedImages);
    await saveGalleryImages(updatedImages);
    toast.success(isNewImage ? 'Image added successfully' : 'Image updated successfully');
  };

  const handleDeleteImage = async (id: number) => {
    const updatedImages = galleryImages.filter(img => img.id !== id);
    setGalleryImages(updatedImages);
    await saveGalleryImages(updatedImages);

    // Adjust current index if necessary
    if (currentIndex >= updatedImages.length && updatedImages.length > 0) {
      setCurrentIndex(updatedImages.length - 1);
    } else if (updatedImages.length === 0) {
      setCurrentIndex(0);
    }

    toast.success('Image deleted successfully');
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (galleryImages.length === 0 && !isEditMode) {
    return null;
  }

  return (
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
              <EditableText
                  contentKey="gallery_title"
                  tagName="h2"
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900"
                  placeholder="Enter gallery title..."
              >
                {title}
              </EditableText>
              <EditableText
                  contentKey="gallery_subtitle"
                  tagName="p"
                  className="mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4"
                  placeholder="Enter gallery subtitle..."
                  multiline={true}
              >
                {subtitle}
              </EditableText>
            </motion.div>
          </div>

          {/* Main Gallery Display */}
          {galleryImages.length > 0 && (
              <div className="relative w-full max-w-4xl mx-auto">
                <AnimatePresence initial={false}>
                  <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                      className="relative w-full aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-lg bg-gray-100 group"
                  >
                    <Image
                        src={galleryImages[currentIndex].src}
                        alt={galleryImages[currentIndex].alt}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                    {/* Edit overlay for current image */}
                    {isEditMode && (
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <Button
                              onClick={() => handleEditImage(galleryImages[currentIndex])}
                              className="bg-white/90 text-black hover:bg-white"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Image
                          </Button>
                        </div>
                    )}

                    <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                      <h3 className="text-white text-lg sm:text-xl font-bold">
                        {galleryImages[currentIndex].title}
                      </h3>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation buttons */}
                {galleryImages.length > 1 && (
                    <>
                      <button
                          onClick={goToPrevious}
                          className="absolute top-1/2 -left-4 sm:-left-6 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 sm:p-3 shadow-md transition-all z-10"
                          aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                      <button
                          onClick={goToNext}
                          className="absolute top-1/2 -right-4 sm:-right-6 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 sm:p-3 shadow-md transition-all z-10"
                          aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                    </>
                )}
              </div>
          )}

          {/* Dots indicator */}
          {galleryImages.length > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {galleryImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                            currentIndex === index ? 'bg-yellow-500' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
              </div>
          )}

          {/* Gallery Management Panel */}
          <AnimatePresence>
            {isEditMode && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mt-8"
                >
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Gallery Management</h3>
                      <Button onClick={handleAddImage} className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Image
                      </Button>
                    </div>

                    {/* Image thumbnails */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {galleryImages.map((image, index) => (
                          <div key={image.id} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                  src={image.src}
                                  alt={image.alt}
                                  width={120}
                                  height={120}
                                  className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 rounded-lg flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                <Button
                                    size="sm"
                                    onClick={() => handleEditImage(image)}
                                    className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteImage(image.id)}
                                    className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-center mt-1 truncate">{image.title}</p>
                          </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state for edit mode */}
          {isEditMode && galleryImages.length === 0 && (
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
              >
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <p className="text-gray-500 mb-4">No images in gallery</p>
                  <Button onClick={handleAddImage} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Image
                  </Button>
                </div>
              </motion.div>
          )}

          {/* Image Edit Modal */}
          <ImageEditModal
              image={editingImage}
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false);
                setEditingImage(null);
                setIsNewImage(false);
              }}
              onSave={handleSaveImage}
              onDelete={handleDeleteImage}
              isNew={isNewImage}
          />
        </div>
      </section>
  );
}