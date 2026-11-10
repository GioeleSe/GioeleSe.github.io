const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Add CORS headers so 3D assets and workers can load without restrictions
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Handle local survey responses recording
  if (req.method === 'POST' && pathname === '/api/survey') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        data.recordedAt = new Date().toISOString();
        const responsesPath = path.join(ROOT_DIR, 'survey_responses.json');
        let existing = [];
        if (fs.existsSync(responsesPath)) {
          try {
            existing = JSON.parse(fs.readFileSync(responsesPath, 'utf8'));
          } catch(e) {
            existing = [];
          }
        }
        existing.push(data);
        fs.writeFileSync(responsesPath, JSON.stringify(existing, null, 2), 'utf8');
        console.log(`[Survey] New validation response recorded from ${data.email || 'anonymous'}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Response recorded locally in survey_responses.json' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(path.join(ROOT_DIR, pathname));

  // Prevent directory traversal
  if (!safePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    let filePathToServe = safePath;
    if (stats.isDirectory()) {
      filePathToServe = path.join(safePath, 'index.html');
    }

    const ext = path.extname(filePathToServe).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePathToServe, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${pathname}`);
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': data.length,
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`ORBITAL DIY Hardware Validation Server running at http://localhost:${PORT}/`);
  });
}

module.exports = server;
