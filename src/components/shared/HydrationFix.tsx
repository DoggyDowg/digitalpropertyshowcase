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
    console.log('🔄 HydrationFix: Component mounted, setting hydrated state to true')
    setHydrated(true)
  }, [])

  // Add debugging for render phases
  if (!hydrated) {
    console.log('⏳ HydrationFix: Not yet hydrated, returning null')
    return null
  }

  console.log('✅ HydrationFix: Hydrated, rendering children')
  return <>{children}</>
} 