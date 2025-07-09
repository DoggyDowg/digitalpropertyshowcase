import { useState, useEffect, ReactNode } from 'react'

interface HydrationFixProps {
  children: ReactNode
}

/**
 * This component prevents its children from rendering during the server-rendered phase.
 * It waits until after the component is mounted (i.e., after hydration) to render children.
 */
export default function HydrationFix({ children }: HydrationFixProps) {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Add some debugging to help us track hydration in production
    // Component mounted, setting hydrated state
    setHydrated(true)
  }, [])

  // Add debugging for render phases
  if (!hydrated) {
    // Not yet hydrated, returning null
    return null
  }

      // Hydrated, rendering children
  return <>{children}</>
} 