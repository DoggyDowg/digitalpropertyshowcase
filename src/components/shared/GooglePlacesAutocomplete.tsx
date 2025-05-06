import { useEffect, useRef, useState } from 'react'
import { useGoogleMaps } from './GoogleMapsLoader'

// Define more specific types for the Google Maps API
interface GooglePlaceAutocompleteElement extends HTMLElement {
  getPlace(): Promise<GooglePlaceResult>;
  name: string;
  value: string;
}

interface GooglePlaceResult {
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  utcOffsetMinutes?: number;
  location?: {
    lat: number;
    lng: number;
  };
}

interface GoogleAddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

interface GooglePlacesAutocompleteProps {
  value?: string
  onChange: (value: {
    formattedAddress: string
    streetAddress: string
    suburb: string
    state: string
    latitude: number
    longitude: number
    timezone?: string
  }) => void
  className?: string
  placeholder?: string
  error?: boolean
  useNewApi?: boolean
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  className = '',
  placeholder = 'Search for an address...',
  error = false,
  useNewApi = false
}: GooglePlacesAutocompleteProps) {
  // If the new API is requested but not available, fall back to legacy
  const [actuallyUseNewApi, setActuallyUseNewApi] = useState(useNewApi)
  const { isLoaded } = useGoogleMaps(actuallyUseNewApi)
  
  // Check if new API is available once Google Maps is loaded
  useEffect(() => {
    if (isLoaded && useNewApi) {
      const newApiAvailable = 
        typeof window !== 'undefined' && 
        window.google?.maps?.places?.PlaceAutocompleteElement !== undefined;
        
      if (!newApiAvailable) {
        console.warn('PlaceAutocompleteElement is not available. Falling back to legacy API.');
        setActuallyUseNewApi(false);
      }
    }
  }, [isLoaded, useNewApi]);

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const newAutocompleteRef = useRef<GooglePlaceAutocompleteElement | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Helper function to get IANA timezone from location and UTC offset
  const getIANATimezone = (state: string, country: string, utcOffset: number): string => {
    // Australian states mapping
    const australianTimezones: Record<string, string> = {
      'New South Wales': 'Australia/Sydney',
      'Victoria': 'Australia/Melbourne',
      'Queensland': 'Australia/Brisbane',
      'South Australia': 'Australia/Adelaide',
      'Western Australia': 'Australia/Perth',
      'Tasmania': 'Australia/Hobart',
      'Northern Territory': 'Australia/Darwin',
      'Australian Capital Territory': 'Australia/Sydney'
    };

    // If it's Australia, use state-based mapping
    if (country === 'Australia' && state in australianTimezones) {
      return australianTimezones[state];
    }

    // For other locations, return UTC offset format
    const offsetHours = Math.abs(Math.floor(utcOffset / 60));
    const offsetMinutes = Math.abs(utcOffset % 60);
    const sign = utcOffset >= 0 ? '+' : '-';
    return `UTC${sign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
  };

  // Initialize new PlaceAutocompleteElement
  useEffect(() => {
    if (!isLoaded || !containerRef.current || !actuallyUseNewApi) return;

    // Store a reference to the current container for cleanup
    const currentContainer = containerRef.current;
    
    try {
      console.log('Initializing New Places Autocomplete Element...');
      
      // Remove any existing PlaceAutocompleteElement
      if (newAutocompleteRef.current && currentContainer.contains(newAutocompleteRef.current)) {
        currentContainer.removeChild(newAutocompleteRef.current);
      }
      
      // Create new PlaceAutocompleteElement
      const autocompleteElement = document.createElement('gmp-place-autocomplete') as GooglePlaceAutocompleteElement;
      
      // Set options
      if (placeholder) {
        autocompleteElement.name = placeholder;
      }
      
      // For biasing results to specified location (optional)
      // autocompleteElement.locationBias = { ... };
      
      // For restricting to countries (if needed)
      // autocompleteElement.includedRegionCodes = ['US', 'CA'];
      
      // Add to DOM
      currentContainer.appendChild(autocompleteElement);
      
      // Store a reference to the element
      newAutocompleteRef.current = autocompleteElement;
      
      // Add Select Event Listener (the new API uses gmp-select instead of place_changed)
      autocompleteElement.addEventListener('gmp-select', async () => {
        try {
          if (!('getPlace' in autocompleteElement)) {
            console.error('getPlace method not available on PlaceAutocompleteElement');
            return;
          }
          
          // Type assertion with our specific type
          const place = await autocompleteElement.getPlace();
          console.log('Place selected (new API):', place);
          
          if (place) {
            // Get location data
            let latitude = 0;
            let longitude = 0;
            
            if (place.location) {
              latitude = place.location.lat || 0;
              longitude = place.location.lng || 0;
            }
            
            // Parse address components
            let streetNumber = '';
            let route = '';
            let suburb = '';
            let state = '';
            const timezone = place.utcOffsetMinutes ? 
              `UTC${place.utcOffsetMinutes >= 0 ? '+' : '-'}${Math.abs(Math.floor(place.utcOffsetMinutes / 60))}:${Math.abs(place.utcOffsetMinutes % 60).toString().padStart(2, '0')}` : 
              '';
            
            if (place.addressComponents) {
              place.addressComponents.forEach((component: GoogleAddressComponent) => {
                const types = component.types || [];
                console.log('Processing component:', { types, longText: component.longText });
                
                if (types.includes('street_number')) {
                  streetNumber = component.longText || '';
                }
                if (types.includes('route')) {
                  route = component.longText || '';
                }
                if (types.includes('locality') || types.includes('sublocality')) {
                  suburb = component.longText || '';
                }
                if (types.includes('administrative_area_level_1')) {
                  state = component.longText || '';
                }
              });
            }
            
            // Construct street address
            const streetAddress = `${streetNumber} ${route}`.trim();
            
            // Call onChange with the formatted data
            onChange({
              formattedAddress: place.formattedAddress || autocompleteElement.value || '',
              streetAddress,
              suburb,
              state,
              latitude,
              longitude,
              timezone
            });
          }
        } catch (error) {
          console.error('Error handling place selection (new API):', error);
        }
      });
    } catch (error) {
      console.error('Error initializing PlaceAutocompleteElement:', error);
      setActuallyUseNewApi(false);
    }
    
    return () => {
      // Use the captured reference from the outer scope
      if (newAutocompleteRef.current && currentContainer?.contains(newAutocompleteRef.current)) {
        currentContainer.removeChild(newAutocompleteRef.current);
      }
    };
  }, [isLoaded, actuallyUseNewApi, onChange, placeholder]);

  // Initialize legacy Autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || actuallyUseNewApi || autocompleteRef.current) return;

    try {
      console.log('Initializing Legacy Places Autocomplete...');
      
      // Create autocomplete instance
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: [
          'address_components',
          'formatted_address',
          'geometry',
          'utc_offset_minutes'
        ],
        types: ['address']
      });

      // Store instance in ref
      autocompleteRef.current = autocomplete;

      // Add place_changed listener
      autocomplete.addListener('place_changed', async () => {
        const place = autocomplete.getPlace();
        console.log('Place selected (legacy API):', place);
        
        if (!place.geometry?.location) {
          console.error('No location found for this address');
          return;
        }

        const formattedAddress = place.formatted_address || '';
        
        // Extract address components
        let streetNumber = '';
        let route = '';
        let suburb = '';
        let state = '';
        let country = '';
        
        console.log('Raw address components:', place.address_components);
        
        place.address_components?.forEach((component) => {
          const types = component.types;
          console.log('Processing component:', { types, long_name: component.long_name });
          
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          }
          if (types.includes('route')) {
            route = component.long_name;
          }
          if (types.includes('locality') || types.includes('sublocality')) {
            suburb = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
          if (types.includes('country')) {
            country = component.long_name;
          }
        });

        console.log('Extracted address components:', {
          streetNumber,
          route,
          suburb,
          state,
          country
        });

        // Construct street address
        const streetAddress = streetNumber && route 
          ? `${streetNumber} ${route}`
          : formattedAddress.split(',')[0].trim();

        // Update input value
        if (inputRef.current) {
          inputRef.current.value = formattedAddress;
        }

        console.log('Final address data:', {
          formattedAddress,
          streetAddress,
          suburb,
          state,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        });

        // Get coordinates
        const latitude = place.geometry.location.lat();
        const longitude = place.geometry.location.lng();

        // Get timezone based on location and UTC offset
        let timezone = 'UTC';
        if (typeof place.utc_offset_minutes === 'number') {
          timezone = getIANATimezone(state, country, place.utc_offset_minutes);
          console.log('Determined timezone:', timezone);
        }

        // Call onChange with structured data
        onChange({
          formattedAddress,
          streetAddress,
          suburb,
          state,
          latitude,
          longitude,
          timezone
        });
      });

      console.log('Legacy Places Autocomplete initialized successfully');
    } catch (err) {
      console.error('Error initializing Legacy Places Autocomplete:', err);
    }

    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, onChange, actuallyUseNewApi]);

  // Render appropriate UI based on API choice
  return (
    <div className="relative">
      {actuallyUseNewApi ? (
        <div 
          ref={containerRef}
          className="relative"
          style={{
            position: 'relative',
            zIndex: isFocused ? 1000 : 'auto'
          }}
        >
          {/* The PlaceAutocompleteElement will be appended here */}
        </div>
      ) : (
        <div 
          className="relative"
          style={{
            position: 'relative',
            zIndex: isFocused ? 1000 : 'auto'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            defaultValue={value}
            placeholder={placeholder}
            className={`block w-full px-4 py-3 text-base rounded-md border shadow-sm
              ${error 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              }
              ${className}
            `}
            style={{
              outline: 'none'
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
      )}
      
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
        </div>
      )}
    </div>
  )
} 