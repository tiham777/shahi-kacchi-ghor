/* ============================================================
   router.js — hash router, layout selection, route guards
   ============================================================ */
(function () {
  function parseHash() {
    let h = location.hash.replace(/^#/, '') || '/';
    const [pathPart, queryPart] = h.split('?');
    const query = {};
    if (queryPart) queryPart.split('&').forEach(kv => { const [k, v] = kv.split('='); query[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    const seg = pathPart.split('/').filter(Boolean); // e.g. ['account','orders']
    return { path: '/' + seg.join('/'), seg, query };
  }

  const Router = {
    render() {
      const { seg, query } = parseHash();
      const app = U.el('app');
      const root = seg[0] || '';
      window.scrollTo(0, 0);

      /* ----- Admin area ----- */
      if (root === 'admin-login') { app.innerHTML = AV.login(); AV.loginMount(); return; }
      if (root === 'admin') {
        if (!Auth.isAdmin()) { location.hash = '#/admin-login'; return; }
        AV.renderShell(seg[1] || 'dashboard');
        return;
      }

      /* ----- Customer area ----- */
      let page;
      switch (root) {
        case '': page = CV.home(); break;
        case 'menu': page = CV.menu(); break;
        case 'platters': page = CV.platters(); break;
        case 'about': page = CV.about(); break;
        case 'gallery': page = CV.gallery(); break;
        case 'reviews': page = CV.reviews(); break;
        case 'contact': page = CV.contact(); break;
        case 'login': page = CV.login(); break;
        case 'register': page = CV.register(); break;
        case 'account': page = CV.account({ tab: seg[1] }); break;
        case 'cart': page = CV.cart(); break;
        case 'checkout': page = CV.checkout(); break;
        case 'order': page = CV.order({ id: seg[1], query }); break;
        default: page = { html: `<section class="section"><div class="wrap empty"><div class="big">🍽️</div>Page not found.<br><a class="link" href="#/">Back home →</a></div></section>` };
      }
      if (page === undefined) return; // a guard already redirected
      const norm = typeof page === 'string' ? { html: page } : page;
      app.innerHTML = `${CV.navbar()}<main id="view">${norm.html}</main>${CV.footer()}`;
      if (norm.mount) norm.mount();
      Router.updateCartCount();
    },

    updateCartCount() {
      const n = Cart.count();
      U.qsa('[data-cartcount]').forEach(e => { e.textContent = n; e.style.display = n > 0 ? '' : 'none'; });
    },
  };

  window.Router = Router;
})();
