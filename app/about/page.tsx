'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Award, Star, Calendar, Clock, MapPin, Car, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEditMode } from '@/contexts/editModeContext';
import { EditableText } from '@/components/ui/editable-text';
import { EditableImage } from '@/components/ui/editable-image';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Dynamically import the editable map component with SSR disabled
const EditableLeafletServiceAreaMap = dynamic(
    () => import('@/components/maps/EditableLeafletServiceAreaMap'),
    {
      ssr: false,
      loading: () => <div className="w-full h-[500px] bg-gray-200 animate-pulse rounded-xl flex items-center justify-center"><p>Loading map...</p></div>,
    }
);

interface ServiceArea {
  id: number;
  name: string;
  lat: number;
  lng: number;
  popular: boolean;
}

interface LocationEditModalProps {
  isOpen: boolean;
  location: ServiceArea | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (location: ServiceArea) => void;
  onDelete?: (id: number) => void;
}

const LocationEditModal = ({ isOpen, location, isNew, onClose, onSave, onDelete }: LocationEditModalProps) => {
  const [editedLocation, setEditedLocation] = useState<ServiceArea | null>(null);

  useEffect(() => {
    setEditedLocation(location);
  }, [location]);

  const handleSave = () => {
    if (editedLocation && editedLocation.name.trim() && editedLocation.lat && editedLocation.lng) {
      onSave(editedLocation);
      onClose();
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handleDelete = () => {
    if (editedLocation && onDelete) {
      onDelete(editedLocation.id);
      onClose();
    }
  };

  if (!isOpen || !editedLocation) return null;

  return (
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
          onClick={onClose}
      >
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold mb-4">
            {isNew ? 'Add New Location' : 'Edit Location'}
          </h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="location-name">Location Name *</Label>
              <Input
                  id="location-name"
                  value={editedLocation.name}
                  onChange={(e) => setEditedLocation(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Enter location name"
                  className="mt-1"
                  required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location-lat">Latitude *</Label>
                <Input
                    id="location-lat"
                    type="number"
                    step="any"
                    value={editedLocation.lat}
                    onChange={(e) => setEditedLocation(prev => prev ? { ...prev, lat: parseFloat(e.target.value) || 0 } : null)}
                    placeholder="-27.4698"
                    className="mt-1"
                    required
                />
              </div>

              <div>
                <Label htmlFor="location-lng">Longitude *</Label>
                <Input
                    id="location-lng"
                    type="number"
                    step="any"
                    value={editedLocation.lng}
                    onChange={(e) => setEditedLocation(prev => prev ? { ...prev, lng: parseFloat(e.target.value) || 0 } : null)}
                    placeholder="153.0251"
                    className="mt-1"
                    required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                  type="checkbox"
                  id="location-popular"
                  checked={editedLocation.popular}
                  onChange={(e) => setEditedLocation(prev => prev ? { ...prev, popular: e.target.checked } : null)}
                  className="rounded"
              />
              <Label htmlFor="location-popular">Mark as popular area</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="flex-1">
                {isNew ? 'Add Location' : 'Save Changes'}
              </Button>
              {!isNew && onDelete && (
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
  );
};

export default function EditableAboutPage() {
  const { isEditMode, saveContent } = useEditMode();
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ServiceArea | null>(null);
  const [isNewLocation, setIsNewLocation] = useState(false);

  // Load service areas from content or use default
  useEffect(() => {
    const loadServiceAreas = async () => {
      try {
        const response = await fetch('/api/admin/content?page=about&key=service_areas');
        if (response.ok) {
          const { data } = await response.json();
          if (data && data.length > 0 && data[0].content_json) {
            setServiceAreas(data[0].content_json);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to load service areas:', error);
      }

      // Default service areas
      const defaultAreas = [
        { id: 1, name: 'Brisbane CBD', lat: -27.4698, lng: 153.0251, popular: true },
        { id: 2, name: 'South Brisbane', lat: -27.4809, lng: 153.0176, popular: true },
        { id: 3, name: 'West End', lat: -27.4818, lng: 153.0120, popular: false },
        { id: 4, name: 'Fortitude Valley', lat: -27.4570, lng: 153.0344, popular: true },
        { id: 5, name: 'New Farm', lat: -27.4677, lng: 153.0520, popular: false },
      ];
      setServiceAreas(defaultAreas);
    };

    loadServiceAreas();
  }, []);

  const handleAreaSelect = (areaId: number) => {
    setSelectedAreaId(areaId);
  };

  const saveServiceAreas = async (updatedAreas: ServiceArea[]) => {
    try {
      await saveContent('service_areas', updatedAreas, 'json', 'about');
      return true;
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
      updatedAreas = [...serviceAreas, updatedLocation];
    } else {
      updatedAreas = serviceAreas.map(area =>
          area.id === updatedLocation.id ? updatedLocation : area
      );
    }

    setServiceAreas(updatedAreas);
    const success = await saveServiceAreas(updatedAreas);
    if (success) {
      toast.success(isNewLocation ? 'Location added successfully' : 'Location updated successfully');
    }
  };

  const handleDeleteLocation = async (id: number) => {
    const updatedAreas = serviceAreas.filter(area => area.id !== id);
    setServiceAreas(updatedAreas);

    // Adjust selected area if necessary
    if (selectedAreaId === id) {
      setSelectedAreaId(null);
    }

    const success = await saveServiceAreas(updatedAreas);
    if (success) {
      toast.success('Location deleted successfully');
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!isEditMode) return;

    const newLocation: ServiceArea = {
      id: Date.now(),
      name: `New Location ${serviceAreas.length + 1}`,
      lat,
      lng,
      popular: false,
    };
    setEditingLocation(newLocation);
    setIsNewLocation(true);
    setShowLocationModal(true);
  };

  return (
      <div className="bg-gray-50 min-h-screen">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
            <EditableText
                contentKey="about_page_title"
                tagName="h1"
                className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl md:text-6xl"
                placeholder="Enter page title..."
            >
              About Our Driving School
            </EditableText>
            <EditableText
                contentKey="about_page_subtitle"
                tagName="p"
                className="mt-6 max-w-2xl mx-auto text-xl text-gray-500"
                placeholder="Enter page subtitle..."
                multiline={true}
            >
              Your success on the road is our top priority. We are committed to providing the highest quality driving education in Brisbane.
            </EditableText>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          {/* Instructor Bio Section */}
          <section className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Instructor Image */}
              <div className="relative">
                <div className="relative rounded-lg overflow-hidden shadow-xl">
                  <EditableImage
                      src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80"
                      alt="Michael Thompson - Driving Instructor"
                      contentKey="about_instructor_image"
                      width={600}
                      height={600}
                      className="w-full h-auto object-cover rounded-lg"
                      priority
                  />

                  {/* Experience badge */}
                  <div className="absolute top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <EditableText
                        contentKey="about_instructor_experience"
                        tagName="span"
                        className="font-medium"
                        placeholder="15+ Years Experience"
                    >
                      15+ Years Experience
                    </EditableText>
                  </div>
                </div>

                {/* Certification badges */}
                <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
                  <Award className="h-6 w-6 text-yellow-600" />
                  <div>
                    <EditableText
                        contentKey="about_instructor_cert_title"
                        tagName="div"
                        className="font-semibold text-gray-900"
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

                {/* Rating badge */}
                <div className="absolute -top-6 -left-6 bg-white p-3 rounded-full shadow-lg flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <EditableText
                      contentKey="about_instructor_rating"
                      tagName="span"
                      className="font-bold text-gray-900"
                      placeholder="4.9"
                  >
                    4.9
                  </EditableText>
                </div>
              </div>

              {/* Instructor Bio */}
              <div className="space-y-6">
                <div>
                  <EditableText
                      contentKey="about_instructor_section_title"
                      tagName="h2"
                      className="text-3xl font-bold text-gray-900"
                      placeholder="Meet Your Instructor"
                  >
                    Meet Your Instructor
                  </EditableText>
                  <EditableText
                      contentKey="about_instructor_name"
                      tagName="div"
                      className="mt-2 text-xl text-yellow-600 font-medium"
                      placeholder="Michael Thompson"
                  >
                    Michael Thompson
                  </EditableText>
                </div>

                <EditableText
                    contentKey="about_instructor_bio_p1"
                    tagName="p"
                    className="text-gray-700"
                    placeholder="Enter first paragraph of instructor bio..."
                    multiline={true}
                >
                  Hi there! I'm Michael, a passionate driving instructor with over 15 years
                  of experience teaching people of all ages how to drive safely and confidently
                  on Brisbane roads.
                </EditableText>

                <EditableText
                    contentKey="about_instructor_bio_p2"
                    tagName="p"
                    className="text-gray-700"
                    placeholder="Enter second paragraph of instructor bio..."
                    multiline={true}
                >
                  I believe in creating a relaxed, supportive learning environment where you can
                  develop your skills at your own pace. My teaching approach is patient,
                  thorough, and tailored to your individual needs.
                </EditableText>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <Car className="h-5 w-5 text-yellow-600" />
                    </div>
                    <EditableText
                        contentKey="about_instructor_feature_1"
                        tagName="div"
                        className="text-gray-700"
                        placeholder="Dual-control vehicle"
                    >
                      Dual-control vehicle
                    </EditableText>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <MapPin className="h-5 w-5 text-yellow-600" />
                    </div>
                    <EditableText
                        contentKey="about_instructor_feature_2"
                        tagName="div"
                        className="text-gray-700"
                        placeholder="All Brisbane suburbs"
                    >
                      All Brisbane suburbs
                    </EditableText>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <Calendar className="h-5 w-5 text-yellow-600" />
                    </div>
                    <EditableText
                        contentKey="about_instructor_feature_3"
                        tagName="div"
                        className="text-gray-700"
                        placeholder="Flexible scheduling"
                    >
                      Flexible scheduling
                    </EditableText>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <Award className="h-5 w-5 text-yellow-600" />
                    </div>
                    <EditableText
                        contentKey="about_instructor_feature_4"
                        tagName="div"
                        className="text-gray-700"
                        placeholder="Keys2drive accredited"
                    >
                      Keys2drive accredited
                    </EditableText>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild>
                    <Link href="/book">
                      Book a Lesson
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/contact">
                      Contact Me
                    </Link>
                  </Button>
                </div>
              </div>
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
                    placeholder="Enter service areas description..."
                    multiline={true}
                >
                  We cover a wide range of suburbs across Brisbane. Select an area on the map
                  to see more details or choose from the list below.
                </EditableText>
                {isEditMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4"
                    >
                      <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                        💡 <strong>Admin tip:</strong> Click anywhere on the map to add a new location, or use the "Add Location" button below.
                      </p>
                    </motion.div>
                )}
              </div>
              <div className="h-[500px] w-full rounded-xl border-4 border-white shadow-2xl overflow-hidden">
                <EditableLeafletServiceAreaMap
                    selectedAreaId={selectedAreaId}
                    onAreaSelect={handleAreaSelect}
                    serviceAreas={serviceAreas}
                    onMapClick={handleMapClick}
                    isEditMode={isEditMode}
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl space-y-6 sticky top-8">
              <div className="flex items-center justify-between">
                <EditableText
                    contentKey="about_locations_list_title"
                    tagName="h3"
                    className="text-2xl font-bold text-gray-900"
                    placeholder="Locations List"
                >
                  Locations List
                </EditableText>
                {isEditMode && (
                    <Button onClick={handleAddLocation} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                )}
              </div>

              <div className="max-h-[420px] overflow-y-auto pr-4 -mr-4 space-y-2">
                {serviceAreas.map((area) => (
                    <div
                        key={area.id}
                        className={`relative group w-full text-left p-4 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${selectedAreaId === area.id ? 'bg-yellow-400 text-white shadow-lg' : 'bg-gray-100 hover:bg-yellow-100'}`}
                    >
                      <button
                          onClick={() => handleAreaSelect(area.id)}
                          className="w-full text-left"
                      >
                        <p className="font-semibold text-lg">{area.name}</p>
                        {area.popular && (
                            <span className="text-xs font-bold uppercase tracking-wider text-yellow-800 bg-yellow-200 px-2 py-1 rounded-full">
                        ⭐ Popular
                      </span>
                        )}
                      </button>

                      {isEditMode && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditLocation(area)}
                                className="h-8 w-8 p-0 bg-white/80 hover:bg-white text-gray-700"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteLocation(area.id)}
                                className="h-8 w-8 p-0 bg-red-100 hover:bg-red-200 text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                      )}
                    </div>
                ))}
              </div>

              {/* Location Management Panel */}
              <AnimatePresence>
                {isEditMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="mt-6"
                    >
                      <Card className="p-4 bg-blue-50 border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">Location Management</h4>
                        <p className="text-sm text-blue-700 mb-3">
                          Manage your service areas by clicking on existing locations to edit them,
                          or click anywhere on the map to add a new location.
                        </p>
                        <div className="flex gap-2">
                          <Button onClick={handleAddLocation} size="sm" className="bg-green-600 hover:bg-green-700">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Location
                          </Button>
                          <span className="text-xs text-blue-600 flex items-center">
                        Total: {serviceAreas.length} locations
                      </span>
                        </div>
                      </Card>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Location Edit Modal */}
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