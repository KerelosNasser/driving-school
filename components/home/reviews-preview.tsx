'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ArrowRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {Review} from "@/lib/types";
import { motion } from 'framer-motion';
import { EditableText } from '@/components/ui/editable-text';

// Fallback review data in case the Supabase fetch fails
const fallbackReviews: Review[] = [
    {
      id: '1',
      user_id: 'user1',
      rating: 5,
      comment: "Michael is an amazing instructor! He was patient, encouraging, and really helped me build my confidence on the road. I passed my test on the first attempt!",
      created_at: '2025-07-15T10:30:00Z',
      approved: true,
      user_name: 'Sarah Johnson'
    },
    {
      id: '2',
      user_id: 'user2',
      rating: 5,
      comment: "Best driving instructor in Brisbane! The lessons were structured perfectly for my learning style, and Michael's calm demeanor made me feel at ease even in stressful traffic situations.",
      created_at: '2025-07-10T14:45:00Z',
      approved: true,
      user_name: 'James Wilson'
    },
    {
      id: '3',
      user_id: 'user3',
      rating: 4,
      comment: "Very professional service. The online booking system was convenient, and the instructor was always on time. Would definitely recommend to anyone learning to drive in Brisbane.",
      created_at: '2025-07-05T09:15:00Z',
      approved: true,
      user_name: 'Emma Thompson'
    }
];

// Function to render star ratings
const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={`star-${i}`}
      className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
    />
  ));
};

export function ReviewsPreview() {
  const [reviews, setReviews] = useState<Review[]>(fallbackReviews);
  const [loading, setLoading] = useState(true);

  // CSS for auto-scroll animation
  const scrollStyle = `
    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .animate-scroll {
      animation: scroll 30s linear infinite;
      will-change: transform;
    }
    .animate-scroll:hover {
      animation-play-state: paused;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .reviews-container {
      overflow: hidden;
      position: relative;
    }
  `;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // We'll create a simple API endpoint for fetching reviews
        const response = await fetch('/api/reviews?approved=true&limit=3');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            // Ensure all required fields have proper values
            const processedReviews = data.map((review: any) => ({
              ...review,
              user_name: review.user_name || 'Anonymous',
              comment: review.comment || '',
              rating: Math.min(5, Math.max(1, review.rating || 5)), // Ensure rating is between 1-5
              created_at: review.created_at || new Date().toISOString()
            })) as Review[];
            setReviews(processedReviews);
          }
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        // Keep fallback reviews on error
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-emerald-50/30 relative overflow-hidden">
      <style jsx>{scrollStyle}</style>
      
      {/* Background decoration */}
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
            contentKey="reviews_title"
            tagName="h2"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-700 bg-clip-text text-transparent"
            placeholder="Enter reviews title..."
          >
            Student Success Stories
          </EditableText>
          <EditableText
            contentKey="reviews_subtitle"
            tagName="p"
            className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto px-4 leading-relaxed"
            placeholder="Enter reviews subtitle..."
            multiline={true}
          >
            Real feedback from students who achieved their driving goals with us
          </EditableText>
        </motion.div>

        {loading ? (
          <div className="flex space-x-6 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0 w-80 bg-white rounded-lg p-6 shadow-sm animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  <div className="ml-3 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="h-4 w-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden reviews-container">
            {/* Auto-scrolling reviews container */}
            <div className="flex space-x-6 pb-4 scrollbar-hide animate-scroll">
              {/* Duplicate reviews for seamless loop */}
              {[...reviews, ...reviews].map((review, index) => (
                <div
                  key={`${review.id}-${index}`}
                  className="flex-shrink-0 w-80 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 border-l-4 border-l-emerald-500 transform hover:scale-105"
                >
                  <div className="bg-emerald-100 rounded-full p-3 w-fit mb-4">
                    <Quote className="h-6 w-6 text-emerald-600" />
                  </div>

                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 font-bold text-lg shadow-sm">
                      {review.user_name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="font-bold text-gray-900 text-sm">{review.user_name}</div>
                      <div className="flex mt-1 space-x-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-4 mb-4">
                    {review.comment}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-emerald-600 font-medium">
                      {new Date(review.created_at).toLocaleDateString('en-AU', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="bg-emerald-50 px-2 py-1 rounded-full">
                      <span className="text-xs text-emerald-700 font-medium">Verified</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Gradient overlays for smooth edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10"></div>
          </div>
        )}

        {/* Trust Stats - Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
            </div>
            
            <div className="relative z-10">
              <EditableText
                contentKey="reviews_cta_title"
                tagName="h3"
                className="text-2xl sm:text-3xl font-bold mb-8 text-center"
                placeholder="Enter CTA title..."
              >
                Trusted by Students Across Australia
              </EditableText>
              
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-2">4.9★</div>
                  <div className="text-sm text-emerald-100">Average Rating</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-2">95%</div>
                  <div className="text-sm text-emerald-100">Pass Rate</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-2">500+</div>
                  <div className="text-sm text-emerald-100">Happy Students</div>
                </div>
              </div>

              <div className="text-center mt-8">
                <Button
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold px-8 py-4 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  asChild
                >
                  <Link href="/reviews">
                    Read All Reviews
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      </section>
  );
}
