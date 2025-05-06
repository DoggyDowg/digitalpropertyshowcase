// Type declaration to support both legacy and new Google Maps Places API
declare namespace google.maps.places {
  // Extended PlaceResult interface to support both naming conventions
  interface ExtendedPlaceResult extends google.maps.places.PlaceResult {
    // New camelCase naming conventions
    formattedAddress?: string;
    addressComponents?: AddressComponent[];
    utcOffsetMinutes?: number;
    location?: {
      lat: number;
      lng: number;
    };
  }
  
  // Address component from the new API
  interface AddressComponent {
    longText: string;
    shortText: string;
    types: string[];
  }
  
  // Extended Autocomplete interface to acknowledge the new methods
  interface ExtendedAutocomplete extends google.maps.places.Autocomplete {
    getPlace(): ExtendedPlaceResult;
  }
  
  // Type for the result from the new PlaceAutocompleteElement
  interface PlaceAutocompleteResult {
    formattedAddress?: string;
    addressComponents?: AddressComponent[];
    utcOffsetMinutes?: number;
    location?: {
      lat: number;
      lng: number;
    };
  }
  
  // New PlaceAutocompleteElement class
  class PlaceAutocompleteElement extends HTMLElement {
    constructor(options?: PlaceAutocompleteElementOptions);
    
    // Methods
    getPlace(): Promise<PlaceAutocompleteResult>;
    
    // Event listener methods
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    
    // Properties
    name: string;
    value: string;
  }
  
  // Type for PlaceAutocompleteElement constructor options
  interface PlaceAutocompleteElementOptions {
    inputPlaceholder?: string;
    inputValue?: string;
    types?: string[];
    componentRestrictions?: { country: string[] };
    fields?: string[];
  }
} 