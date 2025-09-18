"use client";

import { useState, useEffect } from 'react';
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
  Award
} from 'lucide-react';
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
  achievement?: string; // e.g., "First Time Pass", "Manual License", etc.
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
    if (editedImage && editedImage.src && editedImage.studentName.trim()) {
      onSave(editedImage);
      onClose();
    } else {
      toast.error('Please provide both image and student name');
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
          {/* Image Preview */}
          <div className="relative h-48 w-full rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200">
            {editedImage.src ? (
              <Image
                src={editedImage.src}
                alt={editedImage.alt}
                width={400}
                height={192}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                onError={() => {
                  console.error('Image failed to load:', editedImage.src);
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Camera className="h-12 w-12 mb-2" />
                <span className="text-sm">Upload student photo</span>
              </div>
            )}
          </div>

          {/* Upload Mode Selector */}
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

          {/* Image Source Input */}
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
            </div>
          )}

          {/* Student Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="student-name" className="text-sm font-medium text-gray-700">Student Name *</Label>
              <Input
                id="student-name"
                value={editedImage.studentName}
                onChange={(e) => setEditedImage(prev => prev ? { ...prev, studentName: e.target.value } : null)}
                placeholder="Enter student's name"
                className="mt-2 rounded-xl"
                required
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl" 
              disabled={!editedImage.src || !editedImage.studentName.trim()}
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

  // Initialize student images
  useEffect(() => {
    const fallbackImages: StudentImage[] = [
      {
        id: 1,
        src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Sarah - successful driving student",
        studentName: "Sarah M.",
        achievement: "First Time Pass",
        date: "2024-01-15"
      },
      {
        id: 2,
        src: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Emma - successful driving student",
        studentName: "Emma T.",
        achievement: "Manual License",
        date: "2024-01-20"
      },
      {
        id: 3,
        src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "James - successful driving student",
        studentName: "James W.",
        achievement: "First Time Pass",
        date: "2024-02-03"
      },
      {
        id: 4,
        src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Michael - successful driving student",
        studentName: "Michael R.",
        achievement: "Auto License",
        date: "2024-02-10"
      },
      {
        id: 5,
        src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Lisa - successful driving student",
        studentName: "Lisa K.",
        achievement: "First Time Pass",
        date: "2024-02-18"
      },
      {
        id: 6,
        src: "https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "David - successful driving student",
        studentName: "David L.",
        achievement: "Manual License",
        date: "2024-02-25"
      }
    ];

    let imagesToUse = fallbackImages;

    // Process initial images from props/database
    if (initialImages && Array.isArray(initialImages) && initialImages.length > 0) {
      const validImages = initialImages.filter(img =>
        img &&
        typeof img.src === 'string' &&
        img.src.trim() !== '' &&
        typeof img.studentName === 'string' &&
        img.studentName.trim() !== ''
      ).map(img => ({
        ...img,
        id: img.id || Date.now() + Math.random(),
        alt: img.alt || `${img.studentName} - successful driving student`,
        src: img.src.trim(),
        studentName: img.studentName.trim()
      }));

      if (validImages.length > 0) {
        imagesToUse = validImages;
      }
    }

    setStudentImages(imagesToUse);
  }, [initialImages]);

  const saveStudentImages = async (updatedImages: StudentImage[]) => {
    try {
      await saveContent('student_gallery_images', updatedImages, 'json');
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

    const success = await saveStudentImages(updatedImages);
    if (success) {
      toast.success('Student removed successfully');
    }
  };

  if (studentImages.length === 0 && !isEditMode) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-emerald-50/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
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

        {/* Stats Bar */}
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

        {/* Student Gallery Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {studentImages.map((student, index) => (
              <motion.div
                key={student.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300"
              >
                {/* Student Photo */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <Image
                    src={student.src}
                    alt={student.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                  
                  {/* Achievement Badge */}
                  {student.achievement && (
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-emerald-500/90 text-white text-xs font-bold rounded-full backdrop-blur-sm flex items-center">
                        <Award className="h-3 w-3 mr-1" />
                        {student.achievement}
                      </span>
                    </div>
                  )}

                  {/* Edit Controls */}
                  {isEditMode && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditImage(student)}
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteImage(student.id)}
                        className="h-8 w-8 p-0 rounded-full shadow-lg"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Student Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-bold text-lg mb-1">{student.studentName}</h3>
                    {student.date && (
                      <p className="text-xs text-white/80">
                        {new Date(student.date).toLocaleDateString('en-AU', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
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

        {/* Admin Controls */}
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
                            src={student.src}
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