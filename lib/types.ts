// Base types for the application

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  hours: number;
  features: string[];
  popular: boolean;
  created_at: string;
  stripe_price_id?: string;
  stripe_product_id?: string;
}

export interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  approved: boolean;
  user_name: string;
  user_image?: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  role?: 'student' | 'instructor' | 'admin';
}

export interface Booking {
  time: string;
  id: string;
  user_id: string;
  package_id?: string;
  instructor_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at?: string;
  users?: User;
  packages?: Package;
}

export interface BookingStatusUpdate {
  id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  notes?: string;
}

// Add more types as needed for your application
