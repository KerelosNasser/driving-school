import { Features } from "@/components/home/features";
import { PackagesPreview } from "@/components/home/packages-preview";
import { InstructorBio } from "@/components/home/instructor-bio";
import { ServiceAreaMap } from "@/components/home/service-area-map";
import { ReviewsPreview } from "@/components/home/reviews-preview";
import { Hero } from "@/components/home/hero";
import { Gallery } from "@/components/home/gallery";
import { AIChatbot } from '@/components/chatbot/AIChatbot';
import type { Metadata } from 'next'

import {
    getPageContent,
    getContentValue,
    getContentJson,
    getImageData,
    validateGalleryImages
} from '@/lib/content';

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

    const featuresTitle = getContentValue(content, 'features_title', 'Why Choose EG Driving School?');
    const featuresSubtitle = getContentValue(content, 'features_subtitle', "We're committed to providing the best driving education experience.");

    const features = Array.from({ length: 8 }, (_, i) => ({
        title: getContentValue(content, `features_item_${i + 1}_title`),
        description: getContentValue(content, `features_item_${i + 1}_description`)
    })).filter(feature => feature.title && feature.description);

    // Gallery content with improved handling
    const galleryTitle = getContentValue(content, 'gallery_title', 'Our Learning Experience');
    const gallerySubtitle = getContentValue(content, 'gallery_subtitle', 'See our students and instructors in action.');
    const rawGalleryImages = getContentJson(content, 'gallery_images', []);
    const galleryImages = validateGalleryImages(rawGalleryImages);

    // Instructor content with improved image handling
    const instructorTitle = getContentValue(content, 'instructor_title', 'Meet Your Instructor');
    const instructorName = getContentValue(content, 'instructor_name', 'Michael Thompson');
    const instructorBioP1 = getContentValue(content, 'instructor_bio_p1', "Hi there! I'm Michael, a passionate driving instructor with over 15 years of experience teaching people of all ages how to drive safely and confidently on Brisbane roads.");
    const instructorBioP2 = getContentValue(content, 'instructor_bio_p2', "I believe in creating a relaxed, supportive learning environment where you can develop your skills at your own pace. My teaching approach is patient, thorough, and tailored to your individual needs.");

    // Get instructor image data with fallback
    const instructorImageData = getImageData(
        content,
        'instructor_image',
        'https://img1.wsimg.com/isteam/ip/14e0fa52-5b69-4038-a086-1acfa9374b62/20230411_110458.jpg/:/cr=t:0%25,l:0%25,w:100%25,h:100%25/rs=w:1200,h:1600,cg:true',
        'Professional driving instructor portrait'
    );

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

    return (
        <>

            <div className="min-h-screen">
                <main>
                    <Hero
                        content={content}
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
                        imageUrl={instructorImageData.url}
                        imageAlt={instructorImageData.alt}
                        experience={instructorExperience}
                        rating={instructorRating}
                        certTitle={instructorCertTitle}
                        certSubtitle={instructorCertSubtitle}
                        features={instructorFeatures}
                    />

                    <ServiceAreaMap />

                    <ReviewsPreview />

                </main>

                {/* AI Chatbot */}
                <AIChatbot delayMs={5000} />
            </div>
        </>
    );
}