import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Asset } from '@/types/assets';
import FloorplanEditorWindow from './FloorplanEditorWindow';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FloorplanEditorProps {
  propertyId: string;
  floorplanAsset?: Asset;
  onSave?: () => void;
}

interface FloorplanData {
  property_id: string;
  file_path: string;
  original_width: number;
  original_height: number;
  pixels_per_meter: number;
  calibration_method: string;
  regions: Array<{
    id: string;
    name: string;
    type: 'room' | 'hallway' | 'outdoor' | 'other';
    points: Array<{ x: number; y: number }>;
  }>;
  metadata: Record<string, unknown>;
}

export default function FloorplanEditor({ propertyId, floorplanAsset, onSave }: FloorplanEditorProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [existingData, setExistingData] = useState<FloorplanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadFloorplanData() {
      try {
        const { data, error } = await supabase
          .from('floorplans')
          .select('*')
          .eq('property_id', propertyId)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error loading floorplan data:', error);
          }
          setExistingData(null);
        } else {
          // Check if the existing data matches the current floorplan
          if (data.file_path !== floorplanAsset?.storage_path) {
            // Settings exist but for a different floorplan image
            setExistingData(null);
            toast.warning('Previous floorplan settings found but the image has changed. Please reconfigure the floorplan.');
          } else {
            setExistingData(data);
          }
        }
      } catch (err) {
        console.error('Error loading floorplan data:', err);
        setExistingData(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (propertyId && floorplanAsset) {
      loadFloorplanData();
    } else {
      setIsLoading(false);
    }
  }, [propertyId, floorplanAsset, supabase]);

  if (!floorplanAsset) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          Please upload a floorplan image first to enable the interactive floorplan editor.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Loading floorplan data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {existingData ? (
        <div className="p-4 bg-white rounded-lg border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Interactive Floorplan</h3>
              <p className="text-sm text-gray-500">
                Scale: 1 pixel = {(1/existingData.pixels_per_meter).toFixed(3)}m
              </p>
              <p className="text-sm text-gray-500">
                Regions: {existingData.regions.length} mapped areas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditorOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Pencil className="w-4 h-4" />
                Edit Floorplan
              </button>
            </div>
          </div>
          
          {/* Region List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Mapped Regions:</h4>
              {existingData.regions.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear All
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Regions</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete all {existingData.regions.length} regions? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('floorplans')
                              .update({ regions: [] })
                              .eq('property_id', propertyId);
                            
                            if (error) throw error;
                            
                            // Update local state immediately
                            setExistingData(prev => prev ? {
                              ...prev,
                              regions: []
                            } : null);
                            
                            toast.success('All regions cleared');
                          } catch (err) {
                            console.error('Error clearing regions:', err);
                            toast.error('Failed to clear regions');
                          }
                        }}
                      >
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {existingData.regions
                .map(region => (
                  <div key={region.id} className={`p-2 rounded flex items-center justify-between ${
                    region.points.length < 3 ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{region.name}</p>
                        {region.points.length < 3 && (
                          <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                            Incomplete
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 capitalize">{region.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        region.points.length < 3 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {region.points.length} points
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            const updatedRegions = existingData.regions.filter(r => r.id !== region.id);
                            const { error } = await supabase
                              .from('floorplans')
                              .update({ regions: updatedRegions })
                              .eq('property_id', propertyId);
                            
                            if (error) throw error;
                            
                            // Update local state immediately
                            setExistingData(prev => prev ? {
                              ...prev,
                              regions: updatedRegions
                            } : null);
                            
                            // Show specific toast for region deletion
                            toast.success(`Region "${region.name}" deleted`);
                          } catch (err) {
                            console.error('Error deleting region:', err);
                            toast.error('Failed to delete region');
                          }
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete region"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsEditorOpen(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Configure Interactive Floorplan
        </button>
      )}

      {isEditorOpen && (
        <FloorplanEditorWindow
          propertyId={propertyId}
          floorplanAsset={floorplanAsset}
          onClose={() => setIsEditorOpen(false)}
          onSave={() => {
            onSave?.();
            setIsEditorOpen(false);
          }}
          existingData={existingData}
        />
      )}
    </div>
  );
} 