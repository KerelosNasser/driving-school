export interface KnowledgeItem {
  id: string;
  category: string;
  keywords: string[];
  response: string;
  requiresAuth?: boolean;
}

export const knowledgeBase: KnowledgeItem[] = [
  {
    id: 'packages-overview',
    category: 'packages',
    keywords: ['package', 'packages', 'price', 'cost', 'pricing'],
    response: `We offer three main packages:

**Beginner Package** - $299 for 10 hours
Perfect for new drivers with comprehensive basic training

**Standard Package** - $499 for 15 hours  
Our most popular package with balanced theory and practical lessons

**Premium Package** - $699 for 20 hours
Comprehensive training with extra practice and test preparation

Would you like more details about any specific package?`
  },
  {
    id: 'booking-process',
    category: 'booking',
    keywords: ['book', 'booking', 'schedule', 'appointment', 'reserve'],
    response: `Booking is easy! Here's how:

1. Choose your preferred package
2. Select available dates and times
3. Complete payment securely online
4. Receive confirmation email

You can book directly through our website. Would you like me to guide you to the booking page?`,
    requiresAuth: false
  },
  {
    id: 'my-bookings',
    category: 'account',
    keywords: ['my booking', 'my lesson', 'my appointment', 'when is my'],
    response: `I can help you check your upcoming lessons and booking details. Let me look up your recent bookings...`,
    requiresAuth: true
  }
];

export function findBestMatch(message: string): KnowledgeItem | null {
  const lowerMessage = message.toLowerCase();
  
  for (const item of knowledgeBase) {
    for (const keyword of item.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return item;
      }
    }
  }
  
  return null;
}