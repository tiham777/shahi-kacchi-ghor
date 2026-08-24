// Vercel entry point — serves static files and API from a single function
const fs = require('fs');
const path = require('path');
const { seed } = require('./seed');

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };
const ROOT = __dirname;

// In-memory state for Vercel serverless
let state = null;

function load() {
  if (state) return state;
  state = seed();
  return state;
}

function uid(prefix) {
  return prefix + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
}

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 5e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); }
    });
  });
}

const SINGLETONS = { settings: 1, delivery: 1, admin: 1 };

async function handleApi(req, res, parts) {
  const seg = parts.slice(1);
  const method = req.method;
  const s = load();

  if (seg[0] === 'state' && method === 'GET') return sendJSON(res, 200, s);
  if (seg[0] === 'reset' && method === 'POST') {
    state = seed();
    return sendJSON(res, 200, state);
  }

  if (seg[0] === 'singleton' && method === 'PATCH') {
    const name = seg[1];
    if (!SINGLETONS[name]) return sendJSON(res, 404, { error: 'unknown singleton' });
    const patch = await readBody(req);
    s[name] = { ...s[name], ...patch };
    return sendJSON(res, 200, s[name]);
  }

  if (seg[0] === 'coll') {
    const name = seg[1], id = seg[2];
    if (!Array.isArray(s[name])) return sendJSON(res, 404, { error: 'unknown collection' });

    if (method === 'POST' && !id) {
      const obj = await readBody(req);
      if (!obj.id) obj.id = uid(name[0] + '_');
      s[name].unshift(obj);
      return sendJSON(res, 201, obj);
    }
    if (method === 'PATCH' && id) {
      const patch = await readBody(req);
      const i = s[name].findIndex(x => x.id === id);
      if (i < 0) return sendJSON(res, 404, { error: 'not found' });
      s[name][i] = { ...s[name][i], ...patch };
      return sendJSON(res, 200, s[name][i]);
    }
    if (method === 'DELETE' && id) {
      s[name] = s[name].filter(x => x.id !== id);
      return sendJSON(res, 200, { ok: true });
    }
  }

  return sendJSON(res, 405, { error: 'unsupported' });
}

module.exports = async (req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const parts = urlPath.split('/').filter(Boolean);

    // API routes
    if (parts[0] === 'api') {
      return await handleApi(req, res, parts);
    }

    // Static file serving
    let p = urlPath === '/' ? '/index.html' : urlPath;
    // Prevent path traversal
    p = p.replace(/\.\./g, '');
    const filePath = path.join(ROOT, p);

    // Security: block internal files
    const base = path.basename(filePath);
    if (['data-store.json', 'seed.js', 'index.js', 'server.js', 'dev-server.js', 'package.json'].includes(base)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not found');
      }
      const ext = path.extname(filePath);
      res.writeHead(200, {
        'Content-Type': TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      res.end(data);
    });
  } catch (e) {
    return sendJSON(res, 500, { error: String(e) });
  }
};
