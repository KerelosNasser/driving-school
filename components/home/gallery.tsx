"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  title: string;
}

interface GalleryProps {
  title?: string;
  subtitle?: string;
  images?: GalleryImage[];
}

export function Gallery({ 
  title = 'Our Learning Experience',
  subtitle = 'See our students and instructors in action.',
  images
}: GalleryProps) {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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

    if (images && Array.isArray(images) && images.length > 0) {
      setGalleryImages(images);
    } else {
      setGalleryImages(fallbackImages);
    }
  }, [images]);

  // Reset current index when images change
  useEffect(() => {
    if (currentIndex >= galleryImages.length) {
      setCurrentIndex(0);
    }
  }, [galleryImages.length, currentIndex]);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying || galleryImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, galleryImages.length]);

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

  if (galleryImages.length === 0) {
    return null; // Don't render anything if there are no images
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
              {title}
            </h2>
            <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              {subtitle}
            </p>
          </motion.div>
        </div>

        <div className="relative w-full max-w-4xl mx-auto">
          <AnimatePresence initial={false}>
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="relative w-full aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-lg bg-gray-100"
            >
              <Image
                src={galleryImages[currentIndex].src}
                alt={galleryImages[currentIndex].alt}
                fill
                style={{ objectFit: 'cover' }}
                className="transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                <h3 className="text-white text-lg sm:text-xl font-bold">{galleryImages[currentIndex].title}</h3>
              </div>
            </motion.div>
          </AnimatePresence>

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
        </div>

        <div className="flex justify-center mt-6 space-x-2">
          {galleryImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${currentIndex === index ? 'bg-yellow-500' : 'bg-gray-300 hover:bg-gray-400'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}