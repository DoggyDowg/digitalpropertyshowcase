'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { generateContentHash } from '@/utils/assetHash';
import { useDropzone } from 'react-dropzone';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Asset, AssetCategory, PropertyAssets } from '@/types/assets';
import { ASSET_CATEGORY_CONFIG } from '@/types/assets';
import Image from 'next/image';
import { Loader2, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { isValidYouTubeUrl, getYouTubeVideoId } from '@/lib/youtube';

interface PropertyAssetsProps {
  propertyId: string;
  onSave?: () => void;
  isDemoProperty?: boolean;
}

interface UploadProgress {
  [key: string]: number;
}

interface UploadZoneProps {
  category: AssetCategory;
  config: typeof ASSET_CATEGORY_CONFIG[keyof typeof ASSET_CATEGORY_CONFIG];
  onDrop: (files: File[], category: AssetCategory) => void;
  isAtCapacity: boolean;
}

function UploadZone({ category, config, onDrop, isAtCapacity }: UploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => onDrop(files, category),
    accept: config.acceptedTypes.reduce((acc, type) => {
      if (type === 'image') acc['image/*'] = [];
      if (type === 'video') acc['video/*'] = [];
      if (type === 'pdf') acc['application/pdf'] = [];
      if (type === 'glb') acc['model/gltf-binary'] = ['.glb'];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: config.maxFiles,
    disabled: isAtCapacity
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center
        transition-colors
        ${isAtCapacity 
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
          : isDragActive 
            ? 'border-blue-500 bg-blue-50 cursor-pointer' 
            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
        }
      `}
    >
      <input {...getInputProps()} />
      <Upload className={`mx-auto h-10 w-10 ${isAtCapacity ? 'text-gray-300' : 'text-gray-400'}`} />
      <p className={`mt-2 text-sm ${isAtCapacity ? 'text-gray-400' : 'text-gray-600'}`}>
        {isAtCapacity 
          ? `Maximum ${config.maxFiles} file${config.maxFiles > 1 ? 's' : ''} reached` 
          : isDragActive 
            ? 'Drop files here' 
            : `Drag files here or click to select (${config.acceptedTypes.map(type => {
              switch(type) {
                case 'pdf': return 'PDF';
                case 'glb': return 'GLB';
                default: return type;
              }
            }).join(', ')})`
        }
      </p>
      {isAtCapacity && (
        <p className="mt-1 text-xs text-gray-400">
          Delete existing file{config.maxFiles > 1 ? 's' : ''} to upload new ones
        </p>
      )}
    </div>
  );
}

export default function PropertyAssets({ propertyId, onSave, isDemoProperty }: PropertyAssetsProps) {
  const [assets, setAssets] = useState<PropertyAssets>({
    hero_video: undefined,
    gallery: [],
    your_home: undefined,
    neighbourhood: [],
    footer: undefined,
    floorplan: [],
    features_banner: undefined,
    lifestyle_banner: undefined,
    neighbourhood_banner: undefined,
    property_logo: undefined,
    '3d_tour': [],
    aerials: []
  });
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<string>('');
  const [virtualTourEnabled, setVirtualTourEnabled] = useState(false);
  const [has3DTourAssets, setHas3DTourAssets] = useState(false);
  const [heroVideo, setHeroVideo] = useState<{ url: string; type: 'upload' | 'youtube' } | null>(null);
  const [promoVideo, setPromoVideo] = useState<{ url: string; type: 'upload' | 'youtube' } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Move loadData outside of useEffect and wrap in useCallback
  const loadData = useCallback(async () => {
    if (!propertyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setUploadProgress({});
      setVirtualTourEnabled(false);
      setHas3DTourAssets(false);
      
      // Fetch assets
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('property_id', propertyId);
      
      if (assetError) throw assetError;
      
      // Fetch property virtual tour status
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('virtual_tour_enabled')
        .eq('id', propertyId)
        .single();
      
      if (propertyError) throw propertyError;

      // Group assets by category
      const grouped = assetData.reduce((acc: PropertyAssets, asset: Asset) => {
        if (asset.category === 'gallery' || asset.category === 'neighbourhood' || asset.category === 'floorplan' || asset.category === '3d_tour' || asset.category === 'aerials') {
          acc[asset.category] = [...(acc[asset.category] || []), asset];
        } else {
          acc[asset.category] = asset;
        }
        return acc;
      }, { gallery: [], neighbourhood: [], floorplan: [], '3d_tour': [], aerials: [] });

      setAssets(grouped);
      setVirtualTourEnabled(propertyData?.virtual_tour_enabled || false);
      
      // Check if there are any 3D tour assets
      const has3DTour = assetData?.some(asset => 
        asset.category === '3d_tour' && asset.status === 'active'
      ) || false;
      setHas3DTourAssets(has3DTour);

      // Load existing videos
      const videos = assetData.filter(a => a.type === 'video');
      if (videos.length > 0) {
        // Set hero video
        const heroVid = videos.find(v => v.video_type === 'hero');
        if (heroVid) {
          setHeroVideo({
            url: heroVid.source_type === 'youtube' 
              ? heroVid.external_url 
              : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${heroVid.storage_path}`,
            type: heroVid.source_type
          });
        }

        // Set promo video
        const promoVid = videos.find(v => v.video_type === 'promo');
        if (promoVid) {
          setPromoVideo({
            url: promoVid.source_type === 'youtube' 
              ? promoVid.external_url 
              : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${promoVid.storage_path}`,
            type: promoVid.source_type
          });
        }
      }

    } catch (err) {
      console.error('Error loading assets:', err);
      setError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [propertyId, supabase]);

  // Load existing assets and virtual tour status
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        setError('You must be logged in to upload files');
        console.error('Authentication error:', error);
      }
      setLoading(false);
    }
    checkAuth();
  }, [supabase]);

  // Handle file drops
  const onDrop = useCallback(async (acceptedFiles: File[], category: AssetCategory) => {
    // For demo properties, only allow property_logo uploads
    if (isDemoProperty && category !== 'property_logo') {
      toast.error('Demo properties can only update their property logo. Other assets are loaded from the demo assets directory.');
      return;
    }

    const config = ASSET_CATEGORY_CONFIG[category];
    
    // Check capacity for both multi-file and single-file categories
    if (category === 'gallery' || category === 'neighbourhood' || category === 'floorplan' || category === 'aerials') {
      const currentCount = assets[category]?.length || 0;
      if (currentCount >= config.maxFiles) {
        toast.error(`Maximum ${config.maxFiles} files reached for ${config.label}. Please delete at least one file to continue.`);
        return;
      }
      if (currentCount + acceptedFiles.length > config.maxFiles) {
        toast.error(`Can only upload ${config.maxFiles - currentCount} more files for ${config.label}.`);
        return;
      }
    } else if (assets[category]) {
      toast.error(`${config.label} already has a file. Please delete the existing file to upload a new one.`);
      return;
    }

    // Upload files
    for (const file of acceptedFiles) {
      const fileId = Math.random().toString(36).substring(7);
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        // Validate file type
        const fileType = file.type;
        const isImage = fileType.startsWith('image/');
        const isVideo = fileType.startsWith('video/');
        const isPDF = fileType === 'application/pdf';
        const isGLB = fileType === 'model/gltf-binary' || file.name.endsWith('.glb');
        
        if (!config.acceptedTypes.some(type => 
          (type === 'image' && isImage) || 
          (type === 'video' && isVideo) || 
          (type === 'pdf' && isPDF) ||
          (type === 'glb' && isGLB)
        )) {
          throw new Error(`Invalid file type. Accepted types for ${config.label}: ${config.acceptedTypes.join(', ')}`);
        }

        // For OG images, validate and optimize before upload
        let fileToUpload = file;
        if (category === 'og_image' && isImage) {
          try {
            // Create FormData and append the file
            const formData = new FormData();
            formData.append('file', file);

            // Send to optimization API
            const response = await fetch('/api/optimize-image', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to optimize image');
            }

            // Get the optimized image blob
            const optimizedBlob = await response.blob();
            
            // Convert optimized blob to File
            fileToUpload = new File([optimizedBlob], file.name, {
              type: 'image/jpeg'
            });
          } catch (error) {
            throw new Error(
              error instanceof Error 
                ? error.message 
                : 'Failed to optimize image for social sharing'
            );
          }
        }

        // Generate a clean filename (remove special characters, spaces, etc)
        const cleanFileName = file.name.toLowerCase()
          .replace(/[^a-z0-9.]/g, '_')
          .replace(/_+/g, '_');

        // Generate content hash for cache busting
        const contentHash = await generateContentHash(fileToUpload);

        // Create the storage path using the directory configuration
        const path = `${propertyId}/${config.directory}/${cleanFileName}`;
        
        console.log('Uploading file:', {
          name: file.name,
          size: fileToUpload.size,
          type: fileToUpload.type,
          category,
          path,
          contentHash
        });

        // Create a new Blob with the correct MIME type
        const blob = new Blob([fileToUpload], { type: fileToUpload.type });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property-assets')
          .upload(path, blob, {
            contentType: fileToUpload.type,
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Storage upload error:', {
            error: uploadError,
            message: uploadError.message,
            name: uploadError.name
          });
          throw new Error(`Failed to upload video: ${uploadError.message}`);
        }

        if (!uploadData?.path) {
          throw new Error('No upload path returned from storage');
        }

        console.log('File uploaded successfully:', uploadData);

        // Create asset record
        const asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'> = {
          property_id: propertyId,
          category,
          type: isGLB ? 'glb' : isPDF ? 'pdf' : isVideo ? 'video' : 'image',
          filename: cleanFileName,
          storage_path: uploadData.path,
          status: 'active',
          title: file.name.split('.')[0].replace(/_/g, ' '),
          alt_text: `${config.label} - ${file.name.split('.')[0].replace(/_/g, ' ')}`
        };

        console.log('Creating asset record:', asset);

        try {
          const response = await fetch('/api/assets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(asset),
          });

          if (!response.ok) {
            const error = await response.json();
            if (isPDF && error.message?.includes('type')) {
              throw new Error('PDF uploads are temporarily unavailable. Please contact support to enable this feature.');
            }
            throw new Error(error.message || 'Failed to create asset record');
          }

          const assetData = await response.json();
          console.log('Asset record created:', assetData);

          // Update state
          setAssets(prev => {
            if (category === 'gallery' || category === 'neighbourhood' || category === 'floorplan') {
              return {
                ...prev,
                [category]: [...(prev[category] || []), assetData]
              };
            }
            return {
              ...prev,
              [category]: assetData
            };
          });

          // Show success message
          toast.success(`${file.name} uploaded successfully`);
          setError('');
          onSave?.();
        } catch (err) {
          console.error('Error creating asset record:', err);
          throw err;
        }
      } catch (err) {
        console.error('Error uploading file:', {
          error: err,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          errorStack: err instanceof Error ? err.stack : undefined,
          file: {
            name: file.name,
            size: file.size,
            type: file.type
          }
        });
        toast.error(err instanceof Error ? err.message : 'Failed to upload file');
      } finally {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }
  }, [propertyId, assets, supabase, onSave, isDemoProperty]);

  // Delete asset
  const handleDelete = async (asset: Asset) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('property-assets')
        .remove([asset.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('assets')
        .delete()
        .eq('id', asset.id);

      if (dbError) throw dbError;

      // Update state
      setAssets(prev => {
        if (asset.category === 'gallery' || asset.category === 'neighbourhood') {
          return {
            ...prev,
            [asset.category]: prev[asset.category].filter(a => a.id !== asset.id)
          };
        }
        const newAssets = { ...prev };
        delete newAssets[asset.category];
        return newAssets;
      });
      onSave?.();
    } catch (err) {
      console.error('Error deleting asset:', err);
      setError('Failed to delete asset');
    }
  };

  // Group asset categories by directory
  const assetsByDirectory = React.useMemo(() => {
    return Object.entries(ASSET_CATEGORY_CONFIG).reduce((acc, [category, config]) => {
      if (!acc[config.directory]) {
        acc[config.directory] = [];
      }
      acc[config.directory].push({ category, config });
      return acc;
    }, {} as Record<string, { category: string; config: typeof ASSET_CATEGORY_CONFIG[keyof typeof ASSET_CATEGORY_CONFIG] }[]>);
  }, []);

  // Handle virtual tour toggle
  const handleVirtualTourToggle = async (enabled: boolean) => {
    try {
      if (enabled && !has3DTourAssets) {
        toast.error('Please upload at least one 3D tour asset first');
        return;
      }

      const { error } = await supabase
        .from('properties')
        .update({ virtual_tour_enabled: enabled })
        .eq('id', propertyId);

      if (error) throw error;

      setVirtualTourEnabled(enabled);
      toast.success('Virtual tour settings updated');
    } catch (err) {
      console.error('Error updating virtual tour status:', err);
      toast.error('Failed to update virtual tour settings');
    }
  };

  // Handle video upload
  const handleVideoUpload = async (files: File[], videoType: 'hero' | 'promo') => {
    const loadingToast = toast.loading(`Uploading ${videoType} video...`);
    try {
      if (files.length === 0) {
        toast.dismiss(loadingToast);
        return;
      }
      const file = files[0]; // Only use the first file

      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast.dismiss(loadingToast);
        toast.error('Please upload a valid video file');
        return;
      }

      // Delete existing video of this type first
      const { data: existingVideos, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('property_id', propertyId)
        .eq('type', 'video')
        .eq('video_type', videoType);

      if (fetchError) {
        console.error('Error fetching existing videos:', fetchError);
        throw new Error('Failed to check for existing videos');
      }

      if (existingVideos?.length) {
        // Delete from storage if it was an upload
        for (const video of existingVideos) {
          if (video.source_type === 'upload') {
            const { error: deleteError } = await supabase.storage
              .from('property-assets')
              .remove([video.storage_path]);
            
            if (deleteError) {
              console.error('Error deleting existing video from storage:', deleteError);
              throw new Error('Failed to delete existing video from storage');
            }
          }
        }

        // Delete from database
        const { error: dbDeleteError } = await supabase
          .from('assets')
          .delete()
          .eq('property_id', propertyId)
          .eq('video_type', videoType);

        if (dbDeleteError) {
          console.error('Error deleting existing video from database:', dbDeleteError);
          throw new Error('Failed to delete existing video from database');
        }
      }

      // Upload new video
      const cleanFileName = file.name.toLowerCase()
        .replace(/[^a-z0-9.]/g, '_')
        .replace(/_+/g, '_');

      const path = `${propertyId}/videos/${videoType}/${cleanFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-assets')
        .upload(path, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', {
          error: uploadError,
          message: uploadError.message,
          name: uploadError.name
        });
        throw new Error(`Failed to upload video: ${uploadError.message}`);
      }

      if (!uploadData?.path) {
        throw new Error('No upload path returned from storage');
      }

      // Create asset record
      const { error: dbError } = await supabase
        .from('assets')
        .insert([{
          property_id: propertyId,
          type: 'video',
          video_type: videoType,
          source_type: 'upload',
          filename: cleanFileName,
          storage_path: uploadData.path,
          status: 'active',
          category: `${videoType}_video` // Add the category field
        }]);

      if (dbError) {
        console.error('Database insert error:', {
          error: dbError,
          message: dbError.message,
          code: dbError.code,
          details: dbError.details,
          hint: dbError.hint
        });
        // If the upload succeeded but DB insert failed, try to clean up the uploaded file
        await supabase.storage
          .from('property-assets')
          .remove([uploadData.path]);
        throw new Error(`Failed to create asset record: ${dbError.message}`);
      }

      // Update state
      const videoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${uploadData.path}`;
      if (videoType === 'hero') {
        setHeroVideo({ url: videoUrl, type: 'upload' });
      } else {
        setPromoVideo({ url: videoUrl, type: 'upload' });
      }

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(`${videoType === 'hero' ? 'Hero' : 'Promo'} video uploaded successfully`);
      onSave?.();
    } catch (error) {
      // Make sure to dismiss the loading toast
      toast.dismiss(loadingToast);
      
      console.error('Error uploading video:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error(error instanceof Error ? error.message : 'Failed to upload video', {
        duration: 5000 // Add a duration to auto-dismiss error toasts
      });
    }
  };

  // Update handleYouTubeUrl to also include category
  const handleYouTubeUrl = async (url: string, videoType: 'hero' | 'promo') => {
    const loadingToast = toast.loading(`Adding ${videoType} video from YouTube...`);
    try {
      if (!isValidYouTubeUrl(url)) {
        toast.dismiss(loadingToast);
        toast.error('Please enter a valid YouTube URL', { duration: 5000 });
        return;
      }

      // Delete existing video of this type first
      const { data: existingVideos, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('property_id', propertyId)
        .eq('type', 'video')
        .eq('video_type', videoType);

      if (fetchError) {
        console.error('Error fetching existing videos:', fetchError);
        throw fetchError;
      }

      if (existingVideos?.length) {
        // Delete from storage if it was an upload
        for (const video of existingVideos) {
          if (video.source_type === 'upload') {
            const { error: deleteError } = await supabase.storage
              .from('property-assets')
              .remove([video.storage_path]);
              
            if (deleteError) {
              console.error('Error deleting existing video:', deleteError);
              throw deleteError;
            }
          }
        }

        // Delete from database
        const { error: deleteError } = await supabase
          .from('assets')
          .delete()
          .eq('property_id', propertyId)
          .eq('video_type', videoType);

        if (deleteError) {
          console.error('Error deleting existing video record:', deleteError);
          throw deleteError;
        }
      }

      // Create asset record
      const videoId = getYouTubeVideoId(url);
      if (!videoId) {
        throw new Error('Could not extract video ID from URL');
      }

      const { data: insertData, error: dbError } = await supabase
        .from('assets')
        .insert([{
          property_id: propertyId,
          type: 'video',
          video_type: videoType,
          source_type: 'youtube',
          external_url: url,
          status: 'active',
          category: 'promo_video',
          filename: `youtube_${videoId}.mp4`,
          title: `YouTube Video ${videoId}`,
          storage_path: `youtube/${videoId}` // Add a placeholder storage path for YouTube videos
        }])
        .select()
        .single();

      if (dbError) {
        console.error('Error creating YouTube video record:', dbError);
        throw dbError;
      }

      if (!insertData) {
        throw new Error('No data returned from insert operation');
      }

      // Update state
      if (videoType === 'hero') {
        setHeroVideo({ url, type: 'youtube' });
      } else {
        setPromoVideo({ url, type: 'youtube' });
      }

      // Reload assets to ensure everything is in sync
      loadData();

      toast.dismiss(loadingToast);
      toast.success(`${videoType === 'hero' ? 'Hero' : 'Promo'} video added successfully`, {
        duration: 5000
      });
      onSave?.();
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error adding YouTube video:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to add YouTube video', 
        { duration: 5000 }
      );
    }
  };

  const removeVideo = async (videoType: 'hero' | 'promo') => {
    try {
      const { data: existingVideos } = await supabase
        .from('assets')
        .select('*')
        .eq('property_id', propertyId)
        .eq('type', 'video')
        .eq('video_type', videoType)

      if (existingVideos?.length) {
        // Delete from storage if it was an upload
        for (const video of existingVideos) {
          if (video.source_type === 'upload') {
            await supabase.storage
              .from('property-assets')
              .remove([video.storage_path])
          }
        }

        // Delete from database
        await supabase
          .from('assets')
          .delete()
          .eq('property_id', propertyId)
          .eq('video_type', videoType)
      }

      // Update state
      if (videoType === 'hero') {
        setHeroVideo(null)
      } else {
        setPromoVideo(null)
      }

      toast.success(`${videoType === 'hero' ? 'Hero' : 'Promo'} video removed`)
      onSave?.()
    } catch (error) {
      console.error('Error removing video:', error)
      toast.error('Failed to remove video')
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Loading skeleton for each section */}
        {['Hero Video', 'Promo Video', 'Gallery', 'Features', 'Lifestyle', 'Neighbourhood'].map((section) => (
          <div key={section} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {isDemoProperty && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-600">
            This is a demo property. Only the property logo can be updated. All other assets are loaded from the demo assets directory.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Videos Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold capitalize border-b pb-2">Videos</h2>
        
        {/* Hero Video */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Hero Video</h3>
            <p className="text-sm text-gray-600 mt-1">
              The hero video will be used as a background video in certain sections of the property showcase. 
              It should be a short, high-quality video that looks good when looped. Sound is not necessary as it will be muted.
              <br />
              <strong className="text-gray-700">Note:</strong> Only direct video uploads are allowed for the hero video to ensure optimal performance as a background video.
            </p>
          </div>
          
          {heroVideo ? (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <video
                  src={heroVideo.url}
                  className="w-full h-full object-cover"
                  controls
                />
              </div>
              <button
                onClick={() => removeVideo('hero')}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
              >
                Remove Video
              </button>
            </div>
          ) : (
            <div>
              <UploadZone
                category="hero_video"
                config={{
                  label: "Hero Video",
                  directory: "videos",
                  maxFiles: 1,
                  acceptedTypes: ["video"],
                  description: "Upload a video file for the hero section",
                  required: false
                }}
                onDrop={(files) => handleVideoUpload(files, 'hero')}
                isAtCapacity={false}
              />
            </div>
          )}
        </div>

        {/* Promo Video */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Promo Video</h3>
            <p className="text-sm text-gray-600 mt-1">
              The promo video will be displayed in the More Info section and can be viewed in full screen with sound. 
              You can either upload a video file or provide a YouTube URL.
              If no promo video is set, the hero video will be used as a fallback.
            </p>
          </div>
          
          {promoVideo ? (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {promoVideo.type === 'upload' ? (
                  <video
                    src={promoVideo.url}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(promoVideo.url)}?rel=0&modestbranding=1&playsinline=1&showinfo=0&enablejsapi=1&origin=${process.env.NEXT_PUBLIC_APP_URL}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
              <button
                onClick={() => removeVideo('promo')}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
              >
                Remove Video
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <UploadZone
                category="promo_video"
                config={{
                  label: "Promo Video",
                  directory: "videos",
                  maxFiles: 1,
                  acceptedTypes: ["video"],
                  description: "Upload a video file for the promo section",
                  required: false
                }}
                onDrop={(files) => handleVideoUpload(files, 'promo')}
                isAtCapacity={false}
              />
              <div className="flex items-center">
                <span className="text-sm text-gray-500">or</span>
                <form 
                  className="flex-1 ml-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.querySelector('input');
                    const url = input?.value.trim();
                    if (url) {
                      handleYouTubeUrl(url, 'promo');
                      // Clear input after submission
                      if (input) input.value = '';
                    }
                  }}
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter YouTube URL"
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Asset Categories */}
      {Object.entries(assetsByDirectory).map(([directory, categories]) => (
        <div key={directory} className="space-y-4">
          <h2 className="text-xl font-semibold capitalize border-b pb-2">
            {directory.replace('_', ' ')}
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {categories.map(({ category, config }) => (
              category !== '3d_tour' && (  // Skip 3D tour category here
                <div key={category} className={`bg-white rounded-lg shadow p-6 ${
                  isDemoProperty && category !== 'property_logo' ? 'opacity-50' : ''
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        {config.label}
                        {config.required && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Required</span>
                        )}
                        {isDemoProperty && category !== 'property_logo' && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Demo Asset</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {isDemoProperty && category !== 'property_logo' 
                          ? 'This asset is managed through the demo assets directory.'
                          : config.description
                        }
                      </p>
                    </div>
                    {assets[category as keyof PropertyAssets] && (
                      <div className="text-xs text-gray-500">
                        {Array.isArray(assets[category as keyof PropertyAssets])
                          ? `${(assets[category as keyof PropertyAssets] as Asset[]).length}/${config.maxFiles} files`
                          : '1/1 file'
                        }
                      </div>
                    )}
                  </div>

                  {/* Current Assets */}
                  {assets[category as keyof PropertyAssets] && (
                    <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {Array.isArray(assets[category as keyof PropertyAssets])
                        ? (assets[category as keyof PropertyAssets] as Asset[]).map((asset) => (
                          <div key={asset.id} className="relative group">
                            {asset.type === 'video' ? (
                              <video
                                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${asset.storage_path}`}
                                controls
                                className="rounded-lg object-cover w-full aspect-video"
                              />
                            ) : asset.type === 'pdf' ? (
                              <div className="relative aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs text-gray-600 text-center break-all">
                                  {asset.filename}
                                </span>
                                <a
                                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${asset.storage_path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                                >
                                  View PDF
                                </a>
                              </div>
                            ) : asset.type === 'glb' ? (
                              <div className="relative aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                <span className="text-xs text-gray-600 text-center break-all">
                                  {asset.filename}
                                </span>
                                <a
                                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${asset.storage_path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Download GLB
                                </a>
                              </div>
                            ) : (
                              <div className="relative aspect-square">
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${asset.storage_path}`}
                                  alt={asset.title || asset.filename}
                                  fill
                                  className="rounded-lg object-cover"
                                />
                              </div>
                            )}
                            <button
                              onClick={() => handleDelete(asset)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                        : (assets[category as keyof PropertyAssets] as Asset) && (
                          <div className="relative group">
                            {(assets[category as keyof PropertyAssets] as Asset).type === 'video' ? (
                              <video
                                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${(assets[category as keyof PropertyAssets] as Asset).storage_path}`}
                                controls
                                className="rounded-lg object-cover w-full aspect-video"
                              />
                            ) : (
                              <div className="relative aspect-square">
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${(assets[category as keyof PropertyAssets] as Asset).storage_path}`}
                                  alt={(assets[category as keyof PropertyAssets] as Asset).title || (assets[category as keyof PropertyAssets] as Asset).filename}
                                  fill
                                  className="rounded-lg object-cover"
                                />
                              </div>
                            )}
                            <button
                              onClick={() => handleDelete(assets[category as keyof PropertyAssets] as Asset)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      }
                    </div>
                  )}

                  {/* Upload Area - Only show for property_logo in demo mode */}
                  {(!isDemoProperty || category === 'property_logo') && (
                    <UploadZone
                      category={category as AssetCategory}
                      config={config}
                      onDrop={onDrop}
                      isAtCapacity={
                        Array.isArray(assets[category as keyof PropertyAssets])
                          ? (assets[category as keyof PropertyAssets] as Asset[]).length >= config.maxFiles
                          : Boolean(assets[category as keyof PropertyAssets])
                      }
                    />
                  )}
                </div>
              )
            ))}
          </div>
        </div>
      ))}

      {/* 3D Tour Section - Now at the bottom */}
      <section className="border-t pt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">3D Tour</h3>
          <div className="flex items-center space-x-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={virtualTourEnabled}
                onChange={(e) => handleVirtualTourToggle(e.target.checked)}
                disabled={!has3DTourAssets}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Enable Virtual Tour Button
              </span>
            </label>
            {!has3DTourAssets && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Upload a 3D model first
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">3D Model Files</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Upload GLB files for the virtual tour viewer. The model will be automatically centered and scaled.
                </p>
              </div>
              {assets['3d_tour'] && (
                <div className="text-xs text-gray-500">
                  {Array.isArray(assets['3d_tour']) 
                    ? `${assets['3d_tour'].length}/${ASSET_CATEGORY_CONFIG['3d_tour'].maxFiles} files` 
                    : '1/1 file'
                  }
                </div>
              )}
            </div>

            {/* Current 3D Tour Assets */}
            {assets['3d_tour'] && assets['3d_tour'].length > 0 && (
              <div className="mt-4 space-y-3">
                {assets['3d_tour'].map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium">{asset.filename}</div>
                        <div className="text-xs text-gray-500">GLB Model</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(asset)}
                      className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Zone */}
            <div className="mt-4">
              <UploadZone
                category="3d_tour"
                config={ASSET_CATEGORY_CONFIG['3d_tour']}
                onDrop={onDrop}
                isAtCapacity={
                  Array.isArray(assets['3d_tour']) 
                    ? assets['3d_tour'].length >= ASSET_CATEGORY_CONFIG['3d_tour'].maxFiles 
                    : false
                }
              />
            </div>

            {/* Upload Progress */}
            {Object.entries(uploadProgress).map(([id, progress]) => (
              <div key={id} className="mt-4">
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="ml-2 text-sm text-gray-600">{Math.round(progress)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}