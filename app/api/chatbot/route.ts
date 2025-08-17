import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

Always be encouraging, safety-focused,straight to the point, and emphasize the value of professional instruction.
`;

// AI Provider Configuration
interface AIProvider {
  name: string;
  endpoint: string;
  apiKey: string | null;
  headers: Record<string, string>;
  payload: (message: string, context: string) => any;
  parseResponse: (response: any) => string;
}

const getAIProviders = (): AIProvider[] => [
    {
    name: 'Hyperbolic',
    endpoint: 'https://api.hyperbolic.xyz/v1/chat/completions',
    apiKey: process.env.HYPERBOLIC_API_KEY || '',
    headers: {
      'Authorization': `Bearer ${process.env.HYPERBOLIC_API_KEY}`,
      'Content-Type': 'application/json'
    },
    payload: (message: string, context: string) => ({
      model: 'meta-llama/Llama-3.2-3B-Instruct',
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: message }
      ],
      max_tokens: 300,
      temperature: 0.7,
      stream: false
    }),
    parseResponse: (response: any) => response.choices?.[0]?.message?.content || ''
  },
   {
    name: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://localhost:3000',
      'X-Title': 'EG Driving School Chatbot'
    },
    payload: (message: string, context: string) => ({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: message }
      ],
      max_tokens: 300,
      temperature: 0.7,
      stream: false
    }),
    parseResponse: (response: any) => response.choices?.[0]?.message?.content || ''
  },
  {
    name: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: process.env.GROQ_API_KEY || '',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    payload: (message: string, context: string) => ({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: message }
      ],
      max_tokens: 300,
      temperature: 0.7,
      stream: false
    }),
    parseResponse: (response: any) => response.choices?.[0]?.message?.content || ''
  },
];

async function callAIProvider(provider: AIProvider, message: string, context: string): Promise<string> {
  if (!provider.apiKey) {
    throw new Error(`No API key for ${provider.name}`);
  }

  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: provider.headers,
    body: JSON.stringify(provider.payload(message, context))
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${provider.name} API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return provider.parseResponse(data);
}

async function getEnhancedAIResponse(
  message: string,
  userContext?: any,
  comprehensiveData?: any,
  conversationHistory?: any[]
): Promise<string> {
  
  // Prepare comprehensive context
  const dataContext = `
    **Driving School Information:**
    ${drivingSchoolContext}

    **Live Data:**
    - **Packages:** ${JSON.stringify(comprehensiveData?.packages || knowledgeBase.packages, null, 2)}
    - **Reviews:** ${JSON.stringify(comprehensiveData?.reviews, null, 2)}
    - **Service Areas:** ${JSON.stringify(knowledgeBase.areas, null, 2)}
    - **Contact Info:** ${JSON.stringify(knowledgeBase.contact, null, 2)}
  `;

  let userPrompt = "";
  if (userContext?.userData) {
    userPrompt = `
      **User Information:**
      - **Name:** ${userContext.userData.full_name}
      - **Recent Bookings:** ${JSON.stringify(userContext.recentBookings, null, 2)}
    `;
  }

  const fullContext = `${dataContext}\n${userPrompt}\n\nPlease respond as a friendly, professional driving school assistant. Keep responses under 250 words and be encouraging.`;

  // Try each AI provider in order
  const providers = getAIProviders();
  
  for (const provider of providers) {
    try {
      console.log(`🤖 Trying ${provider.name} AI provider...`);
      
      const response = await callAIProvider(provider, message, fullContext);
      
      if (response && response.trim().length > 10) {
        console.log(`✅ Success with ${provider.name}!`);
        return response.trim();
      }
    } catch (error) {
      console.log(`❌ ${provider.name} failed:`, error);
      continue;
    }
  }

  // If all AI providers fail, use intelligent fallback
  console.log('🔄 All AI providers failed, using intelligent fallback');
  return getIntelligentResponse(message, userContext, comprehensiveData, conversationHistory);
}

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
    email: "info@EGdrivingschool.com",
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

function getIntelligentResponse(message: string, userContext?: any, comprehensiveData?: any, _conversationHistory?: any[]): string {
  const lowerMessage = message.toLowerCase();
  
  // Conversational responses
  if (lowerMessage.includes('how are you') || lowerMessage.includes('how\'re you')) {
    return "I'm doing great, thank you for asking! 😊 I'm here and ready to help you with all your driving lesson questions. Whether you're looking for package information, want to book lessons, or need details about our services, I've got you covered! What would you like to know?";
  }
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    const stats = comprehensiveData ? `We currently serve ${comprehensiveData.totalUsers}+ students with an average rating of ${comprehensiveData.averageRating} stars! ⭐` : "";
    return `Hello! 🚗 Welcome to EG Driving School! I'm your AI assistant with complete access to our database. ${stats} What would you like to know about our packages, your bookings, or our services?`;
  }
  
  // Package inquiries with real-time data
  if (lowerMessage.includes('package') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    const packages = comprehensiveData?.packages || knowledgeBase.packages;
    const packageInfo = packages.map((pkg: any) => 
      `**${pkg.name}**: $${pkg.price} for ${pkg.hours} hours\n   ${pkg.description}\n   Features: ${Array.isArray(pkg.features) ? pkg.features.join(', ') : pkg.features}`
    ).join('\n\n');
    return `🌟 Here are our current packages with live pricing:\n\n${packageInfo}\n\n💡 Our Standard Package is most popular! Would you like to book one or need more details?`;
  }
  
  // Booking inquiries
  if (lowerMessage.includes('book') || lowerMessage.includes('schedule') || lowerMessage.includes('appointment')) {
    let response = "Excellent! I'd love to help you book your driving lessons. 🚗 ";
    
    if (userContext?.userId) {
      if (userContext.recentBookings && userContext.recentBookings.length > 0) {
        const upcomingBookings = userContext.recentBookings.filter((b: any) => new Date(b.date) > new Date());
        if (upcomingBookings.length > 0) {
          response += `I can see you have ${upcomingBookings.length} upcoming lesson(s) scheduled. `;
        }
      }
      response += "You can book additional lessons directly through our booking page. What type of package interests you?";
    } else {
      response += "To get started, you'll need to create an account first. Once logged in, you can easily book and manage your lessons. Would you like me to guide you through the process?";
    }
    
    return response;
  }
  
  // My bookings
  if (lowerMessage.includes('my booking') || lowerMessage.includes('my lesson')) {
    if (!userContext?.userId) {
      return "Please sign in to view your bookings. Once logged in, I can show you all your upcoming lessons and booking history. 📅";
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
      
      return response + `\nNeed to reschedule or have questions?`;
    } else {
      return "I don't see any bookings yet! Would you like to book your first lesson? I can help you choose the perfect package! 🌟";
    }
  }
  
  // Default response
  return "I'm here to help with all your driving school needs! 🚗 I can assist with:\n\n🎯 Package selection & pricing\n📅 Booking & scheduling\n📊 Your lessons & progress\n⭐ Student reviews\n📞 Contact information\n🗺️ Service areas\n\nWhat would you like to know? You can also call us at 0400 000 000!";
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

    console.log('🤖 Processing message:', message.substring(0, 50) + '...');

    // Check which AI providers are available
    const providers = getAIProviders();
    const availableProviders = providers.filter(p => p.apiKey);
    console.log(`🔧 Available AI providers: ${availableProviders.map(p => p.name).join(', ')}`);

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

    // Get enhanced response with AI or fallback
    let response = await getEnhancedAIResponse(message, userContext, comprehensiveData, _conversationHistory);
    
    // Add context-aware personalization
    if (userContext?.recentBookings && userContext.recentBookings.length > 0) {
      const recentBooking = userContext.recentBookings[0];
      if (message.toLowerCase().includes('booking') || message.toLowerCase().includes('lesson')) {
        response += `\n\n💡 **Quick Update:** Your most recent booking is for ${recentBooking.packages?.name || 'a lesson'} on ${new Date(recentBooking.date).toLocaleDateString()}. Status: ${recentBooking.status}`;
      }
    }

    console.log('✅ Response generated successfully');
    return NextResponse.json({ response });
    
  } catch (error) {
    console.error('❌ Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}