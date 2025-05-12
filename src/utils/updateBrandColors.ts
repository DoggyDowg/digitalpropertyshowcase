import type { BrandColors } from '@/types/brand'

// Helper function to convert hex to RGB
const hexToRgb = (hex: string) => {
  try {
    // Remove # if present
    const cleanHex = hex.charAt(0) === '#' ? hex.slice(1) : hex
    
    // Handle both 3-digit and 6-digit hex codes
    const fullHex = cleanHex.length === 3 
      ? cleanHex.split('').map(char => char + char).join('') 
      : cleanHex

    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex)
    if (!result) {
      console.error(`Invalid hex color format: ${hex}`)
      return null
    }

    const rgb = `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    // console.log(`Successfully converted ${hex} to RGB: ${rgb}`)
    return rgb
  } catch (error) {
    console.error(`Failed to convert hex to RGB: ${hex}`, error)
    return null
  }
}

export const updateBrandColors = (colors: BrandColors) => {
  if (typeof document === 'undefined') {
    console.error('updateBrandColors: Document is undefined')
    throw new Error('updateBrandColors: Document is undefined')
  }

  if (!colors) {
    console.error('updateBrandColors: Colors object is undefined')
    throw new Error('updateBrandColors: Colors object is undefined')
  }

  if (!colors.dark || !colors.light) {
    console.error(`updateBrandColors: Required colors missing - dark: ${colors.dark}, light: ${colors.light}`)
    throw new Error(`updateBrandColors: Required colors missing - dark: ${colors.dark}, light: ${colors.light}`)
  }

  const root = document.documentElement
  
  try {
    // console.log('Setting brand colors:', colors)

    // Set main color variables
    root.style.setProperty('--brand-dark', colors.dark)
    root.style.setProperty('--brand-light', colors.light)
    root.style.setProperty('--brand-highlight', colors.highlight ?? colors.dark)
    
    // Set RGB values
    const darkRgb = hexToRgb(colors.dark)
    const lightRgb = hexToRgb(colors.light)
    
    if (darkRgb) root.style.setProperty('--brand-dark-rgb', darkRgb)
    if (lightRgb) root.style.setProperty('--brand-light-rgb', lightRgb)

    const result = {
      '--brand-dark': root.style.getPropertyValue('--brand-dark'),
      '--brand-light': root.style.getPropertyValue('--brand-light'),
      '--brand-highlight': root.style.getPropertyValue('--brand-highlight'),
      '--brand-dark-rgb': root.style.getPropertyValue('--brand-dark-rgb'),
      '--brand-light-rgb': root.style.getPropertyValue('--brand-light-rgb')
    }

    // console.log('Brand colors updated successfully:', result)
    return result
  } catch (error) {
    console.error('Error updating brand colors:', error)
    throw new Error(`updateBrandColors: Error updating brand colors - ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
