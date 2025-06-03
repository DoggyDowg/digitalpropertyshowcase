const http = require('http');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load Dify API Key from environment variable
const DIFY_API_KEY = process.env.DIFY_APP_KEY;
const DIFY_API_URL = 'https://api.dify.ai/v1';

const PORT = process.env.PROXY_PORT || 3001; // Port for our proxy server

if (!DIFY_API_KEY) {
    console.error('ERROR: DIFY_APP_KEY environment variable is not set.');
    console.error('Please set it before running the proxy server.');
    console.error('Example: export DIFY_APP_KEY="your_dify_app_key_here"');
    process.exit(1);
}

console.log(`Dify API Key Loaded: ${DIFY_API_KEY.substring(0, 5)}...`); // Log a portion for confirmation

const server = http.createServer(async (req, res) => {
    // Set CORS headers to allow requests from your frontend
    res.setHeader('Access-Control-Allow-Origin', '*'); // In production, restrict this to your actual frontend domain
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        // Pre-flight request. Reply successfully:
        res.writeHead(204); // No Content
        res.end();
        return;
    }

    if (req.url === '/chat-messages' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });

        req.on('end', async () => {
            try {
                const requestData = JSON.parse(body);
                console.log('Proxy received request:', requestData);

                const difyRequestBody = {
                    inputs: requestData.inputs || {},
                    query: requestData.query,
                    response_mode: 'streaming',
                    conversation_id: requestData.conversation_id || null,
                    user: requestData.user || 'vanilla-js-user',
                    // chat_type: requestData.chat_type || 'vanilla-js-chat' // Optional: if you used this in Dify
                };

                const difyResponse = await fetch(`${DIFY_API_URL}/chat-messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${DIFY_API_KEY}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(difyRequestBody),
                });

                if (!difyResponse.ok) {
                    const errorText = await difyResponse.text();
                    console.error(`Dify API Error (${difyResponse.status}): ${errorText}`);
                    res.writeHead(difyResponse.status, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Dify API Error', details: errorText }));
                    return;
                }

                // Stream the response from Dify back to the client
                res.writeHead(difyResponse.status, {
                    'Content-Type': 'text/event-stream', // Dify streams with this content type
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                });

                difyResponse.body.pipe(res);
                console.log('Streaming response from Dify to client...');

            } catch (error) {
                console.error('Error processing request in proxy:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Proxy server error', details: error.message }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not Found' }));
    }
});

server.listen(PORT, () => {
    console.log(`Dify Chat Proxy server running on http://localhost:${PORT}`);
    console.log('Ensure your DIFY_APP_KEY environment variable is set.');
});

process.on('SIGINT', () => {
    console.log('\nProxy server shutting down...');
    server.close(() => {
        console.log('Proxy server stopped.');
        process.exit(0);
    });
}); 