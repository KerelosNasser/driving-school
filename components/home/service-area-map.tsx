'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditMode } from '@/contexts/editModeContext';
import { EditableText } from '@/components/ui/editable-text';
import { LocationEditModal } from '@/components/admin/locationEditModel';
import { toast } from 'sonner';
import * as ReactWindow from 'react-window'
import { serviceAreas as defaultServiceAreas } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { EditableWrapper } from '@/components/drag-drop/EditableWrapper';
import { DropZoneArea } from '@/components/drag-drop/DropZoneArea';

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
const { FixedSizeList } = ReactWindow;

interface ServiceArea {
  id: number;
  name: string;
  lat: number;
  lng: number;
  popular: boolean;
}

interface ServiceAreaMapProps {
  initialServiceAreas?: ServiceArea[];
  showSearch?: boolean;
}

export function ServiceAreaMap({ initialServiceAreas, showSearch = true }: ServiceAreaMapProps) {
  const { isEditMode, saveContent } = useEditMode();
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>(initialServiceAreas || defaultServiceAreas);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ServiceArea | null>(null);
  const [isNewLocation, setIsNewLocation] = useState(false);

  // Load service areas from Supabase or fall back to API/defaults
  const loadServiceAreas = useCallback(async (force = false) => {
    try {
      setIsLoading(true);
      // If the parent passed initial service areas and we're not forcing a reload,
      // prefer those so pages (like About) don't get overwritten by the 'home' entry.
      if (!force && initialServiceAreas && initialServiceAreas.length > 0) {
        setServiceAreas(initialServiceAreas);
        setIsLoading(false);
        return;
      }

      // Try reading the page_content entry directly from Supabase (public client)
      const { data, error } = await supabase
        .from('page_content')
        .select('content_json')
        .eq('page_name', 'home')
        .eq('content_key', 'service_areas')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Supabase fetch error, falling back to API', error.message || error);
      }

      if (data && Array.isArray(data) && data.length > 0 && data[0] && data[0].content_json && Array.isArray(data[0].content_json)) {
        setServiceAreas(data[0].content_json as ServiceArea[]);
      } else {
        // fallback to existing API endpoint for compatibility
        const resp = await fetch('/api/admin/content?page=home&key=service_areas');
        if (resp.ok) {
          const { data: apiData } = await resp.json();
          if (apiData?.length > 0 && apiData[0].content_json && Array.isArray(apiData[0].content_json)) {
            setServiceAreas(apiData[0].content_json);
          } else {
            setServiceAreas(initialServiceAreas || defaultServiceAreas);
          }
        } else {
          setServiceAreas(initialServiceAreas || defaultServiceAreas);
        }
      }
    } catch (error) {
      console.error('Failed to load service areas:', error);
      setError('Failed to load service areas');
      setServiceAreas(initialServiceAreas || defaultServiceAreas);
    } finally {
      setIsLoading(false);
    }
  }, [initialServiceAreas]);

  // Keep local state in sync if the parent passes new initial areas
  useEffect(() => {
    if (initialServiceAreas && initialServiceAreas.length > 0) {
      setServiceAreas(initialServiceAreas);
    }
  }, [initialServiceAreas]);

  useEffect(() => {
    loadServiceAreas();
  }, [loadServiceAreas]);

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
      setSelectedArea(updatedAreas.length > 0 ? updatedAreas[0]?.id || null : null);
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

  // Use all service areas (no filtering for now)
  // Search handling
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredAreas = serviceAreas.filter(area =>
    debouncedQuery === '' ? true : area.name.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  return (
    <EditableWrapper componentId="map-section" componentType="map">
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
            contentKey="service_areas_title"
            tagName="h2"
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-700 bg-clip-text text-transparent"
            placeholder="Service Areas"
          >
            Where We Teach
          </EditableText>
          <EditableText
            contentKey="service_areas_subtitle"
            tagName="p"
            className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto px-4 leading-relaxed"
            placeholder="Enter description..."
            multiline={true}
          >
            We provide driving lessons throughout Brisbane and surrounding areas
          </EditableText>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service areas list - Enhanced Design */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-emerald-100 order-2 lg:order-1"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <div className="bg-emerald-100 rounded-xl p-2 mr-3">
                  <MapPin className="h-6 w-6 text-emerald-600" />
                </div>
                Coverage Areas
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadServiceAreas()}
                  className="text-sm px-3 py-1 bg-white/90 hover:bg-white rounded-md shadow-sm"
                  title="Refresh list from Supabase"
                >
                  ⟳ Refresh
                </button>
                {isEditMode && (
                  <Button
                    onClick={handleAddLocation}
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

              {showSearch && (
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              )}

                        <div className="max-h-[300px]">
                          {isLoading ? (
                            <div className="space-y-3">
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className="p-4 bg-gray-200 animate-pulse rounded-xl">
                                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Virtualized list using react-window for lazy rendering of many areas
                            (() => {
                              const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
                                const area = filteredAreas[index];
                                return (
                                  <div style={style} className="px-0">
                                    <motion.div
                                      key={area.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.2) }}
                                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 transform ${selectedArea === area.id
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                                        : 'bg-white shadow-sm'
                                        }`}
                                      onClick={() => setSelectedArea(area.id)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white font-semibold shadow">
                                            {area.name ? area.name.charAt(0).toUpperCase() : '#'}
                                          </div>
                                          <div>
                                            <div className="font-semibold text-sm">{area.name}</div>
                                            <div className="text-xs text-gray-500">{area.lat.toFixed(3)}, {area.lng.toFixed(3)}</div>
                                          </div>
                                        </div>
                                        {area.popular && (
                                          <span className={`text-xs px-3 py-1 rounded-full font-bold ${selectedArea === area.id
                                            ? 'bg-white/20 text-white'
                                            : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            ⭐ Popular
                                          </span>
                                        )}
                                      </div>
                                      {isEditMode && (
                                        <div className="flex gap-2 mt-3">
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditLocation(area);
                                            }}
                                            className="h-7 w-7 p-0 bg-white/90 hover:bg-white text-gray-700"
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
                                            className="h-7 w-7 p-0"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </motion.div>
                                  </div>
                                );
                              };

                              const rowHeight = 84; // px - accommodates the item padding and optional edit buttons
                              const listHeight = Math.min(300, filteredAreas.length * rowHeight);

                              return (
                                <FixedSizeList
                                  height={listHeight}
                                  itemCount={filteredAreas.length}
                                  itemSize={rowHeight}
                                  width="100%"
                                  className="overflow-y-auto"
                                >
                                  {Row}
                                </FixedSizeList>
                              );
                            })()
                          )}
                        </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl text-center">
              <p className="text-sm text-gray-700">
                Don't see your area? <Link href="/contact" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">Contact us</Link> - we likely cover it!
              </p>
            </div>
          </motion.div>

          {/* Map - Enhanced Design */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 rounded-2xl overflow-hidden shadow-xl h-[300px] sm:h-[400px] order-1 lg:order-2"
          >
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
                  serviceAreas={filteredAreas}
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
      
      <DropZoneArea id="after-map" className="my-4" placeholder="Add components after map" />
    </EditableWrapper>
  );
}

