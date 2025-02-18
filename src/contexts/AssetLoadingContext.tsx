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
const INITIALIZATION_TIMEOUT = 2000 // Increased to 2 seconds to give more time for assets to register

export function AssetLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [totalAssets, setTotalAssets] = useState(0)
  const [loadedAssets, setLoadedAssets] = useState(0)
  const [loadingStartTime, setLoadingStartTime] = useState(Date.now())
  const mountedRef = useRef(true)
  const initializationTimer = useRef<NodeJS.Timeout | null>(null)
  const loadingCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const hasCompletedInitialLoad = useRef(false)
  const assetsRegisteredAfterInit = useRef(false)

  const clearAllTimers = useCallback(() => {
    if (initializationTimer.current) {
      clearTimeout(initializationTimer.current)
      initializationTimer.current = null
    }
    if (loadingCheckInterval.current) {
      clearInterval(loadingCheckInterval.current)
      loadingCheckInterval.current = null
    }
  }, [])

  const completeLoading = useCallback(() => {
    console.log('[AssetLoading] Completing loading:', {
      totalAssets,
      loadedAssets,
      hasCompletedInitialLoad: hasCompletedInitialLoad.current,
      assetsRegisteredAfterInit: assetsRegisteredAfterInit.current
    })
    hasCompletedInitialLoad.current = true
    setIsLoading(false)
    clearAllTimers()
  }, [totalAssets, loadedAssets, clearAllTimers])

  // Reset loading state when component mounts
  useEffect(() => {
    console.log('[AssetLoading] Provider mounted')
    setIsLoading(true)
    setTotalAssets(0)
    setLoadedAssets(0)
    setLoadingStartTime(Date.now())
    hasCompletedInitialLoad.current = false
    assetsRegisteredAfterInit.current = false

    // Initial timeout to check if any assets were registered
    initializationTimer.current = setTimeout(() => {
      if (!mountedRef.current) return
      
      if (totalAssets === 0 && !hasCompletedInitialLoad.current && !assetsRegisteredAfterInit.current) {
        console.log('[AssetLoading] No assets registered during initialization')
        completeLoading()
      }
    }, INITIALIZATION_TIMEOUT)

    // Set up an interval to check loading state
    loadingCheckInterval.current = setInterval(() => {
      if (!mountedRef.current) return

      const timeElapsed = Date.now() - loadingStartTime
      console.log('[AssetLoading] Checking loading state:', {
        totalAssets,
        loadedAssets,
        timeElapsed,
        isLoading,
        hasCompletedInitialLoad: hasCompletedInitialLoad.current,
        assetsRegisteredAfterInit: assetsRegisteredAfterInit.current
      })

      // Only complete if we have no assets and haven't registered any after init
      if (timeElapsed > INITIALIZATION_TIMEOUT && 
          totalAssets === 0 && 
          !hasCompletedInitialLoad.current && 
          !assetsRegisteredAfterInit.current) {
        completeLoading()
      }
    }, LOADING_CHECK_INTERVAL)

    return () => {
      console.log('[AssetLoading] Provider unmounting')
      mountedRef.current = false
      clearAllTimers()
    }
  }, [clearAllTimers, completeLoading])

  // Handle loading completion when all assets are loaded
  useEffect(() => {
    if (!mountedRef.current) return

    if (totalAssets > 0 && loadedAssets === totalAssets) {
      const timeElapsed = Date.now() - loadingStartTime
      const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - timeElapsed)

      console.log(`[AssetLoading] All assets loaded:`, {
        totalAssets,
        loadedAssets,
        timeElapsed,
        remainingTime,
        loadingStartTime,
        currentTime: Date.now()
      })

      clearAllTimers()

      // Add a delay to ensure minimum loading time and smooth transition
      initializationTimer.current = setTimeout(() => {
        if (mountedRef.current) {
          completeLoading()
        }
      }, remainingTime)

      return () => {
        clearAllTimers()
      }
    }
  }, [totalAssets, loadedAssets, loadingStartTime, clearAllTimers, completeLoading])

  const registerAsset = useCallback(() => {
    if (!mountedRef.current) return
    
    // Mark that we've registered assets after initialization
    assetsRegisteredAfterInit.current = true
    
    setTotalAssets(prev => {
      const newTotal = prev + 1
      console.log(`[AssetLoading] Registered new asset:`, {
        previousTotal: prev,
        newTotal,
        currentLoaded: loadedAssets,
        hasCompletedInitialLoad: hasCompletedInitialLoad.current
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
        isComplete: newLoaded === totalAssets,
        hasCompletedInitialLoad: hasCompletedInitialLoad.current
      })
      return newLoaded
    })
  }, [totalAssets])

  const resetLoading = useCallback(() => {
    if (!mountedRef.current) return
    console.log('[AssetLoading] Reset loading state:', {
      previousTotal: totalAssets,
      previousLoaded: loadedAssets,
      hasCompletedInitialLoad: hasCompletedInitialLoad.current
    })
    clearAllTimers()
    hasCompletedInitialLoad.current = false
    assetsRegisteredAfterInit.current = false
    setIsLoading(true)
    setTotalAssets(0)
    setLoadedAssets(0)
    setLoadingStartTime(Date.now())
  }, [totalAssets, loadedAssets, clearAllTimers])

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