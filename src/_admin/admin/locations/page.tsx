'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap } from '@/components/shared/GoogleMap';
import { useGoogleMaps } from '@/components/shared/GoogleMapsLoader';
import type { Landmark, Property, LandmarkType, PlaceDetails } from '@/types/maps';
import { LANDMARK_TYPES, getLandmarkTypeConfig } from '@/utils/landmarkTypes';

interface LocationState {
  property: Property | null;
  landmarks: Landmark[];
  isAddingLandmark: boolean;
  selectedType: LandmarkType | null;
  searchQuery: string;
  searchResults: google.maps.places.PlaceResult[];
  isSearching: boolean;
}

export default function LocationsAdmin() {
  const [state, setState] = useState<LocationState>({
    property: null,
    landmarks: [],
    isAddingLandmark: false,
    selectedType: null,
    searchQuery: '',
    searchResults: [],
    isSearching: false
  });

  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const landmarkSearchInputRef = useRef<HTMLInputElement>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const { isLoaded: isReady } = useGoogleMaps();

  // Load existing data when component mounts
  useEffect(() => {
    async function loadExistingData() {
      try {
        const response = await fetch('/api/get-landmarks');
        if (!response.ok) {
          throw new Error('Failed to load landmarks');
        }
        const data = await response.json();
        
        // Update state with existing data
        setState(prev => ({
          ...prev,
          property: data.property,
          landmarks: data.landmarks
        }));

        // Update the autocomplete input with the property address
        if (autocompleteInputRef.current && data.property) {
          autocompleteInputRef.current.value = data.property.address;
        }
      } catch (err) {
        console.error('Error loading existing landmarks:', err);
        // Don't show error to user since this is optional pre-population
      }
    }

    loadExistingData();
  }, []);

  // Initialize Places Autocomplete and Places Service
  useEffect(() => {
    if (!isReady || !autocompleteInputRef.current || autocompleteRef.current) return;

    try {
      const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
        fields: ['formatted_address', 'geometry', 'name'],
        types: ['address']
      });

      // Add place_changed event listener
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) {
          setError('No location found for this address');
          return;
        }

        const property: Property = {
          name: place.name || place.formatted_address || '',
          position: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          },
          address: place.formatted_address || '',
          id: place.place_id || crypto.randomUUID(),
          is_demo: false
        };

        setState(prev => ({
          ...prev,
          property
        }));
      });

      autocompleteRef.current = autocomplete;

      // Initialize Places Service for landmark search
      if (!placesServiceRef.current) {
        placesServiceRef.current = new google.maps.places.PlacesService(document.createElement('div'));
      }
    } catch (err) {
      console.error('Error initializing Places Autocomplete:', err);
      setError('Failed to initialize address search');
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isReady]);

  // Handle enter key in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && autocompleteRef.current) {
      // Prevent form submission
      e.preventDefault();
      
      // Get the first suggestion if available
      const place = autocompleteRef.current.getPlace();
      if (place?.geometry?.location) {
        const property: Property = {
          name: place.name || place.formatted_address || '',
          position: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          },
          address: place.formatted_address || '',
          id: place.place_id || crypto.randomUUID(),
          is_demo: false
        };

        setState(prev => ({
          ...prev,
          property
        }));
      }
    }
  };

  // Landmark search functionality
  const searchLandmarks = useCallback(async (query: string) => {
    if (!placesServiceRef.current || !query.trim() || !state.selectedType || !state.property) {
      setState(prev => ({ ...prev, searchResults: [] }));
      return;
    }

    setState(prev => ({ ...prev, isSearching: true }));

    try {
      // Use textSearch for more precise results
      placesServiceRef.current.textSearch(
        {
          query: query,
          location: state.property.position,
          radius: 10000, // 10km radius around the property
          type: state.selectedType === 'dining' ? 'restaurant' : 
                state.selectedType === 'shopping' ? 'store' : 
                state.selectedType === 'leisure' ? 'park' : 
                state.selectedType === 'schools' ? 'school' : 
                state.selectedType === 'transport' ? 'transit_station' : undefined
        },
        (results, status) => {
          console.log('Search results:', { status, count: results?.length, results });
          
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setState(prev => ({ 
              ...prev, 
              searchResults: results.slice(0, 5), // Limit to 5 results
              isSearching: false 
            }));
          } else {
            setState(prev => ({ 
              ...prev, 
              searchResults: [], 
              isSearching: false 
            }));
          }
        }
      );
    } catch (error) {
      console.error('Search error:', error);
      setState(prev => ({ 
        ...prev, 
        searchResults: [], 
        isSearching: false 
      }));
    }
  }, [state.selectedType, state.property]);

  // Handle search input changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (state.searchQuery && state.isAddingLandmark) {
        searchLandmarks(state.searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [state.searchQuery, state.isAddingLandmark, searchLandmarks]);

  // Landmark addition handlers
  const startAddingLandmark = (type: LandmarkType) => {
    console.log('Starting to add landmark of type:', type);
    setState(prev => {
      console.log('Updating state - isAddingLandmark:', true, 'selectedType:', type);
      return {
        ...prev,
        isAddingLandmark: true,
        selectedType: type,
        searchQuery: '',
        searchResults: []
      };
    });
    
    // Focus on search input after a brief delay
    setTimeout(() => {
      if (landmarkSearchInputRef.current) {
        landmarkSearchInputRef.current.focus();
      }
    }, 100);
  };

  // Debug logging for state changes
  useEffect(() => {
    console.log('Current state:', {
      isAddingLandmark: state.isAddingLandmark,
      selectedType: state.selectedType,
      propertySet: !!state.property,
      landmarkCount: state.landmarks.length
    });
  }, [state]);

  // Handle selecting a landmark from search results
  const selectLandmarkFromSearch = useCallback(async (place: google.maps.places.PlaceResult) => {
    if (!state.selectedType || !placesServiceRef.current || !place.place_id) {
      showToast('Error selecting landmark', 'error');
      return;
    }

    try {
      // Get detailed place information
      placesServiceRef.current.getDetails(
        {
          placeId: place.place_id,
          fields: [
            'name',
            'business_status',
            'formatted_address',
            'photos',
            'rating',
            'user_ratings_total',
            'price_level',
            'types',
            'geometry'
          ]
        },
        (detailedPlace, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && detailedPlace) {
            console.log('Selected landmark details:', detailedPlace);

            // Extract place details
            const details: PlaceDetails = {
              shortDescription: detailedPlace.types?.[0] ? formatTypeString(detailedPlace.types[0]) : undefined,
            };

            // Get the first photo if available
            if (detailedPlace.photos && detailedPlace.photos.length > 0) {
              try {
                const photo = detailedPlace.photos[0];
                details.photoUrl = photo.getUrl({
                  maxWidth: 800,
                  maxHeight: 600
                });
              } catch (err) {
                console.error('Error getting place photo URL:', err);
              }
            }

            // Create the new landmark
            const newLandmark: Landmark = {
              name: detailedPlace.name || `New ${state.selectedType!}`,
              type: state.selectedType!,
              position: {
                lat: detailedPlace.geometry!.location!.lat(),
                lng: detailedPlace.geometry!.location!.lng()
              },
              description: '',
              details: details
            };

            // Add the landmark to state
            setState(prev => ({
              ...prev,
              landmarks: [...prev.landmarks, newLandmark],
              isAddingLandmark: false,
              selectedType: null,
              searchQuery: '',
              searchResults: []
            }));

            // Show success toast with more detail
            const typeConfig = getLandmarkTypeConfig(state.selectedType!);
            showToast(`Added ${newLandmark.name} as ${typeConfig.label} landmark`);
          } else {
            showToast('Failed to get landmark details', 'error');
          }
        }
      );
    } catch (error) {
      console.error('Error selecting landmark:', error);
      showToast('Error selecting landmark', 'error');
    }
  }, [state.selectedType]);

  // Landmark deletion handler
  const handleDeleteLandmark = (index: number) => {
    console.log('Deleting landmark at index:', index);
    setState(prev => ({
      ...prev,
      landmarks: prev.landmarks.filter((_, i) => i !== index)
    }));
  };

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({
    message: '',
    type: 'success',
    visible: false
  });

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Helper function to format type string nicely
  function formatTypeString(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const handlePlaceClick = useCallback(async (place: google.maps.places.PlaceResult) => {
    console.log('Initial place data:', {
      name: place.name,
      types: place.types,
      formatted_address: place.formatted_address,
      business_status: place.business_status,
      raw: place
    });
    
    if (!state.isAddingLandmark || !state.selectedType) {
      console.log('Not in adding mode or no type selected:', {
        isAddingLandmark: state.isAddingLandmark,
        selectedType: state.selectedType
      });
      return;
    }

    if (!place.geometry?.location) {
      console.error('Place has no location data:', place);
      showToast('Failed to add landmark: No location data', 'error');
      return;
    }

    console.log('Creating new landmark...');

    // Get detailed place information
    const placesService = new google.maps.places.PlacesService(document.createElement('div'));
    
    try {
      const detailedPlace = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        placesService.getDetails({
          placeId: place.place_id as string,
          fields: [
            'name',
            'business_status',
            'formatted_address',
            'photos',
            'rating',
            'user_ratings_total',
            'price_level',
            'types'
          ]
        }, (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result) {
            console.log('Detailed place data:', {
              name: result.name,
              types: result.types,
              formatted_address: result.formatted_address,
              business_status: result.business_status,
              raw: result
            });
            resolve(result);
          } else {
            reject(new Error(`Failed to get place details: ${status}`));
          }
        });
      });

      // Extract place details
      const details: PlaceDetails = {
        shortDescription: detailedPlace.types?.[0] ? formatTypeString(detailedPlace.types[0]) : undefined,
      };

      // Get the first photo if available
      if (detailedPlace.photos && detailedPlace.photos.length > 0) {
        try {
          const photo = detailedPlace.photos[0];
          details.photoUrl = photo.getUrl({
            maxWidth: 800,
            maxHeight: 600
          });
          console.log('Added photo URL to landmark:', details.photoUrl);
        } catch (err) {
          console.error('Error getting place photo URL:', err);
        }
      }

      // Create the new landmark
      const newLandmark: Landmark = {
        name: detailedPlace.name || `New ${state.selectedType}`,
        type: state.selectedType, // This is our internal categorization
        position: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        },
        description: '', // We don't need this anymore since we have shortDescription
        details: details
      };

      console.log('Adding new landmark:', newLandmark);

      // Add the landmark to state
      setState(prev => ({
        ...prev,
        landmarks: [...prev.landmarks, newLandmark],
        isAddingLandmark: false,
        selectedType: null
      }));

      // Show success toast with more detail
      const typeConfig = getLandmarkTypeConfig(state.selectedType!);
      showToast(`Added ${newLandmark.name} as ${typeConfig.label} landmark`);
    } catch (error) {
      console.error('Error getting place details:', error);
      showToast('Failed to get place details', 'error');
    }
  }, [state.isAddingLandmark, state.selectedType]);

  const handleSave = async () => {
    if (!state.property || state.landmarks.length === 0) {
      setError('Please add a property and at least one landmark');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const response = await fetch('/api/save-landmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property: state.property,
          landmarks: state.landmarks
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save landmarks');
      }

      setSaveSuccess(true);
    } catch (err) {
      setError('Error saving landmarks file. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all transform ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">Location Manager</h1>
      
      {/* Property Search */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Showcase Property</h2>
        <div className="flex gap-4">
          <input
            ref={autocompleteInputRef}
            type="text"
            placeholder="Enter property address..."
            className="flex-grow p-2 border rounded"
            onKeyDown={handleSearchKeyDown}
            disabled={!isReady}
          />
        </div>
        {!isReady && (
          <p className="mt-2 text-sm text-gray-500">Loading address search...</p>
        )}
      </div>

      {/* Map and Controls */}
      <div className="flex gap-6">
        {/* Map */}
        <div className="flex-grow">
          {state.property ? (
            <GoogleMap
              center={state.property.position}
              zoom={15}
              property={state.property}
              landmarks={state.landmarks}
              onAddLandmark={handlePlaceClick}
              isAddingLandmark={state.isAddingLandmark}
              mode="admin"
            />
          ) : (
            <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              Search for a property to begin
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="w-80 space-y-4">
          {/* Add Landmark Controls */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-semibold mb-3">Add Landmarks</h3>
            <p className="text-sm text-gray-600 mb-3">
              Select a landmark type, then search for the specific landmark you want to add
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {LANDMARK_TYPES.map((typeConfig) => {
                const Icon = typeConfig.icon;
                const isSelected = state.isAddingLandmark && state.selectedType === typeConfig.type;
                return (
                  <button
                    key={typeConfig.type}
                    onClick={() => {
                      if (isSelected) {
                        setState(prev => ({
                          ...prev,
                          isAddingLandmark: false,
                          selectedType: null,
                          searchQuery: '',
                          searchResults: []
                        }));
                      } else {
                        startAddingLandmark(typeConfig.type);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      isSelected
                        ? `bg-${typeConfig.color}-500 text-white shadow-lg ring-2 ring-${typeConfig.color}-200`
                        : `bg-${typeConfig.color}-100 text-${typeConfig.color}-700 hover:bg-${typeConfig.color}-200 hover:shadow-md`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {typeConfig.label}
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Search Interface */}
            {state.isAddingLandmark && state.selectedType && (
              <div className="border-t pt-4">
                <div className="mb-3">
                                     <label className="block text-sm font-medium text-gray-700 mb-2">
                     Search for {state.selectedType ? getLandmarkTypeConfig(state.selectedType).label.toLowerCase() : 'landmark'}:
                   </label>
                   <input
                     ref={landmarkSearchInputRef}
                     type="text"
                     value={state.searchQuery}
                     onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                     placeholder={`Search for ${state.selectedType ? getLandmarkTypeConfig(state.selectedType).label.toLowerCase() : 'landmark'}... (e.g., "Elwood Beach")`}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!isReady}
                  />
                </div>
                
                {/* Search Results */}
                {state.isSearching && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Searching...
                    </div>
                  </div>
                )}
                
                {state.searchResults.length > 0 && !state.isSearching && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Select a landmark:</p>
                    {state.searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => selectLandmarkFromSearch(result)}
                        className="w-full p-3 text-left border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{result.name}</div>
                        {result.formatted_address && (
                          <div className="text-sm text-gray-600">{result.formatted_address}</div>
                        )}
                        {result.rating && (
                          <div className="text-sm text-yellow-600">
                            ⭐ {result.rating} ({result.user_ratings_total} reviews)
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                
                {state.searchQuery && state.searchResults.length === 0 && !state.isSearching && (
                  <div className="text-center py-4 text-gray-500">
                    No landmarks found. Try a different search term.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Landmarks List */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-semibold mb-3">Added Landmarks</h3>
            {state.landmarks.length === 0 ? (
              <p className="text-gray-500 text-sm">No landmarks added yet</p>
            ) : (
              <div className="space-y-2">
                {state.landmarks.map((landmark, index) => {
                  const typeConfig = getLandmarkTypeConfig(landmark.type);
                  const Icon = typeConfig.icon;
                  return (
                    <div
                      key={index}
                      className="p-2 bg-gray-50 rounded text-sm flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-gray-900" />
                        <div>
                          <div className="font-medium">{landmark.name}</div>
                          <div className="text-gray-500">{typeConfig.label}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteLandmark(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                        title="Delete landmark"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save Button */}
          {state.property && state.landmarks.length > 0 && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full px-6 py-3 rounded-lg shadow-lg ${
                isSaving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : saveSuccess 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors duration-200`}
            >
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save to Project'}
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}

      {/* JSON Preview */}
      {state.property && state.landmarks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">JSON Preview</h2>
          <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify({
                property: state.property,
                landmarks: state.landmarks
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 