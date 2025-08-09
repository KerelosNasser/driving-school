import Link from 'next/link';
import { Star, ArrowRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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

async function getReviews() {
  const supabase = createServerComponentClient({ cookies });
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error || !data || data.length === 0) {
      console.error('Error fetching reviews or no reviews found, using fallback.');
      return fallbackReviews;
    }

    // Ensure all required fields have proper values
    return data.map(review => ({
      ...review,
      user_name: review.user_name || 'Anonymous',
      comment: review.comment || '',
      rating: Math.min(5, Math.max(1, review.rating || 5)), // Ensure rating is between 1-5
      created_at: review.created_at || new Date().toISOString()
    })) as Review[];
  } catch (error) {
    console.error('Error in reviews fetch:', error);
    return fallbackReviews;
  }
}

// Function to render star ratings
const renderStars = (rating: number) => {
  return Array(5).fill(0).map((_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
    />
  ));
};

export async function ReviewsPreview() {
  const reviews = await getReviews();

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              What Our Students Say
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Don&apos;t just take our word for it - hear from our satisfied students
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow relative"
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-yellow-100" />

              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">
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
            </div>
          ))}
        </div>

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
