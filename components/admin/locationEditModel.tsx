// components/admin/LocationEditModal.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ServiceArea {
    id: number;
    name: string;
    lat: number;
    lng: number;
    popular: boolean;
}

interface GeocodingResult {
    lat: number;
    lng: number;
    display_name: string;
    name: string;
}

interface LocationEditModalProps {
    isOpen: boolean;
    location: ServiceArea | null;
    isNew: boolean;
    onClose: () => void;
    onSave: (location: ServiceArea) => void;
    onDelete?: (id: number) => void;
}

// Simple geocoding service
const geocodeLocation = async (query: string): Promise<GeocodingResult[]> => {
    if (!query || query.length < 2) return [];

    try {
        const enhancedQuery = query.includes('Brisbane') ? query : `${query}, Brisbane, Queensland, Australia`;

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
                q: enhancedQuery,
                format: 'json',
                addressdetails: '1',
                limit: '5',
                countrycodes: 'AU',
            }),
            {
                headers: { 'User-Agent': 'EGDrivingSchool/1.0' },
            }
        );

        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();

        return data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            display_name: item.display_name,
            name: item.name || item.display_name.split(',')[0],
        })).filter((result: GeocodingResult) => {
            // Filter for Brisbane area
            return result.lat >= -27.8 && result.lat <= -27.2 &&
                result.lng >= 152.7 && result.lng <= 153.3;
        });
    } catch (error) {
        console.error('Geocoding failed:', error);
        throw error;
    }
};

export const LocationEditModal: React.FC<LocationEditModalProps> = ({
                                                                        isOpen,
                                                                        location,
                                                                        isNew,
                                                                        onClose,
                                                                        onSave,
                                                                        onDelete,
                                                                    }) => {
    const [editedLocation, setEditedLocation] = useState<ServiceArea | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize location
    useEffect(() => {
        if (location) {
            setEditedLocation(location);
            setSearchQuery(location.name);
            setError(null);
        }
    }, [location]);

    // Search with debouncing
    const searchLocations = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            const results = await geocodeLocation(query);
            setSearchResults(results);
            setShowSuggestions(results.length > 0);
        } catch (error) {
            setError('Search failed. Please try again.'+ error);
            setSearchResults([]);
            setShowSuggestions(false);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        setError(null);

        if (editedLocation) {
            setEditedLocation(prev => prev ? { ...prev, name: value } : null);
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length >= 2) {
            searchTimeoutRef.current = setTimeout(() => {
                searchLocations(value);
            }, 300);
        } else {
            setSearchResults([]);
            setShowSuggestions(false);
        }
    }, [editedLocation, searchLocations]);

    const handleSuggestionSelect = useCallback((result: GeocodingResult) => {
        setShowSuggestions(false);

        setEditedLocation(prev => prev ? {
            ...prev,
            name: result.name,
            lat: result.lat,
            lng: result.lng,
        } : null);

        setSearchQuery(result.name);
        toast.success(`Location found: ${result.name}`);
    }, []);

    const isValid = editedLocation &&
        editedLocation.name.trim().length > 0 &&
        editedLocation.lat !== 0 &&
        editedLocation.lng !== 0;

    const handleSave = useCallback(() => {
        if (!isValid || !editedLocation) {
            setError('Please select a valid location from the suggestions.');
            return;
        }

        onSave(editedLocation);
        onClose();
    }, [isValid, editedLocation, onSave, onClose]);

    if (!isOpen || !editedLocation) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4"
                onClick={onClose}
                style={{ zIndex: 9999 }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
                    onClick={(e) => e.stopPropagation()}
                    style={{ zIndex: 10000 }}
                >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        {isNew ? 'Add New Location' : 'Edit Location'}
                    </h3>

                    <div className="space-y-4">
                        {/* Search Input */}
                        <div className="relative">
                            <Label htmlFor="location-search">Location Name *</Label>
                            <div className="relative mt-1">
                                <Input
                                    ref={inputRef}
                                    id="location-search"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Search for a location in Brisbane..."
                                    className="pr-10"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    {isSearching ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    ) : (
                                        <Search className="h-4 w-4 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* Suggestions */}
                            {showSuggestions && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-[10001] mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {searchResults.map((result, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                            onClick={() => handleSuggestionSelect(result)}
                                        >
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm text-gray-900 truncate">
                                                        {result.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        {result.display_name}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Coordinates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Latitude</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={editedLocation.lat.toFixed(6)}
                                    onChange={(e) => setEditedLocation(prev => prev ? {
                                        ...prev,
                                        lat: parseFloat(e.target.value) || 0
                                    } : null)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>Longitude</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={editedLocation.lng.toFixed(6)}
                                    onChange={(e) => setEditedLocation(prev => prev ? {
                                        ...prev,
                                        lng: parseFloat(e.target.value) || 0
                                    } : null)}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        {/* Popular Checkbox */}
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="location-popular"
                                checked={editedLocation.popular}
                                onChange={(e) => setEditedLocation(prev => prev ? {
                                    ...prev,
                                    popular: e.target.checked
                                } : null)}
                                className="rounded"
                            />
                            <Label htmlFor="location-popular">Mark as popular area</Label>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {isValid && !error && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                <Check className="h-4 w-4 text-green-600" />
                                <p className="text-sm text-green-700">Location is valid and ready to save</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button onClick={handleSave} className="flex-1" disabled={!isValid}>
                                {isNew ? 'Add Location' : 'Save Changes'}
                            </Button>

                            {!isNew && onDelete && (
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        onDelete(editedLocation.id);
                                        onClose();
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}

                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-xs text-blue-700">
                            💡 Start typing a Brisbane location name and select from suggestions for accurate coordinates.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};