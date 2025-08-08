'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface Review {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}

interface ReviewsTabProps {
  reviews: Review[];
  loading: boolean;
  handleReviewApproval: (reviewId: string, approved: boolean) => Promise<void>;
}

export const ReviewsTab = ({ reviews, loading, handleReviewApproval }: ReviewsTabProps) => {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Review Management</CardTitle>
          <CardDescription>Approve or reject user reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium">{review.user_name || 'Anonymous'}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < review.rating ? 'text-yellow-500' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {!review.approved && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleReviewApproval(review.id, true)}
                        disabled={loading}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                    )}
                    {review.approved && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleReviewApproval(review.id, false)}
                        disabled={loading}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
                <div className="mt-2">
                  <span className={`text-sm ${
                    review.approved ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {review.approved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};