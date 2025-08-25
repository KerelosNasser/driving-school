'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useEditMode } from '@/contexts/editModeContext';
import { EditableText } from '@/components/ui/editable-text';
import { LocationEditModal } from '@/components/admin/locationEditModel';
import { toast } from 'sonner';
import { serviceAreas as defaultServiceAreas } from '@/lib/data';

// Dynamic map import with proper SSR handling
const LeafletServiceAreaMap = dynamic(
  () => import('@/components/maps/LeafletServiceAreaMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center rounded-lg">
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

export function ServiceAreaMap() {
  const { isEditMode, saveContent } = useEditMode();
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>(defaultServiceAreas);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ServiceArea | null>(null);
  const [isNewLocation, setIsNewLocation] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Load service areas from API or use defaults
  useEffect(() => {
    const loadServiceAreas = async () => {
      try {
        const response = await fetch('/api/admin/content?page=home&key=service_areas');
        if (response.ok) {
          const { data } = await response.json();
          if (data?.length > 0 && data[0].content_json && Array.isArray(data[0].content_json)) {
            setServiceAreas(data[0].content_json);
          }
        }
      } catch (error) {
        console.error('Failed to load service areas:', error);
        setError('Failed to load service areas');
      } finally {
        setIsLoading(false);
      }
    };

    loadServiceAreas();
  }, []);

  const saveServiceAreas = async (updatedAreas: ServiceArea[]) => {
    try {
      const success = await saveContent('service_areas', updatedAreas, 'json', 'home');
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

    if (selectedArea === id) {
      setSelectedArea(updatedAreas.length > 0 ? updatedAreas[0].id : null);
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

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <EditableText
              contentKey="service_areas_title"
              tagName="h2"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900"
              placeholder="Service Areas"
            >
              Service Areas
            </EditableText>
            <EditableText
              contentKey="service_areas_subtitle"
              tagName="p"
              className="mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4"
              placeholder="Enter description..."
              multiline={true}
            >
              We provide driving lessons throughout our service areas and surrounding suburbs
            </EditableText>
            {isEditMode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Admin:</strong> Click on map or "Add Location" to manage service areas.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Service areas list */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gray-50 p-4 sm:p-6 rounded-xl shadow-md order-2 lg:order-1"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 text-yellow-600 mr-2" />
                Covered Areas
              </h3>
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
            {filteredAreas.length > 5 && (
              <div className="relative mb-4">
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
            
            <div className="space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-3 bg-gray-200 animate-pulse rounded-lg">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2 mt-2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                filteredAreas.map((area) => (
                  <LocationItem
                    key={area.id}
                    area={area}
                    selectedAreaId={selectedArea}
                    onAreaSelect={setSelectedArea}
                    onEdit={handleEditLocation}
                    onDelete={handleDeleteLocation}
                    isEditMode={isEditMode}
                  />
                ))
              )}
            </div>
            
            <div className="mt-6 text-xs sm:text-sm text-gray-600">
              <p>Don&apos;t see your suburb? We likely cover it too! Contact us to confirm.</p>
            </div>
            
            {/* Admin Panel */}
            <AnimatePresence>
              {isEditMode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-4"
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
          </motion.div>

          {/* Leaflet Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 rounded-xl overflow-hidden shadow-lg h-[300px] sm:h-[400px] lg:h-[500px] order-1 lg:order-2"
          >
            {error ? (
              <div className="w-full h-full bg-red-50 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-2">🗺️</div>
                  <h3 className="font-semibold text-red-900">Map Error</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <LeafletServiceAreaMap 
                selectedAreaId={selectedArea}
                onAreaSelect={setSelectedArea}
                serviceAreas={serviceAreas}
                onMapClick={handleMapClick}
                isEditMode={isEditMode}
              />
            )}
          </motion.div>
        </div>
        
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
    </section>
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
      className={`relative group w-full text-left p-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${
        isSelected
          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg'
          : 'bg-white hover:bg-gradient-to-r hover:from-yellow-50 hover:to-yellow-100'
      }`}
    >
      <button
        onClick={() => onAreaSelect(area.id)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium text-sm sm:text-base ${
              isSelected ? 'text-white' : 'text-gray-900'
            }`}>
              {area.name}
            </p>
            {area.popular && (
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full mt-1 inline-block ${
                isSelected
                  ? 'text-yellow-800 bg-yellow-200'
                  : 'text-yellow-700 bg-yellow-200'
              }`}>
                ⭐ Popular
              </span>
            )}
          </div>
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