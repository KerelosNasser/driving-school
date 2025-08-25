'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Download, 
  User, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Facebook,
  Chrome,
  ExternalLink
} from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';
import { toast } from 'sonner';

// Types for external reviews
interface ExternalReview {
  external_id: string;
  source: 'google' | 'facebook';
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  approved: boolean;
  profile_photo_url?: string;
  recommendation_type?: 'positive' | 'negative' | 'no_recommendation';
  facebook_user_id?: string;
  reply?: {
    comment: string;
    updated_at: string;
  } | null;
}

interface ExternalReviewsResponse {
  success: boolean;
  reviews: ExternalReview[];
  totalReviewCount: number;
  source: string;
  isMockData?: boolean;
  message?: string;
  nextPageToken?: string;
  nextCursor?: string;
}

interface ExternalReviewsSyncProps {
  onReviewImported?: (review: ExternalReview) => void;
}

export function ExternalReviewsSync({ onReviewImported }: ExternalReviewsSyncProps) {
  const [googleReviews, setGoogleReviews] = useState<ExternalReview[]>([]);
  const [facebookReviews, setFacebookReviews] = useState<ExternalReview[]>([]);
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState({ google: false, facebook: false, import: false });
  const [lastSync, setLastSync] = useState<{ google?: Date; facebook?: Date }>({});

  // Fetch Google reviews
  const fetchGoogleReviews = useCallback(async () => {
    setLoading(prev => ({ ...prev, google: true }));
    try {
      const response = await fetch('/api/admin/google-reviews');
      const data: ExternalReviewsResponse = await response.json();
      
      if (data.success) {
        setGoogleReviews(data.reviews);
        setLastSync(prev => ({ ...prev, google: new Date() }));
        
        if (data.isMockData) {
          toast.info('Google Reviews (Demo)', {
            description: data.message || 'Using demonstration data. Configure Google My Business API for real reviews.'
          });
        } else {
          toast.success(`Fetched ${data.reviews.length} Google reviews`);
        }
      } else {
        toast.error(`Failed to fetch Google reviews`);
      }
    } catch (error) {
      console.error('Error fetching Google reviews:', error);
      toast.error('Error fetching Google reviews');
    } finally {
      setLoading(prev => ({ ...prev, google: false }));
    }
  }, []);

  // Fetch Facebook reviews
  const fetchFacebookReviews = useCallback(async () => {
    setLoading(prev => ({ ...prev, facebook: true }));
    try {
      const response = await fetch('/api/admin/facebook-reviews');
      const data: ExternalReviewsResponse = await response.json();
      
      if (data.success) {
        setFacebookReviews(data.reviews);
        setLastSync(prev => ({ ...prev, facebook: new Date() }));
        
        if (data.isMockData) {
          toast.info('Facebook Reviews (Demo)', {
            description: data.message || 'Using demonstration data. Configure Facebook Graph API for real reviews.'
          });
        } else {
          toast.success(`Fetched ${data.reviews.length} Facebook reviews`);
        }
      } else {
        toast.error('Failed to fetch Facebook reviews');
      }
    } catch (error) {
      console.error('Error fetching Facebook reviews:', error);
      toast.error('Error fetching Facebook reviews');
    } finally {
      setLoading(prev => ({ ...prev, facebook: false }));
    }
  }, []);

  // Toggle review selection
  const toggleReviewSelection = useCallback((reviewId: string) => {
    setSelectedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  }, []);

  // Import selected reviews
  const importSelectedReviews = useCallback(async () => {
    if (selectedReviews.size === 0) {
      toast.error('Please select reviews to import');
      return;
    }

    setLoading(prev => ({ ...prev, import: true }));
    try {
      const allReviews = [...googleReviews, ...facebookReviews];
      const reviewsToImport = allReviews.filter(review => 
        selectedReviews.has(review.external_id)
      );

      // Group by source for API calls
      const googleIds = reviewsToImport
        .filter(r => r.source === 'google')
        .map(r => r.external_id);
      const facebookIds = reviewsToImport
        .filter(r => r.source === 'facebook')
        .map(r => r.external_id);

      // Import Google reviews
      if (googleIds.length > 0) {
        const response = await fetch('/api/admin/google-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewIds: googleIds })
        });
        
        if (!response.ok) {
          throw new Error('Failed to import Google reviews');
        }
      }

      // Import Facebook reviews
      if (facebookIds.length > 0) {
        const response = await fetch('/api/admin/facebook-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewIds: facebookIds })
        });
        
        if (!response.ok) {
          throw new Error('Failed to import Facebook reviews');
        }
      }

      // Callback for parent component
      reviewsToImport.forEach(review => {
        onReviewImported?.(review);
      });

      // Clear selections
      setSelectedReviews(new Set());
      
      toast.success(`Successfully imported ${selectedReviews.size} reviews`);
    } catch (error) {
      console.error('Error importing reviews:', error);
      toast.error('Error importing selected reviews');
    } finally {
      setLoading(prev => ({ ...prev, import: false }));
    }
  }, [selectedReviews, googleReviews, facebookReviews, onReviewImported]);

  // Select all reviews from a source
  const selectAllFromSource = useCallback((source: 'google' | 'facebook') => {
    const reviews = source === 'google' ? googleReviews : facebookReviews;
    const reviewIds = reviews.map(r => r.external_id);
    setSelectedReviews(prev => {
      const newSet = new Set(prev);
      reviewIds.forEach(id => newSet.add(id));
      return newSet;
    });
  }, [googleReviews, facebookReviews]);

  // Render star rating
  const renderStars = (rating: number, reviewId: string) => (
    <StarRating rating={rating} uniqueId={reviewId} size="sm" />
  );

  // Render review card
  const renderReviewCard = (review: ExternalReview) => {
    const isSelected = selectedReviews.has(review.external_id);
    
    return (
      <Card 
        key={review.external_id} 
        className={`cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
        }`}
        onClick={() => toggleReviewSelection(review.external_id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              {review.profile_photo_url ? (
                <img 
                  src={review.profile_photo_url} 
                  alt={review.user_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
              )}
              <div>
                <h4 className="font-medium text-sm">{review.user_name}</h4>
                <div className="flex items-center space-x-2">
                  <div className="flex">{renderStars(review.rating, review.external_id)}</div>
                  <Badge variant={review.source === 'google' ? 'default' : 'secondary'}>
                    {review.source === 'google' ? (
                      <><Chrome className="w-3 h-3 mr-1" /> Google</>
                    ) : (
                      <><Facebook className="w-3 h-3 mr-1" /> Facebook</>
                    )}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isSelected && <CheckCircle className="h-5 w-5 text-blue-500" />}
              <div className="text-xs text-gray-500 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(review.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {review.comment && (
            <p className="text-sm text-gray-700 mb-2 line-clamp-3">
              {review.comment}
            </p>
          )}
          
          {review.recommendation_type && (
            <Badge 
              variant={review.recommendation_type === 'positive' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {review.recommendation_type === 'positive' ? 'Recommended' : 'Not Recommended'}
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ExternalLink className="h-5 w-5" />
            <span>External Reviews Sync</span>
          </CardTitle>
          <CardDescription>
            Fetch and import reviews from Google My Business and Facebook to display on your website.
            All imported reviews require admin approval before being published.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Button 
              onClick={fetchGoogleReviews}
              disabled={loading.google}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {loading.google ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="h-4 w-4" />
              )}
              <span>Sync Google Reviews</span>
            </Button>
            
            <Button 
              onClick={fetchFacebookReviews}
              disabled={loading.facebook}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {loading.facebook ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Facebook className="h-4 w-4" />
              )}
              <span>Sync Facebook Reviews</span>
            </Button>

            {selectedReviews.size > 0 && (
              <Button 
                onClick={importSelectedReviews}
                disabled={loading.import}
                className="flex items-center space-x-2"
              >
                {loading.import ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Import Selected ({selectedReviews.size})</span>
              </Button>
            )}
          </div>

          {/* Last sync info */}
          {(lastSync.google || lastSync.facebook) && (
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              {lastSync.google && (
                <div className="flex items-center space-x-1">
                  <Chrome className="h-3 w-3" />
                  <span>Google: {lastSync.google.toLocaleTimeString()}</span>
                </div>
              )}
              {lastSync.facebook && (
                <div className="flex items-center space-x-1">
                  <Facebook className="h-3 w-3" />
                  <span>Facebook: {lastSync.facebook.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          )}

          <Tabs defaultValue="google" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="google" className="flex items-center space-x-2">
                <Chrome className="h-4 w-4" />
                <span>Google Reviews ({googleReviews.length})</span>
              </TabsTrigger>
              <TabsTrigger value="facebook" className="flex items-center space-x-2">
                <Facebook className="h-4 w-4" />
                <span>Facebook Reviews ({facebookReviews.length})</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="google" className="space-y-4">
              {googleReviews.length > 0 && (
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => selectAllFromSource('google')}
                  >
                    Select All Google Reviews
                  </Button>
                  <span className="text-sm text-gray-600">
                    {googleReviews.filter(r => selectedReviews.has(r.external_id)).length} selected
                  </span>
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
                {googleReviews.length > 0 ? (
                  googleReviews.map(renderReviewCard)
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No Google reviews fetched yet. Click "Sync Google Reviews" to fetch them.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="facebook" className="space-y-4">
              {facebookReviews.length > 0 && (
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => selectAllFromSource('facebook')}
                  >
                    Select All Facebook Reviews
                  </Button>
                  <span className="text-sm text-gray-600">
                    {facebookReviews.filter(r => selectedReviews.has(r.external_id)).length} selected
                  </span>
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
                {facebookReviews.length > 0 ? (
                  facebookReviews.map(renderReviewCard)
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No Facebook reviews fetched yet. Click "Sync Facebook Reviews" to fetch them.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}