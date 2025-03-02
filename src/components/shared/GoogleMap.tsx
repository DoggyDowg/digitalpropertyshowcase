import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap as GoogleMapComponent, Marker, InfoWindow } from '@react-google-maps/api';
import { MapInfoWindow } from './MapInfoWindow';
import type { GoogleMapProps, Landmark, LandmarkType } from '@/types/maps';
import { LANDMARK_TYPES, PROPERTY_MARKER_COLOR, getLandmarkTypeConfig } from '@/utils/landmarkTypes';
import * as React from 'react';
import Image from 'next/image';
import { useFooterImage } from '@/hooks/useFooterImage';

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

export function GoogleMap({ 
  center, 
  zoom = 15, 
  landmarks = [], 
  property,
  mode = 'view',
  onPlaceClick,
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

  // Debug logging for prop changes
  useEffect(() => {
    console.log('GoogleMap props updated:', {
      isAddingLandmark,
      hasOnPlaceClick: !!onPlaceClick,
      hasOnAddLandmark: !!onAddLandmark,
      hasProperty: !!property,
      landmarkCount: landmarks.length
    });
  }, [isAddingLandmark, onPlaceClick, onAddLandmark, property, landmarks]);

  // Reset map when unmounting to prevent memory leaks
  useEffect(() => {
    return () => {
      if (map) {
        setMap(null);
      }
    };
  }, [map]);

  const onLoad = useCallback((map: google.maps.Map) => {
    console.log('Map loaded, checking initialization');
    // Prevent double initialization
    if (map === null) {
      console.log('Map is null, skipping initialization');
      return;
    }
    
    setMap(map);
    
    // Initialize Places Service
    const service = new google.maps.places.PlacesService(map);
    setPlacesService(service);
    console.log('Places service initialized');
  }, []);

  // Only set up click handlers in admin mode
  useEffect(() => {
    // Skip if no map or not in admin mode
    if (!map || mode !== 'admin') {
      console.log('Skipping click handlers - no map or not in admin mode:', { hasMap: !!map, mode });
      return;
    }

    // Skip if no required services
    if (!placesService || (!onPlaceClick && !onAddLandmark)) {
      console.log('Skipping click handlers - missing services:', { 
        hasPlacesService: !!placesService, 
        hasOnPlaceClick: !!onPlaceClick,
        hasOnAddLandmark: !!onAddLandmark 
      });
      return;
    }

    console.log('Setting up admin click handlers with isAddingLandmark:', isAddingLandmark);

    // Add click listener for POIs
    const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent & { placeId?: string }) => {
      console.log('Map clicked:', e);
      const placeId = e.placeId;
      console.log('Place ID from click:', placeId);
      
      if (isAddingLandmark && placeId) {
        console.log('Getting place details for:', placeId);
        placesService.getDetails(
          {
            placeId: placeId,
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
          async (place, status) => {
            console.log('Place details response:', { status, place });
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              try {
                if (onAddLandmark) {
                  onAddLandmark(place);
                } else if (onPlaceClick) {
                  await onPlaceClick(place);
                }
              } catch (err) {
                console.error('Error handling place click:', err);
              }
            } else {
              console.error('Failed to get place details:', status);
            }
          }
        );
      } else {
        console.log('Click not processed:', {
          isAddingLandmark,
          hasOnPlaceClick: !!onPlaceClick,
          hasOnAddLandmark: !!onAddLandmark,
          hasService: !!placesService,
          placeId
        });
      }
    });

    // Add mouseover listener for POIs
    const mouseoverListener = map.addListener('mouseover', (e: google.maps.MapMouseEvent & { placeId?: string }) => {
      const placeId = e.placeId;
      if (isAddingLandmark && placeId) {
        setHoveredPlace(placeId);
        map.getDiv().style.cursor = 'pointer';
      }
    });

    // Add mouseout listener for POIs
    const mouseoutListener = map.addListener('mouseout', () => {
      setHoveredPlace(null);
      map.getDiv().style.cursor = '';
    });

    // Cleanup listeners when effect re-runs or component unmounts
    return () => {
      console.log('Cleaning up map listeners');
      google.maps.event.removeListener(clickListener);
      google.maps.event.removeListener(mouseoverListener);
      google.maps.event.removeListener(mouseoutListener);
    };
  }, [map, mode, placesService, onPlaceClick, onAddLandmark, isAddingLandmark]);

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
      {mode === 'view' && (
        <h2 className="font-heading text-3xl mb-8 text-center text-brand-dark">Explore the Neighbourhood</h2>
      )}
      <div className="w-full overflow-x-hidden">
        <div className="flex w-full">
          {/* Map Container */}
          <div className="w-full">
            {mode === 'admin' && isAddingLandmark && (
              <div className="absolute top-4 left-4 right-4 z-10 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow">
                Click on a place to add it as a landmark
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
                gestureHandling: mode === 'admin' && isAddingLandmark ? 'cooperative' : 'auto'
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
          </div>

          {/* List View */}
          {(mode === 'view' || !isAddingLandmark) && windowWidth > 0 && (
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
          {(mode === 'view' || !isAddingLandmark) && windowWidth > 0 && isMobile && (
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
          {isListOpen && mode === 'view' && (
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

