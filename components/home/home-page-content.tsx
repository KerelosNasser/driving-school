"use client";

import { Features } from "@/components/home/features";
import { PackagesPreview } from "@/components/home/packages-preview";
import { InstructorBio } from "@/components/home/instructor-bio";
import { ServiceAreaMap } from "@/components/home/service-area-map";
import { ReviewsPreview } from "@/components/home/reviews-preview";
import { BookingCTA } from "@/components/home/booking-cta";
import { Hero } from "@/components/home/hero";
import { Gallery } from "@/components/home/gallery";
import { AIChatbot } from '@/components/chatbot/AIChatbot';
import { EditButton } from '@/components/ui/edit-button';
import { OrganizationSchema, LocalBusinessSchema } from '@/components/seo/StructuredData';

export function HomePageContent({ content }: { content: any }) {
  // Function to update content
  const updateContent = async (key: string, value: string) => {
    try {
      // This would be called from client components in a real implementation
      console.log(`Updating content for ${key}: ${value}`);
      // In a real implementation, we would call the content service here
      // await contentService.updateContent(key, value);
    } catch (error) {
      console.error('Failed to update content:', error);
    }
  };

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
            onTitleChange={(value) => updateContent('features_title', value)}
            onSubtitleChange={(value) => updateContent('features_subtitle', value)}
            onFeatureTitleChange={(index, value) => updateContent(`features_item_${index + 1}_title`, value)}
            onFeatureDescriptionChange={(index, value) => updateContent(`features_item_${index + 1}_description`, value)}
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
        
        {/* Edit Mode Button */}
        <EditButton />
      </div>
    </>
  );
}