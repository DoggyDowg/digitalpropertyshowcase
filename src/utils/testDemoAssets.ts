import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DEMO_CONFIG } from '@/config/demo'

interface TestResult {
  path: string
  success: boolean
  error?: string
  url?: string
}

interface TestSummary {
  totalTests: number
  passed: number
  failed: number
  results: TestResult[]
}

export async function testDemoAssets(): Promise<TestSummary> {
  const supabase = createClientComponentClient()
  const results: TestResult[] = []

  // Test individual assets
  const individualAssets = [
    { name: 'Hero Video', path: DEMO_CONFIG.assets.hero_video },
    { name: 'Features Banner', path: DEMO_CONFIG.assets.features_banner },
    { name: 'Lifestyle Banner', path: DEMO_CONFIG.assets.lifestyle_banner },
    { name: 'Neighbourhood Banner', path: DEMO_CONFIG.assets.neighbourhood_banner },
    { name: 'Your Home Banner', path: DEMO_CONFIG.assets.yourhome_banner },
    { name: 'Footer Image', path: DEMO_CONFIG.assets.footer_image },
    { name: '3D Tour', path: DEMO_CONFIG.assets.tour_3d },
  ]

  for (const asset of individualAssets) {
    try {
      const { data: publicUrlData } = supabase.storage
        .from('property-assets')
        .getPublicUrl(asset.path)

      if (publicUrlData?.publicUrl) {
        const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
        if (response.ok) {
          results.push({
            path: asset.path,
            success: true,
            url: publicUrlData.publicUrl
          })
        } else {
          results.push({
            path: asset.path,
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          })
        }
      } else {
        results.push({
          path: asset.path,
          success: false,
          error: 'Failed to generate public URL'
        })
      }
    } catch (error) {
      results.push({
        path: asset.path,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Test gallery images
  for (let i = 0; i < DEMO_CONFIG.assets.gallery.length; i++) {
    const path = DEMO_CONFIG.assets.gallery[i]
    try {
      const { data: publicUrlData } = supabase.storage
        .from('property-assets')
        .getPublicUrl(path)

      if (publicUrlData?.publicUrl) {
        const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
        if (response.ok) {
          results.push({
            path,
            success: true,
            url: publicUrlData.publicUrl
          })
        } else {
          results.push({
            path,
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          })
        }
      } else {
        results.push({
          path,
          success: false,
          error: 'Failed to generate public URL'
        })
      }
    } catch (error) {
      results.push({
        path,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Test neighbourhood images
  for (let i = 0; i < DEMO_CONFIG.assets.neighbourhood.length; i++) {
    const path = DEMO_CONFIG.assets.neighbourhood[i]
    try {
      const { data: publicUrlData } = supabase.storage
        .from('property-assets')
        .getPublicUrl(path)

      if (publicUrlData?.publicUrl) {
        const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
        if (response.ok) {
          results.push({
            path,
            success: true,
            url: publicUrlData.publicUrl
          })
        } else {
          results.push({
            path,
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          })
        }
      } else {
        results.push({
          path,
          success: false,
          error: 'Failed to generate public URL'
        })
      }
    } catch (error) {
      results.push({
        path,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Test aerial images
  for (let i = 0; i < DEMO_CONFIG.assets.aerials.length; i++) {
    const path = DEMO_CONFIG.assets.aerials[i]
    try {
      const { data: publicUrlData } = supabase.storage
        .from('property-assets')
        .getPublicUrl(path)

      if (publicUrlData?.publicUrl) {
        const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
        if (response.ok) {
          results.push({
            path,
            success: true,
            url: publicUrlData.publicUrl
          })
        } else {
          results.push({
            path,
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          })
        }
      } else {
        results.push({
          path,
          success: false,
          error: 'Failed to generate public URL'
        })
      }
    } catch (error) {
      results.push({
        path,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const totalTests = results.length
  const passed = results.filter(r => r.success).length
  const failed = totalTests - passed

  return {
    totalTests,
    passed,
    failed,
    results
  }
}

export function logTestResults(summary: TestSummary) {
  console.log(`\n🧪 Demo Asset Test Results`)
  console.log(`================================`)
  console.log(`Total Tests: ${summary.totalTests}`)
  console.log(`✅ Passed: ${summary.passed}`)
  console.log(`❌ Failed: ${summary.failed}`)
  console.log(`Success Rate: ${((summary.passed / summary.totalTests) * 100).toFixed(1)}%`)
  
  if (summary.failed > 0) {
    console.log(`\n❌ Failed Assets:`)
    summary.results
      .filter(r => !r.success)
      .forEach(result => {
        console.log(`  - ${result.path}: ${result.error}`)
      })
  }
  
  console.log(`\n✅ Working Assets:`)
  summary.results
    .filter(r => r.success)
    .forEach(result => {
      console.log(`  - ${result.path}`)
    })
} 