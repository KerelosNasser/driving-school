'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
        <div className="text-center mb-8">
          <EditableText
            contentKey="service_areas_title"
            tagName="h2"
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
            placeholder="Service Areas"
          >
            Where We Teach
          </EditableText>
          <EditableText
            contentKey="service_areas_subtitle"
            tagName="p"
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            placeholder="Enter description..."
            multiline={true}
          >
            We provide driving lessons throughout Brisbane and surrounding areas
          </EditableText>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service areas list - Mobile Optimized */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm order-2 lg:order-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 text-yellow-600 mr-2" />
                Coverage Areas
              </h3>
              {isEditMode && (
                <Button
                  onClick={handleAddLocation}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-3 bg-gray-200 animate-pulse rounded-lg">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                filteredAreas.slice(0, 8).map((area) => (
                  <div
                    key={area.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedArea === area.id
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white hover:bg-yellow-50'
                    }`}
                    onClick={() => setSelectedArea(area.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{area.name}</span>
                      {area.popular && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          selectedArea === area.id
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          Popular
                        </span>
                      )}
                    </div>
                    {isEditMode && (
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLocation(area);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLocation(area.id);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 text-xs text-gray-600 text-center">
              <p>Don't see your area? <Link href="/contact" className="text-yellow-600 hover:underline">Contact us</Link> - we likely cover it!</p>
            </div>
          </div>

          {/* Map - Mobile Optimized */}
          <div className="lg:col-span-2 rounded-lg overflow-hidden shadow-sm h-[300px] sm:h-[400px] order-1 lg:order-2">
            {error ? (
              <div className="w-full h-full bg-red-50 flex items-center justify-center rounded-lg">
                <div className="text-center p-4">
                  <div className="text-3xl mb-2">🗺️</div>
                  <h3 className="font-semibold text-red-900 mb-2">Map Unavailable</h3>
                  <p className="text-red-700 text-sm mb-3">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Retry
                  </Button>
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
          </div>
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