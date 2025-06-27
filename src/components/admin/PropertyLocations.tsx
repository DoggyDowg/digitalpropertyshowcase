'use client';

import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { GoogleMap } from '@/components/shared/GoogleMap';
import type { Landmark as BaseLandmark, Property, LandmarkType } from '@/types/maps';
import { getLandmarkTypeConfig, LANDMARK_TYPES } from '@/utils/landmarkTypes';
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

  // Handle landmark type toggle
  const toggleLandmarkType = (type: LandmarkType) => {
    if (state.selectedType === type) {
      // Deactivate if same type clicked
      setState(prev => ({
        ...prev,
        isAddingLandmark: false,
        selectedType: null
      }));
    } else {
      // Activate new type
      setState(prev => ({
        ...prev,
        isAddingLandmark: true,
        selectedType: type
      }));
      showToast(`Click on the map to add ${getLandmarkTypeConfig(type).label.toLowerCase()} landmarks`);
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
    
    // Add to newLandmarks array and keep the landmark type active for adding more
    setState(prev => ({
      ...prev,
      newLandmarks: [...prev.newLandmarks, landmark]
      // Keep isAddingLandmark and selectedType active so user can add more of the same type
    }));

    showToast(`Added ${landmark.name} - click map again to add more ${getLandmarkTypeConfig(landmarkType).label.toLowerCase()}`, 'success');
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

      {/* Landmark Type Toggle Buttons */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-medium mb-3">Add Landmarks</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select a landmark type below, then click anywhere on the map to add landmarks of that type.
          </p>
          
          <div className="flex flex-wrap gap-3">
            {LANDMARK_TYPES.map((typeConfig) => {
              const Icon = typeConfig.icon;
              const isActive = state.isAddingLandmark && state.selectedType === typeConfig.type;
              return (
                <button
                  key={typeConfig.type}
                  onClick={() => toggleLandmarkType(typeConfig.type)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 border-2 ${
                    isActive
                      ? `bg-gray-900 text-white border-gray-900 shadow-lg ring-2 ring-gray-300`
                      : `bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {typeConfig.label}
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
          
          {state.isAddingLandmark && state.selectedType && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">
                  Now adding {getLandmarkTypeConfig(state.selectedType).label.toLowerCase()} landmarks
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Click anywhere on the map to add a {getLandmarkTypeConfig(state.selectedType).label.toLowerCase()} landmark at that location.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      {isLoaded && state.property && (
        <div className="h-[500px] rounded-lg overflow-hidden border relative">
          <div className="w-full h-full relative">
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