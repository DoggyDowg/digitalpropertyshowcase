'use client';

import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { GoogleMap } from '@/components/shared/GoogleMap';
import type { Landmark as BaseLandmark, Property, LandmarkType } from '@/types/maps';
import { getLandmarkTypeConfig } from '@/utils/landmarkTypes';
import { useGoogleMaps } from '@/components/shared/GoogleMapsLoader';

// Extend the base Landmark type to include an ID
interface Landmark extends BaseLandmark {
  id?: string;
}

interface LocationState {
  property: Property | null;
  landmarks: Landmark[]; // Existing landmarks loaded from database
  newLandmarks: Landmark[]; // New landmarks added by user but not yet saved
  deletedLandmarkIds: string[]; // IDs of landmarks to delete
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

// Extended interface for PlaceResult with our custom landmarkType
interface EnhancedPlaceResult extends google.maps.places.PlaceResult {
  landmarkType?: LandmarkType;
}

export default function PropertyLocations({ propertyId, onSave }: PropertyLocationsProps) {
  const [state, setState] = useState<LocationState>({
    property: null,
    landmarks: [],
    newLandmarks: [],
    deletedLandmarkIds: [],
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
          landmarks: data.landmarks || [],
          newLandmarks: [],
          deletedLandmarkIds: []
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

  // Handle deleting an existing landmark
  const handleDeleteLandmark = (index: number, isNewLandmark: boolean = false) => {
    if (isNewLandmark) {
      // Remove from newLandmarks array
      setState(prev => ({
        ...prev,
        newLandmarks: prev.newLandmarks.filter((_, i) => i !== index)
      }));
      showToast('New landmark removed', 'info');
    } else {
      // Get the landmark to delete
      const landmarkToDelete = state.landmarks[index];
      
      // Mark it for deletion on save by adding ID to deletedLandmarkIds
      setState(prev => ({
        ...prev,
        landmarks: prev.landmarks.filter((_, i) => i !== index),
        deletedLandmarkIds: [...prev.deletedLandmarkIds, landmarkToDelete.id || '']
      }));
      showToast('Landmark marked for deletion', 'info');
    }
  };

  // Save landmarks
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError('');

    try {
      console.log('Saving landmarks:', {
        existingCount: state.landmarks.length,
        newCount: state.newLandmarks.length,
        deletedCount: state.deletedLandmarkIds.length
      });
      
      const response = await fetch('/api/save-landmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          landmarks: [...state.landmarks, ...state.newLandmarks],
          deletedLandmarkIds: state.deletedLandmarkIds
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      // After successful save, move newLandmarks to landmarks array
      setState(prev => ({
        ...prev,
        landmarks: [...prev.landmarks, ...prev.newLandmarks],
        newLandmarks: [],
        deletedLandmarkIds: []
      }));

      setSaveSuccess(true);
      showToast('All landmark changes saved successfully', 'success');
      onSave?.();
    } catch (error) {
      console.error('Error saving:', error);
      setError('Failed to save changes');
      showToast('Error saving landmarks', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle landmark addition
  const handleAddLandmark = useCallback((place: EnhancedPlaceResult) => {
    console.log('[PropertyLocations] handleAddLandmark called with place:', place);
    
    // Get the landmark type from our custom property or from state
    const landmarkType = place.landmarkType || state.selectedType;
    
    if (!place.geometry?.location || !landmarkType) {
      console.warn('[PropertyLocations] handleAddLandmark: Missing geometry or landmarkType', {
        hasGeometry: !!place.geometry?.location,
        landmarkType
      });
      setState(prev => ({ ...prev, isAddingLandmark: false, selectedType: null }));
      showToast('Could not add landmark - missing required data', 'info');
      return;
    }
    
    console.log('[PropertyLocations] Adding landmark:', {
      name: place.name,
      type: landmarkType,
      position: place.geometry.location.toJSON()
    });
    
    // Create a temporary ID for new landmarks
    const tempId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const landmark: Landmark = {
      id: tempId, // Add temporary ID for new landmarks
      name: place.name || '',
      type: landmarkType,
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

    console.log('[PropertyLocations] Successfully processed landmark, adding to newLandmarks array');
    
    // Add to newLandmarks array instead of updating landmarks directly
    setState(prev => ({
      ...prev,
      newLandmarks: [...prev.newLandmarks, landmark],
      isAddingLandmark: false,
      selectedType: null
    }));

    showToast(`Added ${landmark.name} to new landmarks`, 'success');
  }, [state.selectedType, showToast]);

  // Helper function to format type string nicely
  function formatTypeString(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Get combined landmarks for map display (both existing and new)
  const allLandmarks = [...state.landmarks, ...state.newLandmarks];

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Property Location & Landmarks</h2>
        <div className="flex gap-2 items-center">
          {(state.newLandmarks.length > 0 || state.deletedLandmarkIds.length > 0) && (
            <span className="text-sm text-amber-600 mr-2">
              You have unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
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
          {/* Add a visual indicator for right-click */}
          <div className="absolute top-4 left-4 right-4 z-10 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.629 5.086a.75.75 0 01.707-.371l8.032.765a.75.75 0 01.635.904l-1.222 6.355a.75.75 0 01-1.313.262l-1.295-1.621-4.263 3.199a.75.75 0 01-1.137-.365l-1.607-5.306-1.3 1.076a.75.75 0 01-1.046-.105L3.33 8.225a.75.75 0 01.028-1.036l4.27-3.103zm1.864 1.471l1.776 5.837 3.526-2.645a.75.75 0 011.051.11l.941 1.176.502-2.618-5.391-.513-1.066.774a.75.75 0 01-1.339-.121zm-4.406 2.66l.801.989.966-.799-1.767-1.25v1.06z" clipRule="evenodd" />
            </svg>
            <span>Right-click on the map to add landmarks</span>
          </div>
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
              landmarks={allLandmarks} // Use combined landmarks
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
            <li>Right-click anywhere on the map</li>
            <li>Select a landmark type from the menu (Shopping, Dining, etc.)</li>
            <li>The system will search for a nearby landmark of that type</li>
            <li>The landmark will be added to your list below</li>
          </ol>
          <p className="text-amber-800 mt-2 text-sm">
            Note: You can only add landmarks that already exist in Google Maps. If no landmarks are found
            near where you right-clicked, try right-clicking closer to a point of interest.
          </p>
        </div>
        
        {/* New Landmarks List */}
        {state.newLandmarks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <span>New Landmarks</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">Unsaved</span>
            </h3>
            <div className="space-y-2">
              {state.newLandmarks.map((landmark, index) => {
                const config = getLandmarkTypeConfig(landmark.type as LandmarkType);
                return (
                  <div
                    key={landmark.id || index}
                    className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {React.createElement(config.icon, { className: "w-5 h-5" })}
                      <div>
                        <p className="font-medium">{landmark.name}</p>
                        <p className="text-sm text-gray-500">{landmark.address}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteLandmark(index, true)}
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
        
        {/* Existing Landmarks List */}
        {state.landmarks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Existing Landmarks</h3>
            <div className="space-y-2">
              {state.landmarks.map((landmark, index) => {
                const config = getLandmarkTypeConfig(landmark.type as LandmarkType);
                return (
                  <div
                    key={landmark.id || index}
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
      </div>

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