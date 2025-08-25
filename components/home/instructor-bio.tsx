'use client';
import { motion } from 'framer-motion';
import { CheckCircle, Star, Award } from 'lucide-react';
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
                <div className="text-center mb-12 sm:mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <EditableText
                            contentKey="instructor_title"
                            tagName="h2"
                            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900"
                            placeholder="Enter instructor section title..."
                        >
                            {title}
                        </EditableText>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Instructor Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="relative"
                    >
                        <div className="relative rounded-lg overflow-hidden shadow-xl bg-gray-100">
                            <EditableImage
                                src={displayImageUrl}
                                alt={displayImageAlt}
                                contentKey="instructor_image"
                                width={600}
                                height={600}
                                className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105 rounded-lg"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>

                            {/* Experience Badge */}
                            <div className="absolute top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-1">
                                <Star className="h-4 w-4" />
                                <EditableText
                                    contentKey="instructor_experience"
                                    tagName="span"
                                    className="font-medium"
                                    placeholder="15+ Years Experience"
                                >
                                    {experience}
                                </EditableText>
                            </div>

                            {/* Rating Badge */}
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg flex items-center space-x-2">
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                <div className="flex items-center">
                                    <EditableText
                                        contentKey="instructor_rating"
                                        tagName="span"
                                        className="font-bold text-gray-900"
                                        placeholder="4.9"
                                    >
                                        {rating}
                                    </EditableText>
                                    <span className="text-sm text-gray-600 ml-1">★</span>
                                </div>
                            </div>

                            {/* Certification Badge */}
                            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg flex items-center space-x-3">
                                <Award className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                                <div>
                                    <EditableText
                                        contentKey="instructor_cert_title"
                                        tagName="div"
                                        className="font-semibold text-gray-900 text-sm"
                                        placeholder="Certified Instructor"
                                    >
                                        {certTitle}
                                    </EditableText>
                                    <EditableText
                                        contentKey="instructor_cert_subtitle"
                                        tagName="div"
                                        className="text-xs text-gray-600"
                                        placeholder="Queensland Transport Approved"
                                    >
                                        {certSubtitle}
                                    </EditableText>
                                </div>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-yellow-300 rounded-full opacity-50 blur-2xl -z-10"></div>
                        <div className="absolute -top-4 -left-4 w-32 h-32 bg-yellow-300 rounded-lg opacity-50 blur-2xl -z-10 transform rotate-45"></div>
                    </motion.div>

                    {/* Instructor Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="space-y-6"
                    >
                        <div>
                            <EditableText
                                contentKey="instructor_name"
                                tagName="h3"
                                className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
                                placeholder="Enter instructor name..."
                            >
                                {name}
                            </EditableText>
                            <p className="text-lg text-yellow-600 font-medium">Professional Driving Instructor</p>
                        </div>

                        <div className="space-y-4">
                            <EditableText
                                contentKey="instructor_bio_p1"
                                tagName="p"
                                className="text-base sm:text-lg text-gray-600 leading-relaxed"
                                placeholder="Enter first paragraph of bio..."
                                multiline={true}
                                maxLength={300}
                            >
                                {bioP1}
                            </EditableText>

                            <EditableText
                                contentKey="instructor_bio_p2"
                                tagName="p"
                                className="text-base sm:text-lg text-gray-600 leading-relaxed"
                                placeholder="Enter second paragraph of bio..."
                                multiline={true}
                                maxLength={300}
                            >
                                {bioP2}
                            </EditableText>
                        </div>

                        {/* Key Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            <div className="flex items-center bg-white p-4 rounded-lg shadow-sm border">
                                <div className="bg-yellow-100 p-3 rounded-full mr-4">
                                    <Star className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div>
                                    <div className="flex items-center">
                                        <EditableText
                                            contentKey="instructor_rating"
                                            tagName="span"
                                            className="font-bold text-xl text-gray-900"
                                            placeholder="4.9"
                                        >
                                            {rating}
                                        </EditableText>
                                        <span className="font-bold text-xl text-gray-900 ml-1"> Rating</span>
                                    </div>
                                    <p className="text-sm text-gray-500">Based on student reviews</p>
                                </div>
                            </div>

                            <div className="flex items-center bg-white p-4 rounded-lg shadow-sm border">
                                <div className="bg-yellow-100 p-3 rounded-full mr-4">
                                    <Award className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div>
                                    <EditableText
                                        contentKey="instructor_cert_title"
                                        tagName="p"
                                        className="font-bold text-gray-900"
                                        placeholder="Certified Instructor"
                                    >
                                        {certTitle}
                                    </EditableText>
                                    <EditableText
                                        contentKey="instructor_cert_subtitle"
                                        tagName="p"
                                        className="text-sm text-gray-500"
                                        placeholder="Queensland Transport Approved"
                                    >
                                        {certSubtitle}
                                    </EditableText>
                                </div>
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="pt-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">What to Expect:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {displayFeatures.map((feature, index) => (
                                    <div key={index} className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                        <EditableText
                                            contentKey={`instructor_feature_${index + 1}`}
                                            tagName="span"
                                            className="text-gray-700 font-medium"
                                            placeholder={`Enter feature ${index + 1}...`}
                                        >
                                            {feature}
                                        </EditableText>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Call to Action */}
                        <div className="pt-6 flex flex-col sm:flex-row gap-4">
                            <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex-1 sm:flex-none">
                                Book a Lesson
                            </button>
                            <button className="border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex-1 sm:flex-none">
                                Contact Me
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}