import React from 'react';
import { LANDMARK_TYPES } from '@/utils/landmarkTypes';
import type { LandmarkType } from '@/types/maps';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MapContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onSelect: (type: LandmarkType) => void;
  onClose: () => void;
}

export const MapContextMenu: React.FC<MapContextMenuProps> = ({
  isOpen,
  position,
  onSelect,
  onClose,
}) => {
  // Create a ref to imperatively control the dropdown menu
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  
  // Handle selecting a landmark type
  const handleSelect = (type: LandmarkType) => {
    onSelect(type);
    onClose();
  };
  
  // Programmatically click the trigger when isOpen changes
  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      triggerRef.current.click();
    }
  }, [isOpen]);

  // Add boundary checking to ensure menu doesn't go off-screen
  React.useEffect(() => {
    // We need to wait for the menu to render first
    const timer = setTimeout(() => {
      const menuElement = document.querySelector('[data-radix-dropdown-content]');
      if (!menuElement) return;
      
      const rect = menuElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Check if menu is outside the viewport
      if (rect.right > viewportWidth) {
        // Shift menu to the left to fit in viewport
        (menuElement as HTMLElement).style.left = `${viewportWidth - rect.width - 10}px`;
      }
      
      if (rect.bottom > viewportHeight) {
        // Shift menu up to fit in viewport
        (menuElement as HTMLElement).style.top = `${viewportHeight - rect.height - 10}px`;
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [isOpen, position]);

  if (!isOpen) return null;

  // Fixed position for the dropdown container
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999
  };

  // Position the content directly at the click coordinates with boundary checks
  const contentStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${position.y}px`,
    left: `${position.x}px`
  };

  return (
    <div style={containerStyle}>
      <DropdownMenu defaultOpen onOpenChange={(open) => !open && onClose()}>
        <DropdownMenuTrigger asChild>
          <button
            ref={triggerRef}
            className="hidden"
          >
            Open
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-56"
          style={contentStyle}
          sideOffset={0}
          align="start"
          alignOffset={0}
        >
          <DropdownMenuLabel>Add Landmark</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {LANDMARK_TYPES.map((landmark) => (
            <DropdownMenuItem 
              key={landmark.type}
              onClick={() => handleSelect(landmark.type)}
              className="cursor-pointer flex items-center gap-2"
            >
              {React.createElement(landmark.icon, { className: "w-4 h-4", style: { color: landmark.markerColor } })}
              <span>{landmark.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}; 