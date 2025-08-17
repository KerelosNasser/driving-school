"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  title: string;
  isUploaded?: boolean;
  file_path?: string;
}

interface GalleryProps {
  // Allow overriding images for preview mode or when using content management
  images?: GalleryImage[];
  // Enable admin mode for content management context
  isAdminMode?: boolean;
  // Callback when admin clicks on an image (for editing)
  onImageEdit?: (imageId: number) => void;
}

export function Gallery({ images, isAdminMode = false, onImageEdit }: GalleryProps) {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback images if no content is available
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
    },
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Highway driving lesson in progress",
      title: "Highway Confidence"
    },
    {
      id: 5,
      src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "City driving navigation practice",
      title: "City Navigation"
    }
  ];

  // Fetch gallery images from API if not provided as props
  useEffect(() => {
    if (images) {
      setGalleryImages(images);
      return;
    }

    const fetchGalleryImages = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/content?section=gallery');
        if (!response.ok) {
          throw new Error('Failed to fetch gallery content');
        }

        const result = await response.json();
        const galleryContent = result.data?.find(
          (item: any) => item.content_key === 'gallery_images'
        );

        if (galleryContent?.content_json && Array.isArray(galleryContent.content_json)) {
          setGalleryImages(galleryContent.content_json);
        } else {
          // Use fallback images if no content is found
          setGalleryImages(fallbackImages);
        }
      } catch (err) {
        console.error('Error fetching gallery images:', err);
        setError('Failed to load gallery images');
        setGalleryImages(fallbackImages); // Use fallback on error
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, [images]);

  // Reset current index when images change
  useEffect(() => {
    if (currentIndex >= galleryImages.length) {
      setCurrentIndex(0);
    }
  }, [galleryImages.length, currentIndex]);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying || galleryImages.length === 0 || isAdminMode) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, galleryImages.length, isAdminMode]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10s unless in admin mode
    if (!isAdminMode) {
      setTimeout(() => setIsAutoPlaying(true), 10000);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    setIsAutoPlaying(false);
    if (!isAdminMode) {
      setTimeout(() => setIsAutoPlaying(true), 10000);
    }
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    setIsAutoPlaying(false);
    if (!isAdminMode) {
      setTimeout(() => setIsAutoPlaying(true), 10000);
    }
  };

  const handleImageClick = () => {
    if (isAdminMode && onImageEdit && galleryImages[currentIndex]) {
      onImageEdit(galleryImages[currentIndex].id);
    }
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64 sm:h-80 md:h-96 lg:h-[500px]">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="text-gray-600">Loading gallery...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (galleryImages.length === 0) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Our Learning Experience
            </h2>
            <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Gallery content is being updated
            </p>
          </div>
          {error && (
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </section>
    );
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Our Learning Experience
            </h2>
            <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              See what makes EG Driving School the perfect choice for your driving education
            </p>
          </motion.div>
        </div>

        {/* Error display */}
        {error && (
          <Alert variant="destructive" className="mb-8 max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative">
          {/* Admin overlay indicator */}
          {isAdminMode && (
            <div className="absolute top-4 left-4 z-10 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Admin Mode - Click to Edit
            </div>
          )}

          {/* Main carousel container */}
          <div 
            className={`relative h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden rounded-2xl shadow-2xl ${
              isAdminMode ? 'cursor-pointer ring-2 ring-blue-500' : ''
            }`}
            onClick={handleImageClick}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={galleryImages[currentIndex].src}
                  alt={galleryImages[currentIndex].alt}
                  fill
                  className="object-cover"
                  priority={currentIndex === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  onError={(e) => {
                    // Handle broken images gracefully
                    console.warn('Image failed to load:', galleryImages[currentIndex].src);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-white"
                  >
                    {galleryImages[currentIndex].title}
                  </motion.h3>
                  {galleryImages[currentIndex].isUploaded && isAdminMode && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-2"
                    >
                      <span className="inline-block bg-green-500 text-white px-2 py-1 rounded text-xs">
                        Uploaded Image
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            <button
              onClick={goToPrevious}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 sm:p-3 transition-all duration-200 group z-10"
              aria-label="Previous image"
              disabled={galleryImages.length <= 1}
            >
              <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 sm:p-3 transition-all duration-200 group z-10"
              aria-label="Next image"
              disabled={galleryImages.length <= 1}
            >
              <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Thumbnail navigation */}
          <div className="flex justify-center mt-6 sm:mt-8 space-x-2 sm:space-x-4 overflow-x-auto pb-2">
            {galleryImages.map((image, index) => (
              <motion.button
                key={image.id}
                onClick={() => goToSlide(index)}
                className={`relative flex-shrink-0 w-16 h-12 sm:w-20 sm:h-16 md:w-24 md:h-18 rounded-lg overflow-hidden transition-all duration-300 ${
                  index === currentIndex
                    ? 'ring-4 ring-yellow-500 scale-110 opacity-100'
                    : 'opacity-60 hover:opacity-80 hover:scale-105'
                } ${isAdminMode ? 'cursor-pointer' : ''}`}
                whileHover={{ scale: index === currentIndex ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {index !== currentIndex && (
                  <div className="absolute inset-0 bg-black/30" />
                )}
                {image.isUploaded && isAdminMode && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </motion.button>
            ))}
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {galleryImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-yellow-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Auto-play indicator */}
          {!isAdminMode && (
            <div className="flex justify-center mt-2">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  isAutoPlaying 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isAutoPlaying ? 'Auto-play ON' : 'Auto-play OFF'}
              </button>
            </div>
          )}
        </div>

        {/* Admin info panel */}
        {isAdminMode && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Gallery Admin Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-blue-700">
              <div>
                <span className="font-medium">Total Images:</span> {galleryImages.length}
              </div>
              <div>
                <span className="font-medium">Current:</span> {currentIndex + 1} of {galleryImages.length}
              </div>
              <div>
                <span className="font-medium">Uploaded Images:</span> {galleryImages.filter(img => img.isUploaded).length}
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Click on the main image or thumbnails to edit. Auto-play is disabled in admin mode.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}