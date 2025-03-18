'use client'

import React, { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Asset } from '@/types/assets';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

interface FloorplanViewerProps {
  propertyId: string;
  floorplanAsset: Asset;
  onClose?: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Region {
  id: string;
  name: string;
  type: 'room' | 'hallway' | 'outdoor' | 'other';
  points: Point[];
  metadata: {
    dimensions?: {
      width: number;
      height: number;
      area: number;
    };
  };
}

interface FloorplanData {
  property_id: string;
  file_path: string;
  original_width: number;
  original_height: number;
  pixels_per_meter: number;
  calibration_method: string;
  regions: Region[];
  metadata: Record<string, unknown>;
}

export default function FloorplanViewer({ propertyId, floorplanAsset, onClose }: FloorplanViewerProps) {
  console.log('FloorplanViewer - Props:', { propertyId, floorplanAsset });
  
  const [floorplanData, setFloorplanData] = useState<FloorplanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const supabase = createClientComponentClient();

  // Define drawCanvas before any useEffect that references it
  const drawCanvas = React.useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !isImageLoaded) {
      console.log('FloorplanViewer - drawCanvas: Not ready to draw', {
        hasCanvas: !!canvasRef.current,
        hasImage: !!imageRef.current,
        isImageLoaded
      });
      return;
    }

    console.log('FloorplanViewer - Drawing canvas...');
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('FloorplanViewer - Failed to get canvas context');
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    console.log('FloorplanViewer - Drawing image with:', { pan, zoom });
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    ctx.drawImage(imageRef.current, 0, 0);
    ctx.restore();

    // Draw regions
    if (floorplanData?.regions?.length) {
      console.log('FloorplanViewer - Drawing regions:', floorplanData.regions);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      floorplanData.regions.forEach(region => {
        if (region.points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(region.points[0].x, region.points[0].y);
        
        for (let i = 1; i < region.points.length; i++) {
          ctx.lineTo(region.points[i].x, region.points[i].y);
        }
        
        if (region.points.length > 2) {
          ctx.closePath();
        }
        
        ctx.fillStyle = 'rgba(0, 128, 255, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 128, 255, 0.8)';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();

        // Draw region name and dimensions
        const centerX = region.points.reduce((sum, p) => sum + p.x, 0) / region.points.length;
        const centerY = region.points.reduce((sum, p) => sum + p.y, 0) / region.points.length;
        
        ctx.fillStyle = 'black';
        ctx.font = `${14 / zoom}px Arial`;
        ctx.textAlign = 'center';
        
        ctx.fillText(region.name, centerX, centerY);
        
        if (region.metadata?.dimensions) {
          const dims = region.metadata.dimensions;
          ctx.font = `${12 / zoom}px Arial`;
          ctx.fillText(`${dims.width}m × ${dims.height}m`, centerX, centerY + 20 / zoom);
          ctx.fillText(`Area: ${dims.area}m²`, centerX, centerY + 40 / zoom);
        }
      });

      ctx.restore();
    }
  }, [pan, zoom, floorplanData, isImageLoaded]);

  // Load image first
  useEffect(() => {
    const img = new Image();
    img.src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${floorplanAsset.storage_path}`;
    
    console.log('FloorplanViewer - Loading image from:', img.src);
    
    img.onload = () => {
      console.log('FloorplanViewer - Image loaded successfully:', { width: img.width, height: img.height });
      imageRef.current = img;
      setImageSize({ width: img.width, height: img.height });
      setIsImageLoaded(true);
    };

    img.onerror = (err) => {
      console.error('FloorplanViewer - Error loading image:', err);
      setError(new Error('Failed to load floorplan image'));
    };
  }, [floorplanAsset.storage_path]);

  // Initialize canvas after image is loaded
  useEffect(() => {
    if (!isImageLoaded || !imageRef.current || !containerRef.current || !canvasRef.current) return;

    console.log('FloorplanViewer - Setting up canvas...');
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = imageRef.current;
    
    // Set canvas size to match container's pixel dimensions
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;

    // Calculate initial zoom and pan
    const padding = 40;
    const scaleX = (container.clientWidth - padding * 2) / img.width;
    const scaleY = (container.clientHeight - padding * 2) / img.height;
    const fitScale = Math.min(scaleX, scaleY);
    
    const centerX = (container.clientWidth - (img.width * fitScale)) / 2;
    const centerY = (container.clientHeight - (img.height * fitScale)) / 2;
    
    setZoom(fitScale);
    setPan({ x: centerX, y: centerY });
    
    // Draw initial canvas
    drawCanvas();
  }, [isImageLoaded, drawCanvas]);

  // Add debug logging for floorplan data loading
  useEffect(() => {
    console.log('FloorplanViewer - Loading floorplan data...');
    async function loadFloorplanData() {
      try {
        const { data, error } = await supabase
          .from('floorplans')
          .select('*')
          .eq('property_id', propertyId)
          .single();

        console.log('FloorplanViewer - Supabase response:', { data, error });

        if (error) {
          if (error.code !== 'PGRST116') { // PGRST116 is "not found"
            throw error;
          }
          console.log('FloorplanViewer - No existing floorplan data found');
          return; // No existing floorplan data
        }

        if (data) {
          console.log('FloorplanViewer - Setting floorplan data:', data);
          setFloorplanData(data);
        }
      } catch (err) {
        console.error('FloorplanViewer - Error loading floorplan data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load floorplan data'));
      } finally {
        setLoading(false);
      }
    }

    loadFloorplanData();
  }, [propertyId, supabase]);

  // Update canvas size on container resize
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          // Update canvas size while maintaining pixel density
          const dpr = window.devicePixelRatio || 1;
          canvas.style.width = `${entry.contentRect.width}px`;
          canvas.style.height = `${entry.contentRect.height}px`;
          canvas.width = entry.contentRect.width * dpr;
          canvas.height = entry.contentRect.height * dpr;
          
          drawCanvas();
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [drawCanvas]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPan(prev => ({
      x: prev.x + (x - dragStart.x),
      y: prev.y + (y - dragStart.y)
    }));

    setDragStart({ x, y });
    drawCanvas();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current || !imageSize) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate point under mouse in image coordinates
    const pointXBeforeZoom = (mouseX - pan.x) / zoom;
    const pointYBeforeZoom = (mouseY - pan.y) / zoom;

    // Update zoom with smoother control
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5);
    setZoom(newZoom);

    // Adjust pan to keep point under mouse
    const newPanX = mouseX - pointXBeforeZoom * newZoom;
    const newPanY = mouseY - pointYBeforeZoom * newZoom;
    setPan({ x: newPanX, y: newPanY });

    drawCanvas();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Update canvas when zoom or pan changes
  useEffect(() => {
    console.log('FloorplanViewer - Zoom or pan changed, redrawing canvas');
    drawCanvas();
  }, [zoom, pan, floorplanData, drawCanvas]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Loading floorplan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p className="text-red-600">Error loading floorplan: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col" ref={containerRef}>
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Interactive Floorplan</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              ×
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Instructions */}
            <div className="text-sm text-gray-600">
              <p>
                🖱️ {isPanning ? 'Drag to pan' : 'Click and drag to pan'}<br />
                🖲️ Mouse wheel to zoom
              </p>
            </div>

            {/* Right side - View controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Zoom: {(zoom * 100).toFixed(0)}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(z + 0.2, 5))}
                  className="p-2 bg-gray-100 rounded hover:bg-gray-200"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(z => Math.max(z - 0.2, 0.1))}
                  className="p-2 bg-gray-100 rounded hover:bg-gray-200"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (!containerRef.current || !imageSize) return;
                    const padding = 40;
                    const scaleX = (containerRef.current.clientWidth - padding * 2) / imageSize.width;
                    const scaleY = (containerRef.current.clientHeight - padding * 2) / imageSize.height;
                    const fitScale = Math.min(scaleX, scaleY);
                    setZoom(fitScale);
                    const centerX = (containerRef.current.clientWidth - (imageSize.width * fitScale)) / 2;
                    const centerY = (containerRef.current.clientHeight - (imageSize.height * fitScale)) / 2;
                    setPan({ x: centerX, y: centerY });
                  }}
                  className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                  title="Fit to View"
                >
                  Fit to View
                </button>
              </div>
              <div className="h-6 w-px bg-gray-200" />
              <button
                onClick={() => setIsPanning(!isPanning)}
                className={`px-3 py-2 rounded flex items-center gap-2 ${
                  isPanning ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
                title="Toggle Pan Mode"
              >
                <Move className="w-4 h-4" />
                <span className="text-sm">Pan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden relative">
          <canvas
            ref={canvasRef}
            style={{ 
              cursor: isPanning || isDragging ? 'grabbing' : 'grab',
              width: '100%',
              height: '100%'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={handleContextMenu}
            onWheel={handleWheel}
          />
        </div>
      </div>
    </div>
  );
} 