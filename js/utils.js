/* ============================================================
   utils.js — helpers: DOM, format, toast, modal, store, events
   ============================================================ */
(function () {
  const U = {};

  /* ---- DOM ---- */
  U.el = (id) => document.getElementById(id);
  U.qs = (sel, root = document) => root.querySelector(sel);
  U.qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  // tiny hyperscript-ish: build element from tag, attrs, children
  U.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  /* ---- Escape ---- */
  U.esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ---- Money / dates ---- */
  U.taka = (n) => '৳' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  U.money = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  U.date = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  U.datetime = (d) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  U.timeago = (d) => {
    const s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  };

  /* ---- ID ---- */
  U.uid = (p = '') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  U.orderId = () => 'SKG-' + (Date.now().toString(36).toUpperCase().slice(-5)) + Math.floor(Math.random() * 90 + 10);

  /* ---- Stars ---- */
  U.stars = (r) => { const full = Math.round(r); return '★★★★★☆☆☆☆☆'.slice(5 - full, 10 - full); };

  /* ---- Toast ---- */
  U.toast = (msg, type = 'info', ms = 2600) => {
    const root = U.el('toast-root');
    const t = U.h(`<div class="toast ${type}"><span>${type === 'ok' ? '✓' : type === 'err' ? '⚠' : 'ℹ'}</span><span>${U.esc(msg)}</span></div>`);
    root.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 250); }, ms);
  };

  /* ---- Modal ---- */
  U.modal = ({ title, body, footer, size, onOpen }) => {
    const root = U.el('modal-root');
    root.innerHTML = '';
    const back = U.h(`<div class="modal-back"><div class="modal" style="${size ? 'width:min(' + size + 'px,96vw)' : ''}">
      <div class="modal-head"><h3>${U.esc(title || '')}</h3><button class="x" data-close>✕</button></div>
      <div class="modal-body"></div>
      ${footer ? '<div class="modal-foot"></div>' : ''}
    </div></div>`);
    back.querySelector('.modal-body').innerHTML = body || '';
    if (footer) back.querySelector('.modal-foot').innerHTML = footer;
    const close = () => { back.remove(); };
    back.addEventListener('click', (e) => { if (e.target === back || e.target.hasAttribute('data-close')) close(); });
    root.appendChild(back);
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    if (onOpen) onOpen(back, close);
    return { root: back, close };
  };

  U.confirm = ({ title, message, confirmText = 'Confirm', danger = true, onConfirm }) => {
    return U.modal({
      title,
      body: `<p style="margin:0;color:var(--brown-2)">${U.esc(message)}</p>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn ${danger ? 'btn-primary' : 'btn-terra'}" data-ok>${U.esc(confirmText)}</button>`,
      onOpen: (root, close) => { root.querySelector('[data-ok]').addEventListener('click', () => { close(); onConfirm && onConfirm(); }); }
    });
  };

  /* ---- localStorage store ---- */
  U.store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
    del(key) { localStorage.removeItem(key); },
  };

  /* ---- tiny pub/sub for reactive UI ---- */
  const subs = {};
  U.on = (evt, fn) => { (subs[evt] = subs[evt] || []).push(fn); return () => { subs[evt] = subs[evt].filter(f => f !== fn); }; };
  U.emit = (evt, data) => { (subs[evt] || []).forEach(fn => fn(data)); };

  U.debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  U.by = (key, dir = 1) => (a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * dir;
  U.sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);

  window.U = U;
})();
