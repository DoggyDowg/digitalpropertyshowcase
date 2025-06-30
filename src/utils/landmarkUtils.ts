import type { Landmark, Property } from '@/types/maps';
import { SupabaseClient } from '@supabase/supabase-js';

export interface LandmarkData {
  property: Property;
  landmarks: Landmark[];
}

// Circuit breaker state
const circuitBreaker = {
  failureCount: 0,
  lastFailureTime: 0,
  isOpen: false,
  cooldownPeriod: 300000, // 5 minutes
  maxFailures: 3
};

// Simple in-memory cache
const landmarkCache = new Map<string, { data: LandmarkData; timestamp: number; }>();
const CACHE_DURATION = 300000; // 5 minutes

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      // Add retry headers to prevent aggressive retries
      headers: {
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function updateCircuitBreaker(success: boolean) {
  if (success) {
    circuitBreaker.failureCount = 0;
    circuitBreaker.isOpen = false;
  } else {
    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = Date.now();
    
    if (circuitBreaker.failureCount >= circuitBreaker.maxFailures) {
      circuitBreaker.isOpen = true;
      console.warn('Landmarks circuit breaker opened due to repeated failures');
    }
  }
}

function isCircuitBreakerOpen(): boolean {
  if (!circuitBreaker.isOpen) return false;
  
  // Check if cooldown period has passed
  const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
  if (timeSinceLastFailure >= circuitBreaker.cooldownPeriod) {
    circuitBreaker.isOpen = false;
    circuitBreaker.failureCount = 0;
    console.log('Landmarks circuit breaker reset after cooldown');
    return false;
  }
  
  return true;
}

function getFallbackData(propertyId: string): LandmarkData {
  return {
    property: {
      name: 'Property',
      address: 'Address not available',
      position: { lat: -37.8136, lng: 144.9631 }, // Melbourne fallback
      id: propertyId,
      is_demo: false
    },
    landmarks: []
  };
}

export async function getLandmarks(propertyId: string): Promise<LandmarkData> {
  // Check cache first
  const cached = landmarkCache.get(propertyId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('Returning cached landmarks data');
    return cached.data;
  }

  // Check circuit breaker
  if (isCircuitBreakerOpen()) {
    console.warn('Landmarks circuit breaker is open, returning fallback data');
    return getFallbackData(propertyId);
  }

  try {
    console.log('Fetching landmarks for property:', propertyId);
    
    // Use shorter timeout for landmarks to prevent blocking
    const response = await fetchWithTimeout(`/api/get-landmarks?propertyId=${propertyId}`, 8000);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Landmarks API Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      // For any non-success status, return fallback data
      console.warn('Landmarks API failed, returning fallback data');
      updateCircuitBreaker(false);
      return getFallbackData(propertyId);
    }
    
    const data = await response.json();
    console.log('Landmarks data received successfully');
    
    // Cache successful response
    landmarkCache.set(propertyId, {
      data,
      timestamp: Date.now()
    });
    
    updateCircuitBreaker(true);
    return data;
    
  } catch (error) {
    console.error('Error fetching landmarks (non-blocking):', error);
    updateCircuitBreaker(false);
    
    // ALWAYS return fallback data - never throw errors
    console.warn('Landmarks request failed, returning fallback data');
    return getFallbackData(propertyId);
  }
}

export async function saveLandmarks(data: LandmarkData): Promise<void> {
  try {
    const response = await fetch('/api/save-landmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save landmarks');
    }
    
    // Clear cache on successful save
    landmarkCache.delete(data.property.id);
  } catch (error) {
    console.error('Error saving landmarks:', error);
    throw error;
  }
}

export async function fetchLandmarksForProperty(propertyId: string, supabase: SupabaseClient): Promise<Landmark[]> {
  if (!propertyId) return []

  console.log('Fetching landmarks for property:', propertyId)
  
  try {
    const { data, error } = await supabase
      .from('landmarks')
      .select('*')
      .eq('property_id', propertyId)
    
    if (error) {
      console.error('Supabase error fetching landmarks:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Error fetching landmarks:', error);
    return [] // Return empty array on error
  }
}

// Utility function to check if landmarks are available (for UI purposes)
export function areLandmarksAvailable(data: LandmarkData): boolean {
  return data.landmarks.length > 0 && data.property.position.lat !== -37.8136;
}

// Utility function to preload landmarks in background
export function preloadLandmarks(propertyId: string): void {
  // Don't await - this runs in background
  getLandmarks(propertyId).catch(() => {
    // Silently fail - this is just preloading
  });
} 