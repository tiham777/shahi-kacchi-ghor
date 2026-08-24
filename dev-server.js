// Static file server + tiny JSON REST API with on-disk persistence.
// All clients (customers on any browser/device + the admin panel) share the
// single data-store.json, so orders placed anywhere show up for the admin.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { seed } = require('./seed');

const ROOT = __dirname;
const PORT = process.env.PORT || 4173;
const STORE = path.join(ROOT, 'data-store.json');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };

/* ---------- store helpers ---------- */
// On Vercel (read-only filesystem), persist to memory instead of disk.
let state = null;
const isReadOnlyFS = (() => {
  try { fs.writeFileSync(STORE + '.test', '1'); fs.unlinkSync(STORE + '.test'); return false; }
  catch { return true; }
})();

function load() {
  if (state) return state;
  try { state = JSON.parse(fs.readFileSync(STORE, 'utf8')); }
  catch (e) { state = seed(); }
  return state;
}
function persist(newState) {
  state = newState;
  if (!isReadOnlyFS) {
    try { fs.writeFileSync(STORE, JSON.stringify(newState, null, 2)); } catch { /* read-only FS, keep in-memory */ }
  }
}
function uid(prefix) { return prefix + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); }

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''; req.on('data', c => { data += c; if (data.length > 5e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); } });
  });
}

const SINGLETONS = { settings: 1, delivery: 1, admin: 1 };

/* ---------- API ---------- */
async function handleApi(req, res, parts) {
  // parts: ['api', ...]
  const seg = parts.slice(1);          // e.g. ['state'] or ['coll','orders','SKG-1']
  const method = req.method;
  const state = load();

  if (seg[0] === 'state' && method === 'GET') return sendJSON(res, 200, state);
  if (seg[0] === 'reset' && method === 'POST') { const s = seed(); persist(s); return sendJSON(res, 200, s); }

  // singleton PATCH: /api/singleton/:name
  if (seg[0] === 'singleton' && method === 'PATCH') {
    const name = seg[1];
    if (!SINGLETONS[name]) return sendJSON(res, 404, { error: 'unknown singleton' });
    const patch = await readBody(req);
    state[name] = { ...state[name], ...patch };
    persist(state);
    return sendJSON(res, 200, state[name]);
  }

  // collection ops: /api/coll/:name  (POST add) ; /api/coll/:name/:id (PATCH/DELETE)
  if (seg[0] === 'coll') {
    const name = seg[1], id = seg[2];
    if (!Array.isArray(state[name])) return sendJSON(res, 404, { error: 'unknown collection' });

    if (method === 'POST' && !id) {
      const obj = await readBody(req);
      if (!obj.id) obj.id = uid(name[0] + '_');
      state[name].unshift(obj);
      persist(state);
      return sendJSON(res, 201, obj);
    }
    if (method === 'PATCH' && id) {
      const patch = await readBody(req);
      const i = state[name].findIndex(x => x.id === id);
      if (i < 0) return sendJSON(res, 404, { error: 'not found' });
      state[name][i] = { ...state[name][i], ...patch };
      persist(state);
      return sendJSON(res, 200, state[name][i]);
    }
    if (method === 'DELETE' && id) {
      state[name] = state[name].filter(x => x.id !== id);
      persist(state);
      return sendJSON(res, 200, { ok: true });
    }
  }

  return sendJSON(res, 405, { error: 'unsupported' });
}

/* ---------- server ---------- */
http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const parts = urlPath.split('/').filter(Boolean);

  if (parts[0] === 'api') { try { return await handleApi(req, res, parts); } catch (e) { return sendJSON(res, 500, { error: String(e) }); } }

  // static files
  let p = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.join(ROOT, p);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  // never expose the private data store or server internals
  const base = path.basename(filePath);
  if (base === 'data-store.json' || base === 'seed.js' || base === 'server.js') { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, () => console.log('Shahi Kacchi Ghor running at http://localhost:' + PORT));
