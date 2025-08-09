'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { serviceAreas } from '@/lib/data'; // Updated import path

// Dynamically import the map component with SSR disabled
const LeafletServiceAreaMap = dynamic(
  () => import('@/components/maps/LeafletServiceAreaMap'),
  {
    ssr: false,
    loading: () => <div className="w-full h-[500px] bg-gray-200 animate-pulse rounded-xl flex items-center justify-center"><p>Loading map...</p></div>,
  }
);

export default function AboutPage() {
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);

  const handleAreaSelect = (areaId: number) => {
    setSelectedAreaId(areaId);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
            About Our Driving School
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Your success on the road is our top priority. We are committed to providing the highest quality driving education in Brisbane.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Our Service Areas</h2>
              <p className="mt-4 text-lg text-gray-600">
                We cover a wide range of suburbs across Brisbane. Select an area on the map to see more details or choose from the list below.
              </p>
            </div>
            <div className="h-[500px] w-full rounded-xl border-4 border-white shadow-2xl overflow-hidden">
              <LeafletServiceAreaMap 
                selectedAreaId={selectedAreaId} 
                onAreaSelect={handleAreaSelect} 
              />
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl space-y-6 sticky top-8">
            <h3 className="text-2xl font-bold text-gray-900">Locations List</h3>
            <div className="max-h-[420px] overflow-y-auto pr-4 -mr-4 space-y-2">
              {serviceAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => handleAreaSelect(area.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${selectedAreaId === area.id ? 'bg-yellow-400 text-white shadow-lg' : 'bg-gray-100 hover:bg-yellow-100'}`}>
                  <p className="font-semibold text-lg">{area.name}</p>
                  {area.popular && (
                    <span className="text-xs font-bold uppercase tracking-wider text-yellow-800 bg-yellow-200 px-2 py-1 rounded-full">
                      ⭐ Popular
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
