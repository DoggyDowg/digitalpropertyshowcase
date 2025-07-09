# Demo Assets Setup

## Issue: Demo Properties Not Loading Videos

If you're seeing a grey background instead of a video on demo properties, it's because the demo hero video file is missing from Supabase storage.

## Solution

### Option 1: Upload Demo Assets Using the Script

1. **Prepare demo files** in your local `public/demo/` directory:
   ```
   public/demo/
   ├── hero_video/hero.mp4        (background video - REQUIRED for videos)
   ├── gallery/image1.jpg...image6.jpg
   ├── neighbourhood/image1.jpg...image3.jpg
   ├── features_banner/banner.jpg
   ├── lifestyle_banner/banner.jpg
   ├── neighbourhood_banner/banner.jpg
   ├── your_home/image.jpg
   └── footer/image.jpg
   ```

2. **Set up environment variables** (if not already done):
   ```bash
   # Add to your .env.local file
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Run the upload script**:
   ```bash
   npx tsx scripts/upload-demo-assets.ts
   ```

### Option 2: Disable Demo Properties

If you don't want to upload demo assets, you can disable demo properties by:

1. Setting all properties to `is_demo = false` in your database
2. Or removing the demo property creation logic

## Video Requirements

For the hero video (`demo/hero_video/hero.mp4`):
- **Format**: MP4
- **Duration**: 10-30 seconds (will loop)
- **Aspect Ratio**: 16:9 recommended
- **Size**: Under 50MB for good performance
- **Audio**: Not required (will be muted)
- **Content**: Should look good as a background video

## What Happens Without Demo Assets

Without demo assets, demo properties will:
- Show a gradient background instead of video
- Use placeholder content for images
- Still function normally, just without visual assets

## Fallback Behavior

The system now includes improved fallback behavior:
- **With video**: Shows background video
- **Without video**: Shows a subtle gradient background for demo properties
- **Error states**: Gracefully handled with appropriate fallbacks

## Troubleshooting

### Videos not loading after upload:
1. Check browser console for errors
2. Verify the video file exists in Supabase storage at `demo/hero_video/hero.mp4`
3. Ensure the file is publicly accessible
4. Try refreshing the page

### Storage errors:
1. Verify your Supabase service role key has storage permissions
2. Check that the `property-assets` bucket exists
3. Ensure the bucket has proper RLS policies for public access

### Script errors:
1. Make sure you have the required environment variables
2. Verify your local demo files exist at the expected paths
3. Check that `tsx` is installed (`npm install -g tsx` or use `npx`)

## Asset Guidelines

### Images:
- **Format**: JPEG, PNG, or WebP
- **Size**: 1920x1080 recommended for banners
- **Quality**: High quality for property showcases

### Videos:
- **Format**: MP4 with H.264 encoding
- **Resolution**: 1920x1080 or higher
- **Bitrate**: 5-10 Mbps for good quality
- **Frame Rate**: 24-30 fps 