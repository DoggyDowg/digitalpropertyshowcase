'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react'

interface AssetLoadingContextType {
  isLoading: boolean
  totalAssets: number
  loadedAssets: number
  registerAsset: () => void
  markAssetAsLoaded: () => void
  resetLoading: () => void
}

const AssetLoadingContext = createContext<AssetLoadingContextType | undefined>(undefined)

const MINIMUM_LOADING_TIME = 2000 // 2 seconds minimum loading time
const LOADING_CHECK_INTERVAL = 100 // Check loading state every 100ms

export function AssetLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [totalAssets, setTotalAssets] = useState(0)
  const [loadedAssets, setLoadedAssets] = useState(0)
  const [loadingStartTime, setLoadingStartTime] = useState(Date.now())
  const mountedRef = useRef(true)
  const initializationTimer = useRef<NodeJS.Timeout | null>(null)
  const loadingCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // Reset loading state when component mounts
  useEffect(() => {
    console.log('[AssetLoading] Provider mounted')
    setIsLoading(true)
    setTotalAssets(0)
    setLoadedAssets(0)
    setLoadingStartTime(Date.now())

    // Set up an interval to check loading state
    loadingCheckInterval.current = setInterval(() => {
      if (!mountedRef.current) return

      const timeElapsed = Date.now() - loadingStartTime
      console.log('[AssetLoading] Checking loading state:', {
        totalAssets,
        loadedAssets,
        timeElapsed,
        isLoading
      })

      // If no assets are registered within 1 second, assume everything is loaded
      if (timeElapsed > 1000 && totalAssets === 0) {
        console.log('[AssetLoading] No assets registered, completing load')
        setIsLoading(false)
      }
    }, LOADING_CHECK_INTERVAL)

    return () => {
      console.log('[AssetLoading] Provider unmounting')
      mountedRef.current = false
      
      if (initializationTimer.current) {
        clearTimeout(initializationTimer.current)
      }
      
      if (loadingCheckInterval.current) {
        clearInterval(loadingCheckInterval.current)
      }
    }
  }, [])

  // Handle loading completion
  useEffect(() => {
    if (!mountedRef.current) return

    if (totalAssets > 0 && loadedAssets === totalAssets) {
      const timeElapsed = Date.now() - loadingStartTime
      const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - timeElapsed)

      console.log(`[AssetLoading] Loading complete:`, {
        totalAssets,
        loadedAssets,
        timeElapsed,
        remainingTime,
        loadingStartTime,
        currentTime: Date.now()
      })

      // Clear any existing timer
      if (initializationTimer.current) {
        clearTimeout(initializationTimer.current)
      }

      // Add a delay to ensure minimum loading time and smooth transition
      initializationTimer.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log('[AssetLoading] Hiding loader after minimum time')
          setIsLoading(false)
        }
      }, remainingTime)

      return () => {
        if (initializationTimer.current) {
          clearTimeout(initializationTimer.current)
        }
      }
    }
  }, [totalAssets, loadedAssets, loadingStartTime])

  const registerAsset = useCallback(() => {
    if (!mountedRef.current) return
    setTotalAssets(prev => {
      const newTotal = prev + 1
      console.log(`[AssetLoading] Registered new asset:`, {
        previousTotal: prev,
        newTotal,
        currentLoaded: loadedAssets
      })
      return newTotal
    })
  }, [loadedAssets])

  const markAssetAsLoaded = useCallback(() => {
    if (!mountedRef.current) return
    setLoadedAssets(prev => {
      const newLoaded = prev + 1
      console.log(`[AssetLoading] Asset loaded:`, {
        previousLoaded: prev,
        newLoaded,
        totalAssets,
        isComplete: newLoaded === totalAssets
      })
      return newLoaded
    })
  }, [totalAssets])

  const resetLoading = useCallback(() => {
    if (!mountedRef.current) return
    console.log('[AssetLoading] Reset loading state:', {
      previousTotal: totalAssets,
      previousLoaded: loadedAssets
    })
    setIsLoading(true)
    setTotalAssets(0)
    setLoadedAssets(0)
    setLoadingStartTime(Date.now())
  }, [totalAssets, loadedAssets])

  // Log state changes
  useEffect(() => {
    if (!mountedRef.current) return
    console.log('[AssetLoading] State updated:', {
      isLoading,
      totalAssets,
      loadedAssets,
      progress: totalAssets > 0 ? Math.round((loadedAssets / totalAssets) * 100) : 0
    })
  }, [isLoading, totalAssets, loadedAssets])

  return (
    <AssetLoadingContext.Provider 
      value={{
        isLoading,
        totalAssets,
        loadedAssets,
        registerAsset,
        markAssetAsLoaded,
        resetLoading
      }}
    >
      {children}
    </AssetLoadingContext.Provider>
  )
}

export function useAssetLoading() {
  const context = useContext(AssetLoadingContext)
  if (context === undefined) {
    throw new Error('useAssetLoading must be used within an AssetLoadingProvider')
  }
  return context
} 