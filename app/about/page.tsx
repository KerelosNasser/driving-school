'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { 
  Award, 
  Calendar, 
  Car, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  ArrowRight,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';

// Service areas in Brisbane
const serviceAreas = [
  { id: 1, name: 'Brisbane CBD', lat: -27.4698, lng: 153.0251, popular: true },
  { id: 2, name: 'South Brisbane', lat: -27.4809, lng: 153.0176, popular: true },
  { id: 3, name: 'West End', lat: -27.4818, lng: 153.0120, popular: false },
  { id: 4, name: 'Fortitude Valley', lat: -27.4570, lng: 153.0344, popular: true },
  { id: 5, name: 'New Farm', lat: -27.4677, lng: 153.0520, popular: false },
  { id: 6, name: 'Paddington', lat: -27.4610, lng: 153.0024, popular: false },
  { id: 7, name: 'Milton', lat: -27.4709, lng: 152.9999, popular: false },
  { id: 8, name: 'Toowong', lat: -27.4845, lng: 152.9928, popular: true },
  { id: 9, name: 'St Lucia', lat: -27.4975, lng: 153.0095, popular: false },
  { id: 10, name: 'Indooroopilly', lat: -27.5016, lng: 152.9719, popular: true },
  { id: 11, name: 'Kelvin Grove', lat: -27.4476, lng: 153.0153, popular: false },
  { id: 12, name: 'Chermside', lat: -27.3861, lng: 153.0344, popular: true },
  { id: 13, name: 'Carindale', lat: -27.5047, lng: 153.1000, popular: false },
  { id: 14, name: 'Mount Gravatt', lat: -27.5397, lng: 153.0785, popular: false },
  { id: 15, name: 'Sunnybank', lat: -27.5777, lng: 153.0571, popular: true },
  { id: 16, name: 'Wynnum', lat: -27.4418, lng: 153.1735, popular: false },
  { id: 17, name: 'Sandgate', lat: -27.3200, lng: 153.0700, popular: false },
  { id: 18, name: 'The Gap', lat: -27.4447, lng: 152.9500, popular: false },
];

export default function AboutPage() {
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  
  // Brisbane center coordinates
  const brisbaneCenter = { lat: -27.4698, lng: 153.0251 };

  return (
    <div className="min-h-screen bg-background">
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-500 text-white overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div 
              className="absolute inset-0" 
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                backgroundSize: '30px 30px',
              }} 
            />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center lg:text-left"
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  About Brisbane <span className="text-yellow-200">Driving School</span>
                </h1>
                <p className="text-xl text-yellow-100 max-w-2xl mx-auto lg:mx-0">
                  Meet our professional instructor and discover the areas we serve across Brisbane
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    className="bg-white text-yellow-700 hover:bg-yellow-50 font-bold px-8 py-6 rounded-xl"
                    asChild
                  >
                    <Link href="/book">
                      Book a Lesson
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white bg-white/10 hover:bg-white/20 font-bold px-8 py-6 rounded-xl backdrop-blur-sm"
                    asChild
                  >
                    <Link href="#contact">
                      Contact Us
                    </Link>
                  </Button>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="hidden lg:block"
              >
                <div className="relative">
                  <div className="absolute -top-6 -right-6 h-32 w-32 bg-yellow-400 rounded-full opacity-20 blur-3xl"></div>
                  <div className="absolute -bottom-6 -left-6 h-40 w-40 bg-yellow-800 rounded-full opacity-20 blur-3xl"></div>
                  
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <div className="flex items-center space-x-4">
                      <div className="bg-yellow-500/20 p-3 rounded-full">
                        <Car className="h-8 w-8 text-yellow-300" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">15+</div>
                        <div className="text-yellow-100">Years Experience</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="bg-yellow-500/20 p-3 rounded-full">
                        <Award className="h-8 w-8 text-yellow-300" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">500+</div>
                        <div className="text-yellow-100">Students Taught</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="bg-yellow-500/20 p-3 rounded-full">
                        <CheckCircle className="h-8 w-8 text-yellow-300" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">98%</div>
                        <div className="text-yellow-100">Pass Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Instructor Bio Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Instructor Image */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="relative rounded-lg overflow-hidden shadow-xl">
                  {/* Placeholder for actual image - in production, use next/image */}
                  <img 
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80" 
                    alt="Michael Thompson - Driving Instructor" 
                    className="w-full h-auto object-cover rounded-lg"
                  />
                  
                  {/* Experience badge */}
                  <div className="absolute top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">15+ Years Experience</span>
                  </div>
                </div>
                
                {/* Certification badges */}
                <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
                  <Award className="h-6 w-6 text-yellow-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Certified Instructor</div>
                    <div className="text-sm text-gray-600">Queensland Transport Approved</div>
                  </div>
                </div>
              </motion.div>
              
              {/* Instructor Bio */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Meet Your Instructor</h2>
                  <div className="mt-2 text-xl text-yellow-600 font-medium">Michael Thompson</div>
                </div>
                
                <p className="text-gray-700">
                  Hi there! I&apos;m Michael, a passionate driving instructor with over 15 years of experience teaching people of all ages how to drive safely and confidently on Brisbane roads.
                </p>
                
                <p className="text-gray-700">
                  I founded Brisbane Driving School with a simple mission: to provide high-quality, personalized driving instruction that focuses on building both skills and confidence. I believe that learning to drive should be an enjoyable experience, not a stressful one.
                </p>
                
                <p className="text-gray-700">
                  My teaching approach is patient, thorough, and tailored to your individual needs. Whether you&apos;re a complete beginner, preparing for your driving test, or just need to brush up on your skills, I&apos;m here to help you achieve your goals.
                </p>
                
                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild>
                    <Link href="/book">
                      Book a Lesson
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/contact">
                      Contact Me
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Qualifications Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900">
                Qualifications & Experience
              </h2>
              <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                Professional credentials that ensure you receive the highest quality instruction
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-md"
              >
                <div className="rounded-full bg-yellow-100 w-12 h-12 flex items-center justify-center mb-4">
                  <GraduationCap className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Certified Instructor</h3>
                <p className="text-gray-700">
                  Licensed by Queensland Transport with all required certifications for professional driving instruction.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-md"
              >
                <div className="rounded-full bg-yellow-100 w-12 h-12 flex items-center justify-center mb-4">
                  <Briefcase className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">15+ Years Experience</h3>
                <p className="text-gray-700">
                  Over 15 years of professional driving instruction experience with students of all ages and skill levels.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-md"
              >
                <div className="rounded-full bg-yellow-100 w-12 h-12 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Keys2drive Accredited</h3>
                <p className="text-gray-700">
                  Accredited instructor for the Keys2drive program, offering free lessons for learners and their supervisors.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Service Areas Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900">
                Areas We Cover
              </h2>
              <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                We provide driving lessons throughout Brisbane and surrounding suburbs
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Service areas list */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-gray-50 p-6 rounded-xl shadow-md"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 text-yellow-600 mr-2" />
                  Covered Areas
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {serviceAreas.map((area) => (
                    <div 
                      key={area.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedArea === area.id 
                          ? 'bg-yellow-100 border-l-4 border-yellow-600' 
                          : 'bg-white hover:bg-gray-100 border-l-4 border-transparent'
                      }`}
                      onClick={() => setSelectedArea(area.id)}
                    >
                      <div className="font-medium text-gray-900">{area.name}</div>
                      {area.popular && (
                        <div className="text-sm text-yellow-600 mt-1">Popular area</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-sm text-gray-600">
                  <p>Don&apos;t see your suburb? We likely cover it too! Contact us to confirm.</p>
                </div>
              </motion.div>

              {/* Google Map */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-2 rounded-xl overflow-hidden shadow-lg h-[500px]"
              >
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                  <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                    <Map
                      defaultCenter={brisbaneCenter}
                      defaultZoom={12}
                      mapId="driving-school-map"
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                      className="w-full h-full"
                    >
                      {/* Main office marker */}
                      <AdvancedMarker 
                        position={brisbaneCenter}
                        title="Brisbane Driving School Office"
                      >
                        <div className="bg-yellow-600 text-white px-3 py-2 rounded-lg shadow-md text-sm font-medium">
                          Main Office
                        </div>
                      </AdvancedMarker>
                      
                      {/* Service area markers */}
                      {serviceAreas.map((area) => (
                        <AdvancedMarker
                          key={area.id}
                          position={{ lat: area.lat, lng: area.lng }}
                          onClick={() => setSelectedArea(area.id)}
                        >
                          <Pin
                            background={selectedArea === area.id ? '#ca8a04' : (area.popular ? '#eab308' : '#94A3B8')}
                            borderColor="#FFFFFF"
                            glyphColor="#FFFFFF"
                            scale={selectedArea === area.id ? 1.2 : 1}
                          />
                          
                          {selectedArea === area.id && (
                            <InfoWindow
                              position={{ lat: area.lat, lng: area.lng }}
                              onCloseClick={() => setSelectedArea(null)}
                            >
                              <div className="p-2">
                                <h3 className="font-medium text-gray-900">{area.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  Driving lessons available in this area.
                                </p>
                              </div>
                            </InfoWindow>
                          )}
                        </AdvancedMarker>
                      ))}
                    </Map>
                  </APIProvider>
                )}
                
                {/* Fallback if map can't load */}
                {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center p-6">
                      <MapPin className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900">Map Loading...</h3>
                      <p className="mt-2 text-gray-600">
                        We provide driving lessons throughout Brisbane and surrounding suburbs.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900">
                Why Choose Brisbane Driving School?
              </h2>
              <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                What sets us apart from other driving schools in Brisbane
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-100 p-2 rounded-full shrink-0 mt-1">
                    <CheckCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Personalized Instruction</h3>
                    <p className="text-gray-700">
                      Every student is different, and I tailor my teaching approach to match your learning style, pace, and specific needs.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-100 p-2 rounded-full shrink-0 mt-1">
                    <CheckCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Patience and Support</h3>
                    <p className="text-gray-700">
                      Learning to drive can be nerve-wracking. I create a calm, supportive environment where you can build confidence at your own pace.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-100 p-2 rounded-full shrink-0 mt-1">
                    <CheckCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Flexible Scheduling</h3>
                    <p className="text-gray-700">
                      I offer lessons 7 days a week, including evenings, to accommodate your busy schedule. Online booking makes it easy to find a time that works for you.
                    </p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-100 p-2 rounded-full shrink-0 mt-1">
                    <CheckCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Modern, Dual-Control Vehicle</h3>
                    <p className="text-gray-700">
                      Learn in a well-maintained, late-model car equipped with dual controls for safety and peace of mind.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-100 p-2 rounded-full shrink-0 mt-1">
                    <CheckCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Test Route Familiarity</h3>
                    <p className="text-gray-700">
                      I&apos;m familiar with all the local test routes and can help you practice the specific skills and maneuvers that examiners look for.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-100 p-2 rounded-full shrink-0 mt-1">
                    <CheckCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Competitive Rates</h3>
                    <p className="text-gray-700">
                      I offer excellent value with competitive pricing and package deals that make learning to drive affordable without compromising on quality.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-yellow-600 rounded-xl text-white overflow-hidden shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-8 md:p-12">
                  <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
                  <p className="text-yellow-100 mb-6">
                    Have questions or ready to book your first lesson? Contact me today!
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 p-2 rounded-full">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">Phone</div>
                        <a href="tel:+61400000000" className="text-yellow-100 hover:text-white">
                          0400 000 000
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 p-2 rounded-full">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">Email</div>
                        <a href="mailto:info@brisbanedrivingschool.com" className="text-yellow-100 hover:text-white">
                          info@brisbanedrivingschool.com
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-white/20 p-2 rounded-full">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">Location</div>
                        <div className="text-yellow-100">
                          Brisbane, Queensland, Australia
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <Button 
                      className="bg-white text-yellow-700 hover:bg-yellow-50"
                      size="lg"
                      asChild
                    >
                      <Link href="/contact">
                        Contact Me
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
                
                <div className="hidden md:block relative">
                  <img 
                    src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                    alt="Contact us" 
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/80 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Your Driving Journey?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Book your first lesson today and take the first step towards getting your license.
            </p>
            <Button size="lg" asChild>
              <Link href="/book">
                Book Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}