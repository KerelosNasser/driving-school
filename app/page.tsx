
import { Features } from "@/components/home/features";
import { PackagesPreview } from "@/components/home/packages-preview";
import { InstructorBio } from "@/components/home/instructor-bio";
import { ServiceAreaMap } from "@/components/home/service-area-map";
import { ReviewsPreview } from "@/components/home/reviews-preview";
import { BookingCTA } from "@/components/home/booking-cta";
import {Hero} from "@/components/home/hero";
import { AIChatbot } from '@/components/chatbot/AIChatbot';

export default function Home() {
  return (
    <div className="min-h-screen">
      <main>
        <Hero />
        <Features />
        <PackagesPreview />
        <InstructorBio />
        <ServiceAreaMap />
        <ReviewsPreview />
        <BookingCTA />
      </main>
      {/* AI Chatbot */}
      <AIChatbot delayMs={5000} />
    </div>
  );
}
