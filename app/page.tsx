
import { Features } from "@/components/home/features";
import { PackagesPreview } from "@/components/home/packages-preview";
import { InstructorBio } from "@/components/home/instructor-bio";
import { ServiceAreaMap } from "@/components/home/service-area-map";
import { ReviewsPreview } from "@/components/home/reviews-preview";
import { BookingCTA } from "@/components/home/booking-cta";
import { Hero } from "@/components/home/hero";
import { Gallery } from "@/components/home/gallery";
import { AIChatbot } from '@/components/chatbot/AIChatbot';
import type { Metadata } from 'next'
import { OrganizationSchema, LocalBusinessSchema } from '@/components/seo/StructuredData'

export const metadata: Metadata = {
  title: "EG Driving School - Professional Driving Lessons & Training",
  description: "Learn to drive with EG Driving School - Australia's premier driving instruction service. Professional instructors, flexible scheduling, comprehensive packages, and excellent pass rates. Book your driving lessons today!",
  keywords: [
    "driving lessons",
    "driving school",
    "learn to drive",
    "driving instructor",
    "professional driving lessons",
    "driving test preparation",
    "beginner driving lessons"
  ],
  openGraph: {
    title: "EG Driving School - Professional Driving Lessons & Training",
    description: "Learn to drive with EG Driving School - Australia's premier driving instruction service.",
    type: "website",
    images: [
      {
        url: "/og-image-home.jpg",
        width: 1200,
        height: 630,
        alt: "EG Driving School Homepage",
      },
    ],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL,

  },
}

export default function Home() {
  return (
    <>
      <OrganizationSchema />
      <LocalBusinessSchema />
      <div className="min-h-screen">
        <main>
          <Hero />
          <Features />
          <PackagesPreview />
          <Gallery />
          <InstructorBio />
          <ServiceAreaMap />
          <ReviewsPreview />
          <BookingCTA />
        </main>
        {/* AI Chatbot */}
        <AIChatbot delayMs={5000} />
      </div>
    </>
    );
}
