'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import LeafletServiceAreaMap from '@/components/maps/LeafletServiceAreaMap';
import { serviceAreas } from '@/lib/data';

export function ServiceAreaMap() {
  const [selectedArea, setSelectedArea] = useState<number | null>(null);

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

          {/* Leaflet Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 rounded-xl overflow-hidden shadow-lg h-[500px]"
          >
            <LeafletServiceAreaMap 
              selectedAreaId={selectedArea}
              onAreaSelect={setSelectedArea}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}