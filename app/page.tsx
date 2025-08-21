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
import { getPageContent, getContentValue, getContentJson, getContentFile } from '@/lib/content';

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

    // Extract content with fallbacks
    const heroTitle = getContentValue(content, 'hero_title', 'Learn to Drive with Confidence');
    const heroSubtitle = getContentValue(content, 'hero_subtitle', 'Professional driving lessons with experienced instructors at EG Driving School - tailored to your needs.');

    const heroFeatures = [
        { text: getContentValue(content, 'hero_feature_1', 'Licensed Instructors') },
        { text: getContentValue(content, 'hero_feature_2', 'Modern Vehicles') },
        { text: getContentValue(content, 'hero_feature_3', 'Flexible Scheduling') },
        { text: getContentValue(content, 'hero_feature_4', 'Personalized Pace') },
    ];

    const featuresTitle = getContentValue(content, 'features_title', 'Why Choose EG Driving School?');
    const featuresSubtitle = getContentValue(content, 'features_subtitle', "We're committed to providing the best driving education experience.");

    const features = Array.from({ length: 8 }, (_, i) => ({
        title: getContentValue(content, `features_item_${i + 1}_title`),
        description: getContentValue(content, `features_item_${i + 1}_description`)
    })).filter(feature => feature.title && feature.description);

    const galleryTitle = getContentValue(content, 'gallery_title', 'Our Learning Experience');
    const gallerySubtitle = getContentValue(content, 'gallery_subtitle', 'See our students and instructors in action.');
    const galleryImages = getContentJson(content, 'gallery_images', []);

    const instructorTitle = getContentValue(content, 'instructor_title', 'Meet Your Instructor');
    const instructorName = getContentValue(content, 'instructor_name', 'Michael Thompson');
    const instructorBioP1 = getContentValue(content, 'instructor_bio_p1', "Hi there! I'm Michael, a passionate driving instructor with over 15 years of experience teaching people of all ages how to drive safely and confidently on Brisbane roads.");
    const instructorBioP2 = getContentValue(content, 'instructor_bio_p2', "I believe in creating a relaxed, supportive learning environment where you can develop your skills at your own pace. My teaching approach is patient, thorough, and tailored to your individual needs.");

    const instructorImage = getContentFile(content, 'instructor_image', 'https://img1.wsimg.com/isteam/ip/14e0fa52-5b69-4038-a086-1acfa9374b62/20230411_110458.jpg/:/cr=t:0%25,l:0%25,w:100%25,h:100%25/rs=w:1200,h:1600,cg:true');

    const instructorExperience = getContentValue(content, 'instructor_experience', '15+ Years Experience');
    const instructorRating = getContentValue(content, 'instructor_rating', '4.9');
    const instructorCertTitle = getContentValue(content, 'instructor_cert_title', 'Certified Instructor');
    const instructorCertSubtitle = getContentValue(content, 'instructor_cert_subtitle', 'Queensland Transport Approved');

    const instructorFeatures = [
        getContentValue(content, 'instructor_feature_1', 'Dual-control vehicle'),
        getContentValue(content, 'instructor_feature_2', 'All Brisbane suburbs'),
        getContentValue(content, 'instructor_feature_3', 'Flexible scheduling'),
        getContentValue(content, 'instructor_feature_4', 'Keys2drive accredited'),
    ];

    const ctaTitle = getContentValue(content, 'cta_title', 'Ready to Start Your Driving Journey?');
    const ctaSubtitle = getContentValue(content, 'cta_subtitle', "Book your first lesson today and take the first step towards getting your license with Brisbane's most trusted driving instructor.");
    const ctaPhoneText = getContentValue(content, 'cta_phone_text', 'Call us at');
    const ctaPhoneNumber = getContentValue(content, 'cta_phone_number', '0400 000 000');
    const ctaEmailText = getContentValue(content, 'cta_email_text', 'Email us at');
    const ctaEmailAddress = getContentValue(content, 'cta_email_address', 'info@brisbanedrivingschool.com');

    return (
        <>
            <OrganizationSchema />
            <LocalBusinessSchema />

            <div className="min-h-screen">
                <main>
                    <Hero
                        title={heroTitle}
                        subtitle={heroSubtitle}
                        features={heroFeatures}
                    />

                    <Features
                        title={featuresTitle}
                        subtitle={featuresSubtitle}
                        features={features}
                    />

                    <PackagesPreview />

                    <Gallery
                        title={galleryTitle}
                        subtitle={gallerySubtitle}
                        images={galleryImages}
                    />

                    <InstructorBio
                        title={instructorTitle}
                        name={instructorName}
                        bioP1={instructorBioP1}
                        bioP2={instructorBioP2}
                        imageUrl={instructorImage.url}
                        imageAlt={instructorImage.alt}
                        experience={instructorExperience}
                        rating={instructorRating}
                        certTitle={instructorCertTitle}
                        certSubtitle={instructorCertSubtitle}
                        features={instructorFeatures}
                    />

                    <ServiceAreaMap />

                    <ReviewsPreview />

                    <BookingCTA
                        title={ctaTitle}
                        subtitle={ctaSubtitle}
                        phoneText={ctaPhoneText}
                        phoneNumber={ctaPhoneNumber}
                        emailText={ctaEmailText}
                        emailAddress={ctaEmailAddress}
                    />
                </main>

                {/* AI Chatbot */}
                <AIChatbot delayMs={5000} />
            </div>
        </>
    );
}