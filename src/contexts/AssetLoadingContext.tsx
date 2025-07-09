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
const INITIALIZATION_TIMEOUT = 2000 // 2 seconds to give more time for assets to register
const MAXIMUM_LOADING_TIME = 15000 // 15 seconds maximum loading time - force complete after this

export function AssetLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [totalAssets, setTotalAssets] = useState(0)
  const [loadedAssets, setLoadedAssets] = useState(0)
  const [loadingStartTime] = useState(Date.now())
  const mountedRef = useRef(true)
  const initializationTimer = useRef<NodeJS.Timeout | null>(null)
  const loadingCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const maxLoadingTimer = useRef<NodeJS.Timeout | null>(null)
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
    if (maxLoadingTimer.current) {
      clearTimeout(maxLoadingTimer.current)
      maxLoadingTimer.current = null
    }
  }, [])

  const completeLoading = useCallback(() => {
    if (!mountedRef.current) return
    
    hasCompletedInitialLoad.current = true
    setIsLoading(false)
    clearAllTimers()
  }, [clearAllTimers])

  // Initialize loading state
  useEffect(() => {
    mountedRef.current = true
    hasCompletedInitialLoad.current = false
    assetsRegisteredAfterInit.current = false

    // Maximum loading time failsafe - force complete after MAXIMUM_LOADING_TIME
    maxLoadingTimer.current = setTimeout(() => {
      if (!mountedRef.current) return
      
      console.warn('⏰ Asset loading timeout - forcing completion')
      completeLoading()
    }, MAXIMUM_LOADING_TIME)

    // Initial timeout to check if any assets were registered
    initializationTimer.current = setTimeout(() => {
      if (!mountedRef.current) return
      
      if (totalAssets === 0 && !hasCompletedInitialLoad.current && !assetsRegisteredAfterInit.current) {
        completeLoading()
      }
    }, INITIALIZATION_TIMEOUT)

    return () => {
      mountedRef.current = false
      clearAllTimers()
    }
  }, [clearAllTimers, completeLoading, totalAssets, loadedAssets, loadingStartTime])

  // Handle loading completion when all assets are loaded
  useEffect(() => {
    if (!mountedRef.current) return

    if (totalAssets > 0 && loadedAssets === totalAssets) {
      const timeElapsed = Date.now() - loadingStartTime
      const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - timeElapsed)

      clearAllTimers()

      // Add a delay to ensure minimum loading time and smooth transition
      initializationTimer.current = setTimeout(() => {
        if (mountedRef.current) {
          completeLoading()
        }
      }, remainingTime)
    }
  }, [totalAssets, loadedAssets, loadingStartTime, clearAllTimers, completeLoading])

  // Only warn if stuck for too long
  useEffect(() => {
    if (isLoading && totalAssets > 0) {
      loadingCheckInterval.current = setInterval(() => {
        if (!mountedRef.current) return
        
        const timeElapsed = Date.now() - loadingStartTime
        const progress = Math.round((loadedAssets / totalAssets) * 100)
        
        // Only warn if really stuck
        if (timeElapsed > 10000 && loadedAssets < totalAssets) {
          console.warn(`⚠️ Loading stuck at ${progress}% - check for failed assets`)
        }
      }, 5000) // Check every 5 seconds
    }
    
    return () => {
      if (loadingCheckInterval.current) {
        clearInterval(loadingCheckInterval.current)
        loadingCheckInterval.current = null
      }
    }
  }, [isLoading, totalAssets, loadedAssets, loadingStartTime])

  const registerAsset = useCallback(() => {
    if (!mountedRef.current) return
    
    assetsRegisteredAfterInit.current = true
    setTotalAssets(prev => prev + 1)
  }, [])

  const markAssetAsLoaded = useCallback(() => {
    if (!mountedRef.current) return
    setLoadedAssets(prev => prev + 1)
  }, [])

  const resetLoading = useCallback(() => {
    if (!mountedRef.current) return
    clearAllTimers()
    hasCompletedInitialLoad.current = false
    assetsRegisteredAfterInit.current = false
    setIsLoading(true)
    setTotalAssets(0)
    setLoadedAssets(0)
  }, [clearAllTimers])

  const value = {
    isLoading,
    totalAssets,
    loadedAssets,
    registerAsset,
    markAssetAsLoaded,
    resetLoading
  }

  return (
    <AssetLoadingContext.Provider value={value}>
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