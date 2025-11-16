"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  X, 
  Link as LinkIcon, 
  Check, 
  Camera,
  Users,
  Star,
  Award,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause} from 'lucide-react';
import { useEditMode } from '@/contexts/editModeContext';
import { EditableText } from '@/components/ui/editable-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface StudentImage {
  id: number;
  src: string;
  alt: string;
  studentName: string;
  achievement?: string;
  date?: string;
  isUploaded?: boolean;
}

interface GalleryProps {
  title?: string;
  subtitle?: string;
  images?: StudentImage[];
}

interface ImageEditModalProps {
  image: StudentImage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (image: StudentImage) => void;
  onDelete?: (id: number) => void;
  isNew?: boolean;
}

const ImageEditModal = ({ image, isOpen, onClose, onSave, onDelete, isNew = false }: ImageEditModalProps) => {
  const [editedImage, setEditedImage] = useState<StudentImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');

  useEffect(() => {
    setEditedImage(image);
  }, [image]);

  const convertGoogleDriveUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.hostname === 'drive.google.com' && urlObj.pathname.startsWith('/file/d/')) {
        const pathParts = urlObj.pathname.split('/');
        const fileId = pathParts[3];
        if (fileId) {
          return `https://drive.google.com/uc?id=${fileId}`;
        }
      }
      
      if (urlObj.hostname === 'drive.google.com' && urlObj.pathname.startsWith('/thumbnail')) {
        urlObj.searchParams.set('sz', 's2048');
        return urlObj.toString();
      }
      
      return url;
    } catch (_e) {
      return url;
    }
  };

  const isValidImageUrl = (url: string): boolean => {
    if (!url || url.trim().length === 0) return false;
    
    try {
      const urlToTest = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(urlToTest);
      
      if (urlObj.hostname.includes('google.com') && urlObj.pathname.includes('/imgres')) {
        return false;
      }
      
      if (urlObj.hostname.includes('drive.google.com') && urlObj.pathname.includes('/file/d/')) {
        return true;
      }
      
      if (urlObj.hostname.includes('docs.google.com') && urlObj.pathname.includes('/document/d/')) {
        return false;
      }
      
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
      const urlPath = urlObj.pathname.toLowerCase();
      
      return imageExtensions.some(ext => urlPath.endsWith(ext));
    } catch (_e) {
      return false;
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!editedImage) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contentKey', `student_image_${editedImage.id}_${Date.now()}`);
      formData.append('altText', editedImage.alt || `${editedImage.studentName} - driving student`);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      setEditedImage(prev => prev ? {
        ...prev,
        src: result.url,
        alt: result.alt || prev.alt,
        isUploaded: true
      } : null);

      toast.success('Student image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!editedImage) return;
    
    if (uploadMode === 'url' && editedImage.src) {
      if (!isValidImageUrl(editedImage.src)) {
        toast.error('Please enter a valid direct image URL. Google Images search URLs are not supported.');
        return;
      }
    }

    if (editedImage.src) {
      const imageToSave = {
        ...editedImage,
        studentName: editedImage.studentName.trim() || `Student ${editedImage.id}`
      };
      onSave(imageToSave);
      onClose();
    } else {
      toast.error('Please provide an image');
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
        className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {isNew ? 'Add Student Success Story' : 'Edit Student'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="relative h-48 w-full rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200">
            {editedImage.src && isValidImageUrl(editedImage.src) ? (
              <Image
                src={convertGoogleDriveUrl(editedImage.src)}
                alt={editedImage.alt}
                width={400}
                height={192}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                onError={(e) => {
                  console.error('Image failed to load:', editedImage.src);
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/students/1.webp';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Camera className="h-12 w-12 mb-2" />
                <span className="text-sm">Upload student photo</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant={uploadMode === 'file' ? 'default' : 'outline'}
              onClick={() => setUploadMode('file')}
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
            <Button
              variant={uploadMode === 'url' ? 'default' : 'outline'}
              onClick={() => setUploadMode('url')}
              className="flex-1 rounded-xl"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Use URL
            </Button>
          </div>

          {uploadMode === 'file' ? (
            <div>
              <Label className="text-sm font-medium text-gray-700">Upload Student Photo</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
                  disabled={isUploading}
                />
                {isUploading && (
                  <div className="mt-3 text-sm text-emerald-600 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                    Uploading student photo...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="image-url" className="text-sm font-medium text-gray-700">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                value={editedImage.src}
                onChange={(e) => setEditedImage(prev => prev ? { ...prev, src: e.target.value } : null)}
                placeholder="https://example.com/student-photo.jpg"
                className="mt-2 rounded-xl"
              />
              <p className="text-xs text-gray-500 mt-1">Note: Please use direct image URLs, not search result pages.</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="student-name" className="text-sm font-medium text-gray-700">Student Name (Optional)</Label>
              <Input
                id="student-name"
                value={editedImage.studentName}
                onChange={(e) => setEditedImage(prev => prev ? { ...prev, studentName: e.target.value } : null)}
                placeholder="Enter student's name (optional)"
                className="mt-2 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="achievement" className="text-sm font-medium text-gray-700">Achievement</Label>
              <select
                id="achievement"
                value={editedImage.achievement || ''}
                onChange={(e) => setEditedImage(prev => prev ? { ...prev, achievement: e.target.value } : null)}
                className="mt-2 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select achievement</option>
                <option value="First Time Pass">First Time Pass</option>
                <option value="Manual License">Manual License</option>
                <option value="Auto License">Auto License</option>
                <option value="Motorcycle License">Motorcycle License</option>
                <option value="Truck License">Truck License</option>
                <option value="Refresher Course">Refresher Course</option>
                <option value="Defensive Driving">Defensive Driving</option>
              </select>
            </div>

            <div>
              <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date (Optional)</Label>
              <Input
                id="date"
                type="date"
                value={editedImage.date || ''}
                onChange={(e) => setEditedImage(prev => prev ? { ...prev, date: e.target.value } : null)}
                className="mt-2 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="alt-text" className="text-sm font-medium text-gray-700">Alt Text (for accessibility)</Label>
              <Input
                id="alt-text"
                value={editedImage.alt}
                onChange={(e) => setEditedImage(prev => prev ? { ...prev, alt: e.target.value } : null)}
                placeholder={`${editedImage.studentName || 'Student'} - successful driving student`}
                className="mt-2 rounded-xl"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl" 
              disabled={!editedImage.src}
            >
              <Check className="h-4 w-4 mr-2" />
              Save Student
            </Button>
            {!isNew && onDelete && (
              <Button variant="destructive" onClick={handleDelete} className="rounded-xl">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export function Gallery({
  title = 'Our Successful Students',
  subtitle = 'Meet some of our amazing students who achieved their driving goals with us.',
  images: initialImages
}: GalleryProps) {
  const { isEditMode, saveContent } = useEditMode();
  const [studentImages, setStudentImages] = useState<StudentImage[]>([]);
  const [editingImage, setEditingImage] = useState<StudentImage | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isNewImage, setIsNewImage] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const convertGoogleDriveUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.hostname === 'drive.google.com' && urlObj.pathname.startsWith('/file/d/')) {
        const pathParts = urlObj.pathname.split('/');
        const fileId = pathParts[3];
        if (fileId) {
          return `https://drive.google.com/uc?id=${fileId}`;
        }
      }
      
      if (urlObj.hostname === 'drive.google.com' && urlObj.pathname.startsWith('/thumbnail')) {
        urlObj.searchParams.set('sz', 's2048');
        return urlObj.toString();
      }
      
      return url;
    } catch (_e) {
      return url;
    }
  };

  useEffect(() => {
    const fallbackImages: StudentImage[] = Array.from({ length: 23 }, (_, i) => ({
      id: i + 1,
      src: `/images/students/${i + 1}.webp`,
      alt: "Sarah - successful driving student",
      studentName: "",
      achievement: "",
      date: ""
    }));

    let imagesToUse = fallbackImages;

    if (initialImages && Array.isArray(initialImages) && initialImages.length > 0) {
      const validImages = initialImages.filter(img =>
        img &&
        typeof img.src === 'string' &&
        img.src.trim() !== ''
      ).map(img => ({
        ...img,
        id: img.id || Date.now() + Math.random(),
        studentName: img.studentName || `Student ${img.id || Date.now() + Math.random()}`,
        alt: img.alt || img.studentName || `Student ${img.id || Date.now() + Math.random()} - successful driving student`,
        src: img.src.trim()
      }));

      if (validImages.length > 0) {
        imagesToUse = validImages;
      }
    }

    setStudentImages(imagesToUse);
  }, [initialImages]);

  const saveStudentImages = async (updatedImages: StudentImage[]) => {
    try {
      await saveContent('gallery_images', updatedImages, 'json');
      return true;
    } catch (error) {
      console.error('Failed to save student images:', error);
      toast.error('Failed to save student gallery changes');
      return false;
    }
  };

  const handleAddImage = () => {
    const newImage: StudentImage = {
      id: Date.now(),
      src: '',
      alt: '',
      studentName: '',
      achievement: '',
      date: ''
    };
    setEditingImage(newImage);
    setIsNewImage(true);
    setShowEditModal(true);
  };

  const handleEditImage = (image: StudentImage) => {
    setEditingImage({ ...image });
    setIsNewImage(false);
    setShowEditModal(true);
  };

  const handleSaveImage = async (updatedImage: StudentImage) => {
    let updatedImages: StudentImage[];

    if (isNewImage) {
      updatedImages = [...studentImages, updatedImage];
    } else {
      updatedImages = studentImages.map(img =>
        img.id === updatedImage.id ? updatedImage : img
      );
    }

    setStudentImages(updatedImages);

    const success = await saveStudentImages(updatedImages);
    if (success) {
      toast.success(isNewImage ? 'Student added successfully' : 'Student updated successfully');
    }
  };

  const handleDeleteImage = async (id: number) => {
    const updatedImages = studentImages.filter(img => img.id !== id);
    setStudentImages(updatedImages);

    if (currentIndex >= updatedImages.length && updatedImages.length > 0) {
      setCurrentIndex(updatedImages.length - 1);
    } else if (updatedImages.length === 0) {
      setCurrentIndex(0);
    }

    const success = await saveStudentImages(updatedImages);
    if (success) {
      toast.success('Student removed successfully');
    }
  };

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => prev === 0 ? studentImages.length - 1 : prev - 1);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  }, [studentImages.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => prev === studentImages.length - 1 ? 0 : prev + 1);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  }, [studentImages.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (studentImages.length <= 1) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, studentImages.length]);

  useEffect(() => {
    if (!isAutoPlaying || studentImages.length <= 1) return;

    const interval = setInterval(() => {
      goToNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, goToNext, studentImages.length]);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    if (e.targetTouches && e.targetTouches[0]) {
      setTouchStart(e.targetTouches[0].clientX);
    }
    setIsAutoPlaying(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.targetTouches && e.targetTouches[0]) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && studentImages.length > 1) {
      goToNext();
    }
    if (isRightSwipe && studentImages.length > 1) {
      goToPrevious();
    }

    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  if (studentImages.length === 0 && !isEditMode) {
    return null;
  }

  return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-emerald-50/30 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <EditableText
            contentKey="student_gallery_title"
            tagName="h2"
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-700 bg-clip-text text-transparent"
            placeholder="Enter gallery title..."
          >
            {title}
          </EditableText>
          <EditableText
            contentKey="student_gallery_subtitle"
            tagName="p"
            className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto px-4 leading-relaxed"
            placeholder="Enter gallery subtitle..."
            multiline={true}
          >
            {subtitle}
          </EditableText>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-emerald-600 mr-2" />
                  <span className="text-2xl font-bold text-emerald-600">{studentImages.length}</span>
                </div>
                <p className="text-sm text-gray-600">Success Stories</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-2xl font-bold text-yellow-500">95%</span>
                </div>
                <p className="text-sm text-gray-600">Pass Rate</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-2xl font-bold text-blue-600">
                    {studentImages.filter(img => img.achievement === 'First Time Pass').length}
                  </span>
                </div>
                <p className="text-sm text-gray-600">First Time Pass</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative"
        >
          {studentImages.length > 0 && (
            <>
              <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20">
                <Button
                  onClick={goToPrevious}
                  className="h-10 w-10 sm:h-12 sm:w-12 p-0 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg backdrop-blur-sm border border-gray-200 transition-all duration-200 hover:scale-105"
                  disabled={studentImages.length <= 1}
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </div>
              
              <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20">
                <Button
                  onClick={goToNext}
                  className="h-10 w-10 sm:h-12 sm:w-12 p-0 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg backdrop-blur-sm border border-gray-200 transition-all duration-200 hover:scale-105"
                  disabled={studentImages.length <= 1}
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </div>

              <div 
                className="overflow-hidden rounded-2xl"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div className="flex items-center justify-center min-h-[380px] sm:min-h-[440px] md:min-h-[500px] lg:min-h-[600px] relative px-4">
                  <AnimatePresence initial={false}>
                    {studentImages.map((student, index) => {
                      const isActive = index === currentIndex;
                      const isPrev = index === (currentIndex === 0 ? studentImages.length - 1 : currentIndex - 1);
                      const isNext = index === (currentIndex === studentImages.length - 1 ? 0 : currentIndex + 1);
                      const isVisible = isActive || isPrev || isNext;

                      if (!isVisible) return null;

                      return (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, scale: 0.8, x: isNext ? 100 : isPrev ? -100 : 0 }}
                          animate={{
                            opacity: isActive ? 1 : 0.4,
                            scale: isActive ? 1 : 0.75,
                            x: isActive ? 0 : isNext ? '50%' : isPrev ? '-50%' : 0,
                            zIndex: isActive ? 10 : 5
                          }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className={`absolute group bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-500 ${
                            isActive 
                              ? 'w-[260px] h-[360px] sm:w-[300px] sm:h-[420px] md:w-[350px] md:h-[480px] lg:w-[400px] lg:h-[550px] shadow-2xl shadow-emerald-500/20' 
                              : 'w-[180px] h-[260px] sm:w-[220px] sm:h-[320px] md:w-[260px] md:h-[380px] lg:w-[300px] lg:h-[420px] cursor-pointer'
                          }`}
                          onClick={() => {
                            if (!isActive) {
                              setCurrentIndex(index);
                              setIsAutoPlaying(false);
                              setTimeout(() => setIsAutoPlaying(true), 3000);
                            }
                          }}
                        >
                          <div className="relative w-full h-full overflow-hidden bg-gray-100">
                            <Image
                              src={convertGoogleDriveUrl(student.src)}
                              alt={student.alt}
                              fill
                              className={`object-cover transition-transform duration-500 ${
                                isActive ? 'group-hover:scale-105' : ''
                              }`}
                              sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 400px"
                              priority={isActive}
                              onError={(e) => {
                                console.error('Image failed to load:', student.src);
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/students/1.webp';
                              }}
                            />
                            
                            {student.achievement && isActive && (
                              <div className="absolute top-4 left-4">
                                <span className="px-3 py-1.5 bg-emerald-500/90 text-white text-sm font-bold rounded-full backdrop-blur-sm flex items-center">
                                  <Award className="h-4 w-4 mr-1.5" />
                                  {student.achievement}
                                </span>
                              </div>
                            )}

                            {isEditMode && isActive && (
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditImage(student);
                                  }}
                                  className="h-9 w-9 p-0 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteImage(student.id);
                                  }}
                                  className="h-9 w-9 p-0 rounded-full shadow-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}

                            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent ${
                              isActive ? 'h-32' : 'h-24'
                            }`} />
                            
                            <div className={`absolute bottom-0 left-0 right-0 text-white ${
                              isActive ? 'p-6' : 'p-4'
                            }`}>
                              <h3 className={`font-bold mb-1 ${
                                isActive ? 'text-xl sm:text-2xl' : 'text-lg'
                              }`}>
                                {student.studentName}
                              </h3>
                              {student.date && isActive && (
                                <p className="text-sm text-white/90 mb-2">
                                  {new Date(student.date).toLocaleDateString('en-AU', {
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </p>
                              )}
                              {!isActive && (
                                <p className="text-xs text-white/80">
                                  Click to view
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex flex-col items-center mt-8 space-y-4">
                <div className="flex items-center justify-center space-x-6">
                  {studentImages.length > 1 && (
                    <Button
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md border border-gray-200"
                    >
                      {isAutoPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  <div className="flex space-x-2">
                    {studentImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentIndex(index);
                          setIsAutoPlaying(false);
                          setTimeout(() => setIsAutoPlaying(true), 3000);
                        }}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          index === currentIndex 
                            ? 'bg-emerald-500 w-8' 
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {studentImages.length === 0 && !isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No student stories yet</h3>
            <p className="text-gray-500">
              Student success stories will appear here once they're added.
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-12"
            >
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Student Gallery Management</h3>
                  <Button 
                    onClick={handleAddImage} 
                    className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                </div>

                {studentImages.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No student stories added yet</p>
                    <Button 
                      onClick={handleAddImage} 
                      className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Student Story
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {studentImages.map((student) => (
                      <div key={student.id} className="relative group">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                          <Image
                            src={convertGoogleDriveUrl(student.src)}
                            alt={student.alt}
                            width={120}
                            height={160}
                            className="w-full h-full object-cover"
                            sizes="120px"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 rounded-xl flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditImage(student)}
                              className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 rounded-full"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteImage(student.id)}
                              className="h-8 w-8 p-0 rounded-full"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-xs font-medium text-gray-700 truncate">
                            {student.studentName}
                          </p>
                          {student.achievement && (
                            <p className="text-xs text-emerald-600 font-medium">
                              {student.achievement}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

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