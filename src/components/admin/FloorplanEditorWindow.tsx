import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Asset } from '@/types/assets';
import { X, ZoomIn, ZoomOut, Move, Ruler, Info, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FloorplanEditorWindowProps {
  propertyId: string;
  floorplanAsset: Asset;
  onClose: () => void;
  onSave: () => void;
  existingData?: {
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
  } | null;
}

interface Region {
  id: string;
  name: string;
  type: 'room' | 'hallway' | 'outdoor' | 'other';
  points: Array<{ x: number; y: number }>;
  metadata?: {
    dimensions?: {
      width: number;
      height: number;
      area: number;
    };
  };
}

interface Point {
  x: number;
  y: number;
}

type EditorMode = 'crop' | 'scale' | 'region' | 'pan';
type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Add new types
type DrawingMode = 'freeform' | 'rectangle';

export default function FloorplanEditorWindow({ 
  propertyId, 
  floorplanAsset, 
  onClose,
  onSave,
  existingData 
}: FloorplanEditorWindowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(existingData?.pixels_per_meter || null);
  const [regions, setRegions] = useState<Region[]>(existingData?.regions || []);
  const [mode, setMode] = useState<EditorMode>(existingData ? 'region' : 'crop');
  const [previousMode, setPreviousMode] = useState<EditorMode>('crop');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [scalePoints, setScalePoints] = useState<Point[]>([]);
  const [measurementInput, setMeasurementInput] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [cropStart, setCropStart] = useState<Point | null>(null);
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const supabase = createClientComponentClient();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('freeform');
  const [rectangleStart, setRectangleStart] = useState<Point | null>(null);

  // Update previous mode when changing modes
  const handleModeChange = (newMode: EditorMode) => {
    if (newMode !== 'pan') {
      setPreviousMode(mode);
    }
    setMode(newMode);
    setIsDrawing(false);
    setCurrentRegion(null);
    drawCanvas();
  };

  // Add helper functions for angle and point snapping
  const snapToAngle = (start: Point, end: Point, threshold: number = 5) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Snap to 0° or 90° when within threshold
    let snappedAngle = angle;
    if (Math.abs(angle) < threshold || Math.abs(angle - 180) < threshold || Math.abs(angle + 180) < threshold) {
      // Snap to horizontal (0° or 180°)
      snappedAngle = angle > 90 || angle < -90 ? 180 : 0;
    } else if (Math.abs(angle - 90) < threshold || Math.abs(angle + 90) < threshold) {
      // Snap to vertical (90° or -90°)
      snappedAngle = angle > 0 ? 90 : -90;
    }
    
    // Convert back to coordinates
    const radians = snappedAngle * Math.PI / 180;
    return {
      x: start.x + distance * Math.cos(radians),
      y: start.y + distance * Math.sin(radians)
    };
  };

  const isNearPoint = (p1: Point, p2: Point, threshold: number) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  };

  const calculateRoomDimensions = (points: Point[], pixelsPerMeter: number) => {
    if (points.length < 3) return null;
    
    // Calculate bounding box
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    // Convert to meters
    const width = (maxX - minX) / pixelsPerMeter;
    const height = (maxY - minY) / pixelsPerMeter;
    const area = calculatePolygonArea(points) / (pixelsPerMeter * pixelsPerMeter);
    
    return {
      width: Number(width.toFixed(2)),
      height: Number(height.toFixed(2)),
      area: Number(area.toFixed(2))
    };
  };

  const calculatePolygonArea = (points: Point[]) => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  };

  // Helper function to check if three points form right angles
  const hasRightAngles = (p1: Point, p2: Point, p3: Point, threshold: number = 5) => {
    const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x) * 180 / Math.PI;
    
    // Calculate the absolute difference between angles, normalized to 0-90 degrees
    const angleDiff = Math.abs(((angle1 - angle2) + 180) % 180 - 90);
    return angleDiff < threshold;
  };

  // Calculate the 4th point of a rectangle given 3 points
  const calculateRectanglePoint = (p1: Point, p2: Point, p3: Point): Point => {
    // The 4th point is p1 + (p3 - p2)
    return {
      x: p1.x + (p3.x - p2.x),
      y: p1.y + (p3.y - p2.y)
    };
  };

  // Add helper functions
  const roundCoordinate = (value: number, decimals: number = 2) => {
    return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
  };

  const createRectangleFromCorners = (start: Point, end: Point): Point[] => {
    return [
      { x: roundCoordinate(start.x), y: roundCoordinate(start.y) },
      { x: roundCoordinate(start.x), y: roundCoordinate(end.y) },
      { x: roundCoordinate(end.x), y: roundCoordinate(end.y) },
      { x: roundCoordinate(end.x), y: roundCoordinate(start.y) },
      { x: roundCoordinate(start.x), y: roundCoordinate(start.y) }
    ];
  };

  // Handle canvas click for different modes
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageSize) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const x = roundCoordinate((mouseX - pan.x) / zoom);
    const y = roundCoordinate((mouseY - pan.y) / zoom);

    if (mode === 'scale') {
      if (scalePoints.length < 2) {
        setScalePoints([...scalePoints, { x, y }]);
        
        if (scalePoints.length === 1) {
          setMeasurementInput(true);
        }
      }
    } else if (mode === 'region') {
      if (drawingMode === 'rectangle') {
        if (!rectangleStart) {
          setRectangleStart({ x, y });
          setIsDrawing(true);
          setCurrentRegion({
            id: Date.now().toString(),
            name: `Room ${regions.length + 1}`,
            type: 'room',
            points: [{ x, y }],
            metadata: {}
          });
        } else {
          // Complete rectangle
          const points = createRectangleFromCorners(rectangleStart, { x, y });
          const dimensions = scale ? calculateRoomDimensions(points, scale) : null;
          
          setRegions([...regions, {
            ...currentRegion!,
            points,
            metadata: {
              ...currentRegion?.metadata,
              dimensions: dimensions || undefined
            }
          }]);
          
          setIsDrawing(false);
          setCurrentRegion(null);
          setRectangleStart(null);
        }
        return;
      }

      if (!isDrawing) {
        // Start a new region
        setIsDrawing(true);
        setCurrentRegion({
          id: Date.now().toString(),
          name: `Region ${regions.length + 1}`,
          type: 'room',
          points: [{ x, y }],
          metadata: {}
        });
      } else if (currentRegion && currentRegion.points.length > 0) {
        const lastPoint = currentRegion.points[currentRegion.points.length - 1];
        const firstPoint = currentRegion.points[0];
        const snapThreshold = 10 / zoom;
        
        // Check if we're closing the shape
        if (currentRegion.points.length > 2 && isNearPoint({ x, y }, firstPoint, snapThreshold)) {
          const finalPoints = [...currentRegion.points];
          
          // If we have exactly 3 points and they form right angles, auto-complete as a rectangle
          if (currentRegion.points.length === 3 && 
              hasRightAngles(currentRegion.points[0], currentRegion.points[1], currentRegion.points[2])) {
            // Calculate the perfect 4th point for a rectangle
            const rectPoint = calculateRectanglePoint(
              currentRegion.points[0], 
              currentRegion.points[1], 
              currentRegion.points[2]
            );
            
            // Add the calculated rectangular point instead of the first point
            finalPoints.push(rectPoint);
          } else {
            // Normal closing - add the first point
            finalPoints.push(firstPoint);
          }
          
          // Complete the shape
          const dimensions = scale ? calculateRoomDimensions(finalPoints, scale) : null;
          setRegions([...regions, {
            ...currentRegion,
            points: finalPoints,
            metadata: {
              ...currentRegion.metadata,
              dimensions: dimensions || undefined
            }
          }]);
          setIsDrawing(false);
          setCurrentRegion(null);
          return;
        }
        
        // Calculate the snapped point using the transformed coordinates
        const snappedPoint = snapToAngle(lastPoint, { x, y });
        
        // Update current region with the new point
        setCurrentRegion({
          ...currentRegion,
          points: [...currentRegion.points, snappedPoint]
        });
      }
    }

    drawCanvas();
  };

  // Draw everything on canvas
  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !imageSize || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up the canvas for proper DPI
    const dpr = window.devicePixelRatio || 1;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Draw checkerboard pattern
    const squareSize = 8;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    for (let x = 0; x < width; x += squareSize) {
      for (let y = 0; y < height; y += squareSize) {
        ctx.fillStyle = (x + y) % (squareSize * 2) === 0 ? '#f0f0f0' : '#ffffff';
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }

    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw the cached image
    ctx.drawImage(imageRef.current, 0, 0, imageSize.width, imageSize.height);

    // Draw crop overlay if in crop mode
    if (mode === 'crop') {
      // Create a path for the entire image EXCEPT the crop area
      ctx.beginPath();
      ctx.rect(0, 0, imageSize.width, imageSize.height); // Outer rectangle
      
      if (cropArea) {
        // Cut out the crop area from the overlay path
        ctx.rect(cropArea.x + cropArea.width, cropArea.y, -cropArea.width, cropArea.height);
      }
      
      // Fill the overlay path with semi-transparent black
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();

      if (cropArea) {
        // Draw border around crop area
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2 / zoom;
        ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

        // Draw handles
        const handleSize = 8 / zoom;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#2563eb';
        
        // Corner handles
        [
          ['nw', cropArea.x, cropArea.y],
          ['ne', cropArea.x + cropArea.width, cropArea.y],
          ['sw', cropArea.x, cropArea.y + cropArea.height],
          ['se', cropArea.x + cropArea.width, cropArea.y + cropArea.height]
        ].forEach(([, x, y]) => {
          ctx.beginPath();
          ctx.arc(x as number, y as number, handleSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        // Edge handles
        [
          ['n', cropArea.x + cropArea.width/2, cropArea.y],
          ['s', cropArea.x + cropArea.width/2, cropArea.y + cropArea.height],
          ['w', cropArea.x, cropArea.y + cropArea.height/2],
          ['e', cropArea.x + cropArea.width, cropArea.y + cropArea.height/2]
        ].forEach(([, x, y]) => {
          ctx.beginPath();
          ctx.arc(x as number, y as number, handleSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }
    } else {
      // Only draw the cropped area if it exists
      if (cropArea) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
        ctx.clip();
      }

      // Draw scale points and regions
      if (scalePoints.length > 0) {
        ctx.beginPath();
        scalePoints.forEach((point, index) => {
          ctx.fillStyle = 'red';
          // Scale the point markers inversely to maintain size
          const markerSize = 5 / zoom;
          ctx.arc(point.x, point.y, markerSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw line between points
          if (index > 0) {
            ctx.beginPath();
            ctx.moveTo(scalePoints[index - 1].x, scalePoints[index - 1].y);
            ctx.lineTo(point.x, point.y);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2 / zoom; // Scale line width inversely
            ctx.stroke();
            
            // Draw distance if scale is set
            if (scale) {
              const dx = point.x - scalePoints[index - 1].x;
              const dy = point.y - scalePoints[index - 1].y;
              const distance = Math.sqrt(dx * dx + dy * dy) / scale;
              const midX = (point.x + scalePoints[index - 1].x) / 2;
              const midY = (point.y + scalePoints[index - 1].y) / 2;
              
              // Scale the text background inversely
              const padding = 10 / zoom;
              ctx.fillStyle = 'white';
              ctx.fillRect(midX - 40 / zoom, midY - padding, 80 / zoom, padding * 2);
              
              // Scale the text size inversely
              ctx.fillStyle = 'red';
              ctx.font = `${14 / zoom}px Arial`;
              ctx.textAlign = 'center';
              ctx.fillText(`${distance.toFixed(2)}m`, midX, midY + 5 / zoom);
            }
          }
        });
      }

      // Draw regions
      regions.forEach(region => {
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
        
        // Draw name
        ctx.fillText(region.name, centerX, centerY);
        
        // Draw dimensions if available
        if (scale && region.metadata?.dimensions) {
          const dims = region.metadata.dimensions as { width: number; height: number; area: number };
          ctx.font = `${12 / zoom}px Arial`;
          ctx.fillText(`${dims.width}m × ${dims.height}m`, centerX, centerY + 20 / zoom);
          ctx.fillText(`Area: ${dims.area}m²`, centerX, centerY + 40 / zoom);
        }
      });

      // Draw current region if drawing
      if (isDrawing && currentRegion && currentRegion.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentRegion.points[0].x, currentRegion.points[0].y);
        
        for (let i = 1; i < currentRegion.points.length; i++) {
          ctx.lineTo(currentRegion.points[i].x, currentRegion.points[i].y);
        }
        
        ctx.strokeStyle = 'rgba(0, 128, 255, 0.8)';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();

        // Draw the first point as a dot
        const startPoint = currentRegion.points[0];
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, 5 / zoom, 0, Math.PI * 2);
        
        // Check if mouse is near the start point to show hover effect
        if (mode === 'region' && currentRegion.points.length > 2) {
          const mousePoint = ctx.getTransform().invertSelf().transformPoint(new DOMPoint(lastMousePos.x, lastMousePos.y));
          const isNearStart = isNearPoint(
            { x: mousePoint.x, y: mousePoint.y },
            startPoint,
            10 / zoom
          );
          ctx.fillStyle = isNearStart ? 'rgba(0, 255, 0, 0.8)' : 'rgba(0, 128, 255, 0.8)';
        } else {
          ctx.fillStyle = 'rgba(0, 128, 255, 0.8)';
        }
        ctx.fill();
      }

      if (cropArea) {
        ctx.restore();
      }
    }

    ctx.restore();
  }, [imageSize, zoom, pan, floorplanAsset.storage_path, mode, cropArea, scalePoints, scale, regions, isDrawing, currentRegion, lastMousePos]);

  // Load existing floorplan data
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
            throw error;
          }
          return; // No existing floorplan data
        }

        if (data) {
          setScale(data.pixels_per_meter);
          setRegions(data.regions);
        }
      } catch (err) {
        console.error('Error loading floorplan data:', err);
      }
    }

    loadFloorplanData();
  }, [propertyId, supabase]);

  // Initialize canvas and load image
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    // Set canvas size to match container's pixel dimensions
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;

    // Load and cache the image
    const img = new Image();
    img.src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${floorplanAsset.storage_path}`;
    
    img.onload = () => {
      // Store original image size
      setImageSize({ width: img.width, height: img.height });
      imageRef.current = img;
      
      // Calculate zoom to fit image with padding
      const padding = 40;
      const scaleX = (container.clientWidth - padding * 2) / img.width;
      const scaleY = (container.clientHeight - padding * 2) / img.height;
      const fitScale = Math.min(scaleX, scaleY);
      
      // Center the image
      const centerX = (container.clientWidth - (img.width * fitScale)) / 2;
      const centerY = (container.clientHeight - (img.height * fitScale)) / 2;
      
      setZoom(fitScale);
      setPan({ x: centerX, y: centerY });
      
      drawCanvas();
    };
  }, [floorplanAsset.storage_path]);

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
          
          // Just redraw without resetting the view
          drawCanvas();
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [drawCanvas]);

  // Fixed handle dragging logic
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    if (mode === 'pan' || e.buttons === 2) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (mode === 'crop') {
      if (cropArea) {
        // Check if clicking on a handle
        const handle = getHandleAtPoint(x, y);
        if (handle) {
          setActiveHandle(handle);
          setIsDraggingHandle(true);
          // Store the initial point for the drag operation
          setCropStart({ x, y });
          return;
        }
      }

      // Start new crop area
      if (!cropArea) {
        setCropStart({ x, y });
        setIsDraggingCrop(true);
      }
    }
  };

  // Modify handleMouseMove to include snapping when in region mode
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Transform coordinates to account for pan and zoom
    const x = (mouseX - pan.x) / zoom;
    const y = (mouseY - pan.y) / zoom;
    
    setLastMousePos({ x, y });

    if (isDragging && dragStart) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPan(prevPan => ({
        x: prevPan.x + deltaX,
        y: prevPan.y + deltaY
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isDraggingHandle && activeHandle && cropArea) {
      // Simplified handle dragging - directly update the crop area based on handle position
      const newCropArea = { ...cropArea };
      
      switch (activeHandle) {
        case 'nw':
          newCropArea.width += newCropArea.x - x;
          newCropArea.height += newCropArea.y - y;
          newCropArea.x = x;
          newCropArea.y = y;
          break;
        case 'n':
          newCropArea.height += newCropArea.y - y;
          newCropArea.y = y;
          break;
        case 'ne':
          newCropArea.width = x - newCropArea.x;
          newCropArea.height += newCropArea.y - y;
          newCropArea.y = y;
          break;
        case 'e':
          newCropArea.width = x - newCropArea.x;
          break;
        case 'se':
          newCropArea.width = x - newCropArea.x;
          newCropArea.height = y - newCropArea.y;
          break;
        case 's':
          newCropArea.height = y - newCropArea.y;
          break;
        case 'sw':
          newCropArea.width += newCropArea.x - x;
          newCropArea.height = y - newCropArea.y;
          newCropArea.x = x;
          break;
        case 'w':
          newCropArea.width += newCropArea.x - x;
          newCropArea.x = x;
          break;
      }

      // Ensure width and height stay positive
      if (newCropArea.width < 0) {
        newCropArea.x += newCropArea.width;
        newCropArea.width = Math.abs(newCropArea.width);
      }
      if (newCropArea.height < 0) {
        newCropArea.y += newCropArea.height;
        newCropArea.height = Math.abs(newCropArea.height);
      }

      setCropArea(newCropArea);
    } else if (isDraggingCrop && cropStart) {
      const width = x - cropStart.x;
      const height = y - cropStart.y;
      setCropArea({
        x: width > 0 ? cropStart.x : x,
        y: height > 0 ? cropStart.y : y,
        width: Math.abs(width),
        height: Math.abs(height)
      });
    }

    // Update cursor based on handle hover
    if (mode === 'crop' && cropArea && !isDraggingCrop && !isDraggingHandle) {
      const handle = getHandleAtPoint(x, y);
      if (handle) {
        canvasRef.current.style.cursor = HANDLE_CURSORS[handle];
      } else {
        canvasRef.current.style.cursor = 'crosshair';
      }
    }

    // Add preview line for region mode
    if (mode === 'region' && isDrawing && currentRegion && currentRegion.points.length > 0) {
      const lastPoint = currentRegion.points[currentRegion.points.length - 1];
      const firstPoint = currentRegion.points[0];
      const snapThreshold = 10 / zoom;
      
      drawCanvas();
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw preview line
      if (currentRegion.points.length > 2 && isNearPoint({ x, y }, firstPoint, snapThreshold)) {
        // Show green line when near start point
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(firstPoint.x, firstPoint.y);
      } else {
        // Show preview line with angle snapping
        const snappedPoint = snapToAngle(lastPoint, { x, y });
        ctx.strokeStyle = 'rgba(0, 128, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(snappedPoint.x, snappedPoint.y);
      }
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    drawCanvas();
  };

  // Handle mouse up for all modes
  const handleMouseUp = () => {
    setIsDraggingCrop(false);
    setIsDragging(false);
    setIsDraggingHandle(false);
    setActiveHandle(null);
  };

  // Handle right click to complete region
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (mode === 'region' && isDrawing && currentRegion) {
      // Complete the region
      setRegions([...regions, currentRegion]);
      setIsDrawing(false);
      setCurrentRegion(null);
      drawCanvas();
    }
  };

  // Handle measurement input
  const handleMeasurementSubmit = (measurement: number) => {
    if (scalePoints.length !== 2) return;

    const dx = scalePoints[1].x - scalePoints[0].x;
    const dy = scalePoints[1].y - scalePoints[0].y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    const newScale = pixelDistance / measurement;
    
    setScale(newScale);
    setMeasurementInput(false);
    handleModeChange('region');
    drawCanvas();
  };

  // Save floorplan data
  const handleSave = async () => {
    try {
      if (!scale) {
        throw new Error('Please set the scale before saving');
      }

      const floorplanData = {
        property_id: propertyId,
        file_path: floorplanAsset.storage_path,
        original_width: canvasRef.current?.width || 0,
        original_height: canvasRef.current?.height || 0,
        pixels_per_meter: scale,
        calibration_method: 'manual',
        regions: regions,
        metadata: {}
      };

      // Use upsert with property_id as the match key
      const { error } = await supabase
        .from('floorplans')
        .upsert(floorplanData, {
          onConflict: 'property_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving floorplan:', err);
      toast.error('Failed to save floorplan settings');
    }
  };

  // Confirm crop and move to scale mode
  const confirmCrop = () => {
    if (cropArea) {
      handleModeChange('scale');
    }
  };

  // Enhanced zoom functionality with better control
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

  // Helper functions for handle interaction
  const HANDLE_CURSORS: Record<HandleType, string> = {
    nw: 'nw-resize',
    n: 'n-resize',
    ne: 'ne-resize',
    e: 'e-resize',
    se: 'se-resize',
    s: 's-resize',
    sw: 'sw-resize',
    w: 'w-resize'
  };

  const getHandleAtPoint = (x: number, y: number): HandleType | null => {
    if (!cropArea) return null;

    const handleSize = 8 / zoom;
    const handles: Record<HandleType, Point> = {
      nw: { x: cropArea.x, y: cropArea.y },
      n: { x: cropArea.x + cropArea.width/2, y: cropArea.y },
      ne: { x: cropArea.x + cropArea.width, y: cropArea.y },
      e: { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height/2 },
      se: { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height },
      s: { x: cropArea.x + cropArea.width/2, y: cropArea.y + cropArea.height },
      sw: { x: cropArea.x, y: cropArea.y + cropArea.height },
      w: { x: cropArea.x, y: cropArea.y + cropArea.height/2 }
    };

    for (const [handle, point] of Object.entries(handles) as [HandleType, Point][]) {
      if (Math.abs(x - point.x) < handleSize && Math.abs(y - point.y) < handleSize) {
        return handle;
      }
    }
    return null;
  };

  // Update the initial mode based on existing data
  useEffect(() => {
    if (existingData) {
      // If we have existing data, start in region mode with the scale already set
      setMode('region');
      setScale(existingData.pixels_per_meter);
      setRegions(existingData.regions);
    }
  }, [existingData]);

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'region') {
        if (e.key === 'r') {
          setDrawingMode(prev => prev === 'freeform' ? 'rectangle' : 'freeform');
        } else if (e.key === 'Escape') {
          if (isDrawing) {
            setIsDrawing(false);
            setCurrentRegion(null);
            setRectangleStart(null);
          }
        } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && currentRegion) {
          // Undo last point
          setCurrentRegion(prev => prev ? {
            ...prev,
            points: prev.points.slice(0, -1)
          } : null);
          if (currentRegion.points.length <= 1) {
            setIsDrawing(false);
            setCurrentRegion(null);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isDrawing, currentRegion]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col" ref={containerRef}>
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Interactive Floorplan Editor</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Mode controls */}
            <div className="flex-1 flex items-center gap-4">
              {mode === 'crop' ? (
                /* Crop Mode Controls */
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2h12v20H6z" />
                      <path d="M2 6h20v12H2z" />
                    </svg>
                    <h3 className="font-medium">Select Floorplan Area</h3>
                  </div>
                  {cropArea && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCropArea(null)}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm"
                      >
                        Reset
                      </button>
                      <button
                        onClick={confirmCrop}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Confirm
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Scale and Region Tabs */
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex gap-1 border-b">
                    <button
                      onClick={() => handleModeChange('scale')}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg -mb-px ${
                        mode === 'scale'
                          ? 'text-blue-600 border-x border-t border-b-transparent bg-white'
                          : 'text-gray-500 border-b hover:text-blue-600'
                      }`}
                    >
                      Set Scale
                    </button>
                    <button
                      onClick={() => handleModeChange('region')}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg -mb-px ${
                        mode === 'region'
                          ? 'text-blue-600 border-x border-t border-b-transparent bg-white'
                          : 'text-gray-500 border-b hover:text-blue-600'
                      }`}
                      disabled={!scale}
                    >
                      Map Regions
                    </button>
                  </div>

                  {/* Mode-specific controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {mode === 'scale' && (
                        <>
                          <Ruler className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-gray-600">
                            {scale 
                              ? `Current Scale: 1 pixel = ${(1/scale).toFixed(3)}m`
                              : 'Click two points to set scale'}
                          </span>
                          {scale && (
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => {
                                  setScale(null);
                                  setScalePoints([]);
                                }}
                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm"
                              >
                                Reset
                              </button>
                              <button
                                onClick={() => handleModeChange('region')}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              >
                                Save & Continue
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      {mode === 'region' && (
                        <>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setDrawingMode(prev => prev === 'freeform' ? 'rectangle' : 'freeform')}
                              className={`px-3 py-1.5 ${
                                drawingMode === 'rectangle' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-600'
                              } rounded hover:bg-blue-700 hover:text-white text-sm`}
                              title="Press 'R' to toggle"
                            >
                              Rectangle Mode
                            </button>
                            {isDrawing && currentRegion && currentRegion.points.length > 1 && (
                              <button
                                onClick={() => {
                                  setCurrentRegion(prev => prev ? {
                                    ...prev,
                                    points: prev.points.slice(0, -1)
                                  } : null);
                                  if (currentRegion.points.length <= 2) {
                                    setIsDrawing(false);
                                    setCurrentRegion(null);
                                  }
                                }}
                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm"
                                title="Press Ctrl/Cmd + Z"
                              >
                                Undo Last Point
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setIsDrawing(false);
                                setCurrentRegion({
                                  id: Date.now().toString(),
                                  name: `Room ${regions.length + 1}`,
                                  type: 'room',
                                  points: [],
                                  metadata: {}
                                });
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              disabled={isDrawing}
                            >
                              New Room
                            </button>
                            {regions.length > 0 && (
                              <button
                                onClick={() => {
                                  setRegions([]);
                                  setCurrentRegion(null);
                                  setIsDrawing(false);
                                }}
                                className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-sm"
                              >
                                Clear All
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setShowInstructions(!showInstructions)}
                      className={`p-1 rounded-full hover:bg-gray-100 ${showInstructions ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
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
                onClick={() => handleModeChange(mode === 'pan' ? previousMode : 'pan')}
                className={`px-3 py-2 rounded flex items-center gap-2 ${
                  mode === 'pan' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
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
          <div className="absolute top-4 left-4 z-10 bg-white/90 px-3 py-2 rounded-lg shadow text-sm">
            <p>
              {mode === 'pan' ? '🖱️ Drag to pan' : '🖱️ Right-click drag to pan'}<br />
              🖲️ Mouse wheel to zoom
            </p>
          </div>

          {/* Regions Side Panel - Only show when in region mode */}
          {mode === 'region' && regions.length > 0 && (
            <div className="absolute right-4 top-4 bottom-4 w-64 bg-white/95 rounded-lg shadow-lg border border-gray-200 overflow-y-auto">
              <div className="p-4">
                <h3 className="font-medium mb-2">Regions</h3>
                <div className="space-y-2">
                  {regions.map(region => (
                    <div key={region.id} className="p-2 bg-gray-50 rounded">
                      <input
                        type="text"
                        value={region.name}
                        onChange={(e) => {
                          const updatedRegions = regions.map(r =>
                            r.id === region.id ? { ...r, name: e.target.value } : r
                          );
                          setRegions(updatedRegions);
                        }}
                        className="w-full px-2 py-1 border rounded mb-1 text-sm"
                      />
                      <div className="flex items-center justify-between">
                        <select
                          value={region.type}
                          onChange={(e) => {
                            const updatedRegions = regions.map(r =>
                              r.id === region.id ? { ...r, type: e.target.value as Region['type'] } : r
                            );
                            setRegions(updatedRegions);
                          }}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="room">Room</option>
                          <option value="hallway">Hallway</option>
                          <option value="outdoor">Outdoor</option>
                          <option value="other">Other</option>
                        </select>
                        <button
                          onClick={() => {
                            const updatedRegions = regions.filter(r => r.id !== region.id);
                            setRegions(updatedRegions);
                            drawCanvas();
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <canvas
            ref={canvasRef}
            style={{ 
              cursor: mode === 'pan' ? (isDragging ? 'grabbing' : 'grab') : mode === 'crop' ? 'crosshair' : 'pointer',
              width: '100%',
              height: '100%'
            }}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={handleContextMenu}
            onWheel={handleWheel}
          />
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={!scale || regions.length === 0}
          >
            Save Changes
          </button>
        </div>

        {/* Room Name Input Dialog - Reusing measurement modal */}
        {measurementInput && mode === 'region' && currentRegion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-medium mb-4">Name this Room</h3>
              <input
                type="text"
                placeholder="Room name"
                defaultValue={currentRegion.name}
                className="w-full px-3 py-2 border rounded mb-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const name = (e.target as HTMLInputElement).value;
                    if (name) {
                      setRegions([...regions, { ...currentRegion, name }]);
                      setCurrentRegion(null);
                      setIsDrawing(false);
                      setMeasurementInput(false);
                    }
                  }
                }}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setMeasurementInput(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    const input = (e.target as HTMLElement)
                      .parentElement?.parentElement
                      ?.querySelector('input');
                    const name = input?.value;
                    if (name) {
                      setRegions([...regions, { ...currentRegion, name }]);
                      setCurrentRegion(null);
                      setIsDrawing(false);
                      setMeasurementInput(false);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scale Measurement Input Dialog */}
        {measurementInput && mode === 'scale' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-medium mb-4">Enter Measurement</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the actual distance between the two points in meters.
              </p>
              <input
                type="number"
                step="0.01"
                placeholder="Distance in meters"
                className="w-full px-3 py-2 border rounded mb-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = parseFloat((e.target as HTMLInputElement).value);
                    if (!isNaN(value) && value > 0) {
                      handleMeasurementSubmit(value);
                    }
                  }
                }}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setMeasurementInput(false);
                    setScalePoints([]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    const input = (e.target as HTMLElement)
                      .parentElement?.parentElement
                      ?.querySelector('input');
                    const value = parseFloat(input?.value || '');
                    if (!isNaN(value) && value > 0) {
                      handleMeasurementSubmit(value);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Set Scale
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Tooltip */}
        {showInstructions && (
          <div className="absolute mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900">
                {mode === 'crop' ? 'How to Crop' :
                 mode === 'scale' ? 'How to Set Scale' :
                 'How to Map Regions'}
              </h4>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-2">
              {mode === 'crop' && (
                <>
                  <li>Click and drag to select the area</li>
                  <li>Use handles to adjust the selection</li>
                  <li>Click Confirm when done</li>
                </>
              )}
              {mode === 'scale' && (
                <>
                  <li>Find a known measurement on your floorplan</li>
                  <li>Click on the start and end points</li>
                  <li>Enter the actual distance in meters</li>
                </>
              )}
              {mode === 'region' && (
                <>
                  <li>Click points to outline a region</li>
                  <li>Right-click to complete the region</li>
                  <li>Name and categorize the region</li>
                </>
              )}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
} 