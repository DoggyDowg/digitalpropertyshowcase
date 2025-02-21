'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Info, X, MousePointer, Smartphone } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { motion } from 'framer-motion';

// Dynamically import the VirtualTour component
const VirtualTour = dynamic(() => import('./VirtualTour'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="text-center text-white">
        <div className="text-lg font-semibold">Preparing Virtual Tour...</div>
        <p className="text-sm text-white/70 mt-2">This may take a moment to load</p>
      </div>
    </div>
  ),
});

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

interface VirtualTourViewerProps {
  modelPath: string;
}

export default function VirtualTourViewer({ modelPath }: VirtualTourViewerProps) {
  const [showInstructions, setShowInstructions] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black">
      <VirtualTour modelPath={modelPath} className="w-full h-full" />
      
      {showInstructions ? (
        <ControlsInstructions 
          isMobile={isMobile} 
          onClose={() => setShowInstructions(false)}
          autoHide={false}
        />
      ) : (
        <InfoButton onClick={() => setShowInstructions(true)} />
      )}

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <p className="text-white/80 text-sm">
            {isMobile ? 'Use touch gestures' : 'Use mouse controls'} to explore the space
          </p>
        </div>
      </div>
    </div>
  );
} 