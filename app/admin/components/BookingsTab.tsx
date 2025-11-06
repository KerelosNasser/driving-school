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
import { Search, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useBookings } from '@/hooks/useBookings';
import { Booking } from '@/lib/types';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { CancelBookingDialog } from './CancelBookingDialog';

interface BookingsTabProps {
  bookings: Booking[];
  loading: boolean;
  onBookingUpdate: (booking: Booking) => void;
}

export const BookingsTab = ({ bookings, loading, onBookingUpdate }: BookingsTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  
  const { updateBookingStatus, isUpdating } = useBookings(onBookingUpdate);

  const handleCancelBooking = (booking: Booking) => {
    setBookingToCancel(booking);
    setIsCancelDialogOpen(true);
  };

  const handleCancelSuccess = () => {
    // Refresh bookings list
    if (bookingToCancel) {
      onBookingUpdate({ ...bookingToCancel, status: 'cancelled' });
    }
    setBookingToCancel(null);
  };

  const filteredBookings = bookings.filter(booking => {
    const searchTermLower = searchTerm.toLowerCase();
    
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
      case 'cancelled': return 'text-gray-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  const handleStatusChange = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setIsStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedBooking || !newStatus) return;
    
    const success = await updateBookingStatus({
      id: selectedBooking.id,
      status: newStatus as 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected',
    });
    
    if (success) {
      setIsStatusDialogOpen(false);
      setSelectedBooking(null);
      setNewStatus('');
    }
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Booking Management</CardTitle>
          <CardDescription>View and manage all customer bookings with status updates and email notifications.</CardDescription>
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
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-10">              <LoadingIndicator color="#6b7280" size="large" variant="bars" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <div key={booking.id} className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{booking.users?.full_name || 'Unknown User'}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {booking.users?.email || 'No Email'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewBooking(booking)}>View</Button>
                        <Button size="sm" onClick={() => handleStatusChange(booking)}>Update Status</Button>
                        {booking.status !== 'cancelled' && (
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleCancelBooking(booking)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Booked for {new Date(booking.date).toLocaleDateString()} at {booking.start_time || booking.end_time}
                    </div>
                    <div className="text-sm text-gray-500">
                      Package: {booking.packages?.name || 'Unknown Package'}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {getStatusIcon(booking.status)}
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
                <div>{selectedBooking.start_time || selectedBooking.time}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Package:</div>
                <div>{selectedBooking.packages?.name || 'Unknown Package'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Status:</div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedBooking.status)}
                  <span className={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </span>
                </div>
              </div>
              {selectedBooking.notes && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Notes:</div>
                  <div>{selectedBooking.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
            <DialogDescription>
              Change the status of this booking. An email notification will be sent to the customer.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selectedBooking.users?.full_name}</p>
                <p className="text-sm text-gray-500">{selectedBooking.users?.email}</p>
                <p className="text-sm text-gray-500">
                  {new Date(selectedBooking.date).toLocaleDateString()} at {selectedBooking.start_time || selectedBooking.time}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleStatusUpdate} 
              disabled={isUpdating || !newStatus || newStatus === selectedBooking?.status}
            >
              {isUpdating ? (
                <>
                  <LoadingIndicator color="#ffffff" size="small" variant="lines" />
                  Updating...
                </>
              ) : (
                'Update & Send Email'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Dialog */}
      {bookingToCancel && (
        <CancelBookingDialog
          bookingId={bookingToCancel.id}
          studentName={bookingToCancel.users?.full_name || 'Unknown Student'}
          date={bookingToCancel.date}
          time={bookingToCancel.start_time || bookingToCancel.time || ''}
          open={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
};