'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // Redirect to the static landing page
    window.location.href = '/index.html'
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Redirecting to Digital Property Showcase...</p>
      </div>
    </div>
  )
}
