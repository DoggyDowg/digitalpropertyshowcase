import type { Landmark, Property } from '@/types/maps';

export interface LandmarkData {
  property: Property;
  landmarks: Landmark[];
}

export async function getLandmarks(propertyId: string): Promise<LandmarkData> {
  try {
    console.log('Fetching landmarks for property:', propertyId);
    const response = await fetch(`/api/get-landmarks?propertyId=${propertyId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`Failed to fetch landmarks: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Landmarks data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching landmarks:', error);
    throw error;
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
  } catch (error) {
    console.error('Error saving landmarks:', error);
    throw error;
  }
} 