'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
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
];

export function ServiceAreaMap() {
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Brisbane center coordinates
  const brisbaneCenter = { lat: -27.4698, lng: 153.0251 };
  
  // Set map as loaded after component mounts
  useEffect(() => {
    setMapLoaded(true);
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Service Areas
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              We provide driving lessons throughout Brisbane and surrounding suburbs
            </p>
          </motion.div>
        </div>

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
            {mapLoaded && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
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
            {(!mapLoaded || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) && (
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
  );
}