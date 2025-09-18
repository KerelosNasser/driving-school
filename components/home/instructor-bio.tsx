'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, Star, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditableText } from '@/components/ui/editable-text';
import { EditableImage } from '@/components/ui/editable-image';

interface InstructorBioProps {
    title?: string;
    name?: string;
    bioP1?: string;
    bioP2?: string;
    imageUrl?: string | null;
    imageAlt?: string | null;
    experience?: string;
    rating?: string;
    certTitle?: string;
    certSubtitle?: string;
    features?: (string | null | undefined)[];
}

export function InstructorBio({
title = 'Meet Your Instructor',
name = 'Michael Thompson',
bioP1 = "Hi there! I'm Michael, a passionate driving instructor with over 15 years of experience teaching people of all ages how to drive safely and confidently on Brisbane roads.",
bioP2 = "I believe in creating a relaxed, supportive learning environment where you can develop your skills at your own pace. My teaching approach is patient, thorough, and tailored to your individual needs.",
imageUrl = 'https://img1.wsimg.com/isteam/ip/14e0fa52-5b69-4038-a086-1acfa9374b62/20230411_110458.jpg/:/cr=t:0%25,l:0%25,w:100%25,h:100%25/rs=w:1200,h:1600,cg:true',
imageAlt = 'A friendly and professional driving instructor',
experience = '15+ Years Experience',
rating = '4.9',
certTitle = 'Certified Instructor',
certSubtitle = 'Queensland Transport Approved',
features = [],
}: InstructorBioProps) {

    const defaultFeatures = [
        'Dual-control vehicle',
        'All Brisbane suburbs',
        'Flexible scheduling',
        'Keys2drive accredited',
    ];

    const displayFeatures = features.map((feature, index) => feature || defaultFeatures[index]);

    // Ensure we have a valid image URL, fallback to placeholder
    const fallbackImageUrl = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80';
    const displayImageUrl = imageUrl && imageUrl.trim() !== '' ? imageUrl : fallbackImageUrl;
    const displayImageAlt = imageAlt || 'Professional driving instructor portrait';

    return (
        <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <EditableText
                        contentKey="instructor_title"
                        tagName="h2"
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
                        placeholder="Enter instructor section title..."
                    >
                        {title}
                    </EditableText>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Instructor Image - Mobile Optimized */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-100">
                            <EditableImage
                                src={displayImageUrl}
                                alt={displayImageAlt}
                                contentKey="instructor_image"
                                width={500}
                                height={500}
                                className="w-full aspect-square object-cover"
                                priority
                            />
                            
                            {/* Simplified badges for mobile */}
                            <div className="absolute top-4 right-4 bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                <EditableText
                                    contentKey="instructor_experience"
                                    tagName="span"
                                    placeholder="15+ Years"
                                >
                                    {experience}
                                </EditableText>
                            </div>

                            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <EditableText
                                    contentKey="instructor_rating"
                                    tagName="span"
                                    className="font-bold text-gray-900 text-sm"
                                    placeholder="4.9"
                                >
                                    {rating}
                                </EditableText>
                            </div>
                        </div>
                    </motion.div>

                    {/* Instructor Details - Mobile Optimized */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="text-center lg:text-left">
                            <EditableText
                                contentKey="instructor_name"
                                tagName="h3"
                                className="text-2xl font-bold text-gray-900 mb-2"
                                placeholder="Enter instructor name..."
                            >
                                {name}
                            </EditableText>
                            <p className="text-yellow-600 font-medium">Professional Driving Instructor</p>
                        </div>

                        <div className="space-y-4">
                            <EditableText
                                contentKey="instructor_bio_p1"
                                tagName="p"
                                className="text-gray-600 leading-relaxed"
                                placeholder="Enter first paragraph of bio..."
                                multiline={true}
                                maxLength={200}
                            >
                                {bioP1}
                            </EditableText>
                        </div>

                        {/* Key Stats - Mobile Friendly */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                                <div className="text-2xl font-bold text-yellow-600 mb-1">
                                    <EditableText
                                        contentKey="instructor_rating"
                                        tagName="span"
                                        placeholder="4.9"
                                    >
                                        {rating}
                                    </EditableText>★
                                </div>
                                <p className="text-sm text-gray-600">Student Rating</p>
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                                <div className="text-2xl font-bold text-yellow-600 mb-1">15+</div>
                                <p className="text-sm text-gray-600">Years Experience</p>
                            </div>
                        </div>

                        {/* Features - Simplified */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-gray-800">What You Get:</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {displayFeatures.slice(0, 4).map((feature, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        <EditableText
                                            contentKey={`instructor_feature_${index + 1}`}
                                            tagName="span"
                                            className="text-gray-700 text-sm"
                                            placeholder={`Enter feature ${index + 1}...`}
                                        >
                                            {feature}
                                        </EditableText>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA - Mobile Optimized */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button 
                                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold flex-1"
                                asChild
                            >
                                <Link href="/service-center">Book a Lesson</Link>
                            </Button>
                            <Button 
                                variant="outline" 
                                className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 font-semibold flex-1"
                                asChild
                            >
                                <Link href="/contact">Contact Me</Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}