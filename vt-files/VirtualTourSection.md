'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Expand, Minimize2, MousePointer, Smartphone, Info, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { use3DTour } from '@/hooks/use3DTour';
import type { Property } from '@/types/property';

// Dynamically import the VirtualTour component instead of ClientThreeViewer
const VirtualTour = dynamic(() => import('./VirtualTour'), {
  ssr: false,
  loading: () => (
    <div className="w-[80vw] h-[60vh] mx-auto flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="text-lg font-semibold">Preparing Virtual Tour...</div>
        <p className="text-sm text-gray-500 mt-2">This may take a moment to load</p>
      </div>
    </div>
  ),
});

interface VirtualTourSectionProps {
  property: Property;
}

interface ControlsInstructionsProps {
  isMobile: boolean;
  className?: string;
  onClose?: () => void;
  autoHide?: boolean;
}

function ControlsInstructions({ isMobile, className = "", onClose, autoHide = true }: ControlsInstructionsProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoHide) return;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 6000); // Hide after 6 seconds

    return () => clearTimeout(timer);
  }, [autoHide]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`absolute top-4 left-4 z-10 p-4 rounded-lg bg-black/30 backdrop-blur-sm text-white/90 shadow-lg ${className}`}
    >
      <div className="flex items-start gap-3">
        {isMobile ? <Smartphone className="w-5 h-5 mt-1" /> : <MousePointer className="w-5 h-5 mt-1" />}
        <div className="space-y-2">
          <h4 className="font-medium mb-2">Controls:</h4>
          {isMobile ? (
            <ul className="space-y-1.5 text-sm">
              <li>• One finger drag to rotate</li>
              <li>• Two finger drag to pan</li>
              <li>• Pinch to zoom</li>
              <li>• Double tap to reset view</li>
            </ul>
          ) : (
            <ul className="space-y-1.5 text-sm">
              <li>• Left click + drag to rotate</li>
              <li>• Right click + drag to pan</li>
              <li>• Scroll wheel to zoom</li>
              <li>• Double click to reset view</li>
            </ul>
          )}
        </div>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className="absolute top-2 right-2 p-1.5 hover:bg-white/10 rounded-full transition-colors duration-200"
        aria-label="Close instructions"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function InfoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors duration-200 text-white backdrop-blur-sm"
      aria-label="Show controls"
    >
      <Info className="w-5 h-5" />
    </button>
  );
}

export default function VirtualTourSection({ property }: VirtualTourSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showInstructions, setShowInstructions] = useState(true);
  
  const { modelUrl, loading: modelLoading, error: modelError } = use3DTour(
    property.id,
    property.is_demo
  );

  // Add debug logging
  useEffect(() => {
    console.log('VirtualTourSection render:', {
      propertyId: property.id,
      isDemo: property.is_demo,
      modelUrl,
      modelLoading,
      modelError,
      has3dTour: property.assets?.['3d_tour']?.length ?? 0 > 0
    });
  }, [property.id, property.is_demo, modelUrl, modelLoading, modelError, property.assets]);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isExpanded]);

  // Handle body scroll lock when fullscreen
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isExpanded]);

  // For demo properties, we always want to show the component while loading
  if (property.is_demo && modelLoading) {
    return (
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Virtual Tour</h2>
          <div className="w-[80vw] h-[60vh] mx-auto flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold">Preparing Virtual Tour...</div>
              <p className="text-sm text-gray-500 mt-2">This may take a moment to load</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // For non-demo properties, only hide if no tour is available
  if (!property.is_demo && !modelLoading && !modelUrl && !modelError) {
    console.log('VirtualTourSection: Hiding section - no tour available');
    if (process.env.NODE_ENV === 'development') {
      return (
        <section id="virtual-tour" className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 border-2 border-dashed border-gray-300">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Virtual Tour</h2>
            <div className="text-center p-4">
              <p className="text-gray-500">No virtual tour available for this property.</p>
              <pre className="mt-4 text-left text-sm bg-white p-4 rounded-lg">
                {JSON.stringify({
                  propertyId: property.id,
                  isDemo: property.is_demo,
                  modelUrl,
                  modelLoading,
                  modelError,
                  has3dTour: property.assets?.['3d_tour']?.length ?? 0 > 0
                }, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      );
    }
    return null;
  }

  // For demo properties, we want to show an error state rather than hiding
  if (property.is_demo && modelError) {
    return (
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Virtual Tour</h2>
          <div className="w-[80vw] h-[60vh] mx-auto flex items-center justify-center bg-red-50 rounded-lg">
            <div className="text-center p-4">
              <div className="text-lg font-semibold text-red-600">Unable to load Virtual Tour</div>
              <p className="text-sm text-red-500 mt-2">Please try again later</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // For non-demo properties, hide on error
  if (!property.is_demo && modelError) {
    console.error('Error loading 3D tour:', modelError);
    return null;
  }

  if (isExpanded) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 w-screen h-screen bg-black z-[100]"
        >
          <div className="absolute inset-0 w-full h-full">
            <VirtualTour modelPath={modelUrl!} className="w-full h-full" />
            {showInstructions ? (
              <ControlsInstructions 
                isMobile={isMobile} 
                onClose={() => setShowInstructions(false)}
                autoHide={false}
              />
            ) : (
              <InfoButton onClick={() => setShowInstructions(true)} />
            )}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-6 right-6 z-[101] p-3 rounded-full bg-black/40 hover:bg-black/60 transition-colors duration-200 text-white backdrop-blur-sm"
              aria-label="Exit full screen"
            >
              <Minimize2 className="w-6 h-6" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
              <div className="max-w-7xl mx-auto">
                <h3 className="text-white text-xl font-semibold mb-2">{property.name}</h3>
                <p className="text-white/80 text-sm">
                  {isMobile ? 'Use touch gestures' : 'Use mouse controls'} to explore the space. Press ESC to exit fullscreen.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <section id="virtual-tour" className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Virtual Tour</h2>
        <div className="relative w-[80vw] h-[60vh] mx-auto rounded-lg overflow-hidden">
          <VirtualTour modelPath={modelUrl!} />
          {showInstructions ? (
            <ControlsInstructions 
              isMobile={isMobile} 
              onClose={() => setShowInstructions(false)}
            />
          ) : (
            <InfoButton onClick={() => setShowInstructions(true)} />
          )}
          <button
            onClick={() => setIsExpanded(true)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors duration-200 text-white backdrop-blur-sm"
            aria-label="Enter full screen"
          >
            <Expand className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
} 