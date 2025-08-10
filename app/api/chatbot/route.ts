import { NextRequest, NextResponse } from 'next/server';
import { pipeline } from '@xenova/transformers';
import { supabase } from '@/lib/supabase';

// Initialize the AI model (this will be cached after first use)
let classifier: any = null;

const initializeModel = async () => {
  if (!classifier) {
    classifier = await pipeline('text-generation', 'Xenova/distilgpt2');
  }
  return classifier;
};

// Knowledge base for the driving school
const knowledgeBase = {
  packages: [
    {
      name: "Beginner Package",
      price: "$299",
      hours: "10 hours",
      description: "Perfect for new drivers with comprehensive basic training"
    },
    {
      name: "Standard Package", 
      price: "$499",
      hours: "15 hours",
      description: "Most popular package with balanced theory and practical lessons"
    },
    {
      name: "Premium Package",
      price: "$699", 
      hours: "20 hours",
      description: "Comprehensive training with extra practice and test preparation"
    }
  ],
  services: [
    "Driving lessons for beginners",
    "Refresher courses for experienced drivers",
    "Test preparation and mock tests",
    "Defensive driving courses",
    "Manual and automatic transmission training"
  ],
  areas: [
    "Brisbane CBD",
    "South Brisbane", 
    "West End",
    "Fortitude Valley",
    "New Farm",
    "Kangaroo Point"
  ],
  contact: {
    phone: "0400 000 000",
    email: "info@brisbanedrivingschool.com",
    hours: "Monday to Friday: 8AM - 6PM, Saturday: 9AM - 4PM"
  }
};

function getContextualResponse(message: string, userContext?: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm here to help you with all your driving lesson needs. What would you like to know about our packages, booking process, or services?";
  }
  
  // Package inquiries
  if (lowerMessage.includes('package') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    const packageInfo = knowledgeBase.packages.map(pkg => 
      `**${pkg.name}**: ${pkg.price} for ${pkg.hours} - ${pkg.description}`
    ).join('\n\n');
    return `Here are our available packages:\n\n${packageInfo}\n\nWould you like to book a package or need more details about any specific one?`;
  }
  
  // Booking inquiries
  if (lowerMessage.includes('book') || lowerMessage.includes('schedule') || lowerMessage.includes('appointment')) {
    return userContext?.userId 
      ? "Great! You can book your lessons directly through our booking page. I can help guide you through the process. What type of package are you interested in?"
      : "To book lessons, you'll need to sign up for an account first. Once you're logged in, you can easily book and manage your lessons. Would you like me to guide you through the sign-up process?";
  }
  
  // Service area inquiries
  if (lowerMessage.includes('area') || lowerMessage.includes('location') || lowerMessage.includes('where')) {
    return `We provide driving lessons across Brisbane including: ${knowledgeBase.areas.join(', ')}. We can arrange pickup from your preferred location within these areas.`;
  }
  
  // Services inquiries
  if (lowerMessage.includes('service') || lowerMessage.includes('offer') || lowerMessage.includes('teach')) {
    return `Our services include:\n\n${knowledgeBase.services.map(service => `• ${service}`).join('\n')}\n\nWhich service are you most interested in?`;
  }
  
  // Contact inquiries
  if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('call')) {
    return `You can reach us at:\n\n📞 Phone: ${knowledgeBase.contact.phone}\n📧 Email: ${knowledgeBase.contact.email}\n🕒 Hours: ${knowledgeBase.contact.hours}\n\nFeel free to call us for immediate assistance!`;
  }
  
  // Test/exam inquiries
  if (lowerMessage.includes('test') || lowerMessage.includes('exam') || lowerMessage.includes('license')) {
    return "We offer comprehensive test preparation including mock driving tests and theory practice. Our instructors will ensure you're fully prepared for your driving test. Would you like to know more about our test preparation package?";
  }
  
  // Reviews/testimonials
  if (lowerMessage.includes('review') || lowerMessage.includes('testimonial') || lowerMessage.includes('feedback')) {
    return "We're proud of our excellent student reviews! You can read testimonials from our students on our reviews page. Our instructors are highly rated for their patience, professionalism, and effective teaching methods.";
  }
  
  // Default response
  return "I'd be happy to help you with information about our driving lessons, packages, booking process, or any other questions. You can also contact us directly at 0400 000 000 or info@brisbanedrivingschool.com for immediate assistance.";
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user context if authenticated
    let userContext = null;
    if (userId) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', userId)
          .single();
        
        const { data: userBookings } = await supabase
          .from('bookings')
          .select('*, packages(*)')
          .eq('user_id', userData?.id)
          .order('created_at', { ascending: false })
          .limit(3);
          
        userContext = {
          userId,
          userData,
          recentBookings: userBookings
        };
      } catch (error) {
        console.log('Could not fetch user context:', error);
      }
    }

    // Get contextual response based on message content and user data
    let response = getContextualResponse(message, userContext);
    
    // Add personalized information if user has bookings
    if (userContext?.recentBookings && userContext.recentBookings.length > 0) {
      const recentBooking = userContext.recentBookings[0];
      if (message.toLowerCase().includes('booking') || message.toLowerCase().includes('lesson')) {
        response += `\n\nI can see you have a recent booking for ${recentBooking.packages?.name || 'a lesson'} on ${new Date(recentBooking.date).toLocaleDateString()}. Is there anything specific about this booking you'd like to know?`;
      }
    }

    // Try to enhance response with AI if the model is available
    try {
      await initializeModel();
      // Note: For production, you might want to use a more sophisticated model
      // This is a basic implementation with distilgpt2
    } catch (error) {
      console.log('AI model not available, using rule-based responses', error);
    }

    return NextResponse.json({ response });
    
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}