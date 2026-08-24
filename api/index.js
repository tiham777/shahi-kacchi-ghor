// Vercel Serverless Function — handles all API requests
// On Vercel's serverless platform, data is stored in-memory per-function instance.
// The state is seeded automatically from seed.js on first request.
const { seed } = require('../seed');

// In-memory state (persists for the lifetime of this function instance)
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

  // singleton PATCH: /api/singleton/:name
  if (seg[0] === 'singleton' && method === 'PATCH') {
    const name = seg[1];
    if (!SINGLETONS[name]) return sendJSON(res, 404, { error: 'unknown singleton' });
    const patch = await readBody(req);
    s[name] = { ...s[name], ...patch };
    return sendJSON(res, 200, s[name]);
  }

  // collection ops: /api/coll/:name (POST add), /api/coll/:name/:id (PATCH/DELETE)
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
    return await handleApi(req, res, parts);
  } catch (e) {
    return sendJSON(res, 500, { error: String(e) });
  }
};
