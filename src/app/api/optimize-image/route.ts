import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Get original image metadata
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width ?? 0;
    const originalHeight = metadata.height ?? 0;

    // Target dimensions for social sharing
    const targetWidth = 1200;
    const targetHeight = 630;
    const targetRatio = targetWidth / targetHeight;

    // Calculate resize options based on original image dimensions
    let resizeOptions: sharp.ResizeOptions = {
      width: targetWidth,
      height: targetHeight,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    };

    // If original image is very different from target ratio, use 'cover' to avoid too much padding
    const originalRatio = originalWidth / originalHeight;
    const ratioDifference = Math.abs(originalRatio - targetRatio);
    
    if (ratioDifference > 0.5) { // If aspect ratios are very different
      resizeOptions = {
        width: targetWidth,
        height: targetHeight,
        fit: 'cover',
        position: 'center'
      };
    }

    // Optimize image
    const optimizedBuffer = await sharp(buffer)
      // First ensure image is big enough by enlarging if necessary
      .resize({
        width: Math.max(targetWidth, originalWidth),
        height: Math.max(targetHeight, originalHeight),
        fit: 'fill'
      })
      // Then resize to target dimensions with appropriate fit
      .resize(resizeOptions)
      // Convert to JPEG with high quality
      .jpeg({
        quality: 85,
        chromaSubsampling: '4:4:4'
      })
      .toBuffer();

    // Verify the optimized image
    const optimizedMetadata = await sharp(optimizedBuffer).metadata();
    
    if (!optimizedMetadata.width || !optimizedMetadata.height ||
        optimizedMetadata.width < targetWidth || 
        optimizedMetadata.height < targetHeight) {
      return NextResponse.json(
        { 
          error: 'Failed to optimize image to required dimensions',
          details: {
            original: { width: originalWidth, height: originalHeight },
            optimized: { width: optimizedMetadata.width, height: optimizedMetadata.height },
            target: { width: targetWidth, height: targetHeight }
          }
        },
        { status: 400 }
      );
    }

    // Return optimized image
    return new NextResponse(optimizedBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': optimizedBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error optimizing image:', error);
    return NextResponse.json(
      { error: 'Failed to optimize image' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 