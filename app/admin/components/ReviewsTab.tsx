'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThumbsUp, ThumbsDown, Globe, MessageSquare, ExternalLink } from 'lucide-react';

interface Review {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
  source?: 'website' | 'google' | 'facebook';
  external_id?: string;
}

interface ReviewsTabProps {
  reviews: Review[];
  loading: boolean;
  handleReviewApproval: (reviewId: string, approved: boolean) => Promise<void>;
}

export const ReviewsTab = ({ reviews, loading, handleReviewApproval }: ReviewsTabProps) => {
  // Separate reviews by source
  const websiteReviews = reviews.filter(review => !review.source || review.source === 'website');
  const externalReviews = reviews.filter(review => review.source && review.source !== 'website');

  const handleExternalReviewImported = () => {
    // Trigger a refresh of the reviews data - implementation depends on parent component
    console.log('External review imported - parent should refresh data');
  };

  const renderReviewCard = (review: Review) => {
    const getSourceBadge = () => {
      if (!review.source || review.source === 'website') {
        return (
          <Badge variant="outline" className="text-xs">
            <Globe className="w-3 h-3 mr-1" />
            Website
          </Badge>
        );
      }
      
      if (review.source === 'google') {
        return (
          <Badge variant="default" className="text-xs">
            <ExternalLink className="w-3 h-3 mr-1" />
            Google
          </Badge>
        );
      }
      
      if (review.source === 'facebook') {
        return (
          <Badge variant="secondary" className="text-xs">
            <ExternalLink className="w-3 h-3 mr-1" />
            Facebook
          </Badge>
        );
      }
    };

    return (
      <div key={review.id} className="border p-4 rounded-lg hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div>
              <span className="font-medium">{review.user_name || 'Anonymous'}</span>
              <span className="text-sm text-gray-500 ml-2">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            {getSourceBadge()}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={`star-${review.id}-${i}`}
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
        <p className="text-gray-700 mb-2">{review.comment}</p>
        <div className="flex items-center justify-between">
          <span className={`text-sm ${
            review.approved ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {review.approved ? 'Approved' : 'Pending Approval'}
          </span>
          {review.external_id && (
            <span className="text-xs text-gray-400">ID: {review.external_id}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Manage Reviews ({reviews.length})</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center space-x-2">
            <ExternalLink className="h-4 w-4" />
            <span>External Reviews Sync</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage">
          <div className="grid gap-4">
            {/* Website Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Website Reviews ({websiteReviews.length})</span>
                </CardTitle>
                <CardDescription>
                  Reviews submitted directly through your website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {websiteReviews.length > 0 ? (
                    websiteReviews.map(renderReviewCard)
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No website reviews yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* External Reviews */}
            {externalReviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ExternalLink className="h-5 w-5" />
                    <span>External Reviews ({externalReviews.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Reviews imported from Google and Facebook
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {externalReviews.map(renderReviewCard)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>External Review Sync</CardTitle>
              <CardDescription>
                External review sync feature has been removed. Reviews can only be managed through code.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                To sync external reviews, please use the API endpoints directly or contact the development team.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};