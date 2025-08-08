'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// These types should ideally be in a central file, but defining here for clarity
interface User {
  id: string;
  email: string;
  full_name: string;
}

interface Package {
  id: string;
  name: string;
}

interface Booking {
  id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  users: User | null; // Corresponds to the 'users' table join
  packages: Package | null; // Corresponds to the 'packages' table join
}

interface BookingsTabProps {
  bookings: Booking[];
  loading: boolean;
}

export const BookingsTab = ({ bookings, loading }: BookingsTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredBookings = bookings.filter(booking => {
    const searchTermLower = searchTerm.toLowerCase();
    
    // Defensive checks to ensure nested data exists before filtering
    const matchesSearch =
      (booking.users?.full_name?.toLowerCase() || '').includes(searchTermLower) ||
      (booking.users?.email?.toLowerCase() || '').includes(searchTermLower) ||
      (booking.packages?.name?.toLowerCase() || '').includes(searchTermLower);

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'confirmed': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Booking Management</CardTitle>
          <CardDescription>View and manage all customer bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, email, or package..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <div key={booking.id} className="border p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{booking.users?.full_name || 'Unknown User'}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {booking.users?.email || 'No Email'}
                        </span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleViewBooking(booking)}>View</Button>
                    </div>
                    <div className="text-sm text-gray-500">
                      Booked for {new Date(booking.date).toLocaleDateString()} at {booking.time}
                    </div>
                    <div className="text-sm text-gray-500">
                      Package: {booking.packages?.name || 'Unknown Package'}
                    </div>
                    <div className="mt-2">
                      <span className={`text-sm font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No bookings found.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-fit bg-white p-6 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Booking Details</DialogTitle>
            <DialogDescription className="text-gray-500">
              Detailed information about the booking.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">User:</div>
                <div>{selectedBooking.users?.full_name || 'Unknown User'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Email:</div>
                <div>{selectedBooking.users?.email || 'No Email'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Date:</div>
                <div>{new Date(selectedBooking.date).toLocaleDateString()}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Time:</div>
                <div>{selectedBooking.time}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Package:</div>
                <div>{selectedBooking.packages?.name || 'Unknown Package'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Status:</div>
                <div>
                  <span className={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};