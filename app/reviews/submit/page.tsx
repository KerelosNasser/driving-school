'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SubmitReviewPage() {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { user } = useUser();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            router.push('/sign-in');
            return;
        }

        if (rating === 0 || comment.trim() === '') {
            setError('Please provide a rating and a comment.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: supabaseError } = await supabase.from('reviews').insert([
                {
                    user_id: user.id,
                    user_name: user.fullName || 'Anonymous',
                    rating,
                    comment,
                    approved: false,
                },
            ]);

            if (supabaseError) {
                throw supabaseError;
            }

            setSuccess(true);
            setComment('');
            setRating(0);
            setTimeout(() => router.push('/reviews'), 3000);
        } catch (err: Error | unknown) {
            setError('Failed to submit review. Please try again.');
            console.error('Error submitting review:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-2xl mx-auto py-12 px-4">
                <h1 className="text-3xl font-bold mb-6">Leave a Review</h1>
                {success ? (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
                        <p className="font-bold">Thank you!</p>
                        <p>Your review has been submitted for approval. You will be redirected shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                            <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-8 w-8 cursor-pointer ${rating >= star ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                        onClick={() => setRating(star)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Your Review</label>
                            <Textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Tell us about your experience..."
                                rows={6}
                                className="mt-1"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </form>
                )}
            </main>
        </div>
    );
}
