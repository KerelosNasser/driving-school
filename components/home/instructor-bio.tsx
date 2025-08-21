'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CheckCircle, Star, Award, Edit } from 'lucide-react';
import { useEditMode } from '@/contexts/editModeContext';
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
                        <div className="relative aspect-w-1 aspect-h-1 rounded-lg overflow-hidden shadow-xl">
                            <EditableImage
                                src={imageUrl || ''}
                                alt={imageAlt || ''}
                                contentKey="instructor_image"
                                fill
                                className="transform transition-transform duration-500 hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                        </div>
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
                        <EditableText
                            contentKey="instructor_name"
                            tagName="h3"
                            className="text-2xl sm:text-3xl font-bold text-gray-900"
                            placeholder="Enter instructor name..."
                        >
                            {name}
                        </EditableText>

                        <EditableText
                            contentKey="instructor_bio_p1"
                            tagName="p"
                            className="text-base sm:text-lg text-gray-600"
                            placeholder="Enter first paragraph of bio..."
                            multiline={true}
                            maxLength={300}
                        >
                            {bioP1}
                        </EditableText>

                        <EditableText
                            contentKey="instructor_bio_p2"
                            tagName="p"
                            className="text-base sm:text-lg text-gray-600"
                            placeholder="Enter second paragraph of bio..."
                            multiline={true}
                            maxLength={300}
                        >
                            {bioP2}
                        </EditableText>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                                <Star className="h-8 w-8 text-yellow-500 mr-3" />
                                <div>
                                    <div className="flex items-center">
                                        <EditableText
                                            contentKey="instructor_rating"
                                            tagName="span"
                                            className="font-bold text-gray-900"
                                            placeholder="4.9"
                                        >
                                            {rating}
                                        </EditableText>
                                        <span className="font-bold text-gray-900 ml-1">Star Rating</span>
                                    </div>
                                    <p className="text-sm text-gray-500">Based on student reviews</p>
                                </div>
                            </div>

                            <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                                <Award className="h-8 w-8 text-yellow-500 mr-3" />
                                <div>
                                    <EditableText
                                        contentKey="instructor_cert_title"
                                        tagName="p"
                                        className="font-bold text-gray-900"
                                        placeholder="Enter certification title..."
                                    >
                                        {certTitle}
                                    </EditableText>
                                    <EditableText
                                        contentKey="instructor_cert_subtitle"
                                        tagName="p"
                                        className="text-sm text-gray-500"
                                        placeholder="Enter certification subtitle..."
                                    >
                                        {certSubtitle}
                                    </EditableText>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3">What to Expect:</h4>
                            <ul className="space-y-2">
                                {displayFeatures.map((feature, index) => (
                                    <li key={index} className="flex items-center">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                        <EditableText
                                            contentKey={`instructor_feature_${index + 1}`}
                                            tagName="span"
                                            className="text-gray-700"
                                            placeholder={`Enter feature ${index + 1}...`}
                                        >
                                            {feature}
                                        </EditableText>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}