'use client'

import { useState } from 'react'
import type { Property, HoverEffectType, HeaderStyleType } from '@/types/property'
import styles from '@/styles/HoverEffects.module.css'

interface HoverEffect {
  id: HoverEffectType
  name: string
  description: string
  preview: string
}

const HOVER_EFFECTS: HoverEffect[] = [
  {
    id: 'underline',
    name: 'Underline Reveal',
    description: 'Clean and minimal animated underline that reveals from left to right',
    preview: 'Features'
  },
  {
    id: 'slide',
    name: 'Slide Background',
    description: 'Smooth background color transition that slides in from left',
    preview: 'Lifestyle'
  },
  {
    id: 'fade',
    name: 'Fade Effect',
    description: 'Subtle opacity and color transition on hover',
    preview: 'Neighbourhood'
  },
  {
    id: 'scale',
    name: 'Scale Transform',
    description: 'Slight scaling animation with smooth transition',
    preview: 'Info'
  },
  {
    id: 'glow',
    name: 'Soft Glow',
    description: 'Elegant glowing effect that radiates from the text',
    preview: 'Contact'
  },
  {
    id: 'background',
    name: 'Background Pulse',
    description: 'Elegant background color pulse animation',
    preview: 'Viewings'
  }
]

// Define a type for the styling settings that can be updated
type PropertyStylingUpdate = {
  styling: {
    textLinks?: {
      hoverEffect?: HoverEffectType;
    };
    header?: {
      style?: HeaderStyleType;
    };
  };
};

interface PropertyStylingProps {
  property: Property
  onSave: (settings: PropertyStylingUpdate) => Promise<void>
}

export function PropertyStyling({ property, onSave }: PropertyStylingProps) {
  const [selectedEffect, setSelectedEffect] = useState<HoverEffectType>(
    property.styling?.textLinks?.hoverEffect || 'scale'
  )
  const [selectedHeaderStyle, setSelectedHeaderStyle] = useState<HeaderStyleType>(
    property.styling?.header?.style || 'light'
  )
  const [isSaving, setIsSaving] = useState(false)

  // Handle effect change
  const handleEffectChange = async (effectId: HoverEffectType) => {
    setSelectedEffect(effectId)
    setIsSaving(true)
    
    try {
      // Create new styling object, preserving any existing styling settings
      const updatedStyling = {
        ...property.styling,
        textLinks: {
          ...property.styling?.textLinks,
          hoverEffect: effectId
        }
      }

      await onSave({
        styling: updatedStyling
      })
    } catch (error) {
      console.error('Error saving hover effect:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle header style change
  const handleHeaderStyleChange = async (style: HeaderStyleType) => {
    setSelectedHeaderStyle(style)
    setIsSaving(true)
    
    try {
      // Create new styling object, preserving any existing styling settings
      const updatedStyling = {
        ...property.styling,
        header: {
          ...property.styling?.header,
          style
        }
      }

      await onSave({
        styling: updatedStyling
      })
    } catch (error) {
      console.error('Error saving header style:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-12">
      {/* Header Style Section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Header Style</h2>
        <p className="text-gray-600 mb-6">
          Choose the color scheme for the header. This affects the background color and text/logo colors.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Light Header Option */}
          <div
            onClick={() => handleHeaderStyleChange('light')}
            className={`
              p-6 border rounded-lg cursor-pointer transition-all
              ${selectedHeaderStyle === 'light' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }
            `}
          >
            <h3 className="font-medium text-lg mb-2">Light Header</h3>
            <p className="text-gray-600 text-sm mb-4">Light background with dark text and logo</p>
            
            {/* Preview */}
            <div className="bg-white border rounded p-4 flex items-center justify-center">
              <div className="text-gray-900">Light Header Preview</div>
            </div>
          </div>

          {/* Dark Header Option */}
          <div
            onClick={() => handleHeaderStyleChange('dark')}
            className={`
              p-6 border rounded-lg cursor-pointer transition-all
              ${selectedHeaderStyle === 'dark' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }
            `}
          >
            <h3 className="font-medium text-lg mb-2">Dark Header</h3>
            <p className="text-gray-600 text-sm mb-4">Dark background with light text and logo</p>
            
            {/* Preview */}
            <div className="bg-gray-900 border rounded p-4 flex items-center justify-center">
              <div className="text-white">Dark Header Preview</div>
            </div>
          </div>
        </div>
      </div>

      {/* Text Link Hover Effects Section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Text Link Hover Effects</h2>
        <p className="text-gray-600 mb-6">
          Choose how text links animate when users hover over them. Changes will apply to all text links in the property showcase.
        </p>

        {/* Effect Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOVER_EFFECTS.map((effect) => (
            <div
              key={effect.id}
              onClick={() => handleEffectChange(effect.id)}
              className={`
                p-6 border rounded-lg cursor-pointer transition-all
                ${selectedEffect === effect.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }
              `}
            >
              <h3 className="font-medium text-lg mb-2">{effect.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{effect.description}</p>
              
              {/* Preview Link */}
              <div className="p-4 bg-white rounded border">
                <span className={`${styles.textLink} ${styles[`hoverEffect${effect.id.charAt(0).toUpperCase() + effect.id.slice(1)}`]}`}>
                  {effect.preview}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Preview Section */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Live Preview</h3>
          <div className="flex gap-6">
            {['Features', 'Lifestyle', 'Neighbourhood'].map((text) => (
              <span
                key={text}
                className={`${styles.textLink} ${styles[`hoverEffect${selectedEffect.charAt(0).toUpperCase() + selectedEffect.slice(1)}`]}`}
              >
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="text-sm text-blue-600">
          Saving changes...
        </div>
      )}
    </div>
  )
} 