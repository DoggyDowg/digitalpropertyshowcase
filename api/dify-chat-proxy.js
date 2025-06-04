const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load Dify API Key from environment variable
const DIFY_API_KEY = process.env.DIFY_APP_KEY;
const DIFY_API_URL = 'https://api.dify.ai/v1';

// Vercel serverless function handler
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust in production
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Added Authorization as it's often needed

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (!DIFY_API_KEY) {
        console.error('ERROR: DIFY_APP_KEY environment variable is not set in Vercel.');
        res.status(500).json({ error: 'Server configuration error: DIFY_APP_KEY missing.' });
        return;
    }

    // We expect this function to be deployed at a path like /api/dify-chat-proxy
    // So we don't need to check req.url as strictly as in the original http server
    if (req.method === 'POST') {
        try {
            const requestData = req.body; // Vercel automatically parses JSON body for `application/json` content type
            console.log('Vercel function received request:', requestData);
            
            // Check if conversation ID exists in the request
            if (requestData.conversation_id) {
                console.log('Continuing conversation with ID:', requestData.conversation_id);
            } else {
                console.log('Starting new conversation (no conversation_id provided)');
            }

            const difyRequestBody = {
                inputs: requestData.inputs || {},
                query: requestData.query,
                response_mode: 'streaming',
                conversation_id: requestData.conversation_id || undefined, // Pass undefined for new conversations
                user: requestData.user || 'vercel-serverless-user',
            };

            console.log('Sending request to Dify API with body:', JSON.stringify(difyRequestBody));

            const difyResponse = await fetch(`${DIFY_API_URL}/chat-messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DIFY_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream', // Dify streams with this content type
                },
                body: JSON.stringify(difyRequestBody),
            });

            if (!difyResponse.ok) {
                const errorText = await difyResponse.text();
                console.error(`Dify API Error (${difyResponse.status}): ${errorText}`);
                res.status(difyResponse.status).json({ error: 'Dify API Error', details: errorText });
                return;
            }

            // Set headers for streaming response
            res.writeHead(difyResponse.status, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                // Vercel handles transfer-encoding (like chunked) automatically for streams
            });

            // Pipe the stream from Dify to the client
            // Node.js stream piping
            if (difyResponse.body && typeof difyResponse.body.pipe === 'function') {
                 difyResponse.body.pipe(res);
                 console.log('Streaming response from Dify to client via Node.js stream...');
            } else {
                // Fallback for environments where body might not be a directly pipeable Node stream
                // (e.g. Web Streams API - though Vercel usually provides Node.js compatible streams)
                // This part might need adjustment based on the exact stream type from node-fetch in Vercel env.
                // For Vercel, node-fetch's response.body should be a Node.js Readable stream.
                console.error('Error: difyResponse.body is not a pipeable Node.js stream.');
                res.status(500).json({ error: 'Proxy server error', details: 'Could not pipe stream.' });
            }

        } catch (error) {
            console.error('Error processing request in Vercel function:', error);
            let errorMessage = 'Proxy server error';
            let errorDetails = error.message;

            if (error instanceof SyntaxError && error.message.includes('JSON')) {
                errorMessage = 'Invalid JSON in request body.';
                errorDetails = 'Please ensure the request body is valid JSON.';
            }
            
            res.status(500).json({ error: errorMessage, details: errorDetails });
        }
    } else {
        res.setHeader('Allow', ['POST', 'OPTIONS']);
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
} 