import 'dotenv/config';
import { createServer } from 'http';
import { parse } from 'url';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const server = createServer(async (req, res) => {
  const parsedUrl = parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Route API requests to serverless functions
  if (pathname.startsWith('/api/')) {
    const apiPath = pathname.replace('/api/', '');

    try {
      const handlerPath = join(__dirname, 'api', `${apiPath}.js`);
      const handler = (await import(handlerPath)).default;

      // Create Vercel-compatible request object with query params
      req.query = parsedUrl.query;

      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'API endpoint not found' }));
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
