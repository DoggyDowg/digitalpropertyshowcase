'use client';

import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { GoogleMap } from '@/components/shared/GoogleMap';
import type { Landmark, Property, LandmarkType } from '@/types/maps';
import { LANDMARK_TYPES, getLandmarkTypeConfig } from '@/utils/landmarkTypes';
import { useGoogleMaps } from '@/components/shared/GoogleMapsLoader';

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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { isLoaded, loadError } = useGoogleMaps();

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
      }
    };

    if (propertyId) {
      loadExistingData();
    }
  }, [propertyId]);

  // Landmark addition handlers
  const startAddingLandmark = (type: LandmarkType) => {
    console.log('[PropertyLocations] Starting to add landmark of type:', type);
    
    // Cancel any existing landmark addition first
    setState(prev => {
      // Only show the toast if we're not already in adding mode
      if (!prev.isAddingLandmark) {
        showToast(`Click directly on a point of interest icon on the map to add a ${type} landmark`, 'info');
      }
      
      return {
        ...prev,
        isAddingLandmark: true,
        selectedType: type
      };
    });
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
    console.log('[PropertyLocations] handleAddLandmark called with place:', place);
    if (!place.geometry?.location || !state.selectedType) {
      console.warn('[PropertyLocations] handleAddLandmark: Missing geometry or selectedType', {
        hasGeometry: !!place.geometry?.location,
        selectedType: state.selectedType
      });
      setState(prev => ({ ...prev, isAddingLandmark: false, selectedType: null }));
      showToast('Could not add landmark - missing required data', 'info');
      return;
    }
    
    console.log('[PropertyLocations] Adding landmark:', {
      name: place.name,
      type: state.selectedType,
      position: place.geometry.location.toJSON()
    });
    
    const landmark: Landmark = {
      name: place.name || '',
      type: state.selectedType,
      position: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      address: place.formatted_address || place.vicinity || '',
      details: {
        shortDescription: place.types?.[0] ? formatTypeString(place.types[0]) : undefined,
        photoUrl: place.photos?.[0]?.getUrl()
      }
    };

    console.log('[PropertyLocations] Successfully processed landmark, resetting isAddingLandmark.');
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

      {/* Map loading status */}
      {!isLoaded && (
        <div className="h-[500px] rounded-lg overflow-hidden border flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="font-medium text-gray-700">Loading Google Maps...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
          </div>
        </div>
      )}

      {/* Map load error */}
      {loadError && (
        <div className="h-[500px] rounded-lg overflow-hidden border flex items-center justify-center bg-red-50">
          <div className="text-center p-6">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="font-medium text-red-700">Failed to load Google Maps</p>
            <p className="text-sm text-red-600 mt-2">Try refreshing the page or check your network connection</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      {isLoaded && state.property && (
        <div className="h-[500px] rounded-lg overflow-hidden border relative">
          {state.isAddingLandmark && (
            <div className="absolute top-4 left-0 right-0 mx-auto w-max z-10 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow">
              <p className="text-sm flex items-center">
                <span className="mr-2">Click directly on a {state.selectedType} icon on the map</span>
                <button 
                  onClick={() => setState(prev => ({ ...prev, isAddingLandmark: false, selectedType: null }))}
                  className="ml-2 p-1 hover:bg-blue-200 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </p>
            </div>
          )}
          <div 
            className="w-full h-full relative" 
            style={{ 
              pointerEvents: 'auto',
              zIndex: 0
            }}
          >
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
        </div>
      )}

      {/* Landmark Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add Landmarks</h3>
        
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 font-medium mb-2">How to add landmarks:</p>
          <ol className="list-decimal pl-5 text-amber-800 space-y-1">
            <li>Click one of the landmark type buttons below (Shopping, Dining, etc.)</li>
            <li>Look for <strong>existing points of interest</strong> on the map (restaurants, shops, schools, etc.)</li>
            <li>Click directly on a point of interest icon (not just anywhere on the map)</li>
            <li>The landmark will be added to your list below</li>
          </ol>
          <p className="text-amber-800 mt-2 text-sm">
            Note: You can only add landmarks that already exist in Google Maps. If you don&apos;t see 
            icons for points of interest, try zooming in or moving the map around.
          </p>
        </div>
        
        {state.isAddingLandmark && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              <strong>Currently adding: {state.selectedType}</strong>
              <br />
              Look for {state.selectedType} icons on the map and click directly on one to add it.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {LANDMARK_TYPES.map((config) => (
            <button
              key={config.type}
              onClick={() => startAddingLandmark(config.type)}
              disabled={state.isAddingLandmark}
              className={`
                p-3 rounded-lg border text-left
                ${state.isAddingLandmark 
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50 active:bg-gray-100'
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