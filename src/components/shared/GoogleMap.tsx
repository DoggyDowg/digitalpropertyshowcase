import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap as GoogleMapComponent, Marker, InfoWindow } from '@react-google-maps/api';
import { MapInfoWindow } from './MapInfoWindow';
import type { GoogleMapProps, Landmark, LandmarkType } from '@/types/maps';
import { LANDMARK_TYPES, PROPERTY_MARKER_COLOR, getLandmarkTypeConfig } from '@/utils/landmarkTypes';
import * as React from 'react';
import Image from 'next/image';
import { useFooterImage } from '@/hooks/useFooterImage';
import { MapContextMenu } from './MapContextMenu';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  scaleControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
  clickableIcons: true,
};

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

function formatDistance(meters: number): string {
  // Convert to kilometers with one decimal place
  const km = (meters / 1000).toFixed(1);
  return `${km}km`;
}

// Create a custom type that includes our landmarkType
interface EnhancedPlaceResult extends google.maps.places.PlaceResult {
  landmarkType?: LandmarkType;
}

export function GoogleMap({ 
  center, 
  zoom = 15, 
  landmarks = [], 
  property,
  mode = 'view',
  onAddLandmark,
  isAddingLandmark = false
}: GoogleMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hoveredPlace, setHoveredPlace] = useState<string | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [activeFilters, setActiveFilters] = useState<LandmarkType[]>([]);
  const [showPropertyInfo, setShowPropertyInfo] = useState<boolean>(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [allowTransitions, setAllowTransitions] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const listViewRef = useRef<HTMLDivElement>(null);
  const { imageUrl, loading } = useFooterImage(property?.id, property?.is_demo);
  
  // Add these new state variables for context menu
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    mapPosition?: google.maps.LatLngLiteral;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  const router = useRouter();

  // Handle window width
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkWidth = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsListOpen(width >= 800);
    };

    // Initial check
    checkWidth();
    
    // Enable transitions after initial render
    const timeoutId = setTimeout(() => {
      setAllowTransitions(true);
    }, 100);

    // Add resize listener
    window.addEventListener('resize', checkWidth);
    
    return () => {
      window.removeEventListener('resize', checkWidth);
      clearTimeout(timeoutId);
    };
  }, []);

  const isMobile = windowWidth > 0 && windowWidth < 800;

  // Sort landmarks by distance from property
  const sortedLandmarks = useMemo(() => {
    if (!property) return landmarks;
    
    return [...landmarks].sort((a, b) => {
      const distA = calculateDistance(
        property.position.lat,
        property.position.lng,
        a.position.lat,
        a.position.lng
      );
      const distB = calculateDistance(
        property.position.lat,
        property.position.lng,
        b.position.lat,
        b.position.lng
      );
      return distA - distB;
    });
  }, [landmarks, property]);

  // Calculate distances for each landmark
  const landmarkDistances = useMemo(() => {
    if (!property) return new Map<string, string>();

    const distances = new Map<string, string>();
    landmarks.forEach(landmark => {
      const distance = calculateDistance(
        property.position.lat,
        property.position.lng,
        landmark.position.lat,
        landmark.position.lng
      );
      distances.set(landmark.name, formatDistance(distance));
    });
    return distances;
  }, [landmarks, property]);

  // Filter landmarks based on active filters
  const filteredLandmarks = useMemo(() => {
    if (activeFilters.length === 0) return sortedLandmarks;
    return sortedLandmarks.filter(landmark => {
      const type = landmark.type.toLowerCase() as LandmarkType;
      return activeFilters.includes(type);
    });
  }, [sortedLandmarks, activeFilters]);

  // Toggle filter function
  const toggleFilter = (type: LandmarkType) => {
    setActiveFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Reset map when unmounting to prevent memory leaks
  useEffect(() => {
    return () => {
      if (map) {
        setMap(null);
      }
    };
  }, [map]);

  // Handle right-click on map for context menu
  const handleRightClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (mode !== 'admin') return;
    
    // Prevent the default context menu
    if (e.domEvent) {
      e.domEvent.preventDefault();
      
      // Get the mouse position for the context menu - safely check for MouseEvent
      const clientX = e.domEvent instanceof MouseEvent ? e.domEvent.clientX : 0;
      const clientY = e.domEvent instanceof MouseEvent ? e.domEvent.clientY : 0;
      
      // Store the map position where the user clicked
      const mapPosition = e.latLng?.toJSON();
      
      if (!mapPosition) return;
      
      setContextMenu({
        isOpen: true,
        position: { x: clientX, y: clientY },
        mapPosition,
      });
    }
  }, [mode]);
  
  // Handle landmark type selection from context menu
  const handleLandmarkTypeSelect = useCallback(async (type: LandmarkType) => {
    if (!contextMenu.mapPosition || !placesService) {
      console.error('[GoogleMap] Missing map position or places service for landmark search');
      return;
    }
    
    try {
      // Search for places of the selected type near the clicked location
      const service = new google.maps.places.PlacesService(map!);
      
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(contextMenu.mapPosition.lat, contextMenu.mapPosition.lng),
        radius: 1000, // 1km radius
        type: type as any
      };

      service.nearbySearch(request, async (results, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results || results.length === 0) {
          // If no results, try a different search
          if (!contextMenu.mapPosition) {
            console.error('No map position available for landmark search');
            return;
          }
          
          const textSearchRequest: google.maps.places.TextSearchRequest = {
            query: `${type} near ${contextMenu.mapPosition.lat},${contextMenu.mapPosition.lng}`,
            location: new google.maps.LatLng(contextMenu.mapPosition.lat, contextMenu.mapPosition.lng),
            radius: 2000
          };

          service.textSearch(textSearchRequest, async (secondResults, secondStatus) => {
            if (secondStatus === google.maps.places.PlacesServiceStatus.OK && secondResults && secondResults.length > 0) {
              if (!contextMenu.mapPosition) return;
              
              const closestPlace = secondResults.reduce((closest, current) => {
                if (!current.geometry?.location || !closest.geometry?.location) return closest;
                
                const currentDistance = google.maps.geometry.spherical.computeDistanceBetween(
                  new google.maps.LatLng(contextMenu.mapPosition!.lat, contextMenu.mapPosition!.lng),
                  current.geometry.location
                );
                const closestDistance = google.maps.geometry.spherical.computeDistanceBetween(
                  new google.maps.LatLng(contextMenu.mapPosition!.lat, contextMenu.mapPosition!.lng),
                  closest.geometry.location
                );
                
                return currentDistance < closestDistance ? current : closest;
              });

              if (closestPlace?.place_id) {
                const detailsRequest: google.maps.places.PlaceDetailsRequest = {
                  placeId: closestPlace.place_id,
                  fields: ['name', 'formatted_address', 'geometry', 'place_id', 'website']
                };

                service.getDetails(detailsRequest, (place, detailsStatus) => {
                  if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && place) {
                    const landmark: Omit<Landmark, 'id' | 'property_id'> = {
                      name: place.name || `${type.charAt(0).toUpperCase() + type.slice(1)} Location`,
                      type: type,
                      position: {
                        lat: place.geometry?.location?.lat() || contextMenu.mapPosition!.lat,
                        lng: place.geometry?.location?.lng() || contextMenu.mapPosition!.lng
                      },
                      address: place.formatted_address || ''
                    };

                    onAddLandmark?.(landmark);
                  }
                });
              }
            }
          });
          return;
        }

        // Find the closest place to the clicked location
        if (!contextMenu.mapPosition) {
          console.error('No map position available for landmark search');
          return;
        }
        
        const closestPlace = results.reduce((closest, current) => {
          if (!current.geometry?.location || !closest.geometry?.location) return closest;
          
          const currentDistance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(contextMenu.mapPosition!.lat, contextMenu.mapPosition!.lng),
            current.geometry.location
          );
          const closestDistance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(contextMenu.mapPosition!.lat, contextMenu.mapPosition!.lng),
            closest.geometry.location
          );
          
          return currentDistance < closestDistance ? current : closest;
        });

        if (closestPlace?.place_id) {
          const detailsRequest: google.maps.places.PlaceDetailsRequest = {
            placeId: closestPlace.place_id,
            fields: ['name', 'formatted_address', 'geometry', 'place_id', 'website']
          };

          service.getDetails(detailsRequest, (place, detailsStatus) => {
            if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && place) {
              const landmark: Omit<Landmark, 'id' | 'property_id'> = {
                name: place.name || `${type.charAt(0).toUpperCase() + type.slice(1)} Location`,
                type: type,
                position: {
                  lat: place.geometry?.location?.lat() || contextMenu.mapPosition!.lat,
                  lng: place.geometry?.location?.lng() || contextMenu.mapPosition!.lng
                },
                address: place.formatted_address || ''
              };

              onAddLandmark?.(landmark);
            }
          });
        }
      });
    } catch (error) {
      console.error('Error searching for landmarks:', error);
    } finally {
      setContextMenu(prev => ({ ...prev, isOpen: false }));
    }
  }, [contextMenu, onAddLandmark, placesService, map]);
  
  // Close context menu
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Modify the onLoad function to set up the places service
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // Initialize Places Service
    const service = new google.maps.places.PlacesService(map);
    setPlacesService(service);

    // Add right-click listener for context menu
    if (mode === 'admin') {
      const mapContainer = map.getDiv();
      mapContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        const { clientX, clientY } = e;
        
        const center = map.getCenter();
        if (!center) {
          console.error('[GoogleMap] Could not get map center');
          return;
        }
        
        const mapPosition = {
          lat: center.lat(),
          lng: center.lng()
        };
        
        setContextMenu({
          isOpen: true,
          position: { x: clientX, y: clientY },
          mapPosition,
        });
      });
      
      // Also keep the Google Maps rightclick handler as backup
      map.addListener('rightclick', handleRightClick);
    }
  }, [mode, handleRightClick]);

  const onUnmount = useCallback(() => {
    if (map) {
      google.maps.event.clearInstanceListeners(map);
    }
    setMap(null);
    setPlacesService(null);
  }, [map]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isListOpen && listViewRef.current && !listViewRef.current.contains(event.target as Node)) {
        setIsListOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isListOpen]);

  return (
    <div className="w-full">
      <div className="w-full overflow-x-hidden">
        <div className="flex w-full">
          {/* Map Container */}
          <div className="w-full">
            {mode === 'admin' && isAddingLandmark && (
              <div className="absolute top-4 left-4 right-4 z-10 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  Right-click on the map to add a landmark, or left-click on a place icon
                </div>
              </div>
            )}
            
            <GoogleMapComponent
              mapContainerClassName="w-full h-[600px] rounded-lg"
              center={center}
              zoom={zoom}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                ...mapOptions,
                clickableIcons: true,
                gestureHandling: 'auto',
                zoomControl: true,
                fullscreenControl: true,
                streetViewControl: true
              }}
              onClick={(e: google.maps.MapMouseEvent & { placeId?: string }) => {
                if (isAddingLandmark && e.placeId && onAddLandmark) {
                  try {
                    placesService?.getDetails(
                      {
                        placeId: e.placeId,
                        fields: [
                          'name',
                          'geometry',
                          'formatted_address',
                          'types',
                          'place_id',
                          'photos',
                          'rating',
                          'user_ratings_total',
                          'price_level'
                        ]
                      },
                      (place, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                          onAddLandmark(place);
                        } else {
                          console.error('[GoogleMap] Failed to get place details in onClick:', status);
                        }
                      }
                    );
                  } catch (error) {
                    console.error('[GoogleMap] Error in onClick handler:', error);
                  }
                }
              }}
            >
              {/* Property Marker */}
              {property && (
                <Marker
                  position={property.position}
                  icon={{
                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                    fillColor: PROPERTY_MARKER_COLOR,
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: '#FFFFFF',
                    scale: 2,
                    anchor: new google.maps.Point(12, 24)
                  }}
                  title={property.name}
                  onClick={() => {
                    setSelectedLandmark(null);
                    map?.panTo(property.position);
                    setShowPropertyInfo(true);
                  }}
                />
              )}

              {/* Property Info Window */}
              {showPropertyInfo && property && (
                <InfoWindow
                  position={property.position}
                  onCloseClick={() => setShowPropertyInfo(false)}
                >
                  <div className="max-w-sm">
                    {loading ? (
                      <div className="w-full h-48 bg-gray-800 animate-pulse rounded-lg mb-3" />
                    ) : imageUrl ? (
                      <Image 
                        src={imageUrl}
                        alt={property.name}
                        width={480}
                        height={320}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-800 flex items-center justify-center rounded-lg mb-3">
                        <p className="text-white/50">No image available</p>
                      </div>
                    )}
                    <h3 className="font-heading text-lg mb-2">{property.name}</h3>
                    <p className="font-paragraph text-gray-600">{property.address}</p>
                  </div>
                </InfoWindow>
              )}

              {/* Landmark Markers */}
              {filteredLandmarks.map((landmark, index) => {
                const type = landmark.type.toLowerCase() as LandmarkType;
                const typeConfig = getLandmarkTypeConfig(type);
                
                // Get the icon SVG based on type
                const getIconSvg = () => {
                  switch (type) {
                    case 'shopping':
                      return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 11-1 9"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"/><path d="M4.5 15.5h15"/><path d="m5 11 4-7"/><path d="m9 11 1 9"/></svg>';
                    case 'dining':
                      return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>';
                    case 'schools':
                      return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>';
                    case 'leisure':
                      return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11h.01"/><path d="M14 6h.01"/><path d="M18 6h.01"/><path d="M6.5 13.1h.01"/><path d="M22 5c0 9-4 12-6 12s-6-3-6-12c0-2 2-3 6-3s6 1 6 3"/><path d="M17.4 9.9c-.8.8-2 .8-2.8 0"/><path d="M10.1 7.1C9 7.2 7.7 7.7 6 8.6c-3.5 2-4.7 3.9-3.7 5.6 4.5 7.8 9.5 8.4 11.2 7.4.9-.5 1.9-2.1 1.9-4.7"/><path d="M9.1 16.5c.3-1.1 1.4-1.7 2.4-1.4"/></svg>';
                    case 'transport':
                      return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1"/><path d="m15 15 1-1"/><path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/></svg>';
                    default:
                      return '';
                  }
                };
                
                // Create marker icon using SVG
                const markerIcon = {
                  url: `data:image/svg+xml,${encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="14" fill="${typeConfig.markerColor}" stroke="white" stroke-width="2"/>
                      <g transform="translate(7 7)" stroke="white" stroke-width="2" fill="none">
                        ${getIconSvg()}
                      </g>
                    </svg>
                  `)}`,
                  scaledSize: new google.maps.Size(32, 32),
                  anchor: new google.maps.Point(16, 16)
                };
                
                return (
                  <Marker
                    key={`${landmark.name}-${index}`}
                    position={landmark.position}
                    icon={markerIcon}
                    title={landmark.name}
                    onClick={() => setSelectedLandmark(landmark)}
                  />
                );
              })}

              {/* Info Window */}
              {selectedLandmark && (
                <MapInfoWindow
                  landmark={selectedLandmark}
                  position={selectedLandmark.position}
                  onClose={() => setSelectedLandmark(null)}
                  distance={landmarkDistances.get(selectedLandmark.name)}
                />
              )}
            </GoogleMapComponent>
            
            {/* Context Menu for Right-Click */}
            <MapContextMenu
              isOpen={contextMenu.isOpen}
              position={contextMenu.position}
              onSelect={handleLandmarkTypeSelect}
              onClose={handleCloseContextMenu}
            />
          </div>

          {/* List View */}
          {(mode === 'view' || !isAddingLandmark) && windowWidth > 0 && landmarks.length > 0 && (
            <div 
              ref={listViewRef}
              className={`
                w-80 rounded-lg shadow-lg
                bg-white md:block
                flex flex-col
                ${allowTransitions ? 'transition-transform duration-300 ease-in-out' : ''}
              `}
              style={{ height: '600px', display: 'flex', overflow: 'hidden' }}
            >
              {/* Header - No fixed height, will take natural height */}
              <div className="flex-none p-4 bg-gray-50 border-b">
                {property && (
                  <button 
                    onClick={() => {
                      setSelectedLandmark(null);
                      map?.panTo(property.position);
                      setShowPropertyInfo(true);
                      setIsListOpen(false);
                    }}
                    className="w-full text-left group"
                  >
                    <div className="font-heading text-lg mb-2 group-hover:text-blue-600 transition-colors text-brand-dark">
                      {property.name}
                    </div>
                    <div className="font-paragraph text-sm text-brand-dark group-hover:text-blue-600 transition-colors">
                      {property.address?.split(',').length > 1 ? property.address.split(',')[1].trim() : property.address}
                    </div>
                  </button>
                )}
                <div className="h-px bg-gray-200 my-3" />
                <div className="font-paragraph text-sm text-brand-dark mb-3">Nearby Places</div>
                <div className="flex flex-wrap gap-2">
                  {LANDMARK_TYPES.map((config) => {
                    const Icon = config.icon;
                    const type = config.type.toLowerCase() as LandmarkType;
                    const isSelected = activeFilters.includes(type);
                    const colorClasses = {
                      shopping: {
                        selected: 'bg-blue-600 text-white border-blue-600',
                        unselected: 'bg-white text-blue-600 border-blue-600'
                      },
                      dining: {
                        selected: 'bg-orange-600 text-white border-orange-600',
                        unselected: 'bg-white text-orange-600 border-orange-600'
                      },
                      schools: {
                        selected: 'bg-green-600 text-white border-green-600',
                        unselected: 'bg-white text-green-600 border-green-600'
                      },
                      leisure: {
                        selected: 'bg-purple-600 text-white border-purple-600',
                        unselected: 'bg-white text-purple-600 border-purple-600'
                      },
                      transport: {
                        selected: 'bg-red-600 text-white border-red-600',
                        unselected: 'bg-white text-red-600 border-red-600'
                      }
                    };
                    const colors = colorClasses[type];
                    return (
                      <button
                        key={config.type}
                        onClick={() => toggleFilter(type)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? colors.selected : colors.unselected
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    );
                  })}
                  {activeFilters.length > 0 && (
                    <button
                      onClick={() => setActiveFilters([])}
                      className="hover:text-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Content - Takes remaining height */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="divide-y">
                  {filteredLandmarks.map((landmark, index) => {
                    const type = landmark.type.toLowerCase() as LandmarkType;
                    const typeConfig = getLandmarkTypeConfig(type);
                    const Icon = typeConfig.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedLandmark(landmark);
                          setIsListOpen(false);
                        }}
                        className={`w-full text-left hover:bg-gray-50 transition-colors flex items-center gap-3 relative ${
                          selectedLandmark?.name === landmark.name ? 'bg-blue-50' : ''
                        }`}
                      >
                        {selectedLandmark?.name === landmark.name && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-1"
                            style={{ backgroundColor: typeConfig.markerColor }}
                          />
                        )}
                        <div className="p-4 flex items-center gap-3 w-full">
                          <Icon className="w-5 h-5 text-brand-dark shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="!font-paragraph !text-base !not-italic text-brand-dark truncate">{landmark.name}</div>
                            <div className="!font-paragraph text-sm text-brand-dark mt-1">
                              {landmark.details?.shortDescription} • {formatDistance(calculateDistance(
                                property!.position.lat,
                                property!.position.lng,
                                landmark.position.lat,
                                landmark.position.lng
                              ))} away
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="h-16" />
              </div>
            </div>
          )}

          {/* Mobile List View */}
          {(mode === 'view' || !isAddingLandmark) && windowWidth > 0 && isMobile && landmarks.length > 0 && (
            <div 
              ref={listViewRef}
              className={`
                fixed top-[88px] right-0 bottom-0 w-80
                bg-white shadow-lg md:hidden
                flex-col
                z-30
                ${allowTransitions ? 'transition-transform duration-300 ease-in-out' : ''}
                ${isListOpen ? 'translate-x-0' : 'translate-x-full'}
              `}
              style={{ 
                height: 'calc(100vh - 88px)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="p-4 bg-gray-50 border-b flex-shrink-0">
                {property && (
                  <button 
                    onClick={() => {
                      setSelectedLandmark(null);
                      map?.panTo(property.position);
                      setShowPropertyInfo(true);
                      setIsListOpen(false); // Close panel on mobile after selection
                    }}
                    className="w-full text-left group"
                  >
                    <div className="font-heading text-lg mb-2 group-hover:text-blue-600 transition-colors text-brand-dark">
                      {property.name}
                    </div>
                    <div className="font-paragraph text-sm text-brand-dark group-hover:text-blue-600 transition-colors">
                      {property.address?.split(',').length > 1 ? property.address.split(',')[1].trim() : property.address}
                    </div>
                  </button>
                )}
                <div className="h-px bg-gray-200 my-3" />
                <div className="font-paragraph text-sm text-brand-dark mb-3">Nearby Places</div>
                <div className="flex flex-wrap gap-2 relative">
                  {LANDMARK_TYPES.map((config) => {
                    const Icon = config.icon;
                    const type = config.type.toLowerCase() as LandmarkType;
                    const isSelected = activeFilters.includes(type);
                    const colorClasses = {
                      shopping: {
                        selected: 'bg-blue-600 text-white border-blue-600',
                        unselected: 'bg-white text-blue-600 border-blue-600'
                      },
                      dining: {
                        selected: 'bg-orange-600 text-white border-orange-600',
                        unselected: 'bg-white text-orange-600 border-orange-600'
                      },
                      schools: {
                        selected: 'bg-green-600 text-white border-green-600',
                        unselected: 'bg-white text-green-600 border-green-600'
                      },
                      leisure: {
                        selected: 'bg-purple-600 text-white border-purple-600',
                        unselected: 'bg-white text-purple-600 border-purple-600'
                      },
                      transport: {
                        selected: 'bg-red-600 text-white border-red-600',
                        unselected: 'bg-white text-red-600 border-red-600'
                      }
                    };
                    const colors = colorClasses[type];
                    return (
                      <button
                        key={config.type}
                        onClick={() => toggleFilter(type)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? colors.selected : colors.unselected
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    );
                  })}
                  {activeFilters.length > 0 && (
                    <button
                      onClick={() => setActiveFilters([])}
                      className="hover:text-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="divide-y overflow-y-auto flex-1 pb-6">
                {filteredLandmarks.map((landmark, index) => {
                  const type = landmark.type.toLowerCase() as LandmarkType;
                  const typeConfig = getLandmarkTypeConfig(type);
                  const Icon = typeConfig.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedLandmark(landmark);
                        setIsListOpen(false);
                      }}
                      className={`w-full text-left hover:bg-gray-50 transition-colors flex items-center gap-3 relative ${
                        selectedLandmark?.name === landmark.name ? 'bg-blue-50' : ''
                      }`}
                    >
                      {selectedLandmark?.name === landmark.name && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ backgroundColor: typeConfig.markerColor }}
                        />
                      )}
                      <div className="p-4 flex items-center gap-3 w-full">
                        <Icon className="w-5 h-5 text-brand-dark shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="!font-paragraph !text-base !not-italic text-brand-dark truncate">{landmark.name}</div>
                          <div className="!font-paragraph text-sm text-brand-dark mt-1">
                            {landmark.details?.shortDescription} • {formatDistance(calculateDistance(
                              property!.position.lat,
                              property!.position.lng,
                              landmark.position.lat,
                              landmark.position.lng
                            ))} away
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {/* Add bottom padding spacer */}
                <div className="h-16" />
              </div>
            </div>
          )}

          {/* Overlay for mobile when list is open */}
          {isListOpen && mode === 'view' && landmarks.length > 0 && (
            <div 
              className="fixed md:hidden inset-0 bg-black bg-opacity-50 z-20"
              onClick={() => setIsListOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

