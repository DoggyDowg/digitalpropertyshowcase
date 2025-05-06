# Google Places API Migration Guide

## Overview

Google has announced that as of March 1st, 2025, the legacy `google.maps.places.Autocomplete` API will not be available to new customers. While existing implementations will continue to work, it's recommended to migrate to the new `google.maps.places.PlaceAutocompleteElement` API.

Our codebase has been updated to support both APIs with a smooth migration path.

## Components Involved

1. **GoogleMapsLoader.tsx**: Handles loading the Google Maps API script
2. **GooglePlacesAutocomplete.tsx**: The main component that implements both legacy and new APIs
3. **google-maps.d.ts**: Type definitions for both APIs

## How to Use

The `GooglePlacesAutocomplete` component supports both APIs through a feature flag:

```tsx
<GooglePlacesAutocomplete
  value={address}
  onChange={handleAddressChange}
  // Enable this flag to use the new API
  useNewApi={true}
/>
```

### Features

- **Automatic fallback**: If the new API is requested but not available, it will automatically fall back to the legacy API
- **Consistent interface**: The component provides the same props and returns the same data regardless of which API is used
- **Graceful degradation**: Handles errors and edge cases

## Migration Timeline

1. **Testing Phase**: Enable `useNewApi={true}` on individual instances to test behavior
2. **Partial Rollout**: Gradually enable for more components
3. **Full Migration**: Update the default to `useNewApi = true` in the component definition

## Differences Between APIs

### Legacy API (`google.maps.places.Autocomplete`)
- Snake_case property naming (`formatted_address`, `address_components`)
- Synchronous `getPlace()` method
- Component properties like `long_name` and `short_name`

### New API (`google.maps.places.PlaceAutocompleteElement`)
- CamelCase property naming (`formattedAddress`, `addressComponents`)
- Asynchronous `getPlace()` method returning a Promise
- Component properties like `longText` and `shortText`
- Extends HTMLElement rather than being a JavaScript class

## Troubleshooting

If you encounter issues with the new API:

1. Check browser console for errors
2. Ensure you're using the beta version of the API by setting `useBeta` to true in the GoogleMapsLoader
3. Verify that all required fields are specified in the fields array
4. Check if the PlaceAutocompleteElement is actually available in your environment

## Resources

- [Google Maps Places Migration Overview](https://developers.google.com/maps/documentation/javascript/places-migration-overview)
- [PlaceAutocompleteElement Documentation](https://developers.google.com/maps/documentation/javascript/place-autocomplete) 