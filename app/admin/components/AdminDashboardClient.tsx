'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package as PackageIcon,
  MessageSquare,
  CalendarDays,
  FileText,
  Palette,
  Map,
  Mail,
  Search,
  Menu,
  X
} from 'lucide-react';
import { OverviewTab } from './OverviewTab';
import { BookingsTab } from './BookingsTab';
import { UsersTab } from './UsersTab';
import { ReviewsTab } from './ReviewsTab';
import { CalendarTab } from './CalendarTab';
import { PackagesTab } from './PackagesTab';
import { SEOTab } from './SEOTab';
import { DirectPagesTab } from './DirectPagesTab';
import { MapTab } from './MapsTab';
import { FormsTab } from './FormsTab';
import { ThemeTab } from './ThemeTab';
import { MergedUser } from '../page';
import { Booking, Review, Package } from '@/lib/types';

const navigationItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Dashboard & Analytics',
    category: 'main'
  },
  {
    id: 'pages',
    label: 'Pages',
    icon: FileText,
    description: 'WordPress-like File Editor',
    category: 'content'
  },
  {
    id: 'theme',
    label: 'Theme',
    icon: Palette,
    description: 'Design Customization',
    category: 'content'
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: Calendar,
    description: 'Lesson Management',
    category: 'business'
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    description: 'Customer Management',
    category: 'business'
  },
  {
    id: 'packages',
    label: 'Packages',
    icon: PackageIcon,
    description: 'Lesson Packages',
    category: 'business'
  },
  {
    id: 'reviews',
    label: 'Reviews',
    icon: MessageSquare,
    description: 'Customer Feedback',
    category: 'business'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: CalendarDays,
    description: 'Schedule View',
    category: 'business'
  },
  {
    id: 'maps',
    label: 'Maps',
    icon: Map,
    description: 'Location Management',
    category: 'tools'
  },
  {
    id: 'forms',
    label: 'Forms',
    icon: Mail,
    description: 'Form Management',
    category: 'tools'
  },
  {
    id: 'seo',
    label: 'SEO',
    icon: Search,
    description: 'SEO Optimization',
    category: 'tools'
  }
];

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
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const activeItem = navigationItems.find(item => item.id === activeTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab bookings={bookings} users={initialUsers} reviews={reviews} loading={loading} />;
      case 'bookings':
        return <BookingsTab bookings={bookings} loading={loading} onBookingUpdate={handleBookingUpdate} />;
      case 'users':
        return <UsersTab users={initialUsers} loading={false} />;
      case 'packages':
        return <PackagesTab initialPackages={initialPackages} />;
      case 'reviews':
        return <ReviewsTab reviews={reviews} loading={loading} handleReviewApproval={handleReviewApproval} />;
      case 'calendar':
        return (
          <CalendarTab 
            bookings={bookings.map(booking => ({
              ...booking,
              package_id: booking.package_id || 'unknown',
              google_calendar_event_id: booking.id, // Fallback to booking ID
              package: booking.packages || { id: '', name: 'Unknown Package', hours: 1 },
              user: booking.users || { id: '', email: '', full_name: 'Unknown User' }
            }))} 
          />
        );
      case 'pages':
        return <DirectPagesTab />;
      case 'forms':
        return <FormsTab />;
      case 'maps':
        return (
          <MapTab 
            bookings={bookings.map(booking => ({
              id: booking.id,
              user: booking.users ? {
                latitude: (booking.users as any).latitude || null,
                longitude: (booking.users as any).longitude || null
              } : null
            }))} 
          />
        );
      case 'theme':
        return <ThemeTab />;
      case 'seo':
        return <SEOTab />;
      default:
        return <OverviewTab bookings={bookings} users={initialUsers} reviews={reviews} loading={loading} />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'main': return 'Dashboard';
      case 'content': return 'Content & Design';
      case 'business': return 'Business Operations';
      case 'tools': return 'Tools & Settings';
      default: return '';
    }
  };

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-gray-900">EG Admin</h1>
                <p className="text-sm text-gray-500">Driving School</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                {!sidebarCollapsed && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {getCategoryLabel(category)}
                  </h3>
                )}
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start group relative transition-all duration-200",
                          sidebarCollapsed ? "px-3 py-3" : "px-3 py-2.5",
                          isActive 
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )}
                        onClick={() => setActiveTab(item.id)}
                      >
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0 transition-colors",
                          sidebarCollapsed ? "" : "mr-3",
                          isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                        )} />
                        {!sidebarCollapsed && (
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm">{item.label}</div>
                            <div className="text-xs opacity-75 mt-0.5">{item.description}</div>
                          </div>
                        )}
                        
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                {activeItem && <activeItem.icon className="h-6 w-6 mr-3 text-blue-600" />}
                {activeItem?.label}
              </h2>
              <p className="text-gray-600 mt-1">{activeItem?.description}</p>
            </div>
            
            {activeTab === 'pages' && (
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <FileText className="h-3 w-3 mr-1" />
                  Direct File Editor
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Live Preview
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className={cn(
          "flex-1 overflow-auto",
          activeTab === 'pages' || activeTab === 'theme' || activeTab === 'maps' 
            ? "p-0" // Full screen for page builder, theme, and maps
            : "p-6"
        )}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}