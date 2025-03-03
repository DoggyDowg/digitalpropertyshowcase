'use client';

import React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap } from '@/components/shared/GoogleMap';
import { useGoogleMaps } from '@/components/shared/GoogleMapsLoader';
import type { Landmark, Property, LandmarkType } from '@/types/maps';
import { LANDMARK_TYPES, getLandmarkTypeConfig } from '@/utils/landmarkTypes';

interface LocationState {
  property: Property | null;
  landmarks: Landmark[];
  isAddingLandmark: boolean;
  selectedType: LandmarkType | null;
}

interface PropertyLocationsProps {
  propertyId: string;
  onSave?: () => void;
}

interface Toast {
  message: string;
  type: 'info' | 'success';
  id: number;
}

export default function PropertyLocations({ propertyId, onSave }: PropertyLocationsProps) {
  const [state, setState] = useState<LocationState>({
    property: null,
    landmarks: [],
    isAddingLandmark: false,
    selectedType: null
  });

  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { isLoaded } = useGoogleMaps();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(false);

  // Toast helper function
  const showToast = useCallback((message: string, type: 'info' | 'success' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/get-landmarks?propertyId=${propertyId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load landmarks');
        }

        const data = await response.json();
        
        setState(prev => ({
          ...prev,
          property: data.property,
          landmarks: data.landmarks || []
        }));
      } catch (err) {
        console.error('Error loading existing landmarks:', err);
        setError('Failed to load existing landmarks');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      loadExistingData();
    }
  }, [propertyId]);

  // Landmark addition handlers
  const startAddingLandmark = (type: LandmarkType) => {
    setState(prev => ({
      ...prev,
      isAddingLandmark: true,
      selectedType: type
    }));
    showToast('Click on the map to add the landmark', 'info');
  };

  // Landmark deletion handler
  const handleDeleteLandmark = (index: number) => {
    setState(prev => ({
      ...prev,
      landmarks: prev.landmarks.filter((_, i) => i !== index)
    }));
  };

  // Save landmarks
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError('');

    try {
      const response = await fetch('/api/save-landmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          landmarks: state.landmarks,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      setSaveSuccess(true);
      onSave?.();
    } catch (error) {
      console.error('Error saving:', error);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle landmark addition
  const handleAddLandmark = useCallback((place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location || !state.selectedType) return;
    
    console.log('Adding landmark:', {
      name: place.name,
      type: state.selectedType,
      location: place.geometry.location.toJSON()
    });
    
    const landmark: Landmark = {
      name: place.name || '',
      type: state.selectedType,
      position: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      details: {
        shortDescription: place.types?.[0] ? formatTypeString(place.types[0]) : undefined,
        photoUrl: place.photos?.[0]?.getUrl()
      }
    };

    setState(prev => ({
      ...prev,
      landmarks: [...prev.landmarks, landmark],
      isAddingLandmark: false,
      selectedType: null
    }));

    showToast(`Added ${landmark.name} to landmarks`, 'success');
  }, [state.selectedType, showToast]);

  // Helper function to format type string nicely
  function formatTypeString(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Property Location & Landmarks</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Map */}
      {state.property && (
        <div className="h-[500px] rounded-lg overflow-hidden border">
          <GoogleMap
            center={state.property.position}
            zoom={15}
            property={state.property}
            landmarks={state.landmarks}
            isAddingLandmark={state.isAddingLandmark}
            mode="admin"
            onAddLandmark={handleAddLandmark}
          />
        </div>
      )}

      {/* Landmark Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add Landmarks</h3>
        <div className="grid grid-cols-3 gap-4">
          {LANDMARK_TYPES.map((config) => (
            <button
              key={config.type}
              onClick={() => startAddingLandmark(config.type)}
              disabled={state.isAddingLandmark}
              className={`
                p-3 rounded-lg border text-left
                ${state.isAddingLandmark 
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center gap-2">
                {React.createElement(config.icon, { className: "w-5 h-5" })}
                <span className="font-medium">{config.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Landmarks List */}
      {state.landmarks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Added Landmarks</h3>
          <div className="space-y-2">
            {state.landmarks.map((landmark, index) => {
              const config = getLandmarkTypeConfig(landmark.type as LandmarkType);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {React.createElement(config.icon, { className: "w-5 h-5" })}
                    <div>
                      <p className="font-medium">{landmark.name}</p>
                      <p className="text-sm text-gray-500">{landmark.address}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteLandmark(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600">Changes saved successfully!</p>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              px-4 py-2 rounded-lg shadow-lg text-white
              ${toast.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}
              transition-all duration-300 ease-in-out
            `}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}