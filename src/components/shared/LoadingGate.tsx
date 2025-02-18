'use client'

import { ReactNode, useEffect, useState, useRef } from 'react'
import { useAssetLoading } from '@/contexts/AssetLoadingContext'

interface LoadingGateProps {
  children: ReactNode
  id?: string // Optional ID for debugging specific gates
}

export function LoadingGate({ children, id = 'unnamed' }: LoadingGateProps) {
  const { isLoading, totalAssets, loadedAssets } = useAssetLoading()
  const [isHydrated, setIsHydrated] = useState(false)
  const [isDOMReady, setIsDOMReady] = useState(false)
  const mountTime = useRef(Date.now())
  
  // Track hydration
  useEffect(() => {
    console.log(`[LoadingGate:${id}] 🔄 Hydration check initiated`, {
      timestamp: new Date().toISOString(),
      mountDelay: Date.now() - mountTime.current
    })
    setIsHydrated(true)
  }, [id])
  
  // Track DOM readiness
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    console.log(`[LoadingGate:${id}] 🌐 DOM readiness check initiated`, {
      timestamp: new Date().toISOString(),
      readyState: document.readyState
    })
    
    const checkDOMReady = () => {
      const isReady = document.readyState === 'complete'
      console.log(`[LoadingGate:${id}] 📑 DOM readiness status:`, {
        status: isReady ? 'complete' : document.readyState,
        timestamp: new Date().toISOString()
      })
      setIsDOMReady(isReady)
    }
    
    checkDOMReady()
    document.addEventListener('readystatechange', checkDOMReady)
    
    return () => {
      document.removeEventListener('readystatechange', checkDOMReady)
    }
  }, [id])
  
  // Debug logging for state changes
  useEffect(() => {
    console.log(`[LoadingGate:${id}] 📊 State updated:`, {
      isHydrated,
      isDOMReady,
      isLoading,
      totalAssets,
      loadedAssets,
      progress: totalAssets > 0 ? Math.round((loadedAssets / totalAssets) * 100) : 0,
      timeFromMount: Date.now() - mountTime.current,
      timestamp: new Date().toISOString(),
      componentStack: new Error().stack?.split('\n').slice(1).join('\n')
    })
  }, [id, isHydrated, isDOMReady, isLoading, totalAssets, loadedAssets])
  
  // Early return with null if not ready
  if (!isHydrated || !isDOMReady || isLoading) {
    console.log(`[LoadingGate:${id}] ⏳ Blocking render:`, {
      reason: !isHydrated ? 'Not hydrated' : !isDOMReady ? 'DOM not ready' : 'Assets still loading',
      isHydrated,
      isDOMReady,
      isLoading,
      timestamp: new Date().toISOString()
    })
    return null
  }
  
  console.log(`[LoadingGate:${id}] ✅ Rendering children, all conditions met:`, {
    isHydrated,
    isDOMReady,
    isLoading: false,
    totalAssets,
    loadedAssets,
    timeFromMount: Date.now() - mountTime.current,
    timestamp: new Date().toISOString()
  })
  
  return <>{children}</>
} 