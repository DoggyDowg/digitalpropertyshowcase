import type { Landmark, Property } from '@/types/maps';

export interface LandmarkData {
  property: Property;
  landmarks: Landmark[];
}

export async function getLandmarks(): Promise<LandmarkData> {
  try {
    const response = await fetch('/api/get-landmarks');
    if (!response.ok) {
      throw new Error('Failed to fetch landmarks');
    }
    return await response.json();
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