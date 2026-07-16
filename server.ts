import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable JSON body parsing (Mercado Libre sends JSON payloads)
app.use(express.json());

// Basic CORS middleware to allow connection from the React frontend if needed
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Webhook server is running' });
});

// Endpoint to receive Mercado Libre notifications
app.post('/notifications', (req, res) => {
  const notification = req.body;

  console.log('\n--- Received Mercado Libre Notification ---');
  console.log(JSON.stringify(notification, null, 2));
  console.log('-------------------------------------------\n');

  // Mercado Libre expects a 200 OK or 201 Created response immediately.
  // If your server returns 5xx or fails to respond, ML will retry.
  res.status(200).send('OK');
});

app.post('/api/auth/token', async (req, res) => {
  const { code, redirectUri, codeVerifier } = req.body;
  console.log('\n--- OAuth Token Exchange Request Received ---');
  console.log(`Code: ${code ? code.substring(0, 15) + '...' : 'undefined'}`);
  console.log(`RedirectUri: ${redirectUri}`);
  console.log(`CodeVerifier: ${codeVerifier ? 'provided' : 'not provided'}`);
  console.log('---------------------------------------------\n');

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Mercado Libre credentials not configured on server' });
  }

  try {
    const paramsMap: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    };

    if (codeVerifier) {
      paramsMap.code_verifier = codeVerifier;
    }

    const params = new URLSearchParams(paramsMap);

    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('\n--- OAuth Exchange Error Response ---');
      console.error(JSON.stringify(data, null, 2));
      console.error('-------------------------------------\n');
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Error exchanging token:', error);
    return res.status(500).json({ error: 'Internal server error during token exchange' });
  }
});

// Proxy route to forward Mercado Libre API requests and log errors for debugging
app.all('/api-ml/*', async (req, res) => {
  const targetPath = req.params[0] || '';
  const queryString = new URL(req.url, 'http://localhost').search;
  const targetUrl = `https://api.mercadolibre.com/${targetPath}${queryString}`;

  console.log(`\n--- Proxying Request: ${req.method} ${targetUrl} ---`);

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  };

  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization as string;
    console.log(`Authorization token sent (first 25 chars): ${req.headers.authorization.substring(0, 25)}...`);
    
    // Diagnostic check for the token validation and search API
    try {
      console.log('--- Starting API Diagnostics ---');
      
      // Test 1: Verify token with /users/me
      const meResponse = await fetch('https://api.mercadolibre.com/users/me', {
        headers: { 'Authorization': req.headers.authorization as string }
      });
      const meData = await meResponse.json();
      console.log(`[Diag 1: /users/me] Status: ${meResponse.status}`);
      if (meResponse.ok) {
        console.log(`  User Nickname: ${meData.nickname}, ID: ${meData.id}, Site: ${meData.site_id}`);
      } else {
        console.log(`  Error:`, JSON.stringify(meData));
      }

      // Test 2: Search with token (standard headers)
      const searchWithToken = await fetch('https://api.mercadolibre.com/sites/MLB/search?q=teste&limit=5', {
        headers: { 
          'Authorization': req.headers.authorization as string,
          'Accept': 'application/json'
        }
      });
      console.log(`[Diag 2: Search with token] Status: ${searchWithToken.status}`);
      if (!searchWithToken.ok) {
        const body = await searchWithToken.json().catch(() => ({}));
        console.log(`  Body:`, JSON.stringify(body));
      }

      // Test 3: Search WITHOUT token (to see if public search is allowed or blocked by IP/Cloudflare)
      const searchWithoutToken = await fetch('https://api.mercadolibre.com/sites/MLB/search?q=teste&limit=5', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log(`[Diag 3: Search without token] Status: ${searchWithoutToken.status}`);
      if (!searchWithoutToken.ok) {
        const body = await searchWithoutToken.json().catch(() => ({}));
        console.log(`  Body:`, JSON.stringify(body));
      }

      // Test 4: Get item details directly with token (to verify /items endpoint)
      const itemWithToken = await fetch('https://api.mercadolibre.com/items/MLB4581295984', {
        headers: { 'Authorization': req.headers.authorization as string }
      });
      console.log(`[Diag 4: Item detail with token] Status: ${itemWithToken.status}`);
      if (itemWithToken.ok) {
        const itemData = await itemWithToken.json();
        console.log(`  Item Title: ${itemData.title}, Price: ${itemData.price}`);
      }

      // Test 5: Search by seller_id with token (querying own products)
      const searchBySeller = await fetch('https://api.mercadolibre.com/sites/MLB/search?seller_id=730996151&limit=5', {
        headers: { 
          'Authorization': req.headers.authorization as string,
          'Accept': 'application/json'
        }
      });
      console.log(`[Diag 5: Search by seller_id] Status: ${searchBySeller.status}`);
      if (searchBySeller.ok) {
        const body = await searchBySeller.json();
        console.log(`  Results count: ${body.results?.length || 0}`);
      } else {
        const body = await searchBySeller.json().catch(() => ({}));
        console.log(`  Body:`, JSON.stringify(body));
      }

      console.log('--- End of API Diagnostics ---');
    } catch (diagErr) {
      console.error('[Diagnostic] Exception:', diagErr);
    }
  } else {
    console.log('No Authorization token sent');
  }

  try {
    const fetchOptions: any = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    console.log(`Proxy Response Status: ${response.status}`);
    if (!response.ok) {
      console.warn('Proxy Error Payload:', JSON.stringify(data, null, 2));
    }
    console.log('-------------------------------------------\n');

    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Proxy Exception:', error);
    console.log('-------------------------------------------\n');
    return res.status(500).json({ error: 'Proxy failed', message: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Webhook server is running at http://localhost:${PORT}`);
  console.log(`📢 Target notifications endpoint: http://localhost:${PORT}/notifications`);
  console.log(`==================================================`);
});
