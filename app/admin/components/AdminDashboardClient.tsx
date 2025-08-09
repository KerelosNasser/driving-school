'use client';

import { useState } from 'react';
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
import { MergedUser } from '../page'; // Import the MergedUser type

// Define types for our data
interface Review {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  clerk_id: string;
}

interface Package {
  id: string;
  name: string;
  price: number;
}

interface Booking {
  id: string;
  user_id: string;
  package_id: string | null;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  users: User;
  packages: Package | null;
}

interface AdminDashboardClientProps {
  initialUsers: MergedUser[];
  initialReviews: Review[];
  initialBookings: Booking[];
}

export function AdminDashboardClient({
  initialUsers,
  initialReviews,
  initialBookings,
}: AdminDashboardClientProps) {
  const [users, setUsers] = useState<MergedUser[]>(initialUsers);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [loading, setLoading] = useState(false);

  // Handler for approving or rejecting reviews
  const handleReviewApproval = async (reviewId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ approved })
        .eq('id', reviewId)
        .select();

      if (error) throw error;

      // Update the local state to reflect the change
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
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="map">Map</TabsTrigger>
        <TabsTrigger value="forms">Forms</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <OverviewTab bookings={bookings} users={users} reviews={reviews} loading={loading} />
      </TabsContent>
      <TabsContent value="bookings">
        <BookingsTab bookings={bookings} loading={loading} />
      </TabsContent>
      <TabsContent value="users">
        {/* The UsersTab now receives the merged user data */}
        <UsersTab users={users || initialUsers} loading={loading || !initialUsers} />
      </TabsContent>
      <TabsContent value="reviews">
        <ReviewsTab
          reviews={reviews}
          loading={loading}
          handleReviewApproval={handleReviewApproval}
        />
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