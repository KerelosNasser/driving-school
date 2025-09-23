// app/about/page.tsx
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ServiceAreaMap } from '@/components/home/service-area-map';
import { Award, Star, Calendar, MapPin, Car, Plus, Edit, Trash2, Search, Shield, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEditMode } from '@/contexts/editModeContext';
import { EditableText } from '@/components/ui/editable-text';
import { EditableImage } from '@/components/ui/editable-image';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { LocationEditModal } from '@/components/admin/locationEditModel';

// Dynamic map import
const EditableLeafletServiceAreaMap = dynamic(
  () => import('@/components/maps/LeafletServiceAreaMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-gray-200 animate-pulse rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface ServiceArea {
  id: number;
  name: string;
  lat: number;
  lng: number;
  popular: boolean;
}

export default function AboutPage() {
  const { isEditMode, saveContent } = useEditMode();
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ServiceArea | null>(null);
  const [isNewLocation, setIsNewLocation] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load service areas
  useEffect(() => {
    const loadServiceAreas = async () => {
      try {
        const response = await fetch('/api/admin/content?page=home&key=service_areas');
        if (response.ok) {
          const { data } = await response.json();
          if (data?.length > 0 && data[0].content_json) {
            setServiceAreas(data[0].content_json);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to load service areas:', error);
      }

      // Default areas
      const defaultAreas: ServiceArea[] = [
        { id: 1, name: 'Brisbane CBD', lat: -27.4698, lng: 153.0251, popular: true },
        { id: 2, name: 'South Brisbane', lat: -27.4809, lng: 153.0176, popular: true },
        { id: 3, name: 'West End', lat: -27.4818, lng: 153.0120, popular: false },
        { id: 4, name: 'Fortitude Valley', lat: -27.4570, lng: 153.0344, popular: true },
        { id: 5, name: 'New Farm', lat: -27.4677, lng: 153.0520, popular: false },
      ];
      setServiceAreas(defaultAreas);
      setIsLoading(false);
    };

    loadServiceAreas();
  }, []);

  const saveServiceAreas = async (updatedAreas: ServiceArea[]) => {
    try {
      const success = await saveContent('service_areas', updatedAreas, 'json', 'about');
      return success;
    } catch (error) {
      console.error('Failed to save service areas:', error);
      toast.error('Failed to save service areas');
      return false;
    }
  };

  const handleAddLocation = () => {
    const newLocation: ServiceArea = {
      id: Date.now(),
      name: '',
      lat: -27.4698,
      lng: 153.0251,
      popular: false,
    };
    setEditingLocation(newLocation);
    setIsNewLocation(true);
    setShowLocationModal(true);
  };

  const handleEditLocation = (location: ServiceArea) => {
    setEditingLocation({ ...location });
    setIsNewLocation(false);
    setShowLocationModal(true);
  };

  const handleSaveLocation = async (updatedLocation: ServiceArea) => {
    let updatedAreas: ServiceArea[];

    if (isNewLocation) {
      // Check for duplicate names
      const existingNames = serviceAreas.map(area => area.name.toLowerCase());
      if (existingNames.includes(updatedLocation.name.toLowerCase())) {
        toast.error('A location with this name already exists');
        return;
      }
      updatedAreas = [...serviceAreas, updatedLocation];
    } else {
      updatedAreas = serviceAreas.map(area =>
        area.id === updatedLocation.id ? updatedLocation : area
      );
    }

    setServiceAreas(updatedAreas);
    const success = await saveServiceAreas(updatedAreas);
    if (success) {
      toast.success(
        isNewLocation
          ? `Added "${updatedLocation.name}"`
          : `Updated "${updatedLocation.name}"`
      );
    }
  };

  const handleDeleteLocation = async (id: number) => {
    const locationToDelete = serviceAreas.find(area => area.id === id);
    if (!locationToDelete) return;

    if (locationToDelete.popular) {
      const confirmed = window.confirm(
        `Delete "${locationToDelete.name}"? This is a popular area.`
      );
      if (!confirmed) return;
    }

    const updatedAreas = serviceAreas.filter(area => area.id !== id);
    setServiceAreas(updatedAreas);

    if (selectedAreaId === id) {
      setSelectedAreaId(updatedAreas.length > 0 ? updatedAreas[0]?.id ?? null : null);
    }

    const success = await saveServiceAreas(updatedAreas);
    if (success) {
      toast.success(`Deleted "${locationToDelete.name}"`);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!isEditMode) return;

    const newLocation: ServiceArea = {
      id: Date.now(),
      name: '',
      lat,
      lng,
      popular: false,
    };
    setEditingLocation(newLocation);
    setIsNewLocation(true);
    setShowLocationModal(true);
  };

  // Filter locations
  const filteredAreas = serviceAreas.filter(area =>
    area.name.toLowerCase().includes(searchFilter.toLowerCase())
  );
  const popularAreas = filteredAreas.filter(area => area.popular);
  const regularAreas = filteredAreas.filter(area => !area.popular);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-400 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
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

      <main className="max-w-7xl mx-auto py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Instructor Bio Section */}
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

        {/* Service Areas Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <div>
              <EditableText
                contentKey="about_service_areas_title"
                tagName="h2"
                className="text-3xl font-bold text-gray-900"
                placeholder="Our Service Areas"
              >
                Our Service Areas
              </EditableText>
              <EditableText
                contentKey="about_service_areas_description"
                tagName="p"
                className="mt-4 text-lg text-gray-600"
                placeholder="Enter description..."
                multiline={true}
              >
                We cover a wide range of suburbs across Brisbane. Select an area below or on the map.
              </EditableText>
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

                <div className="h-[500px] w-full rounded-xl shadow-2xl overflow-hidden">
                  {/* Pass the filtered areas so the map reflects the sidebar list; hide the map's internal search to avoid duplication */}
                  <ServiceAreaMap initialServiceAreas={filteredAreas} showSearch={false} />
                </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl space-y-6 sticky top-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Service Locations</h3>
              {isEditMode && (
                <Button
                  onClick={handleAddLocation}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {/* Search */}
            {serviceAreas.length > 5 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="max-h-[420px] overflow-y-auto space-y-3">
              {/* Popular Areas */}
              {popularAreas.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    Popular Areas ({popularAreas.length})
                  </h4>
                  <div className="space-y-2">
                    {popularAreas.map((area) => (
                      <LocationItem
                        key={`popular-${area.id}`}
                        area={area}
                        selectedAreaId={selectedAreaId}
                        onAreaSelect={setSelectedAreaId}
                        onEdit={handleEditLocation}
                        onDelete={handleDeleteLocation}
                        isEditMode={isEditMode}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Areas */}
              {regularAreas.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Other Areas ({regularAreas.length})
                  </h4>
                  <div className="space-y-2">
                    {regularAreas.map((area) => (
                      <LocationItem
                        key={`regular-${area.id}`}
                        area={area}
                        selectedAreaId={selectedAreaId}
                        onAreaSelect={setSelectedAreaId}
                        onEdit={handleEditLocation}
                        onDelete={handleDeleteLocation}
                        isEditMode={isEditMode}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredAreas.length === 0 && serviceAreas.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No locations match your search</p>
                  <button
                    onClick={() => setSearchFilter('')}
                    className="text-blue-600 hover:text-blue-700 text-sm mt-1"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>

            {/* Admin Panel */}
            <AnimatePresence>
              {isEditMode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <Card className="p-4 bg-green-50 border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Location Management</h4>
                    <p className="text-sm text-green-700 mb-3">
                      Add locations with intelligent geocoding and Brisbane-focused search.
                    </p>
                    <div className="flex items-center justify-between">
                      <Button
                        onClick={handleAddLocation}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Location
                      </Button>
                      <span className="text-xs text-green-600">
                        {serviceAreas.length} location{serviceAreas.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Location Modal */}
      <LocationEditModal
        isOpen={showLocationModal}
        location={editingLocation}
        isNew={isNewLocation}
        onClose={() => {
          setShowLocationModal(false);
          setEditingLocation(null);
          setIsNewLocation(false);
        }}
        onSave={handleSaveLocation}
        onDelete={handleDeleteLocation}
      />
    </div>
  );
}

// Location Item Component
interface LocationItemProps {
  area: ServiceArea;
  selectedAreaId: number | null;
  onAreaSelect: (id: number) => void;
  onEdit: (area: ServiceArea) => void;
  onDelete: (id: number) => void;
  isEditMode: boolean;
}

const LocationItem: React.FC<LocationItemProps> = ({
  area,
  selectedAreaId,
  onAreaSelect,
  onEdit,
  onDelete,
  isEditMode,
}) => {
  const isSelected = selectedAreaId === area.id;

  return (
    <div
      className={`relative group w-full text-left p-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${
        isSelected
          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg'
          : 'bg-gray-100 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-yellow-100'
        }`}
    >
      <button
        onClick={() => onAreaSelect(area.id)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>
              {area.name}
            </p>
            <p className={`text-sm ${isSelected ? 'text-yellow-100' : 'text-gray-600'}`}>
              {area.lat.toFixed(4)}, {area.lng.toFixed(4)}
            </p>
          </div>
          {area.popular && (
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${isSelected
              ? 'text-yellow-800 bg-yellow-200'
              : 'text-yellow-700 bg-yellow-200'
              }`}>
              ⭐ Popular
            </span>
          )}
        </div>
      </button>

      {isEditMode && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(area);
            }}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 shadow-sm"
            title="Edit location"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(area.id);
            }}
            className="h-8 w-8 p-0 bg-red-100/90 hover:bg-red-200 text-red-600 shadow-sm"
            title="Delete location"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};