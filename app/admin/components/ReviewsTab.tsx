'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThumbsUp, ThumbsDown, Globe, MessageSquare, ExternalLink, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  profile_photo_url?: string;
  synced_at?: string;
}

interface SyncStatus {
  lastSync: {
    syncedAt: string;
    reviewsImported: number;
    reviewsUpdated: number;
    totalReviews: number;
  } | null;
  syncHistory: any[];
}

interface ReviewsTabProps {
  reviews: Review[];
  loading: boolean;
  handleReviewApproval: (reviewId: string, approved: boolean) => Promise<void>;
}

export const ReviewsTab = ({ reviews, loading, handleReviewApproval }: ReviewsTabProps) => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loadingSyncStatus, setLoadingSyncStatus] = useState(true);

  // Separate reviews by source
  const websiteReviews = reviews.filter(review => !review.source || review.source === 'website');
  const googleReviews = reviews.filter(review => review.source === 'google');
  const facebookReviews = reviews.filter(review => review.source === 'facebook');

  // Fetch sync status on mount
  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      setLoadingSyncStatus(true);
      const response = await fetch('/api/admin/google-reviews/sync');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoadingSyncStatus(false);
    }
  };

  const handleSyncGoogleReviews = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/google-reviews/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Google reviews synced successfully!', {
          description: `Imported: ${data.stats.imported}, Updated: ${data.stats.updated}`,
        });
        
        // Refresh sync status
        await fetchSyncStatus();
        
        // Trigger page refresh to show new reviews
        window.location.reload();
      } else {
        toast.error('Failed to sync Google reviews', {
          description: data.details || data.error,
        });
      }
    } catch (error) {
      console.error('Error syncing reviews:', error);
      toast.error('Error syncing reviews', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSyncing(false);
    }
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
          <Badge className="text-xs bg-blue-500 hover:bg-blue-600">
            <ExternalLink className="w-3 h-3 mr-1" />
            Google Business
          </Badge>
        );
      }
      
      if (review.source === 'facebook') {
        return (
          <Badge className="text-xs bg-blue-600 hover:bg-blue-700">
            <ExternalLink className="w-3 h-3 mr-1" />
            Facebook
          </Badge>
        );
      }
    };

    return (
      <div key={review.id} className="border p-4 rounded-lg hover:shadow-sm transition-shadow bg-white">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            {review.profile_photo_url && (
              <img 
                src={review.profile_photo_url} 
                alt={review.user_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{review.user_name || 'Anonymous'}</span>
                {getSourceBadge()}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
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
            {!review.source || review.source === 'website' ? (
              <>
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
              </>
            ) : (
              <Badge variant="outline" className="text-xs text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Synced
              </Badge>
            )}
          </div>
        </div>
        {review.comment && (
          <p className="text-gray-700 mb-2 leading-relaxed">{review.comment}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className={`${
            review.approved ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {review.approved ? '✓ Approved' : '⏳ Pending Approval'}
          </span>
          {review.synced_at && (
            <span className="text-gray-400">
              Last synced: {new Date(review.synced_at).toLocaleDateString()}
            </span>
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
            <RefreshCw className="h-4 w-4" />
            <span>Google Sync</span>
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

            {/* Google Reviews */}
            {googleReviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ExternalLink className="h-5 w-5 text-blue-500" />
                    <span>Google Business Reviews ({googleReviews.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Reviews synced from your Google Business Profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {googleReviews.map(renderReviewCard)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Facebook Reviews */}
            {facebookReviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                    <span>Facebook Reviews ({facebookReviews.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Reviews synced from your Facebook Page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {facebookReviews.map(renderReviewCard)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="sync">
          <div className="space-y-4">
            {/* Sync Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <RefreshCw className="h-5 w-5" />
                    <span>Google Business Reviews Sync</span>
                  </span>
                  <Button
                    onClick={handleSyncGoogleReviews}
                    disabled={syncing}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Automatically sync reviews from your Google Business Profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Last Sync Info */}
                  {loadingSyncStatus ? (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Loading sync status...</span>
                    </div>
                  ) : syncStatus?.lastSync ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-green-900">Last Successful Sync</h4>
                          <p className="text-sm text-green-700 mt-1">
                            {new Date(syncStatus.lastSync.syncedAt).toLocaleString()}
                          </p>
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-green-600">Total</p>
                              <p className="text-lg font-bold text-green-900">
                                {syncStatus.lastSync.totalReviews}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-green-600">Imported</p>
                              <p className="text-lg font-bold text-green-900">
                                {syncStatus.lastSync.reviewsImported}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-green-600">Updated</p>
                              <p className="text-lg font-bold text-green-900">
                                {syncStatus.lastSync.reviewsUpdated}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-900">No Sync History</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Click Sync Now to import your Google Business reviews
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Automatic Sync Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Automatic Daily Sync</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Reviews sync automatically every day at 2:00 AM UTC
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Setup Instructions */}
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-base">Setup Guide</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <h5 className="font-medium mb-1">Required Environment Variables:</h5>
                        <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`GOOGLE_LOCATION_ID=your_location_id
GOOGLE_OAUTH_ACCESS_TOKEN=your_token
CRON_SECRET=random_secret`}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
