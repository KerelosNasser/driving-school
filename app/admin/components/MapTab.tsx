'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';

const AdminMap = dynamic(() => import('@/components/admin/admin-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 animate-pulse flex items-center justify-center">
      <p>Loading map...</p>
    </div>
  ),
});

interface User {
  latitude: number | null;
  longitude: number | null;
}

interface Booking {
  id: string;
  user: User | null;
}

interface MapTabProps {
  bookings: Booking[];
}

export const MapTab = ({ bookings }: MapTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Locations</CardTitle>
        <CardDescription>View all booking locations on the map</CardDescription>
      </CardHeader>
      <CardContent>
        <AdminMap bookings={bookings} />
      </CardContent>
    </Card>
  );
};