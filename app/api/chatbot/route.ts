import { NextRequest, NextResponse } from 'next/server';
import { InferenceClient } from '@huggingface/inference';
import { supabase } from '@/lib/supabase';

// Initialize Hugging Face client (free tier available)
const hf =  new InferenceClient(process.env.HUGGING_FACE_API_KEY);

// Enhanced driving school knowledge base
const drivingSchoolContext = `
You are an expert AI assistant for EG Driving School in Brisbane, Australia. You specialize in:

**Driving Education Expertise:**
- Road safety and defensive driving techniques
- Australian road rules and traffic laws
- Hazard perception and risk assessment
- Parking techniques (parallel, reverse, angle)
- Highway driving and merging strategies
- Weather condition driving (rain, fog, night)
- Roundabout navigation and right-of-way rules

**Why Choose Professional Driving Lessons:**
- Structured learning progression from basics to advanced skills
- Professional instructors with years of experience
- Dual-control vehicles for maximum safety
- Personalized feedback and improvement plans
- Higher first-time test pass rates (85% vs 60% self-taught)
- Insurance benefits for professionally trained drivers
- Confidence building in real traffic situations

**Student Success Stories:**
- Nervous drivers becoming confident road users
- International license holders adapting to Australian roads
- Mature age learners achieving their driving goals
- Young drivers developing safe driving habits

**Packages Available:**
- Beginner Package: $299 for 10 hours (perfect for new drivers)
- Standard Package: $499 for 15 hours (most popular, includes test prep)
- Premium Package: $699 for 20 hours (comprehensive with extra practice)

Always be encouraging, safety-focused, and emphasize the value of professional instruction.
`;

async function getEnhancedAIResponse(message: string, userContext?: any, comprehensiveData?: any): Promise<string> {
  try {
    // Prepare context with user data
    let contextPrompt = drivingSchoolContext;
    
    if (userContext?.recentBookings) {
      contextPrompt += `\n\nUser Context: This student has ${userContext.recentBookings.length} bookings and their most recent package is ${userContext.recentBookings[0]?.packages?.name || 'unknown'}.`;
    }
    
    if (comprehensiveData?.averageRating) {
      contextPrompt += `\n\nSchool Stats: ${comprehensiveData.averageRating}/5 star rating with ${comprehensiveData.totalUsers}+ students.`;
    }

    // Use Hugging Face's free models (like Microsoft DialoGPT or Facebook BlenderBot)
    const response = await hf.textGeneration({
      model: 'microsoft/DialoGPT-large', // Free and good for conversations
      inputs: `${contextPrompt}\n\nStudent Question: ${message}\n\nHelpful Response:`,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1
      }
    });

    return response.generated_text.split('Helpful Response:')[1]?.trim() || getEnhancedResponse(message, userContext, comprehensiveData);
  } catch (error) {
    console.error('AI model error:', error);
    // Fallback to enhanced rule-based system
    return getEnhancedResponse(message, userContext, comprehensiveData);
  }
}

// Enhanced knowledge base with complete data access
const knowledgeBase = {
  packages: [
    {
      name: "Starter Package",
      price: "$299.99",
      hours: "5 hours",
      description: "Perfect for beginners who are just starting their driving journey",
      features: ["5 hours of driving lessons", "Personalized instruction", "Flexible scheduling"]
    },
    {
      name: "Standard Package", 
      price: "$499.99",
      hours: "10 hours",
      description: "Our most popular package for learners with some experience",
      features: ["10 hours of driving lessons", "Personalized instruction", "Flexible scheduling", "Test preparation"]
    },
    {
      name: "Premium Package",
      price: "$799.99", 
      hours: "20 hours",
      description: "Comprehensive package for complete preparation",
      features: ["20 hours of driving lessons", "Personalized instruction", "Flexible scheduling", "Test preparation", "Mock driving test", "Pick-up and drop-off service"]
    }
  ],
  services: [
    "Driving lessons for beginners",
    "Refresher courses for experienced drivers", 
    "Test preparation and mock tests",
    "Defensive driving courses",
    "Manual and automatic transmission training",
    "Highway driving practice",
    "Parallel parking instruction",
    "Night driving lessons",
    "Pick-up and drop-off service"
  ],
  areas: [
    "Brisbane CBD",
    "South Brisbane", 
    "West End",
    "Fortitude Valley",
    "New Farm",
    "Kangaroo Point",
    "Woolloongabba",
    "Spring Hill",
    "Paddington",
    "Milton"
  ],
  contact: {
    phone: "0400 000 000",
    email: "info@brisbanedrivingschool.com",
    hours: "Monday to Friday: 8AM - 6PM, Saturday: 9AM - 4PM, Sunday: Closed",
    address: "Brisbane CBD, Queensland"
  },
  policies: {
    cancellation: "24 hours notice required for cancellations",
    rescheduling: "Free rescheduling up to 24 hours before lesson",
    payment: "Secure online payment via Stripe",
    refund: "Full refund for unused lessons with 48 hours notice"
  }
};

async function getComprehensiveData(userId?: string) {
  try {
    // Fetch all available data from database
    const [packagesResult, reviewsResult, bookingsResult, usersResult] = await Promise.all([
      supabase.from('packages').select('*').order('price'),
      supabase.from('reviews').select('*').eq('approved', true).order('created_at', { ascending: false }).limit(10),
      userId ? supabase.from('bookings').select('*, packages(*), users(*)').order('created_at', { ascending: false }) : { data: [] },
      supabase.from('users').select('id, full_name, email, created_at').order('created_at', { ascending: false }).limit(5)
    ]);

    return {
      packages: packagesResult.data || [],
      reviews: reviewsResult.data || [],
      bookings: bookingsResult.data || [],
      users: usersResult.data || [],
      totalUsers: usersResult.data?.length || 0,
      averageRating: reviewsResult.data && reviewsResult.data.length > 0
        ? Number((reviewsResult.data.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviewsResult.data.length).toFixed(1))
        : 5.0
    };
  } catch (error) {
    console.error('Error fetching comprehensive data:', error);
    return null;
  }
}

function getEnhancedResponse(message: string, userContext?: any, comprehensiveData?: any, conversationHistory?: any[]): string {
  const lowerMessage = message.toLowerCase();
  
  // Analyze conversation history for context
  const hasAskedAboutPackages = conversationHistory?.some((msg: any) => 
    msg.content.toLowerCase().includes('package') || msg.content.toLowerCase().includes('price')
  );
  const hasAskedAboutBooking = conversationHistory?.some((msg: any) => 
    msg.content.toLowerCase().includes('book') || msg.content.toLowerCase().includes('schedule')
  );
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    const stats = comprehensiveData ? `We currently serve ${comprehensiveData.totalUsers}+ students with an average rating of ${comprehensiveData.averageRating} stars!` : "";
    return `Hello! 🚗 I'm your Brisbane Driving School AI assistant with complete access to our database. ${stats} What would you like to know about our packages, your bookings, or our services?`;
  }
  
  // Package inquiries with real-time data
  if (lowerMessage.includes('package') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    const packages = comprehensiveData?.packages || knowledgeBase.packages;
    const packageInfo = packages.map((pkg: any) => 
      `**${pkg.name}**: $${pkg.price} for ${pkg.hours} hours - ${pkg.description}\nFeatures: ${Array.isArray(pkg.features) ? pkg.features.join(', ') : pkg.features}`
    ).join('\n\n');
    return `Here are our current packages with live pricing:\n\n${packageInfo}\n\n💡 Our Standard Package is most popular! Would you like to book one or need more details?`;
  }
  
  // Booking inquiries with personalized data
  if (lowerMessage.includes('book') || lowerMessage.includes('schedule') || lowerMessage.includes('appointment')) {
    let response = "Great! I can help you book your lessons. ";
    
    if (userContext?.userId) {
      if (userContext.recentBookings && userContext.recentBookings.length > 0) {
        const upcomingBookings = userContext.recentBookings.filter((b: any) => new Date(b.date) > new Date());
        if (upcomingBookings.length > 0) {
          response += `I can see you have ${upcomingBookings.length} upcoming lesson(s). `;
        }
      }
      response += "You can book additional lessons directly through our booking page. What type of package interests you?";
    } else {
      response += "To book lessons, you'll need to sign up first. Once logged in, you can easily book and manage your lessons. Would you like me to guide you through the process?";
    }
    
    // Add contextual suggestion if they've asked about packages before
    if (hasAskedAboutPackages && !hasAskedAboutBooking) {
      response += "\n\n🎯 **Ready to book?** I can guide you through our online booking system step by step!";
    }
    
    return response;
  }
  
  // My bookings with real data
  if (lowerMessage.includes('my booking') || lowerMessage.includes('my lesson') || lowerMessage.includes('when is my')) {
    if (!userContext?.userId) {
      return "Please sign in to view your bookings. Once logged in, I can show you all your upcoming lessons and booking history.";
    }
    
    if (userContext.recentBookings && userContext.recentBookings.length > 0) {
      const upcoming = userContext.recentBookings.filter((b: any) => new Date(b.date) > new Date());
      const completed = userContext.recentBookings.filter((b: any) => b.status === 'completed');
      
      let response = `📅 **Your Booking Summary:**\n\n`;
      
      if (upcoming.length > 0) {
        response += `**Upcoming Lessons (${upcoming.length}):**\n`;
        upcoming.slice(0, 3).forEach((booking: any) => {
          response += `• ${new Date(booking.date).toLocaleDateString()} at ${booking.time} - ${booking.packages?.name || 'Lesson'} (${booking.status})\n`;
        });
      }
      
      if (completed.length > 0) {
        response += `\n**Completed:** ${completed.length} lessons\n`;
      }
      
      response += `\nNeed to reschedule or have questions about any lesson?`;
      return response;
    } else {
      return "I don't see any bookings for your account yet. Would you like to book your first lesson? I can help you choose the perfect package!";
    }
  }
  
  // Service area inquiries
  if (lowerMessage.includes('area') || lowerMessage.includes('location') || lowerMessage.includes('where')) {
    return `🗺️ **Service Areas:**\nWe provide driving lessons across Brisbane including: ${knowledgeBase.areas.join(', ')}.\n\n✨ We offer pick-up and drop-off service within these areas for Premium Package students!`;
  }
  
  // Services inquiries
  if (lowerMessage.includes('service') || lowerMessage.includes('offer') || lowerMessage.includes('teach')) {
    return `🚗 **Our Services:**\n\n${knowledgeBase.services.map(service => `• ${service}`).join('\n')}\n\nWhich service interests you most? I can provide detailed information!`;
  }
  
  // Reviews and testimonials with real data
  if (lowerMessage.includes('review') || lowerMessage.includes('testimonial') || lowerMessage.includes('feedback')) {
    let response = `⭐ **Student Reviews:**\n\n`;
    
    if (comprehensiveData?.reviews && comprehensiveData.reviews.length > 0) {
      response += `Average Rating: ${comprehensiveData.averageRating}/5.0 stars\n\n`;
      response += `**Recent Reviews:**\n`;
      comprehensiveData.reviews.slice(0, 2).forEach((review: any) => {
        response += `• "${review.comment}" - ${review.user_name} (${review.rating}/5 ⭐)\n`;
      });
      response += `\nWe have ${comprehensiveData.reviews.length}+ verified reviews!`;
    } else {
      response += "We're proud of our excellent student reviews! Our instructors are highly rated for patience, professionalism, and effective teaching.";
    }
    
    return response;
  }
  
  // Contact inquiries
  if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('call')) {
    return `📞 **Contact Information:**\n\n• Phone: ${knowledgeBase.contact.phone}\n• Email: ${knowledgeBase.contact.email}\n• Hours: ${knowledgeBase.contact.hours}\n• Location: ${knowledgeBase.contact.address}\n\nFeel free to call us for immediate assistance!`;
  }
  
  // Test/exam inquiries
  if (lowerMessage.includes('test') || lowerMessage.includes('exam') || lowerMessage.includes('license')) {
    return "🎯 **Test Preparation:**\nWe offer comprehensive test preparation including:\n• Mock driving tests\n• Theory practice\n• Test route familiarization\n• Last-minute test tips\n\nOur Premium Package includes dedicated test prep. Ready to book?";
  }
  
  // Pricing comparisons
  if (lowerMessage.includes('compare') || lowerMessage.includes('difference')) {
    return `💰 **Package Comparison:**\n\n🥉 **Starter ($299.99):** Great for basic skills\n🥈 **Standard ($499.99):** Most popular, includes test prep\n🥇 **Premium ($799.99):** Complete package with extras\n\nNeed help choosing? I can recommend based on your experience level!`;
  }
  
  // Availability inquiries
  if (lowerMessage.includes('available') || lowerMessage.includes('when can') || lowerMessage.includes('next')) {
    return "📅 **Availability:**\nWe offer lessons 7 days a week:\n• Monday-Friday: 8AM-6PM\n• Saturday: 9AM-4PM\n• Sunday: 10AM-3PM\n\nMost slots available with 24-48 hours notice. Premium students get priority booking!";
  }
  
  // Policy inquiries
  if (lowerMessage.includes('cancel') || lowerMessage.includes('reschedule') || lowerMessage.includes('refund')) {
    return `📋 **Our Policies:**\n\n• **Cancellation:** ${knowledgeBase.policies.cancellation}\n• **Rescheduling:** ${knowledgeBase.policies.rescheduling}\n• **Payment:** ${knowledgeBase.policies.payment}\n• **Refunds:** ${knowledgeBase.policies.refund}\n\nNeed to make changes to your booking?`;
  }
  
  // Default enhanced response
  return "I'm your comprehensive AI assistant with access to all our data! I can help with:\n\n🎯 Package selection & pricing\n📅 Booking & scheduling\n📊 Your account & lesson history\n⭐ Reviews & testimonials\n📞 Contact information\n🗺️ Service areas\n\nWhat would you like to know? You can also call us at 0400 000 000 for immediate assistance!";
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId, _conversationHistory } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get comprehensive data from database
    const comprehensiveData = await getComprehensiveData(userId);

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
          .limit(5);
          
        userContext = {
          userId,
          userData,
          recentBookings: userBookings
        };
      } catch (error) {
        console.log('Could not fetch user context:', error);
      }
    }

    // Get enhanced response with comprehensive data and conversation history
    let response = await getEnhancedAIResponse(message, userContext, comprehensiveData);
    
    // Add context-aware personalization
    if (userContext?.recentBookings && userContext.recentBookings.length > 0) {
      const recentBooking = userContext.recentBookings[0];
      if (message.toLowerCase().includes('booking') || message.toLowerCase().includes('lesson')) {
        response += `\n\n💡 **Quick Info:** Your most recent booking is for ${recentBooking.packages?.name || 'a lesson'} on ${new Date(recentBooking.date).toLocaleDateString()}. Status: ${recentBooking.status}`;
      }
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