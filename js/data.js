/* ============================================================
   data.js — reactive DB backed by the server API (data-store.json)
   Exposes window.DB (methods) and window.SKG (helpers/images).
   All clients share one dataset, so orders/products/etc. are the
   same for every customer and the admin panel.
   ============================================================ */
(function () {
  /* Themed photo helpers (Unsplash CDN, with SVG fallback in cards) */
  const IMG = (id, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;
  const PH = {
    kacchi: IMG('1633945274405-b6c8069047b0'),
    mutton: IMG('1631452180519-c014fe946bc7'),
    beef: IMG('1589302168068-964664d93dc0'),
    kabab: IMG('1603360946369-dc9bb6258143'),
    roast: IMG('1598515214211-89d3c73ae83b'),
    egg: IMG('1482049016688-2d3e1b311543'),
    potato: IMG('1518977676601-b53f82aba655'),
    salad: IMG('1512621776951-a57141f2eefd'),
    borhani: IMG('1600271886742-f049cd451bba'),
    lacchi: IMG('1553530666-ba11a7da3888'),
    shorbot: IMG('1497534446932-c925b458314a'),
    mango: IMG('1553530979-7ee52a2670c4'),
    orange: IMG('1613478223719-2ab802602423'),
    fruit: IMG('1600271886742-f049cd451bba'),
    lemon: IMG('1523371054106-bbf80586c33c'),
    hero: IMG('1701579231305-d84d8af9a3fd', 1600),
    interior: IMG('1517248135467-4c7edcad34c4'),
    kitchen: IMG('1556910103-1c02745aae4d'),
    plates: IMG('1567337710282-00832b415979'),
    handi: IMG('1596797038530-2c107229654b'),
    platter: IMG('1596797038530-2c107229654b'),
    about: IMG('1601050690597-df0568f70950'),
  };

  /* Branded SVG fallback so a broken photo never looks broken */
  function svgFor(label, tone) {
    const c1 = tone || '#43291a', c2 = '#c88a2a';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>
      <rect width='800' height='600' fill='url(#g)'/>
      <g fill='rgba(255,255,255,.10)'><circle cx='120' cy='120' r='60'/><circle cx='680' cy='480' r='90'/></g>
      <text x='400' y='300' font-family='Georgia,serif' font-size='120' text-anchor='middle' fill='rgba(255,255,255,.9)'>🍛</text>
      <text x='400' y='400' font-family='Georgia,serif' font-size='34' text-anchor='middle' fill='rgba(255,255,255,.92)'>${label}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  /* Brand emblem — a clay handi (biriyani pot) with rising steam.
     Self-contained inline SVG so it's crisp at any size and needs no asset. */
  const logoSVG = `<svg class="logo-mark" viewBox="0 0 48 48" role="img" aria-label="Shahi Kacchi Ghor">
    <rect x="2" y="2" width="44" height="44" rx="13" fill="#ef9d0a"/>
    <g fill="none" stroke="#3d2314" stroke-width="2.2" stroke-linecap="round">
      <path d="M18 13c-2.2-1.6-2.2-3.8 0-5.5"/>
      <path d="M24 12.5c-2.2-1.6-2.2-3.8 0-5.5"/>
      <path d="M30 13c-2.2-1.6-2.2-3.8 0-5.5"/>
    </g>
    <rect x="9.5" y="16.8" width="29" height="4.6" rx="2.3" fill="#2a1710"/>
    <circle cx="24" cy="14.7" r="2.1" fill="#2a1710"/>
    <path d="M12.5 21.4h23c0 8.2-4.2 15-11.5 15S12.5 29.6 12.5 21.4Z" fill="#3d2314"/>
    <path d="M17 24c3.2 1.8 10.8 1.8 14 0" fill="none" stroke="#ffc23d" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
  </svg>`;
  window.SKG = { PH, IMG, svgFor, logoSVG };
})();
/* ---------------- Server-backed reactive DB ---------------- */
(function () {
  const API = '/api';
  let state = {
    categories: [], products: [], platters: [], reviews: [], gallery: [],
    offers: [], coupons: [], delivery: {}, settings: {}, customers: [], orders: [],
    admin: { username: '', password: '' }, meta: {},
  };

  function req(method, url, body) {
    return fetch(API + url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
  }
  function fail(e) { try { U.toast('Could not reach the server. Change not saved.', 'err'); } catch (_) {} console.error('DB sync error:', e); }

  /* pull the whole dataset; replace cache + notify if it actually changed */
  let lastJSON = '';
  function pull(silent) {
    return req('GET', '/state').then(s => {
      const j = JSON.stringify(s);
      if (j !== lastJSON) { lastJSON = j; state = s; if (!silent) U.emit('db:change'); }
      return s;
    });
  }

  const ready = pull(true).catch(e => { fail(e); });
  setInterval(() => pull(false).catch(() => {}), 4000);

  function localChange() { lastJSON = JSON.stringify(state); U.emit('db:change'); }

  const DB = {
    ready,
    _s: () => state,
    reset() { return req('POST', '/reset').then(s => { state = s; localChange(); }).catch(fail); },
    export() { return JSON.stringify(state, null, 2); },

    // generic collection helpers (reads are synchronous against the cache)
    all(coll) { return (state[coll] || []).slice(); },
    find(coll, id) { return (state[coll] || []).find(x => x.id === id); },
    add(coll, obj) {
      obj.id = obj.id || U.uid(coll[0] + '_');
      state[coll] = state[coll] || []; state[coll].unshift(obj); localChange();
      req('POST', '/coll/' + coll, obj).catch(fail);
      return obj;
    },
    update(coll, id, patch) {
      const i = (state[coll] || []).findIndex(x => x.id === id);
      if (i < 0) return;
      state[coll][i] = { ...state[coll][i], ...patch }; localChange();
      req('PATCH', '/coll/' + coll + '/' + encodeURIComponent(id), patch).catch(fail);
      return state[coll][i];
    },
    remove(coll, id) {
      state[coll] = (state[coll] || []).filter(x => x.id !== id); localChange();
      req('DELETE', '/coll/' + coll + '/' + encodeURIComponent(id)).catch(fail);
    },

    // singletons
    settings: () => state.settings,
    saveSettings(patch) { state.settings = { ...state.settings, ...patch }; localChange(); req('PATCH', '/singleton/settings', patch).catch(fail); },
    deliveryCfg: () => state.delivery,
    saveDelivery(patch) { state.delivery = { ...state.delivery, ...patch }; localChange(); req('PATCH', '/singleton/delivery', patch).catch(fail); },
    adminCreds: () => state.admin,
    saveAdmin(patch) { state.admin = { ...state.admin, ...patch }; localChange(); req('PATCH', '/singleton/admin', patch).catch(fail); },

    // derived
    categoryName(id) { const c = (state.categories || []).find(c => c.id === id); return c ? c.name : '—'; },
    activeCoupon(code) {
      const c = (state.coupons || []).find(c => c.code.toUpperCase() === String(code).trim().toUpperCase());
      if (!c) return { ok: false, msg: 'Coupon not found.' };
      if (!c.active) return { ok: false, msg: 'This coupon is inactive.' };
      if (new Date(c.expires) < new Date()) return { ok: false, msg: 'This coupon has expired.' };
      if (c.used >= c.usageLimit) return { ok: false, msg: 'This coupon has reached its usage limit.' };
      return { ok: true, coupon: c };
    },
    save() { localChange(); },
  };
  window.DB = DB;
})();
