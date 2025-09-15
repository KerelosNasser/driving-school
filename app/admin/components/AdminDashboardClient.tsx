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
  X,
  ChevronRight
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
import { ReferralRewardsTab } from './ReferralRewardsTab';
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
    id: 'referral-rewards',
    label: 'Referral Rewards',
    icon: Users,
    description: 'Manage Referral System & Rewards',
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
      case 'referral-rewards':
        return <ReferralRewardsTab />;
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 transition-all duration-300 flex flex-col shadow-2xl",
        sidebarCollapsed ? "w-16" : "w-72"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 backdrop-blur-sm bg-slate-800/50">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                    <p className="text-xs text-slate-400">Welcome, Mr. Emael</p>
                  </div>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors rounded-lg"
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                {!sidebarCollapsed && (
                  <div className="flex items-center space-x-2 px-3 mb-3">
                    <div className="h-px bg-gradient-to-r from-slate-600 to-transparent flex-1" />
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {getCategoryLabel(category)}
                    </h3>
                    <div className="h-px bg-gradient-to-l from-slate-600 to-transparent flex-1" />
                  </div>
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
                          "w-full justify-start group relative transition-all duration-200 rounded-xl",
                          sidebarCollapsed ? "px-3 py-3" : "px-3 py-3",
                          isActive 
                            ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10" 
                            : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-md"
                        )}
                        onClick={() => setActiveTab(item.id)}
                      >
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0 transition-all duration-200",
                          sidebarCollapsed ? "" : "mr-3",
                          isActive ? "text-amber-400 scale-110" : "text-slate-400 group-hover:text-white"
                        )} />
                        {!sidebarCollapsed && (
                          <div className="flex-1 text-left min-w-0">
                            <div className={cn(
                              "font-medium text-sm transition-colors",
                              isActive ? "text-amber-300" : "text-slate-300 group-hover:text-white"
                            )}>
                              {item.label}
                            </div>
                            <div className={cn(
                              "text-xs mt-0.5 transition-colors truncate",
                              isActive ? "text-amber-400/80" : "text-slate-500 group-hover:text-slate-300"
                            )}>
                              {item.description}
                            </div>
                          </div>
                        )}
                        
                        {!sidebarCollapsed && (
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-all duration-200 flex-shrink-0",
                            isActive 
                              ? "text-amber-400 translate-x-1" 
                              : "text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5"
                          )} />
                        )}
                        
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-amber-400 to-orange-400 rounded-r-full shadow-lg" />
                        )}

                        {/* Hover glow effect */}
                        <div className={cn(
                          "absolute inset-0 rounded-xl transition-opacity duration-300",
                          isActive 
                            ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-100"
                            : "bg-gradient-to-r from-slate-600/0 to-slate-500/0 opacity-0 group-hover:opacity-100"
                        )} />
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-slate-800/50">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-white">System Status</div>
                <div className="text-xs text-green-400">All systems online</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "p-3 rounded-xl shadow-lg transition-all duration-300",
                activeItem?.id === 'overview' && "bg-gradient-to-r from-blue-500 to-cyan-500",
                activeItem?.id === 'bookings' && "bg-gradient-to-r from-green-500 to-emerald-500",
                activeItem?.id === 'users' && "bg-gradient-to-r from-purple-500 to-violet-500",
                activeItem?.id === 'packages' && "bg-gradient-to-r from-orange-500 to-red-500",
                activeItem?.id === 'reviews' && "bg-gradient-to-r from-pink-500 to-rose-500",
                activeItem?.id === 'calendar' && "bg-gradient-to-r from-indigo-500 to-blue-500",
                activeItem?.id === 'pages' && "bg-gradient-to-r from-teal-500 to-cyan-500",
                activeItem?.id === 'forms' && "bg-gradient-to-r from-lime-500 to-green-500",
                activeItem?.id === 'maps' && "bg-gradient-to-r from-amber-500 to-yellow-500",
                activeItem?.id === 'theme' && "bg-gradient-to-r from-violet-500 to-purple-500",
                activeItem?.id === 'referral-rewards' && "bg-gradient-to-r from-emerald-500 to-teal-500",
                activeItem?.id === 'seo' && "bg-gradient-to-r from-slate-600 to-slate-700",
                !activeItem && "bg-gradient-to-r from-slate-500 to-slate-600"
              )}>
                {activeItem && <activeItem.icon className="h-6 w-6 text-white" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                  {activeItem?.label}
                </h2>
                <p className="text-slate-600 mt-1">{activeItem?.description}</p>
              </div>
            </div>
            
            {activeTab === 'pages' && (
              <div className="flex items-center space-x-3">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
                  <FileText className="h-3 w-3 mr-1" />
                  Direct File Editor
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg">
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
          <div className={cn(
            "transition-all duration-300",
            activeTab !== 'pages' && activeTab !== 'theme' && activeTab !== 'maps' && "animate-in fade-in-50 duration-500"
          )}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}