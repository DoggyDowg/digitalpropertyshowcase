'use client'

import { useState } from 'react'
import { ShimmerLogo } from '@/components/shared/ShimmerLogo'

export default function TestShimmerLoading() {
  const [showLoading, setShowLoading] = useState(true)

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shimmer Logo Loading Test</h1>
        
        <div className="space-y-6">
          <button
            onClick={() => setShowLoading(!showLoading)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showLoading ? 'Hide Loading' : 'Show Loading'}
          </button>

          {showLoading && (
            <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
              <ShimmerLogo />
            </div>
          )}
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Test Details</h2>
            <ul className="text-gray-600 space-y-2">
              <li>• Logo should be monochrome (black & white)</li>
              <li>• Low opacity (around 15%)</li>
              <li>• Shimmer effect sweeping left to right</li>
              <li>• Animation duration: 2.5 seconds</li>
              <li>• Responsive sizing for mobile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 