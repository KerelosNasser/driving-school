'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ArrowRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {Review} from "@/lib/types";

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
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <style jsx>{scrollStyle}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Student Success Stories
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real feedback from students who achieved their driving goals with us
          </p>
        </div>

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
                  className="flex-shrink-0 w-80 bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-yellow-500"
                >
                  <Quote className="h-6 w-6 text-yellow-500 mb-4" />

                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-sm">
                      {review.user_name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium text-gray-900 text-sm">{review.user_name}</div>
                      <div className="flex mt-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                    {review.comment}
                  </p>

                  <div className="text-xs text-gray-500 mt-4">
                    {new Date(review.created_at).toLocaleDateString('en-AU', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Gradient overlays for smooth edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10"></div>
          </div>
        )}

        {/* Trust Stats */}
        <div className="mt-12 bg-white rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-yellow-600">4.9★</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">95%</div>
              <div className="text-sm text-gray-600">Pass Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">500+</div>
              <div className="text-sm text-gray-600">Happy Students</div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg" asChild className="border-yellow-500 text-yellow-600 hover:bg-yellow-50">
            <Link href="/reviews">
              Read All Reviews
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
