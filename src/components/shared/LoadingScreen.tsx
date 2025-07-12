'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useAssetLoading } from '@/contexts/AssetLoadingContext'

export default function LoadingScreen() {
  const { isLoading, totalAssets, loadedAssets } = useAssetLoading()
  const [showDebug, setShowDebug] = useState(false)

  // Calculate loading percentage
  const loadingPercentage = totalAssets === 0 ? 0 : Math.round((loadedAssets / totalAssets) * 100)

  if (!isLoading) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-6 z-[9999] px-4">
      <div className="relative mb-4">
        <Image
          src="/logos/dps_whitebg.png"
          alt="Digital Property Showcase"
          width={250}
          height={100}
          className="object-contain max-w-full h-auto"
          priority
          sizes="100vw"
        />
      </div>
      
      {/* Loading Progress */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-xl mb-2">Loading demonstration...</div>
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-dark transition-all duration-300 ease-out rounded-full"
            style={{ width: `${loadingPercentage}%` }}
          />
        </div>
        <div className="text-sm text-gray-600">
          {loadingPercentage}% ({loadedAssets}/{totalAssets} assets)
        </div>
        
        {/* Debug Toggle Button */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="mt-4 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
        )}
        
        {/* Debug Information */}
        {showDebug && process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs max-w-md max-h-40 overflow-y-auto">
            <div className="font-bold mb-2">Debug Information:</div>
            <div>Total Assets: {totalAssets}</div>
            <div>Loaded Assets: {loadedAssets}</div>
            <div>Missing Assets: {totalAssets - loadedAssets}</div>
            <div className="mt-2 text-gray-600">
              <strong>Clean Console Logs to Check:</strong>
              <br />
              • 🚀 Starting asset loading
              <br />
              • 📝 Asset registration milestones  
              <br />
              • 📈 Progress updates (every 10%)
              <br />
              • ❌ Any error messages
              <br />
              • ⚠️ Stuck warnings (after 8s)
              <br />
              • 🎯 Completion status
            </div>
            {loadingPercentage === 33 && (
              <div className="mt-2 p-2 bg-yellow-100 rounded text-yellow-800">
                <strong>33% = Common Issue Patterns:</strong>
                <br />
                • Instagram API problems (❌ [Instagram])
                <br />
                • Missing demo assets (❌ [TrackedImage])
                <br />
                • Network/CORS issues (❌ [RobustImage])
                <br />
                • Storage permission problems
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}