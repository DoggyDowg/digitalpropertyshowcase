import { useEffect, useRef, useState } from 'react'
import { useGoogleMaps } from './GoogleMapsLoader'

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
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  className = '',
  placeholder = 'Search for an address...',
  error = false
}: GooglePlacesAutocompleteProps) {
  const { isLoaded } = useGoogleMaps()
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [timezoneError, setTimezoneError] = useState<string | null>(null)

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

  // Initialize autocomplete once and maintain instance
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return

    try {
      console.log('Initializing Places Autocomplete...')
      
      // Create autocomplete instance
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: [
          'address_components',
          'formatted_address',
          'geometry',
          'utc_offset_minutes'
        ],
        types: ['address']
      })

      // Store instance in ref
      autocompleteRef.current = autocomplete

      // Add place_changed listener
      autocomplete.addListener('place_changed', async () => {
        const place = autocomplete.getPlace()
        console.log('Place selected:', place);
        
        if (!place.geometry?.location) {
          console.error('No location found for this address')
          return
        }

        const formattedAddress = place.formatted_address || ''
        
        // Extract address components
        let streetNumber = ''
        let route = ''
        let suburb = ''
        let state = ''
        let country = ''
        
        console.log('Raw address components:', place.address_components);
        
        place.address_components?.forEach((component) => {
          const types = component.types
          console.log('Processing component:', { types, long_name: component.long_name });
          
          if (types.includes('street_number')) {
            streetNumber = component.long_name
          }
          if (types.includes('route')) {
            route = component.long_name
          }
          if (types.includes('locality') || types.includes('sublocality')) {
            suburb = component.long_name
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.long_name
          }
          if (types.includes('country')) {
            country = component.long_name
          }
        })

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

        console.log('Final address data:', {
          formattedAddress,
          streetAddress,
          suburb,
          state,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        });

        // Get coordinates
        const latitude = place.geometry.location.lat()
        const longitude = place.geometry.location.lng()

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
      })

      console.log('Places Autocomplete initialized successfully')
    } catch (err) {
      console.error('Error initializing Places Autocomplete:', err)
    }

    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
        autocompleteRef.current = null
      }
    }
  }, [isLoaded, onChange])

  return (
    <div className="relative">
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
        {!isLoaded && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>
      {timezoneError && (
        <div className="mt-2 text-sm text-red-600">
          {timezoneError}
        </div>
      )}
    </div>
  )
} 