import { NextRequest, NextResponse } from 'next/server';

// Load Dify API Key from environment variable
const DIFY_API_KEY = process.env.DIFY_APP_KEY;
const DIFY_API_URL = 'https://api.dify.ai/v1';

// Next.js App Router API route
export async function POST(request: NextRequest) {
  // Set CORS headers for the preflight request
  const headers = {
    'Access-Control-Allow-Origin': '*', // Adjust in production
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!DIFY_API_KEY) {
    console.error('ERROR: DIFY_APP_KEY environment variable is not set in Vercel.');
    return NextResponse.json(
      { error: 'Server configuration error: DIFY_APP_KEY missing.' },
      { status: 500, headers }
    );
  }

  try {
    const requestData = await request.json();
    console.log('API route received request:', requestData);
    console.log('chat_type from request:', requestData.chat_type);

    // Create proper inputs object with chat_type inside it
    const inputs = {
      ...requestData.inputs || {},
      chat_type: requestData.chat_type || 'landingpage'
    };
    
    const difyRequestBody = {
      inputs: inputs,
      query: requestData.query,
      response_mode: 'streaming',
      conversation_id: requestData.conversation_id || undefined,
      user: requestData.user || 'vercel-nextjs-user',
    };

    console.log('Sending to Dify:', JSON.stringify(difyRequestBody));
    
    const difyResponse = await fetch(`${DIFY_API_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(difyRequestBody),
    });

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();
      console.error(`Dify API Error (${difyResponse.status}): ${errorText}`);
      return NextResponse.json(
        { error: 'Dify API Error', details: errorText },
        { status: difyResponse.status, headers }
      );
    }

    // For streaming responses in Next.js App Router
    const stream = difyResponse.body;
    if (!stream) {
      return NextResponse.json(
        { error: 'Proxy server error', details: 'Could not get response stream.' },
        { status: 500, headers }
      );
    }

    // Use the Response web API to create a streaming response
    return new Response(stream, {
      status: difyResponse.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...headers,
      },
    });
  } catch (error) {
    console.error('Error processing request in Next.js API route:', error);
    let errorMessage = 'Proxy server error';
    let errorDetails = error instanceof Error ? error.message : String(error);

    if (error instanceof SyntaxError && errorDetails.includes('JSON')) {
      errorMessage = 'Invalid JSON in request body.';
      errorDetails = 'Please ensure the request body is valid JSON.';
    }

    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}