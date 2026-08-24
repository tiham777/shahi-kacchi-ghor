/* ============================================================
   app.js — bootstrap, global event delegation, reactivity
   ============================================================ */
(function () {
  /* ---- Global click delegation (customer actions) ---- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action]');
    const navToggle = e.target.closest('[data-navtoggle]');
    if (navToggle) { U.el('navlinks').classList.toggle('open'); return; }
    // close mobile nav when a link is tapped
    if (e.target.closest('#navlinks a')) { const nl = U.el('navlinks'); if (nl) nl.classList.remove('open'); }
    if (!t) return;
    const a = t.dataset.action, id = t.dataset.id, key = t.dataset.key;

    switch (a) {
      case 'add-cart': {
        const p = DB.find('products', id);
        if (p && p.available) Cart.add({ kind: 'product', id: p.id, name: p.name, price: p.price, image: p.image });
        break;
      }
      case 'fav': {
        const on = Auth.toggleFavorite(id);
        if (on !== false) { t.classList.toggle('on', on); t.textContent = on ? '♥' : '♡'; }
        break;
      }
      case 'customize-platter': CV.platterModal(id); break;
      case 'add-address': CV.addressModal(); break;
      case 'default-address': Auth.setDefaultAddress(id); break;
      case 'remove-address':
        U.confirm({ title: 'Remove address', message: 'Remove this saved address?', confirmText: 'Remove', onConfirm: () => { Auth.removeAddress(id); U.toast('Address removed.', 'ok'); } });
        break;
      case 'cart-inc': Cart.inc(key); break;
      case 'cart-dec': Cart.dec(key); break;
      case 'cart-remove': Cart.remove(key); U.toast('Item removed.', 'info', 1400); break;
      case 'logout': Auth.logout(); U.toast('Logged out.', 'info'); location.hash = '#/'; break;
      case 'cancel-order':
        U.confirm({ title: 'Cancel order', message: 'Are you sure you want to cancel this order? This cannot be undone.', confirmText: 'Yes, cancel', onConfirm: () => {
          const o = DB.find('orders', id);
          DB.update('orders', id, { status: 'Cancelled', statusHistory: [...o.statusHistory, { status: 'Cancelled', at: new Date().toISOString() }] });
          U.toast('Order cancelled.', 'info'); Router.render();
        } });
        break;
    }
  });

  /* ---- Reactivity ---- */
  U.on('cart:change', () => Router.updateCartCount());
  U.on('auth:change', () => { /* refresh nav account state on next render */ });

  /* Live-refresh the admin panel when data changes (incl. orders placed in
     another tab), without disrupting an open modal or active typing. */
  U.on('db:change', U.debounce(() => {
    const h = location.hash;
    if (!h.startsWith('#/admin') || h.startsWith('#/admin-login')) return;
    if (!Auth.isAdmin() || !window.AV || !AV.current) return;
    if (document.querySelector('#modal-root .modal')) return;
    const ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    AV.refresh();
  }, 150));

  /* ---- Boot ---- */
  let booted = false;
  const boot = () => {
    if (booted) return; booted = true;
    // wait for the initial dataset from the server, then render
    (DB.ready || Promise.resolve()).then(() => Router.render());
  };
  window.addEventListener('hashchange', () => Router.render());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
