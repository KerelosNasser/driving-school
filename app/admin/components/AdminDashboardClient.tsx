'use client';

import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { OverviewTab } from './OverviewTab';
import { BookingsTab } from './BookingsTab';
import { UsersTab } from './UsersTab';
import { ReviewsTab } from './ReviewsTab';
import { CalendarTab } from './CalendarTab';
import { MapTab } from './MapTab';
import { FormsTab } from './FormsTab';
import { PackagesTab } from './PackagesTab';
import { MergedUser } from '../page';
import { Booking, Review, Package } from '@/lib/types';
import { EnhancedContentManagement } from './ContentManagementTab';

interface AdminDashboardClientProps {
  initialUsers: MergedUser[];
  initialReviews: Review[];
  initialBookings: Booking[];
  initialPackages: Package[];
}

export function AdminDashboardClient({
  initialUsers,
  initialReviews,
  initialBookings,
  initialPackages,
}: AdminDashboardClientProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [loading] = useState(false);

  // Handler for booking updates
  const handleBookingUpdate = useCallback((updatedBooking: Booking) => {
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking.id === updatedBooking.id ? updatedBooking : booking
      )
    );
  }, []);

  // Handler for approving or rejecting reviews
  const handleReviewApproval = async (reviewId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ approved })
        .eq('id', reviewId)
        .select();

      if (error) throw error;

      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId ? { ...review, approved } : review
        )
      );

      toast.success('Review updated', {
        description: `The review has been ${approved ? 'approved' : 'rejected'}.`,
      });
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Error updating review', {
        description: 'Could not update the review status.',
      });
    }
  };

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="bookings">Bookings</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="packages">Packages</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="map">Map</TabsTrigger>
        <TabsTrigger value="forms">Forms</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <OverviewTab bookings={bookings} users={initialUsers} reviews={reviews} loading={loading} />
      </TabsContent>
      <TabsContent value="bookings">
        <BookingsTab 
          bookings={bookings} 
          loading={loading} 
          onBookingUpdate={handleBookingUpdate}
        />
      </TabsContent>
      <TabsContent value="users">
        <UsersTab users={initialUsers} loading={false} />
      </TabsContent>
      <TabsContent value="packages">
        <PackagesTab initialPackages={initialPackages} />
      </TabsContent>
      <TabsContent value="reviews">
        <ReviewsTab
          reviews={reviews}
          loading={loading}
          handleReviewApproval={handleReviewApproval}
        />
      </TabsContent>
      <TabsContent value="content">
        <EnhancedContentManagement />
      </TabsContent>
      <TabsContent value="calendar">
        <CalendarTab bookings={bookings} />
      </TabsContent>
      <TabsContent value="map">
        <MapTab bookings={bookings} />
      </TabsContent>
      <TabsContent value="forms">
        <FormsTab />
      </TabsContent>
    </Tabs>
  );
}