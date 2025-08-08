'use client';

import LeafletAdminMap from '@/components/maps/LeafletAdminMap';

interface MapProps {
  bookings: any[];
}

const AdminMap = ({ bookings }: MapProps) => {
  return <LeafletAdminMap bookings={bookings} />;
};

export default AdminMap;
