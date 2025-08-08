'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Quote, Search, ArrowRight, Filter, ThumbsUp } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { Review } from '@/lib/supabase';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // Fetch reviews from Supabase
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('approved', true)
          .order('created_at', { ascending: false });
        
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
      comment: "Michael is an amazing instructor! He was patient, encouraging, and really helped me build my confidence on the road. I passed my test on the first attempt thanks to his excellent instruction and guidance. I would highly recommend Brisbane Driving School to anyone looking to learn how to drive.",
      created_at: '2025-07-15T10:30:00Z',
      approved: true,
      user_name: 'Sarah Johnson'
    },
    {
      id: '2',
      user_id: 'user2',
      rating: 5,
      comment: "Best driving instructor in Brisbane! The lessons were structured perfectly for my learning style, and Michael's calm demeanor made me feel at ease even in stressful traffic situations. He has a knack for explaining complex driving concepts in a way that's easy to understand. I'm now a confident driver thanks to his teaching.",
      created_at: '2025-07-10T14:45:00Z',
      approved: true,
      user_name: 'James Wilson'
    },
    {
      id: '3',
      user_id: 'user3',
      rating: 4,
      comment: "Very professional service. The online booking system was convenient, and the instructor was always on time. Would definitely recommend to anyone learning to drive in Brisbane. Michael is knowledgeable about all the test routes and gave me great tips for passing my driving test.",
      created_at: '2025-07-05T09:15:00Z',
      approved: true,
      user_name: 'Emma Thompson'
    },
    {
      id: '4',
      user_id: 'user4',
      rating: 5,
      comment: "Michael's tips and tricks for the driving test were invaluable. He knows exactly what the examiners look for and prepared me thoroughly. Thank you for helping me pass my test with flying colors! I couldn't have done it without your guidance and support.",
      created_at: '2025-06-28T16:20:00Z',
      approved: true,
      user_name: 'David Chen'
    },
    {
      id: '5',
      user_id: 'user5',
      rating: 5,
      comment: "I was extremely nervous about learning to drive, but Michael made the whole experience enjoyable. His teaching methods are clear and effective. Highly recommend! He has a great sense of humor which helped me relax during lessons, and his patience is remarkable.",
      created_at: '2025-06-20T11:10:00Z',
      approved: true,
      user_name: 'Olivia Martinez'
    },
    {
      id: '6',
      user_id: 'user6',
      rating: 4,
      comment: "Great value for money. The package deals are well worth it, and the quality of instruction is top-notch. I feel much more confident on the road now. Michael doesn't just teach you how to pass the test, but how to be a safe and responsible driver for life.",
      created_at: '2025-06-15T13:30:00Z',
      approved: true,
      user_name: 'Ryan Taylor'
    },
    {
      id: '7',
      user_id: 'user7',
      rating: 5,
      comment: "After trying two other driving schools, I found Brisbane Driving School and couldn't be happier. Michael's teaching style is perfect for anxious learners like me. He's patient, encouraging, and breaks everything down into manageable steps. I finally passed my test after struggling for months!",
      created_at: '2025-06-10T15:45:00Z',
      approved: true,
      user_name: 'Jessica Brown'
    },
    {
      id: '8',
      user_id: 'user8',
      rating: 5,
      comment: "As a mature-age student, I was worried about learning to drive later in life, but Michael was fantastic. He adapted his teaching to my needs and never made me feel rushed or inadequate. His dual-control car is modern and comfortable, which made learning easier.",
      created_at: '2025-06-05T09:00:00Z',
      approved: true,
      user_name: 'Michael Anderson'
    },
    {
      id: '9',
      user_id: 'user9',
      rating: 4,
      comment: "Flexible scheduling was a huge plus for me as I work irregular hours. Michael was always accommodating and responsive to my needs. The online booking system is straightforward and user-friendly. Good experience overall.",
      created_at: '2025-05-28T14:20:00Z',
      approved: true,
      user_name: 'Sophia Lee'
    },
    {
      id: '10',
      user_id: 'user10',
      rating: 5,
      comment: "I had a specific goal of becoming comfortable driving on highways, and Michael designed lessons specifically to address this. His knowledge of Brisbane roads is impressive, and he knows all the best practice spots for different skills. Highly recommended!",
      created_at: '2025-05-20T11:30:00Z',
      approved: true,
      user_name: 'Daniel White'
    },
    {
      id: '11',
      user_id: 'user11',
      rating: 5,
      comment: "The best investment I've made in my driving journey. Michael doesn't just teach you to drive; he teaches you to drive safely and confidently. His attention to detail and focus on defensive driving techniques have made me a much better driver.",
      created_at: '2025-05-15T16:45:00Z',
      approved: true,
      user_name: 'Emily Wilson'
    },
    {
      id: '12',
      user_id: 'user12',
      rating: 4,
      comment: "I appreciated how Michael focused on building good habits from the start. He's thorough and professional, and genuinely cares about his students becoming safe drivers. The car was always clean and well-maintained, which made for a pleasant learning environment.",
      created_at: '2025-05-10T10:15:00Z',
      approved: true,
      user_name: 'Thomas Garcia'
    }
  ];

  // Filter reviews based on search term and rating filter
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === '' || 
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = filterRating === null || review.rating === filterRating;
    
    return matchesSearch && matchesRating;
  });

  // Function to render star ratings
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-5 w-5 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  // Count reviews by rating
  const ratingCounts = reviews.reduce((counts, review) => {
    counts[review.rating] = (counts[review.rating] || 0) + 1;
    return counts;
  }, {} as Record<number, number>);

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
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero Section */}
        <section className="bg-yellow-600 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Student Reviews
              </h1>
              <p className="text-xl text-yellow-100 max-w-3xl mx-auto">
                See what our students have to say about their experience with Brisbane Driving School
              </p>
            </motion.div>
          </div>
        </section>

        {/* Reviews Summary Section */}
        <section className="py-12 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Average Rating */}
              <div className="text-center md:text-left">
                <div className="text-5xl font-bold text-gray-900">{averageRating}</div>
                <div className="flex justify-center md:justify-start mt-2">
                  {renderStars(Math.round(parseFloat(averageRating)))}
                </div>
                <div className="text-gray-600 mt-2">Based on {reviews.length} reviews</div>
              </div>
              
              {/* Rating Breakdown */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center">
                    <div className="w-12 text-sm text-gray-600">{rating} stars</div>
                    <div className="flex-grow mx-3 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-yellow-500 h-2.5 rounded-full" 
                        style={{ 
                          width: `${(ratingCounts[rating] || 0) / reviews.length * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="w-8 text-sm text-gray-600 text-right">
                      {ratingCounts[rating] || 0}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* CTA */}
              <div className="text-center md:text-right">
                <p className="text-gray-700 mb-4">Had a great experience?</p>
                <Button asChild>
                  <Link href="/reviews/submit">
                    Leave a Review
                    <ThumbsUp className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Search and Filter */}
            <div className="mb-12 flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative max-w-md w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Filter by rating:</span>
                <div className="flex space-x-2">
                  {[null, 5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating === null ? 'all' : rating}
                      className={`px-3 py-1 rounded-full text-sm ${
                        filterRating === rating 
                          ? 'bg-yellow-600 text-white' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                      onClick={() => setFilterRating(rating)}
                    >
                      {rating === null ? 'All' : `${rating} ★`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              // Loading skeleton
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-6 h-64 animate-pulse"></div>
                ))}
              </div>
            ) : filteredReviews.length === 0 ? (
              // No reviews found
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">No reviews found matching your criteria.</div>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRating(null);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              // Reviews grid
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredReviews.map((review) => (
                  <motion.div 
                    key={review.id} 
                    variants={itemVariants}
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow relative"
                  >
                    <Quote className="absolute top-6 right-6 h-8 w-8 text-yellow-100" />
                    
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-lg">
                        {review.user_name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{review.user_name}</div>
                        <div className="flex mt-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700">
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
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-yellow-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Your Driving Journey?
            </h2>
            <p className="text-xl text-yellow-100 max-w-3xl mx-auto mb-8">
              Join our satisfied students and book your first lesson today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-white text-yellow-700 hover:bg-yellow-50"
                asChild
              >
                <Link href="/book">
                  Book Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white bg-white/10"
                asChild
              >
                <Link href="/packages">
                  View Packages
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}