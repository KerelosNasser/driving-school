'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, Star, Award, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditableText } from '@/components/ui/editable-text';
import { EditableImage } from '@/components/ui/editable-image';
import { useGlobalContent } from '@/contexts/globalContentContext';
import { EditableWrapper } from '@/components/drag-drop/EditableWrapper';
import { DropZoneArea } from '@/components/drag-drop/DropZoneArea';

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
name,
bioP1,
bioP2,
imageUrl = 'https://img1.wsimg.com/isteam/ip/14e0fa52-5b69-4038-a086-1acfa9374b62/20230411_110458.jpg/:/cr=t:0%25,l:0%25,w:100%25,h:100%25/rs=w:1200,h:1600,cg:true',
imageAlt = 'A friendly and professional driving instructor',
experience = '15+ Years Experience',
rating = '4.9',
certTitle = 'Certified Instructor',
certSubtitle = 'Queensland Transport Approved',
features = [],
}: InstructorBioProps) {

    const { content } = useGlobalContent();

    // fallback to global content if props not provided
    name = name || content.instructor_name;
    bioP1 = bioP1 || content.instructor_bio_short;
    bioP2 = bioP2 || '';

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
        <EditableWrapper componentId="instructor-section" componentType="instructor">
            <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-emerald-50 to-teal-50/30 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-400 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12 sm:mb-16"
                >
                    <EditableText
                        contentKey="instructor_title"
                        tagName="h2"
                        className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-700 bg-clip-text text-transparent"
                        placeholder="Enter instructor section title..."
                    >
                        {title}
                    </EditableText>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                    {/* Instructor Image - Enhanced Design */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative order-1 lg:order-1"
                    >
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white">
                            <EditableImage
                                src={displayImageUrl}
                                alt={displayImageAlt}
                                contentKey="instructor_image"
                                width={500}
                                height={500}
                                className="w-full aspect-square object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 via-transparent to-transparent" />
                            
                            {/* Enhanced badges */}
                            <div className="absolute top-6 right-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-2xl">
                                <Award className="h-5 w-5" />
                                <div>
                                    <EditableText
                                        contentKey="instructor_experience"
                                        tagName="div"
                                        className="text-sm font-bold"
                                        placeholder="15+ Years"
                                    >
                                        {experience}
                                    </EditableText>
                                    <div className="text-xs opacity-90">Experience</div>
                                </div>
                            </div>

                            <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-2xl">
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                <div>
                                    <EditableText
                                        contentKey="instructor_rating"
                                        tagName="div"
                                        className="text-sm font-bold text-gray-900"
                                        placeholder="4.9"
                                    >
                                        {rating}
                                    </EditableText>
                                    <div className="text-xs text-gray-600">Rating</div>
                                </div>
                            </div>
                        </div>

                        {/* Floating certification badge */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-2xl max-w-sm border-l-4 border-emerald-500"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="bg-emerald-100 rounded-full p-3">
                                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <EditableText
                                        contentKey="instructor_cert_title"
                                        tagName="div"
                                        className="font-bold text-gray-900"
                                        placeholder="Certified Instructor"
                                    >
                                        {certTitle}
                                    </EditableText>
                                    <EditableText
                                        contentKey="instructor_cert_subtitle"
                                        tagName="div"
                                        className="text-sm text-gray-600"
                                        placeholder="Queensland Transport Approved"
                                    >
                                        {certSubtitle}
                                    </EditableText>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Instructor Details - Enhanced Design */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="space-y-6 text-center lg:text-left order-2 lg:order-2"
                    >
                        {/* Trust Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-full px-4 py-2 text-sm font-semibold"
                        >
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                            <span>Certified Professional • Fully Insured</span>
                        </motion.div>

                        <div className="text-center lg:text-left">
                            <EditableText
                                contentKey="instructor_name"
                                tagName="h3"
                                className="text-4xl sm:text-5xl font-bold leading-tight mb-4 bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-700 bg-clip-text text-transparent"
                                placeholder="Enter instructor name..."
                            >
                                {name}
                            </EditableText>
                            <p className="text-lg text-emerald-600 font-medium">Professional Driving Instructor</p>
                        </div>

                        <div className="space-y-4">
                            <EditableText
                                contentKey="instructor_bio_p1"
                                tagName="p"
                                className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0"
                                placeholder="Enter first paragraph of bio..."
                                multiline={true}
                                maxLength={200}
                            >
                                {bioP1}
                            </EditableText>
                            <EditableText
                                contentKey="instructor_bio_p2"
                                tagName="p"
                                className="text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0"
                                placeholder="Enter second paragraph of bio..."
                                multiline={true}
                                maxLength={200}
                            >
                                {bioP2}
                            </EditableText>
                        </div>

                        {/* Key Stats - Enhanced Design */}
                        <motion.div
                            className="grid grid-cols-3 gap-4 py-6"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
                                <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-1">
                                    <EditableText
                                        contentKey="instructor_rating"
                                        tagName="span"
                                        placeholder="4.9"
                                    >
                                        {rating}
                                    </EditableText>★
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600">Student Rating</div>
                            </div>

                            <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
                                <div className="text-2xl sm:text-3xl font-bold text-teal-600 mb-1">15+</div>
                                <div className="text-xs sm:text-sm text-gray-600">Years Experience</div>
                            </div>

                            <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
                                <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">500+</div>
                                <div className="text-xs sm:text-sm text-gray-600">Students Passed</div>
                            </div>
                        </motion.div>

                        {/* Features - Enhanced Design */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="space-y-4"
                        >
                            <h4 className="font-semibold text-gray-800 text-lg">What You Get:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {displayFeatures.slice(0, 4).map((feature, index) => (
                                    <div key={index} className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 hover:bg-white/90 transition-all duration-200">
                                        <div className="bg-emerald-500/20 rounded-xl p-2">
                                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <EditableText
                                            contentKey={`instructor_feature_${index + 1}`}
                                            tagName="span"
                                            className="text-gray-700 text-sm font-medium"
                                            placeholder={`Enter feature ${index + 1}...`}
                                        >
                                            {feature}
                                        </EditableText>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* CTA - Enhanced Design */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                        >
                            <Button 
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-8 py-4 text-lg shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 rounded-xl"
                                asChild
                            >
                                <Link href="/service-center">
                                    <Calendar className="h-5 w-5 mr-2" />
                                    Book a Lesson
                                </Link>
                            </Button>
                            <Button 
                                variant="outline" 
                                className="border-2 border-emerald-400 text-emerald-600 bg-white/80 hover:bg-emerald-400 hover:text-white font-bold px-8 py-4 text-lg backdrop-blur-sm transition-all duration-300 rounded-xl"
                                asChild
                            >
                                <Link href="/contact">Contact Me</Link>
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
            </section>
            
            <DropZoneArea id="after-instructor" className="my-4" placeholder="Add components after instructor" />
        </EditableWrapper>
    );
}