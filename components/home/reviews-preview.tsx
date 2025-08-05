'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { Review } from '@/lib/supabase';

export function ReviewsPreview() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch reviews from Supabase
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('approved', true)
          .order('created_at', { ascending: false })
          .limit(6);
        
        if (error) {
          console.error('Error fetching reviews:', error);
          // Fallback to static data if there's an error
          setReviews(fallbackReviews);
        } else if (data && data.length > 0) {
          setReviews(data as Review[]);
        } else {
          // Use fallback data if no reviews are found
          setReviews(fallbackReviews);
        }
      } catch (error) {
        console.error('Error in reviews fetch:', error);
        setReviews(fallbackReviews);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

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
    },
    {
      id: '4',
      user_id: 'user4',
      rating: 5,
      comment: "Michael's tips and tricks for the driving test were invaluable. He knows exactly what the examiners look for and prepared me thoroughly. Thank you!",
      created_at: '2025-06-28T16:20:00Z',
      approved: true,
      user_name: 'David Chen'
    },
    {
      id: '5',
      user_id: 'user5',
      rating: 5,
      comment: "I was extremely nervous about learning to drive, but Michael made the whole experience enjoyable. His teaching methods are clear and effective. Highly recommend!",
      created_at: '2025-06-20T11:10:00Z',
      approved: true,
      user_name: 'Olivia Martinez'
    },
    {
      id: '6',
      user_id: 'user6',
      rating: 4,
      comment: "Great value for money. The package deals are well worth it, and the quality of instruction is top-notch. I feel much more confident on the road now.",
      created_at: '2025-06-15T13:30:00Z',
      approved: true,
      user_name: 'Ryan Taylor'
    }
  ];

  // Function to render star ratings
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              What Our Students Say
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Don&apos;t just take our word for it - hear from our satisfied students
            </p>
          </motion.div>
        </div>

        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 h-64 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {reviews.map((review) => (
              <motion.div 
                key={review.id} 
                variants={itemVariants}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow relative"
              >
                <Quote className="absolute top-6 right-6 h-8 w-8 text-blue-100" />
                
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {review.user_name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{review.user_name}</div>
                    <div className="flex mt-1">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 line-clamp-4">
                  {review.comment}
                </p>
                
                <div className="text-sm text-gray-500 mt-4">
                  {new Date(review.created_at).toLocaleDateString('en-AU', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild>
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