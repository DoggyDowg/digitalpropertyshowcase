'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // Redirect to the static landing page immediately
    window.location.replace('/index.html')
  }, [])

  // Return null to avoid showing any content during redirect
  return null
}
