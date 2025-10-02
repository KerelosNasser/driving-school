// app/about/page.tsx
'use client';

import { ServiceAreaMap } from '@/components/home/service-area-map';
import { Award, Star, Calendar, MapPin, Car, Shield, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEditMode } from '@/contexts/editModeContext';
import { EditableText } from '@/components/ui/editable-text';
import { EditableImage } from '@/components/ui/editable-image';
import { motion } from 'framer-motion';
import { EditableWrapper } from '@/components/drag-drop/EditableWrapper';
import { DropZoneArea } from '@/components/drag-drop/DropZoneArea';

// Dynamic map import

export default function AboutPage() {
  const { isEditMode } = useEditMode();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-400 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <EditableWrapper componentId="about-hero" componentType="hero">
        <section className="relative bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/95 via-teal-800/90 to-blue-900/95" />
          <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-full px-4 py-2 text-sm font-semibold mb-6"
            >
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>15+ Years Experience</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
                About Our
              </span>
              <br />
              <span className="text-emerald-400">Driving School</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Meet our professional instructor who is passionate about teaching safe, confident drivers across Australia
            </p>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-4 py-6 max-w-2xl mx-auto mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400">500+</div>
                <div className="text-xs sm:text-sm text-blue-200">Students Taught</div>
              </div>
              <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-400">95%</div>
                <div className="text-xs sm:text-sm text-blue-200">Pass Rate</div>
              </div>
              <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="text-2xl sm:text-3xl font-bold text-orange-400">4.9★</div>
                <div className="text-xs sm:text-sm text-blue-200">Rating</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        </section>
      </EditableWrapper>
      
      <DropZoneArea id="after-about-hero" className="my-6" placeholder="Add components after hero" />

      <main className="max-w-7xl mx-auto py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Instructor Bio Section */}
        <EditableWrapper componentId="instructor-bio" componentType="instructor">
          <section className="mb-20">
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
                  src="/images/instructor.png"
                  alt="Driving Instructor"
                  contentKey="about_instructor_image"
                  width={300}
                  height={600}
                  className="w-full aspect-square object-contain"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 via-transparent to-transparent" />

                {/* Enhanced badges */}
                <div className="absolute top-6 right-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-2xl">
                  <Award className="h-5 w-5" />
                  <div>
                    <EditableText
                      contentKey="about_instructor_experience"
                      tagName="div"
                      className="text-sm font-bold"
                      placeholder="15+ Years"
                    >
                      15+ Years
                    </EditableText>
                    <div className="text-xs opacity-90">Experience</div>
                  </div>
                </div>

                <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-2xl">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <div>
                    <EditableText
                      contentKey="about_instructor_rating"
                      tagName="div"
                      className="text-sm font-bold text-gray-900"
                      placeholder="4.9"
                    >
                      4.9
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
                      contentKey="about_instructor_cert_title"
                      tagName="div"
                      className="font-bold text-gray-900"
                      placeholder="Certified Instructor"
                    >
                      Certified Instructor
                    </EditableText>
                    <EditableText
                      contentKey="about_instructor_cert_subtitle"
                      tagName="div"
                      className="text-sm text-gray-600"
                      placeholder="Queensland Transport Approved"
                    >
                      Queensland Transport Approved
                    </EditableText>
                  </div>
                </div>
              </motion.div>

              {/* Experience Badge */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute -top-6 -right-6 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-6 shadow-2xl text-white"
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-10 w-10" />
                  <div>
                    <div className="text-3xl font-bold">500+</div>
                    <div className="text-sm opacity-90">Students Taught</div>
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
                <span>Professional • Certified • Experienced</span>
              </motion.div>

              <div>
                <EditableText
                  contentKey="about_instructor_section_title"
                  tagName="h2"
                  className="text-4xl sm:text-5xl font-bold leading-tight mb-4 bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-700 bg-clip-text text-transparent"
                  placeholder="Meet Your Instructor"
                >
                  Meet Your Instructor
                </EditableText>
                <EditableText
                  contentKey="about_instructor_name"
                  tagName="div"
                  className="text-2xl text-emerald-600 font-bold"
                  placeholder="Instructor Name"
                >
                  Emael Ghobrial
                </EditableText>
                <p className="text-lg text-gray-600 mt-2">Professional Driving Instructor</p>
              </div>

              <EditableText
                contentKey="about_instructor_bio_p1"
                tagName="p"
                className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0"
                placeholder="Enter instructor bio..."
                multiline={true}
              >
Hi, my name is Emeal and I have been a driving instructor since 2017 and am qualified to instruct in both manual and automatic vehicles. The primary focus during our driving lessons is to ensure you learn all the necessary technical and safety skills required to be a responsible driver. I like to take a methodical approach,  structuring the lesson in a step-by-step way to ensure that the information flows and makes sense. My experience tells me that it is the best way to get results. I am punctual, patient and friendly. I enjoy meeting new people and can help in a range of situations from brand new learners, to international licence conversions as well as refresher lessons.                </EditableText>

              {/* Features - Enhanced Design */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4"
              >
                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 hover:bg-white/90 transition-all duration-200">
                  <div className="bg-emerald-500/20 rounded-xl p-2">
                    <Car className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">Dual-control vehicle</span>
                </div>
                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 hover:bg-white/90 transition-all duration-200">
                  <div className="bg-emerald-500/20 rounded-xl p-2">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">All Brisbane suburbs</span>
                </div>
                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 hover:bg-white/90 transition-all duration-200">
                  <div className="bg-emerald-500/20 rounded-xl p-2">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">Flexible scheduling</span>
                </div>
                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 hover:bg-white/90 transition-all duration-200">
                  <div className="bg-emerald-500/20 rounded-xl p-2">
                    <Award className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">Keys2drive accredited</span>
                </div>
              </motion.div>

              {/* CTA - Enhanced Design */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-8 py-4 text-lg shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 rounded-xl"
                  asChild
                >
                  <Link href="/packages">
                    <Calendar className="h-5 w-5 mr-2" />
                    Book a Lesson
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-emerald-400 text-emerald-600 bg-white/80 hover:bg-emerald-400 hover:text-white font-bold px-8 py-4 text-lg backdrop-blur-sm transition-all duration-300 rounded-xl"
                  asChild
                >
                  <Link href="/contact">Contact Me</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
          </section>
        </EditableWrapper>
        
        <DropZoneArea id="after-instructor-bio" className="my-8" placeholder="Add components after instructor bio" />

        {/* Service Areas Section */}
        <EditableWrapper componentId="service-areas" componentType="map">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-16 items-start">
          <div className="space-y-8">
            <div>
              {isEditMode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Admin:</strong> Click on map or "Add Location" to add new service areas with smart geocoding.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

                <div className="h-[800px] w-full rounded-xl shadow-2xl overflow-hidden">
                  {/* Pass the filtered areas so the map reflects the sidebar list; hide the map's internal search to avoid duplication */}
                  <ServiceAreaMap showSearch={true} />
                </div>
          </div>


          </div>
        </EditableWrapper>
        
        <DropZoneArea id="about-page-bottom" className="my-8" placeholder="Add components at bottom of page" />
      </main>
    </div>
  );
}
