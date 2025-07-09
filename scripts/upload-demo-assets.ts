#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Demo assets to upload
const DEMO_ASSETS = [
  {
    category: 'hero_video',
    filename: 'hero.mp4',
    localPath: 'public/demo/hero_video/hero.mp4',
    storagePath: 'demo/hero_video/hero.mp4',
    description: 'Demo hero video for background'
  },
  {
    category: 'features_banner',
    filename: 'banner.jpg',
    localPath: 'public/demo/features_banner/banner.jpg',
    storagePath: 'demo/features_banner/banner.jpg',
    description: 'Demo features banner image'
  },
  {
    category: 'lifestyle_banner',
    filename: 'banner.jpg',
    localPath: 'public/demo/lifestyle_banner/banner.jpg',
    storagePath: 'demo/lifestyle_banner/banner.jpg',
    description: 'Demo lifestyle banner image'
  },
  {
    category: 'neighbourhood_banner',
    filename: 'banner.jpg',
    localPath: 'public/demo/neighbourhood_banner/banner.jpg',
    storagePath: 'demo/neighbourhood_banner/banner.jpg',
    description: 'Demo neighbourhood banner image'
  },
  {
    category: 'your_home',
    filename: 'image.jpg',
    localPath: 'public/demo/your_home/image.jpg',
    storagePath: 'demo/your_home/image.jpg',
    description: 'Demo your home image'
  },
  {
    category: 'footer',
    filename: 'image.jpg',
    localPath: 'public/demo/footer/image.jpg',
    storagePath: 'demo/footer/image.jpg',
    description: 'Demo footer image'
  },
  // Gallery images
  ...Array.from({ length: 6 }, (_, i) => ({
    category: 'gallery',
    filename: `image${i + 1}.jpg`,
    localPath: `public/demo/gallery/image${i + 1}.jpg`,
    storagePath: `demo/gallery/image${i + 1}.jpg`,
    description: `Demo gallery image ${i + 1}`
  })),
  // Neighbourhood images
  ...Array.from({ length: 3 }, (_, i) => ({
    category: 'neighbourhood',
    filename: `image${i + 1}.jpg`,
    localPath: `public/demo/neighbourhood/image${i + 1}.jpg`,
    storagePath: `demo/neighbourhood/image${i + 1}.jpg`,
    description: `Demo neighbourhood image ${i + 1}`
  }))
]

async function uploadDemoAssets() {
  console.log('🚀 Starting demo assets upload...\n')
  
  let uploadedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const asset of DEMO_ASSETS) {
    try {
      console.log(`📁 Processing ${asset.description}...`)
      
      // Check if file exists locally
      if (!existsSync(asset.localPath)) {
        console.log(`   ⚠️  Local file not found: ${asset.localPath}`)
        console.log(`   📝 Create this file to upload it as a demo asset`)
        skippedCount++
        continue
      }

      // Check if already exists in storage
      const { data: existingFile } = await supabase.storage
        .from('property-assets')
        .list(asset.storagePath.split('/').slice(0, -1).join('/'), {
          search: asset.filename
        })

      if (existingFile && existingFile.length > 0) {
        console.log(`   ✅ Already exists in storage`)
        skippedCount++
        continue
      }

      // Read and upload file
      const fileBuffer = readFileSync(asset.localPath)
      const contentType = getContentType(asset.filename)

      const { data, error } = await supabase.storage
        .from('property-assets')
        .upload(asset.storagePath, fileBuffer, {
          contentType,
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.log(`   ❌ Upload failed: ${error.message}`)
        errorCount++
        continue
      }

      console.log(`   ✅ Uploaded successfully`)
      uploadedCount++

    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      errorCount++
    }
  }

  console.log('\n📊 Upload Summary:')
  console.log(`   ✅ Uploaded: ${uploadedCount}`)
  console.log(`   ⏭️  Skipped: ${skippedCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)

  if (uploadedCount > 0) {
    console.log('\n🎉 Demo assets uploaded successfully!')
    console.log('\nDemo properties will now be able to load these assets.')
  }

  if (skippedCount > 0) {
    console.log('\n📝 To upload the missing assets:')
    console.log('   1. Add the demo files to the public/demo/ directory structure')
    console.log('   2. Run this script again')
    console.log('\n   Suggested demo asset structure:')
    console.log('   public/demo/')
    console.log('   ├── hero_video/hero.mp4        (background video)')
    console.log('   ├── gallery/image1.jpg...image6.jpg')
    console.log('   ├── neighbourhood/image1.jpg...image3.jpg')
    console.log('   ├── features_banner/banner.jpg')
    console.log('   ├── lifestyle_banner/banner.jpg')
    console.log('   ├── neighbourhood_banner/banner.jpg')
    console.log('   ├── your_home/image.jpg')
    console.log('   └── footer/image.jpg')
  }
}

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  switch (ext) {
    case 'mp4': return 'video/mp4'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'png': return 'image/png'
    case 'webp': return 'image/webp'
    default: return 'application/octet-stream'
  }
}

// Run the script
uploadDemoAssets().catch(console.error) 