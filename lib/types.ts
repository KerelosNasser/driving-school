export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  hours: number;
  features: string[];
  popular: boolean;
  created_at: string;
  payment_id?: string;
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

export interface SiteContent {
  id: string;
  content_key: string;
  content_type: 'text' | 'image' | 'json' | 'boolean';
  content_value: string | null;
  content_json: any | null;
  page_section: string;
  display_order: number;
  file_path: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  alt_text: string | null;
  title: string | null;
  description: string | null;
  is_active: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}
export interface AIProvider {
  name: string;
  endpoint: string;
  apiKey: string | null;
  headers: Record<string, string>;
  payload: (message: string, context: string) => any;
  parseResponse: (response: any) => string;
}

export interface EmailRequest {
  bookingId: string;
  userEmail: string;
  userName: string;
  status: string;
  date: string;
  time: string;
  packageName?: string;
}
export interface ContentResponse {
  data: SiteContent[];
  count: number;
  error?: string;
  details?: string;
}
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatbotProps {
  delayMs?: number;
}
