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
import { getPageContent } from '@/lib/content';

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
};

export default async function Home() {
  const content = await getPageContent('home');

  return (
    <>
      <OrganizationSchema />
      <LocalBusinessSchema />
      
      <div className="min-h-screen">
        <main>
          <Hero 
            title={content.hero_title?.content_value}
            subtitle={content.hero_subtitle?.content_value}
            features={[
              { text: content.hero_feature_1?.content_value },
              { text: content.hero_feature_2?.content_value },
              { text: content.hero_feature_3?.content_value },
              { text: content.hero_feature_4?.content_value },
            ]}
          />
          
          <Features 
            title={content.features_title?.content_value}
            subtitle={content.features_subtitle?.content_value}
            features={[
              { 
                title: content.features_item_1_title?.content_value, 
                description: content.features_item_1_description?.content_value 
              },
              { 
                title: content.features_item_2_title?.content_value, 
                description: content.features_item_2_description?.content_value 
              },
              { 
                title: content.features_item_3_title?.content_value, 
                description: content.features_item_3_description?.content_value 
              },
              { 
                title: content.features_item_4_title?.content_value, 
                description: content.features_item_4_description?.content_value 
              },
              { 
                title: content.features_item_5_title?.content_value, 
                description: content.features_item_5_description?.content_value 
              },
              { 
                title: content.features_item_6_title?.content_value, 
                description: content.features_item_6_description?.content_value 
              },
              { 
                title: content.features_item_7_title?.content_value, 
                description: content.features_item_7_description?.content_value 
              },
              { 
                title: content.features_item_8_title?.content_value, 
                description: content.features_item_8_description?.content_value 
              },
            ]}
          />
          
          <PackagesPreview />
          
          <Gallery 
            title={content.gallery_title?.content_value}
            subtitle={content.gallery_subtitle?.content_value}
            images={content.gallery_images?.content_json}
          />
          
          <InstructorBio 
            title={content.instructor_title?.content_value}
            name={content.instructor_name?.content_value}
            bioP1={content.instructor_bio_p1?.content_value}
            bioP2={content.instructor_bio_p2?.content_value}
            imageUrl={content.instructor_image?.file_url}
            imageAlt={content.instructor_image?.alt_text}
            experience={content.instructor_experience?.content_value}
            rating={content.instructor_rating?.content_value}
            certTitle={content.instructor_cert_title?.content_value}
            certSubtitle={content.instructor_cert_subtitle?.content_value}
            features={[
              content.instructor_feature_1?.content_value,
              content.instructor_feature_2?.content_value,
              content.instructor_feature_3?.content_value,
              content.instructor_feature_4?.content_value,
            ]}
          />
          
          <ServiceAreaMap />
          
          <ReviewsPreview />
          
          <BookingCTA
            title={content.cta_title?.content_value}
            subtitle={content.cta_subtitle?.content_value}
            phoneText={content.cta_phone_text?.content_value}
            phoneNumber={content.cta_phone_number?.content_value}
            emailText={content.cta_email_text?.content_value}
            emailAddress={content.cta_email_address?.content_value}
          />
        </main>
        
        {/* AI Chatbot */}
        <AIChatbot delayMs={5000} />
      </div>
    </>
  );
}
