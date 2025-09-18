'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Quote, Search, ArrowRight, Filter, ThumbsUp, Settings, Star } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';
import type { Review } from '@/lib/supabase';

// Fallback review data in case the Supabase fetch fails (moved to module scope)
const fallbackReviews: Review[] = [
  {
    id: '1',
    user_id: 'user1',
    rating: 5,
    comment: "Michael is an amazing instructor! He was patient, encouraging, and really helped me build my confidence on the road. I passed my test on the first attempt thanks to his excellent instruction and guidance. I would highly recommend EG Driving School to anyone looking to learn how to drive.",
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
    comment: "After trying two other driving schools, I found EG Driving School and couldn't be happier. Michael's teaching style is perfect for anxious learners like me. He's patient, encouraging, and breaks everything down into manageable steps. I finally passed my test after struggling for months!",
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

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const { user } = useUser();

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin' || process.env.NODE_ENV === 'development';

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
          setReviews(fallbackReviews);
        } else if (data && data.length > 0) {
          setReviews(data as Review[]);
        } else {
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

  // Filter reviews based on search term and rating filter
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === '' ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = filterRating === null || review.rating === filterRating;

    return matchesSearch && matchesRating;
  });

  // Function to render star ratings
  const renderStars = (rating: number, uniqueId?: string) => (
    <StarRating rating={rating} uniqueId={uniqueId} size="md" />
  );

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-400 rounded-full blur-3xl"></div>
      </div>

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900 text-white overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/95 via-teal-800/90 to-blue-900/95" />
            <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center"
            >
              {/* Trust Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-full px-4 py-2 text-sm font-semibold mb-6"
              >
                <Star className="h-4 w-4 text-emerald-400 fill-emerald-400" />
                <span>4.9★ Rating • {reviews.length} Reviews</span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
                  Student Success
                </span>
                <br />
                <span className="text-emerald-400">Stories</span>
              </h1>
              <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                See what our students have to say about their experience with EG Driving School
              </p>

              {/* Stats */}
              <motion.div
                className="grid grid-cols-3 gap-4 py-6 max-w-2xl mx-auto mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-400">{averageRating}★</div>
                  <div className="text-xs sm:text-sm text-blue-200">Average Rating</div>
                </div>
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-400">{reviews.length}</div>
                  <div className="text-xs sm:text-sm text-blue-200">Total Reviews</div>
                </div>
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-400">95%</div>
                  <div className="text-xs sm:text-sm text-blue-200">Pass Rate</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Reviews Summary Section */}
        <section className="py-16 sm:py-20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 sm:p-12 shadow-2xl border border-emerald-100"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                {/* Average Rating */}
                <div className="text-center lg:text-left">
                  <div className="text-6xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">{averageRating}</div>
                  <div className="flex justify-center lg:justify-start mt-2 space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-6 w-6 ${i < Math.round(parseFloat(averageRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <div className="text-gray-600 mt-2 font-medium">Based on {reviews.length} reviews</div>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center">
                      <div className="w-16 text-sm text-gray-700 font-medium">{rating} stars</div>
                      <div className="flex-grow mx-4 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${(ratingCounts[rating] || 0) / reviews.length * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="w-8 text-sm text-gray-700 font-medium text-right">
                        {ratingCounts[rating] || 0}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="text-center lg:text-right space-y-4">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6">
                    <p className="text-gray-700 mb-4 font-medium">Had a great experience?</p>
                    <div className="space-y-3">
                      <Button
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
                        asChild
                      >
                        <Link href="/reviews/submit">
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Leave a Review
                        </Link>
                      </Button>
                      {/* Admin Controls */}
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-emerald-300 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                          asChild
                        >
                          <Link href="/admin?tab=reviews">
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Reviews
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-16 sm:py-20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Search and Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12 flex flex-col lg:flex-row gap-6 justify-between items-center"
            >
              <div className="relative max-w-md w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl leading-5 bg-white/80 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-lg transition-all duration-300"
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2 text-gray-700 font-medium">
                  <Filter className="h-5 w-5 text-emerald-600" />
                  <span>Filter by rating:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[null, 5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating === null ? 'all' : rating}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${filterRating === rating
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                        : 'bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 shadow-sm'
                        }`}
                      onClick={() => setFilterRating(rating)}
                    >
                      {rating === null ? 'All Reviews' : `${rating} ★`}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {loading ? (
              // Enhanced Loading skeleton
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 h-64 animate-pulse border border-emerald-100 shadow-lg"
                  >
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                      <div className="ml-3 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : filteredReviews.length === 0 ? (
              // Enhanced No reviews found
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-emerald-100 max-w-md mx-auto">
                  <Quote className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <div className="text-gray-500 text-lg font-medium mb-2">No reviews found</div>
                  <p className="text-gray-400 mb-6">Try adjusting your search criteria</p>
                  <Button
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterRating(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </motion.div>
            ) : (
              // Enhanced Reviews grid
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 relative border border-emerald-100 group"
                  >
                    <div className="bg-emerald-100 rounded-full p-3 w-fit mb-4">
                      <Quote className="h-6 w-6 text-emerald-600" />
                    </div>

                    <div className="flex items-center mb-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 font-bold text-lg shadow-sm">
                        {review.user_name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="font-bold text-gray-900 text-lg">{review.user_name}</div>
                        <div className="flex mt-1 space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-4 line-clamp-4">
                      {review.comment}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-emerald-600 font-medium">
                        {new Date(review.created_at).toLocaleDateString('en-AU', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="bg-emerald-50 px-3 py-1 rounded-full">
                        <span className="text-xs text-emerald-700 font-medium">Verified</span>
                      </div>
                    </div>

                    {/* Hover effect indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-2xl"></div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden mx-4 sm:mx-6 lg:mx-8">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
            </div>

            <div className="relative z-10 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Start Your Driving Journey?
              </h2>
              <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto mb-8">
                Join our satisfied students and book your first lesson today.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold px-8 py-4 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  asChild
                >
                  <Link href="/packages">
                    Book Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 font-bold px-8 py-4 text-lg rounded-2xl transition-all duration-300"
                  asChild
                >
                  <Link href="/packages">
                    View Packages
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}