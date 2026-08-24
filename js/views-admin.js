/* ============================================================
   views-admin.js — admin dashboard (separate interface)
   window.AV.  Guarded by Auth.isAdmin() in router.
   ============================================================ */
(function () {
  const AV = {};
  let charts = [];
  const destroyCharts = () => { charts.forEach(c => { try { c.destroy(); } catch (e) {} }); charts = []; };

  const NAV = [
    ['dashboard', '📊', 'Dashboard'], ['orders', '🧾', 'Orders'], ['products', '🍛', 'Products'],
    ['categories', '🗂️', 'Categories'], ['platters', '🍽️', 'Platters'], ['customers', '👥', 'Customers'],
    ['reviews', '⭐', 'Reviews'], ['discounts', '🏷️', 'Discounts'], ['coupons', '🎟️', 'Coupons'],
    ['offers', '🎉', 'Offers'], ['gallery', '🖼️', 'Gallery'], ['delivery', '🛵', 'Delivery'],
    ['payments', '💳', 'Payments'], ['reports', '📈', 'Reports'], ['settings', '⚙️', 'Settings'],
  ];

  /* ---------------- Admin login ---------------- */
  AV.login = () => {
    if (Auth.isAdmin()) { location.hash = '#/admin'; return ''; }
    return `<div class="login-admin"><div class="auth-card">
      <div class="center" style="margin-bottom:1rem"><div class="brand" style="justify-content:center">${SKG.logoSVG}</div>
        <h2 style="margin:.6rem 0 0">Admin Panel</h2><p class="muted" style="margin:0">Shahi Kacchi Ghor — staff access only</p></div>
      <form id="admLogin">
        <div class="field"><label>Email</label><input class="input" id="admUser" type="email" autocomplete="off"></div>
        <div class="field"><label>Password</label><input class="input" id="admPass" type="password"></div>
        <button class="btn btn-primary btn-block">Log In</button>
      </form>
      <div class="divider-word">customer?</div>
      <a class="btn btn-ghost btn-block" href="#/">← Back to website</a>
    </div></div>`;
  };
  AV.loginMount = () => {
    const f = U.el('admLogin'); if (!f) return;
    f.addEventListener('submit', e => {
      e.preventDefault();
      const r = Auth.adminLogin(U.el('admUser').value, U.el('admPass').value);
      if (r.ok) { U.toast('Welcome, admin.', 'ok'); location.hash = '#/admin'; }
      else U.toast(r.msg, 'err');
    });
  };

  /* ---------------- Shell ---------------- */
  AV.renderShell = (section) => {
    destroyCharts();
    const titles = Object.fromEntries(NAV.map(n => [n[0], n[2]]));
    U.el('app').innerHTML = `<div class="admin">
      <aside class="side" id="admSide">
        <div class="side-brand">${SKG.logoSVG}<div><b>Shahi Kacchi Ghor</b><br><small>Admin Panel</small></div></div>
        <nav>${NAV.map(([k, i, t]) => `<a href="#/admin/${k}" class="${k === section ? 'active' : ''}"><span class="i">${i}</span>${t}</a>`).join('')}</nav>
        <div class="side-foot"><button class="btn btn-ghost btn-block" data-aaction="admin-logout" style="color:#f0c0b8;border-color:rgba(255,255,255,.2)">↩ Admin Logout</button></div>
      </aside>
      <div class="admin-main">
        <div class="topbar">
          <button class="menu-toggle-admin" id="admToggle">☰</button>
          <h1>${titles[section] || 'Dashboard'}</h1><div class="grow"></div>
          <div class="admin-user"><span class="hide-sm">Administrator</span><span class="av">A</span></div>
        </div>
        <div class="acontent" id="acontent"></div>
      </div>
    </div>`;
    U.el('admToggle').addEventListener('click', () => U.el('admSide').classList.toggle('open'));
    const fn = AV[section] || AV.dashboard;
    U.el('acontent').innerHTML = fn.call(AV);
    if (AV[section + 'Mount']) AV[section + 'Mount']();
    AV.bindContent();
  };

  /* delegated admin actions inside #acontent */
  AV.bindContent = () => {
    document.addEventListener('click', AV._sideHandler = AV._sideHandler || ((e) => {
      const b = e.target.closest('[data-aaction="admin-logout"]');
      if (b) { Auth.adminLogout(); U.toast('Logged out.', 'info'); location.hash = '#/admin-login'; }
    }));
    const root = U.el('acontent');
    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-aaction]'); if (!t) return;
      const a = t.dataset.aaction;
      if (a === 'admin-logout') return;
      AV.handleAction(a, t.dataset, t);
    });
  };

  /* ---------------- shared analytics ---------------- */
  AV.analytics = () => {
    const orders = DB.all('orders');
    const paid = orders.filter(o => o.status !== 'Cancelled');
    const today = new Date().toDateString();
    const todays = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const by = (s) => orders.filter(o => o.status === s).length;
    const revenue = U.sum(paid, o => o.total);
    // popular products
    const counts = {};
    paid.forEach(o => o.items.forEach(i => { counts[i.name] = (counts[i.name] || 0) + i.qty; }));
    const popular = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    // revenue by category
    const catRev = {};
    paid.forEach(o => o.items.forEach(i => {
      const p = DB.all('products').find(x => x.id === i.productId);
      const cat = p ? DB.categoryName(p.categoryId) : 'Other';
      catRev[cat] = (catRev[cat] || 0) + i.price * i.qty;
    }));
    // last 14 days series
    const days = [], sales = [], ocount = [];
    for (let d = 13; d >= 0; d--) {
      const dt = new Date(Date.now() - d * 86400000);
      const label = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const dayOrders = paid.filter(o => new Date(o.createdAt).toDateString() === dt.toDateString());
      days.push(label); sales.push(U.sum(dayOrders, o => o.total)); ocount.push(dayOrders.length);
    }
    return {
      totalOrders: orders.length, todayOrders: todays.length,
      todayRevenue: U.sum(todays.filter(o => o.status !== 'Cancelled'), o => o.total),
      revenue, pending: by('Pending'), preparing: by('Preparing'),
      completed: by('Delivered'), cancelled: by('Cancelled'),
      customers: DB.all('customers').length, popular, catRev, days, sales, ocount,
      aov: paid.length ? Math.round(revenue / paid.length) : 0,
    };
  };
  const CHART_COLORS = ['#43291a', '#c88a2a', '#5c3a24', '#a2825c', '#ddab54', '#8a6b3a'];

  /* ---------------- DASHBOARD ---------------- */
  AV.dashboard = () => {
    const a = AV.analytics();
    const tile = (lab, val, sub, accent) => `<div class="stat ${accent ? 'accent' : ''}"><div class="lab">${lab}</div><div class="val">${val}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
    const recent = DB.all('orders').sort(U.by('createdAt', -1)).slice(0, 6);
    return `
      <div class="stats">
        ${tile('Total Orders', a.totalOrders, `${a.todayOrders} today`)}
        ${tile("Today's Revenue", U.taka(a.todayRevenue), 'across ' + a.todayOrders + ' orders', true)}
        ${tile('Total Revenue', U.taka(a.revenue), 'AOV ' + U.taka(a.aov))}
        ${tile('Total Customers', a.customers, 'registered')}
      </div>
      <div class="stats" style="margin-top:1rem">
        ${tile('Pending', a.pending)}
        ${tile('Preparing', a.preparing)}
        ${tile('Completed', a.completed)}
        ${tile('Cancelled', a.cancelled)}
      </div>
      <div class="chart-grid" style="margin-top:1rem">
        <div class="panel"><div class="panel-head"><h3>Sales over time (14 days)</h3></div><div class="panel-body"><div class="chart-box"><canvas id="chSales"></canvas></div></div></div>
        <div class="panel"><div class="panel-head"><h3>Revenue by category</h3></div><div class="panel-body"><div class="chart-box"><canvas id="chCat"></canvas></div></div></div>
      </div>
      <div class="chart-grid" style="margin-top:1rem">
        <div class="panel"><div class="panel-head"><h3>Orders over time</h3></div><div class="panel-body"><div class="chart-box sm"><canvas id="chOrders"></canvas></div></div></div>
        <div class="panel"><div class="panel-head"><h3>Popular products</h3></div><div class="panel-body">
          <ul class="mini-list">${a.popular.map(([n, c]) => `<li><span>${U.esc(n)}</span><b>${c} sold</b></li>`).join('')}</ul></div></div>
      </div>
      <div class="panel" style="margin-top:1rem"><div class="panel-head"><h3>Recent orders</h3><a class="icon-btn" href="#/admin/orders">View all</a></div>
        <div class="table-scroll"><table class="atable"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Placed</th></tr></thead>
        <tbody>${recent.map(o => `<tr><td><b>${o.id}</b></td><td>${U.esc(o.customerName)}</td><td>${U.taka(o.total)}</td><td><span class="pill ${statusClass(o.status)}">${o.status}</span></td><td>${U.timeago(o.createdAt)}</td></tr>`).join('')}</tbody></table></div>
      </div>`;
  };
  AV.dashboardMount = () => {
    const a = AV.analytics();
    charts.push(new Chart(U.el('chSales'), { type: 'line', data: { labels: a.days, datasets: [{ label: 'Revenue (৳)', data: a.sales, borderColor: '#43291a', backgroundColor: 'rgba(67,41,26,.10)', fill: true, tension: .35, pointRadius: 2 }] }, options: chartOpts() }));
    charts.push(new Chart(U.el('chOrders'), { type: 'bar', data: { labels: a.days, datasets: [{ label: 'Orders', data: a.ocount, backgroundColor: '#c05a34', borderRadius: 4 }] }, options: chartOpts() }));
    const cat = Object.entries(a.catRev);
    charts.push(new Chart(U.el('chCat'), { type: 'doughnut', data: { labels: cat.map(c => c[0]), datasets: [{ data: cat.map(c => c[1]), backgroundColor: CHART_COLORS }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } }));
  };
  function chartOpts() { return { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#eadfce' } }, x: { grid: { display: false } } } }; }
  AV.current = () => (location.hash.split('/')[2] || 'dashboard').split('?')[0];
  AV.refresh = () => AV.renderShell(AV.current());

  /* ---------------- ORDERS ---------------- */
  AV._ord = { q: '', status: 'all', sort: 'new' };
  AV.orders = () => {
    return `<div class="panel">
      <div class="panel-head">
        <div class="filters">
          <div class="search" style="min-width:220px"><span class="ic">🔎</span><input class="input" id="ordSearch" placeholder="Search order / customer…" value="${U.esc(AV._ord.q)}"></div>
          <select class="input" id="ordStatus"><option value="all">All statuses</option>${['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => `<option ${AV._ord.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
          <select class="input" id="ordSort"><option value="new">Newest</option><option value="old">Oldest</option><option value="high">Highest total</option></select>
        </div>
      </div>
      <div class="table-scroll"><table class="atable"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Placed</th><th>Actions</th></tr></thead>
        <tbody id="ordBody"></tbody></table></div>
    </div>`;
  };
  AV.ordersMount = () => {
    const render = () => {
      let list = DB.all('orders');
      const { q, status, sort } = AV._ord;
      if (status !== 'all') list = list.filter(o => o.status === status);
      if (q) list = list.filter(o => (o.id + ' ' + o.customerName + ' ' + o.phone).toLowerCase().includes(q.toLowerCase()));
      list.sort(sort === 'old' ? U.by('createdAt') : sort === 'high' ? U.by('total', -1) : U.by('createdAt', -1));
      U.el('ordBody').innerHTML = list.length ? list.map(o => `<tr>
        <td><b>${o.id}</b></td><td>${U.esc(o.customerName)}<div class="muted" style="font-size:.78rem">${U.esc(o.phone)}</div></td>
        <td>${o.items.reduce((s, i) => s + i.qty, 0)}</td><td>${U.taka(o.total)}</td>
        <td>${U.esc(o.payment)}<div class="muted" style="font-size:.78rem">${o.paymentStatus}</div></td>
        <td><span class="pill ${statusClass(o.status)}">${o.status}</span></td><td>${U.timeago(o.createdAt)}</td>
        <td class="actions-cell"><button class="icon-btn" data-aaction="order-view" data-id="${o.id}">View</button></td></tr>`).join('')
        : `<tr><td colspan="8" class="empty">No orders match.</td></tr>`;
    };
    U.el('ordSearch').addEventListener('input', U.debounce(e => { AV._ord.q = e.target.value; render(); }, 200));
    U.el('ordStatus').addEventListener('change', e => { AV._ord.status = e.target.value; render(); });
    U.el('ordSort').addEventListener('change', e => { AV._ord.sort = e.target.value; render(); });
    render();
  };

  AV.orderModal = (id) => {
    const o = DB.find('orders', id); if (!o) return;
    const flow = ORDER_FLOW; const idx = flow.indexOf(o.status);
    const nextStatuses = o.status === 'Cancelled' || o.status === 'Delivered' ? [] : flow.slice(idx + 1);
    U.modal({
      title: `Order ${o.id}`, size: 620,
      body: `<div class="kpi-row" style="margin-bottom:1rem">
          <div><small class="muted">Customer</small><div><b>${U.esc(o.customerName)}</b></div><div class="muted">${U.esc(o.phone)}</div></div>
          <div><small class="muted">Placed</small><div>${U.datetime(o.createdAt)}</div></div>
          <div><small class="muted">Status</small><div><span class="pill ${statusClass(o.status)}">${o.status}</span></div></div>
        </div>
        <small class="muted">Delivery address</small><p style="margin:.2rem 0 1rem">${U.esc(o.address.line)}, ${U.esc(o.address.area)}</p>
        <table class="atable"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Sum</th></tr></thead><tbody>
          ${o.items.map(i => `<tr><td>${U.esc(i.name)}</td><td>${i.qty}</td><td>${U.taka(i.price)}</td><td>${U.taka(i.price * i.qty)}</td></tr>`).join('')}
        </tbody></table>
        <div style="text-align:right;margin-top:.8rem">
          <div class="sline" style="display:flex;justify-content:flex-end;gap:2rem">Subtotal <b>${U.taka(o.subtotal)}</b></div>
          ${o.discount ? `<div class="sline" style="display:flex;justify-content:flex-end;gap:2rem;color:var(--good)">Discount <b>−${U.taka(o.discount)}</b></div>` : ''}
          <div class="sline" style="display:flex;justify-content:flex-end;gap:2rem">Delivery <b>${o.delivery ? U.taka(o.delivery) : 'Free'}</b></div>
          <div class="sline total" style="display:flex;justify-content:flex-end;gap:2rem">Total ${U.taka(o.total)}</div>
        </div>
        <div class="field" style="margin-top:1rem"><label>Payment: ${U.esc(o.payment)} · ${o.paymentStatus}</label></div>`,
      footer: `
        ${nextStatuses.length ? `<select class="input" id="ordNext" style="max-width:200px">${nextStatuses.map(s => `<option>${s}</option>`).join('')}</select><button class="btn btn-terra" id="ordAdvance">Update status</button>` : ''}
        ${o.status !== 'Cancelled' && o.status !== 'Delivered' ? `<button class="btn btn-ghost" id="ordCancel" style="color:var(--bad)">Cancel order</button>` : ''}
        <button class="btn btn-primary" data-close>Close</button>`,
      onOpen: (root, close) => {
        const adv = root.querySelector('#ordAdvance');
        if (adv) adv.addEventListener('click', () => { AV.setOrderStatus(o.id, root.querySelector('#ordNext').value); close(); });
        const can = root.querySelector('#ordCancel');
        if (can) can.addEventListener('click', () => U.confirm({ title: 'Cancel order', message: `Cancel order ${o.id}?`, confirmText: 'Yes, cancel', onConfirm: () => { AV.setOrderStatus(o.id, 'Cancelled'); close(); } }));
      }
    });
  };
  AV.setOrderStatus = (id, status) => {
    const o = DB.find('orders', id);
    const patch = { status, statusHistory: [...o.statusHistory, { status, at: new Date().toISOString() }] };
    if (status === 'Delivered') patch.paymentStatus = 'Paid';
    DB.update('orders', id, patch);
    U.toast(`Order ${id} → ${status}`, 'ok');
    AV.refresh();
  };
  /* ---------------- PRODUCTS ---------------- */
  AV._prod = { q: '', cat: 'all' };
  AV.products = () => {
    const cats = DB.all('categories');
    return `<div class="panel">
      <div class="panel-head">
        <div class="filters">
          <div class="search" style="min-width:200px"><span class="ic">🔎</span><input class="input" id="prSearch" placeholder="Search products…" value="${U.esc(AV._prod.q)}"></div>
          <select class="input" id="prCat"><option value="all">All categories</option>${cats.map(c => `<option value="${c.id}" ${AV._prod.cat === c.id ? 'selected' : ''}>${U.esc(c.name)}</option>`).join('')}</select>
        </div>
        <button class="btn btn-primary btn-sm" data-aaction="product-add">+ Add product</button>
      </div>
      <div class="table-scroll"><table class="atable"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Rating</th><th>Featured</th><th>Available</th><th>Actions</th></tr></thead>
        <tbody id="prBody"></tbody></table></div>
    </div>`;
  };
  AV.productsMount = () => {
    const render = () => {
      let list = DB.all('products');
      if (AV._prod.cat !== 'all') list = list.filter(p => p.categoryId === AV._prod.cat);
      if (AV._prod.q) list = list.filter(p => p.name.toLowerCase().includes(AV._prod.q.toLowerCase()));
      U.el('prBody').innerHTML = list.length ? list.map(p => `<tr>
        <td style="display:flex;align-items:center;gap:.6rem"><img class="thumb-sm" src="${p.image}" onerror="this.src=SKG.svgFor('${U.esc(p.name.slice(0,16))}')"><b>${U.esc(p.name)}</b></td>
        <td>${U.esc(DB.categoryName(p.categoryId))}</td><td>${U.taka(p.price)}</td><td>★ ${p.rating.toFixed(1)} <span class="muted">(${p.ratingCount})</span></td>
        <td><button class="icon-btn" data-aaction="product-feature" data-id="${p.id}">${p.featured ? '★ Featured' : '☆ Set'}</button></td>
        <td><label class="switch"><input type="checkbox" data-aaction="product-avail" data-id="${p.id}" ${p.available ? 'checked' : ''}></label></td>
        <td class="actions-cell"><button class="icon-btn" data-aaction="product-edit" data-id="${p.id}">Edit</button><button class="icon-btn danger" data-aaction="product-del" data-id="${p.id}">Delete</button></td></tr>`).join('')
        : `<tr><td colspan="7" class="empty">No products found.</td></tr>`;
    };
    U.el('prSearch').addEventListener('input', U.debounce(e => { AV._prod.q = e.target.value; render(); }, 200));
    U.el('prCat').addEventListener('change', e => { AV._prod.cat = e.target.value; render(); });
    // availability toggle via change event
    U.el('prBody').addEventListener('change', e => {
      const c = e.target.closest('[data-aaction="product-avail"]'); if (!c) return;
      DB.update('products', c.dataset.id, { available: c.checked }); U.toast('Availability updated.', 'ok');
    });
    render();
  };
  AV.productModal = (id) => {
    const p = id ? DB.find('products', id) : { name: '', categoryId: DB.all('categories')[0].id, price: 0, desc: '', image: '', rating: 4.5, ratingCount: 0, available: true, featured: false };
    const cats = DB.all('categories');
    U.modal({
      title: id ? 'Edit product' : 'Add product', size: 560,
      body: `<div class="form-grid">
        <div class="field full"><label>Name</label><input class="input" id="pfName" value="${U.esc(p.name)}"></div>
        <div class="field"><label>Category</label><select class="input" id="pfCat">${cats.map(c => `<option value="${c.id}" ${p.categoryId === c.id ? 'selected' : ''}>${U.esc(c.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Price (৳)</label><input class="input" id="pfPrice" type="number" value="${p.price}"></div>
        <div class="field full"><label>Description</label><textarea class="input" id="pfDesc" rows="2">${U.esc(p.desc)}</textarea></div>
        <div class="field full"><label>Image URL (optional)</label><input class="input" id="pfImg" value="${U.esc(p.image)}" placeholder="Leave blank for branded placeholder"></div>
        <div class="field"><label>Rating</label><input class="input" id="pfRating" type="number" step="0.1" min="0" max="5" value="${p.rating}"></div>
        <div class="field"><label>Rating count</label><input class="input" id="pfCount" type="number" value="${p.ratingCount}"></div>
        <label class="switch"><input type="checkbox" id="pfAvail" ${p.available ? 'checked' : ''}> Available</label>
        <label class="switch"><input type="checkbox" id="pfFeat" ${p.featured ? 'checked' : ''}> Featured</label>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="pfSave">Save</button>`,
      onOpen: (root, close) => root.querySelector('#pfSave').addEventListener('click', () => {
        const name = root.querySelector('#pfName').value.trim();
        if (!name) return U.toast('Name is required.', 'err');
        const data = { name, categoryId: root.querySelector('#pfCat').value, price: Number(root.querySelector('#pfPrice').value) || 0,
          desc: root.querySelector('#pfDesc').value.trim(), image: root.querySelector('#pfImg').value.trim() || SKG.svgFor(name.slice(0, 16)),
          rating: Number(root.querySelector('#pfRating').value) || 0, ratingCount: Number(root.querySelector('#pfCount').value) || 0,
          available: root.querySelector('#pfAvail').checked, featured: root.querySelector('#pfFeat').checked };
        if (id) DB.update('products', id, data); else DB.add('products', { id: U.uid('p_'), ...data });
        close(); U.toast('Product saved. Live on the website.', 'ok'); AV.refresh();
      })
    });
  };
  /* ---------------- CATEGORIES ---------------- */
  AV.categories = () => {
    const cats = DB.all('categories').sort(U.by('order'));
    return `<div class="panel">
      <div class="panel-head"><h3>Menu categories</h3><button class="btn btn-primary btn-sm" data-aaction="cat-add">+ Add category</button></div>
      <div class="table-scroll"><table class="atable"><thead><tr><th>Order</th><th>Name</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        ${cats.map((c, i) => `<tr><td>${c.order}</td><td><b>${U.esc(c.name)}</b></td>
          <td>${DB.all('products').filter(p => p.categoryId === c.id).length}</td>
          <td><span class="badge ${c.enabled ? 'badge-good' : 'badge-bad'}">${c.enabled ? 'Enabled' : 'Disabled'}</span></td>
          <td class="actions-cell">
            <button class="icon-btn" data-aaction="cat-up" data-id="${c.id}" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="icon-btn" data-aaction="cat-down" data-id="${c.id}" ${i === cats.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="icon-btn" data-aaction="cat-toggle" data-id="${c.id}">${c.enabled ? 'Disable' : 'Enable'}</button>
            <button class="icon-btn" data-aaction="cat-edit" data-id="${c.id}">Rename</button>
            <button class="icon-btn danger" data-aaction="cat-del" data-id="${c.id}">Delete</button>
          </td></tr>`).join('')}
      </tbody></table></div></div>`;
  };

  /* ---------------- PLATTERS ---------------- */
  AV.platters = () => {
    const pls = DB.all('platters');
    return `<div class="panel">
      <div class="panel-head"><h3>Platters</h3><button class="btn btn-primary btn-sm" data-aaction="platter-add">+ Add platter</button></div>
      <div class="table-scroll"><table class="atable"><thead><tr><th>Platter</th><th>Serves</th><th>Price</th><th>Included</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        ${pls.map(p => `<tr><td><b>${U.esc(p.name)}</b></td><td>${U.esc(p.serves)}</td><td>${U.taka(p.price)}</td>
          <td class="wrap-td" style="max-width:280px">${p.items.map(U.esc).join(', ')}</td>
          <td><span class="badge ${p.enabled ? 'badge-good' : 'badge-bad'}">${p.enabled ? 'Enabled' : 'Disabled'}</span></td>
          <td class="actions-cell"><button class="icon-btn" data-aaction="platter-toggle" data-id="${p.id}">${p.enabled ? 'Disable' : 'Enable'}</button>
            <button class="icon-btn" data-aaction="platter-edit" data-id="${p.id}">Edit</button>
            <button class="icon-btn danger" data-aaction="platter-del" data-id="${p.id}">Delete</button></td></tr>`).join('')}
      </tbody></table></div></div>`;
  };
  AV.platterModal = (id) => {
    const p = id ? DB.find('platters', id) : { name: '', serves: '', price: 0, desc: '', items: [], image: SKG.PH.plates, enabled: true };
    U.modal({
      title: id ? 'Edit platter' : 'Add platter', size: 520,
      body: `<div class="form-grid">
        <div class="field"><label>Name</label><input class="input" id="plName" value="${U.esc(p.name)}"></div>
        <div class="field"><label>Serving size</label><input class="input" id="plServes" value="${U.esc(p.serves)}" placeholder="e.g. 2 people"></div>
        <div class="field"><label>Price (৳)</label><input class="input" id="plPrice" type="number" value="${p.price}"></div>
        <div class="field full"><label>Description</label><input class="input" id="plDesc" value="${U.esc(p.desc)}"></div>
        <div class="field full"><label>Included items (comma separated)</label><input class="input" id="plItems" value="${U.esc(p.items.join(', '))}"></div>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="plSave">Save</button>`,
      onOpen: (root, close) => root.querySelector('#plSave').addEventListener('click', () => {
        const name = root.querySelector('#plName').value.trim(); if (!name) return U.toast('Name required.', 'err');
        const data = { name, serves: root.querySelector('#plServes').value.trim(), price: Number(root.querySelector('#plPrice').value) || 0,
          desc: root.querySelector('#plDesc').value.trim(), items: root.querySelector('#plItems').value.split(',').map(s => s.trim()).filter(Boolean), image: p.image, enabled: p.enabled };
        if (id) DB.update('platters', id, data); else DB.add('platters', { id: U.uid('pl_'), ...data });
        close(); U.toast('Platter saved.', 'ok'); AV.refresh();
      })
    });
  };
  /* ---------------- CUSTOMERS ---------------- */
  AV._cust = { q: '', status: 'all' };
  AV.customers = () => `<div class="panel">
    <div class="panel-head"><div class="filters">
      <div class="search" style="min-width:220px"><span class="ic">🔎</span><input class="input" id="cuSearch" placeholder="Search customers…" value="${U.esc(AV._cust.q)}"></div>
      <select class="input" id="cuStatus"><option value="all">All</option><option value="active">Active</option><option value="disabled">Disabled</option></select>
    </div></div>
    <div class="table-scroll"><table class="atable"><thead><tr><th>Name</th><th>Contact</th><th>Joined</th><th>Orders</th><th>Spent</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="cuBody"></tbody></table></div></div>`;
  AV.customersMount = () => {
    const render = () => {
      let list = DB.all('customers');
      if (AV._cust.status !== 'all') list = list.filter(c => c.status === AV._cust.status);
      if (AV._cust.q) list = list.filter(c => (c.name + ' ' + c.email + ' ' + c.phone).toLowerCase().includes(AV._cust.q.toLowerCase()));
      U.el('cuBody').innerHTML = list.length ? list.map(c => {
        const orders = DB.all('orders').filter(o => o.customerId === c.id);
        const spent = U.sum(orders.filter(o => o.status !== 'Cancelled'), o => o.total);
        return `<tr><td><b>${U.esc(c.name)}</b></td><td>${U.esc(c.email)}<div class="muted" style="font-size:.78rem">${U.esc(c.phone)}</div></td>
          <td>${U.date(c.joined)}</td><td>${orders.length}</td><td>${U.taka(spent)}</td>
          <td><span class="badge ${c.status === 'active' ? 'badge-good' : 'badge-bad'}">${c.status}</span></td>
          <td class="actions-cell"><button class="icon-btn" data-aaction="cust-view" data-id="${c.id}">View</button>
            <button class="icon-btn ${c.status === 'active' ? 'danger' : ''}" data-aaction="cust-toggle" data-id="${c.id}">${c.status === 'active' ? 'Disable' : 'Enable'}</button></td></tr>`;
      }).join('') : `<tr><td colspan="7" class="empty">No customers found.</td></tr>`;
    };
    U.el('cuSearch').addEventListener('input', U.debounce(e => { AV._cust.q = e.target.value; render(); }, 200));
    U.el('cuStatus').addEventListener('change', e => { AV._cust.status = e.target.value; render(); });
    render();
  };
  AV.customerModal = (id) => {
    const c = DB.find('customers', id); if (!c) return;
    const orders = DB.all('orders').filter(o => o.customerId === c.id).sort(U.by('createdAt', -1));
    U.modal({ title: c.name, size: 560,
      body: `<div class="kpi-row" style="margin-bottom:1rem">
          <div><small class="muted">Email</small><div>${U.esc(c.email)}</div></div>
          <div><small class="muted">Phone</small><div>${U.esc(c.phone)}</div></div>
          <div><small class="muted">Joined</small><div>${U.date(c.joined)}</div></div>
        </div>
        <h3>Recent orders</h3>
        ${orders.length ? `<table class="atable"><thead><tr><th>Order</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>
          ${orders.slice(0, 6).map(o => `<tr><td>${o.id}</td><td>${U.taka(o.total)}</td><td><span class="pill ${statusClass(o.status)}">${o.status}</span></td><td>${U.date(o.createdAt)}</td></tr>`).join('')}
        </tbody></table>` : '<p class="muted">No orders yet.</p>'}`,
      footer: `<button class="btn btn-primary" data-close>Close</button>` });
  };

  /* ---------------- REVIEWS ---------------- */
  AV.reviews = () => {
    const revs = DB.all('reviews');
    return `<div class="panel"><div class="panel-head"><h3>Customer reviews</h3><span class="muted">${revs.filter(r => r.status === 'pending').length} pending</span></div>
      <div class="table-scroll"><table class="atable"><thead><tr><th>Customer</th><th>Rating</th><th>Review</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        ${revs.map(r => `<tr><td><b>${U.esc(r.name)}</b><div class="muted" style="font-size:.78rem">${U.date(r.date)}</div></td>
          <td style="color:var(--warn)">${'★'.repeat(r.rating)}</td>
          <td class="wrap-td" style="max-width:320px">${U.esc(r.text)}${r.featured ? ' <span class="badge badge-warn">Featured</span>' : ''}</td>
          <td><span class="badge ${r.status === 'approved' ? 'badge-good' : r.status === 'pending' ? 'badge-warn' : 'badge-neutral'}">${r.status}</span></td>
          <td class="actions-cell">
            ${r.status !== 'approved' ? `<button class="icon-btn" data-aaction="rev-approve" data-id="${r.id}">Approve</button>` : `<button class="icon-btn" data-aaction="rev-hide" data-id="${r.id}">Hide</button>`}
            <button class="icon-btn" data-aaction="rev-feature" data-id="${r.id}">${r.featured ? 'Unfeature' : 'Feature'}</button>
            <button class="icon-btn danger" data-aaction="rev-del" data-id="${r.id}">Delete</button>
          </td></tr>`).join('')}
      </tbody></table></div></div>`;
  };
  /* ---------------- DISCOUNTS (coupon CRUD) ---------------- */
  AV.discounts = () => {
    const cs = DB.all('coupons');
    return `<div class="panel"><div class="panel-head"><h3>Discounts & Coupons</h3><button class="btn btn-primary btn-sm" data-aaction="coupon-add">+ Create discount</button></div>
      <div class="table-scroll"><table class="atable"><thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min order</th><th>Expires</th><th>Usage</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        ${cs.map(c => `<tr><td><b>${U.esc(c.code)}</b></td><td>${c.type === 'percent' ? 'Percentage' : 'Fixed'}</td>
          <td>${c.type === 'percent' ? c.value + '%' : U.taka(c.value)}</td><td>${U.taka(c.minOrder)}</td><td>${U.date(c.expires)}</td>
          <td>${c.used}/${c.usageLimit}</td><td><span class="badge ${c.active ? 'badge-good' : 'badge-bad'}">${c.active ? 'Active' : 'Inactive'}</span></td>
          <td class="actions-cell"><button class="icon-btn" data-aaction="coupon-toggle" data-id="${c.id}">${c.active ? 'Disable' : 'Enable'}</button>
            <button class="icon-btn" data-aaction="coupon-edit" data-id="${c.id}">Edit</button>
            <button class="icon-btn danger" data-aaction="coupon-del" data-id="${c.id}">Delete</button></td></tr>`).join('')}
      </tbody></table></div></div>`;
  };
  AV.couponModal = (id) => {
    const c = id ? DB.find('coupons', id) : { code: '', type: 'percent', value: 10, minOrder: 300, expires: new Date(Date.now() + 30 * 86400000).toISOString(), usageLimit: 100, used: 0, active: true };
    U.modal({ title: id ? 'Edit discount' : 'Create discount', size: 520,
      body: `<div class="form-grid">
        <div class="field"><label>Coupon code</label><input class="input" id="cfCode" value="${U.esc(c.code)}" style="text-transform:uppercase"></div>
        <div class="field"><label>Type</label><select class="input" id="cfType"><option value="percent" ${c.type === 'percent' ? 'selected' : ''}>Percentage (%)</option><option value="fixed" ${c.type === 'fixed' ? 'selected' : ''}>Fixed (৳)</option></select></div>
        <div class="field"><label>Value</label><input class="input" id="cfValue" type="number" value="${c.value}"></div>
        <div class="field"><label>Minimum order (৳)</label><input class="input" id="cfMin" type="number" value="${c.minOrder}"></div>
        <div class="field"><label>Expiry date</label><input class="input" id="cfExp" type="date" value="${new Date(c.expires).toISOString().slice(0, 10)}"></div>
        <div class="field"><label>Usage limit</label><input class="input" id="cfLimit" type="number" value="${c.usageLimit}"></div>
        <label class="switch full"><input type="checkbox" id="cfActive" ${c.active ? 'checked' : ''}> Active</label>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="cfSave">Save</button>`,
      onOpen: (root, close) => root.querySelector('#cfSave').addEventListener('click', () => {
        const code = root.querySelector('#cfCode').value.trim().toUpperCase(); if (!code) return U.toast('Code required.', 'err');
        const data = { code, type: root.querySelector('#cfType').value, value: Number(root.querySelector('#cfValue').value) || 0,
          minOrder: Number(root.querySelector('#cfMin').value) || 0, expires: new Date(root.querySelector('#cfExp').value).toISOString(),
          usageLimit: Number(root.querySelector('#cfLimit').value) || 0, active: root.querySelector('#cfActive').checked };
        if (id) DB.update('coupons', id, data); else DB.add('coupons', { id: U.uid('cp_'), used: 0, ...data });
        close(); U.toast('Discount saved.', 'ok'); AV.refresh();
      })
    });
  };

  /* ---------------- COUPONS (usage view) ---------------- */
  AV.coupons = () => {
    const cs = DB.all('coupons');
    return `<div class="panel"><div class="panel-head"><h3>Coupon usage</h3><a class="icon-btn" href="#/admin/discounts">Manage discounts →</a></div>
      <div class="panel-body"><div class="grid-admin" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))">
        ${cs.map(c => `<div class="stat"><div class="lab">${U.esc(c.code)} <span class="badge ${c.active ? 'badge-good' : 'badge-bad'}">${c.active ? 'active' : 'inactive'}</span></div>
          <div class="val">${c.type === 'percent' ? c.value + '%' : U.taka(c.value)}</div>
          <div class="sub">${c.used} of ${c.usageLimit} used · min ${U.taka(c.minOrder)}</div>
          <div class="bar"><span style="width:${Math.min(100, Math.round(c.used / c.usageLimit * 100))}%"></span></div>
          <div class="sub" style="margin-top:.4rem">Expires ${U.date(c.expires)}</div></div>`).join('')}
      </div></div></div>`;
  };
  /* ---------------- OFFERS ---------------- */
  AV.offers = () => {
    const os = DB.all('offers');
    return `<div class="panel"><div class="panel-head"><h3>Offers & festival promotions</h3><button class="btn btn-primary btn-sm" data-aaction="offer-add">+ Create offer</button></div>
      <div class="panel-body"><div class="grid-admin cols-2" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
        ${os.map(o => `<div class="card" style="padding:1.2rem;border-radius:var(--r)">
          <div class="prow"><span class="badge badge-warn">${U.esc(o.tag)}</span><span class="badge ${o.active ? 'badge-good' : 'badge-bad'}">${o.active ? 'Active' : 'Inactive'}</span></div>
          <h3 style="margin:.6rem 0 .2rem">${U.esc(o.title)}</h3><p class="muted" style="font-size:.9rem">${U.esc(o.desc)}</p>
          <div class="actions-cell"><button class="icon-btn" data-aaction="offer-toggle" data-id="${o.id}">${o.active ? 'Deactivate' : 'Activate'}</button>
            <button class="icon-btn" data-aaction="offer-edit" data-id="${o.id}">Edit</button>
            <button class="icon-btn danger" data-aaction="offer-del" data-id="${o.id}">Delete</button></div>
        </div>`).join('')}
      </div></div></div>`;
  };
  AV.offerModal = (id) => {
    const o = id ? DB.find('offers', id) : { title: '', desc: '', tag: 'Weekend', active: true };
    const tags = ['Eid', 'Ramadan', 'Friday', 'Weekend', 'Special', 'Seasonal'];
    U.modal({ title: id ? 'Edit offer' : 'Create offer', size: 480,
      body: `<div class="field"><label>Title</label><input class="input" id="ofTitle" value="${U.esc(o.title)}"></div>
        <div class="field"><label>Description</label><textarea class="input" id="ofDesc" rows="2">${U.esc(o.desc)}</textarea></div>
        <div class="field"><label>Tag</label><select class="input" id="ofTag">${tags.map(t => `<option ${o.tag === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <label class="switch"><input type="checkbox" id="ofActive" ${o.active ? 'checked' : ''}> Active (shows banner on website)</label>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="ofSave">Save</button>`,
      onOpen: (root, close) => root.querySelector('#ofSave').addEventListener('click', () => {
        const title = root.querySelector('#ofTitle').value.trim(); if (!title) return U.toast('Title required.', 'err');
        const data = { title, desc: root.querySelector('#ofDesc').value.trim(), tag: root.querySelector('#ofTag').value, active: root.querySelector('#ofActive').checked };
        if (id) DB.update('offers', id, data); else DB.add('offers', { id: U.uid('o_'), ...data });
        close(); U.toast('Offer saved.', 'ok'); AV.refresh();
      })
    });
  };

  /* ---------------- GALLERY ---------------- */
  AV.gallery = () => {
    const gs = DB.all('gallery');
    return `<div class="panel"><div class="panel-head"><h3>Gallery</h3><button class="btn btn-primary btn-sm" data-aaction="gal-add">+ Add image</button></div>
      <div class="panel-body"><div class="grid-admin" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
        ${gs.map(g => `<div class="card" style="border-radius:var(--r)"><div style="aspect-ratio:4/3;overflow:hidden"><img src="${g.url}" style="width:100%;height:100%;object-fit:cover" onerror="this.src=SKG.svgFor('${U.esc(g.caption.slice(0,14))}')"></div>
          <div style="padding:.7rem"><div class="prow"><b style="font-size:.9rem">${U.esc(g.caption)}</b>${g.featured ? '<span class="badge badge-warn">★</span>' : ''}</div>
            <div class="muted" style="font-size:.78rem">${U.esc(g.category)}</div>
            <div class="actions-cell" style="margin-top:.5rem"><button class="icon-btn" data-aaction="gal-edit" data-id="${g.id}">Edit</button>
              <button class="icon-btn" data-aaction="gal-feature" data-id="${g.id}">${g.featured ? 'Unfeature' : 'Feature'}</button>
              <button class="icon-btn danger" data-aaction="gal-del" data-id="${g.id}">✕</button></div></div>
        </div>`).join('')}
      </div></div></div>`;
  };
  AV.galleryModal = (id) => {
    const g = id ? DB.find('gallery', id) : { url: '', caption: '', category: 'Food', featured: false };
    U.modal({ title: id ? 'Edit image' : 'Add image', size: 460,
      body: `<div class="field"><label>Image URL</label><input class="input" id="glUrl" value="${U.esc(g.url)}" placeholder="https://…"></div>
        <div class="field"><label>Caption</label><input class="input" id="glCap" value="${U.esc(g.caption)}"></div>
        <div class="field"><label>Category</label><select class="input" id="glCat">${['Food', 'Drinks', 'Place'].map(c => `<option ${g.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <label class="switch"><input type="checkbox" id="glFeat" ${g.featured ? 'checked' : ''}> Featured</label>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="glSave">Save</button>`,
      onOpen: (root, close) => root.querySelector('#glSave').addEventListener('click', () => {
        const cap = root.querySelector('#glCap').value.trim() || 'Untitled';
        const data = { url: root.querySelector('#glUrl').value.trim() || SKG.svgFor(cap.slice(0, 14)), caption: cap, category: root.querySelector('#glCat').value, featured: root.querySelector('#glFeat').checked };
        if (id) DB.update('gallery', id, data); else DB.add('gallery', { id: U.uid('g_'), ...data });
        close(); U.toast('Gallery updated.', 'ok'); AV.refresh();
      })
    });
  };
  /* ---------------- DELIVERY ---------------- */
  AV.delivery = () => {
    const d = DB.deliveryCfg();
    return `<div class="panel" style="max-width:760px"><div class="panel-head"><h3>Delivery settings</h3></div>
      <div class="panel-body"><form id="delForm"><div class="form-grid">
        <div class="field"><label>Delivery fee (৳)</label><input class="input" id="dFee" type="number" value="${d.fee}"></div>
        <div class="field"><label>Free delivery threshold (৳)</label><input class="input" id="dFree" type="number" value="${d.freeThreshold}"></div>
        <div class="field"><label>Minimum order (৳)</label><input class="input" id="dMin" type="number" value="${d.minOrder}"></div>
        <div class="field"><label>ETA min (minutes)</label><input class="input" id="dEtaMin" type="number" value="${d.etaMin}"></div>
        <div class="field"><label>ETA max (minutes)</label><input class="input" id="dEtaMax" type="number" value="${d.etaMax}"></div>
        <label class="switch"><input type="checkbox" id="dAvail" ${d.available ? 'checked' : ''}> Delivery available</label>
        <div class="field full"><label>Delivery areas (comma separated)</label><textarea class="input" id="dAreas" rows="2">${U.esc(d.areas.join(', '))}</textarea></div>
      </div><button class="btn btn-primary" style="margin-top:1rem">Save delivery settings</button></form></div></div>`;
  };
  AV.deliveryMount = () => {
    U.el('delForm').addEventListener('submit', e => { e.preventDefault();
      DB.saveDelivery({ fee: +U.el('dFee').value, freeThreshold: +U.el('dFree').value, minOrder: +U.el('dMin').value,
        etaMin: +U.el('dEtaMin').value, etaMax: +U.el('dEtaMax').value, available: U.el('dAvail').checked,
        areas: U.el('dAreas').value.split(',').map(s => s.trim()).filter(Boolean) });
      U.toast('Delivery settings saved.', 'ok');
    });
  };

  /* ---------------- PAYMENTS ---------------- */
  AV.payments = () => {
    const orders = DB.all('orders').sort(U.by('createdAt', -1));
    const paid = orders.filter(o => o.paymentStatus === 'Paid');
    const online = orders.filter(o => o.payment === 'Online Payment');
    return `<div class="stats" style="margin-bottom:1rem">
        <div class="stat"><div class="lab">Collected (paid)</div><div class="val">${U.taka(U.sum(paid, o => o.total))}</div></div>
        <div class="stat"><div class="lab">Pending payment</div><div class="val">${U.taka(U.sum(orders.filter(o => o.paymentStatus !== 'Paid' && o.status !== 'Cancelled'), o => o.total))}</div></div>
        <div class="stat"><div class="lab">Cash on Delivery</div><div class="val">${orders.filter(o => o.payment === 'Cash on Delivery').length}</div></div>
        <div class="stat"><div class="lab">Online Payment</div><div class="val">${online.length}</div></div>
      </div>
      <div class="panel"><div class="panel-head"><h3>Payment records</h3></div>
      <div class="table-scroll"><table class="atable"><thead><tr><th>Order</th><th>Customer</th><th>Method</th><th>Amount</th><th>Status</th><th>Reference</th><th>Date</th></tr></thead><tbody>
        ${orders.map(o => `<tr><td><b>${o.id}</b></td><td>${U.esc(o.customerName)}</td><td>${U.esc(o.payment)}</td><td>${U.taka(o.total)}</td>
          <td><span class="badge ${o.paymentStatus === 'Paid' ? 'badge-good' : 'badge-warn'}">${o.paymentStatus}</span></td>
          <td class="muted">${o.payment === 'Online Payment' ? 'TXN-' + o.id.slice(-6) : '—'}</td><td>${U.date(o.createdAt)}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="panel-body"><p class="muted" style="margin:0;font-size:.85rem">Payment logic is structured for a real provider (bKash / Nagad / card gateway) to be integrated later. Online payments are simulated in this prototype.</p></div>
      </div>`;
  };
  /* ---------------- REPORTS ---------------- */
  AV._rep = { from: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) };
  AV.reports = () => `
    <div class="panel"><div class="panel-head"><h3>Sales & performance reports</h3>
      <div class="filters"><label class="muted" style="font-size:.85rem">From <input class="input" type="date" id="repFrom" value="${AV._rep.from}"></label>
        <label class="muted" style="font-size:.85rem">To <input class="input" type="date" id="repTo" value="${AV._rep.to}"></label>
        <button class="btn btn-ghost btn-sm" id="repExport">⭳ Export CSV</button></div>
    </div><div class="panel-body" id="repBody"></div></div>`;
  AV.reportsMount = () => {
    const render = () => {
      const from = new Date(AV._rep.from); from.setHours(0, 0, 0, 0);
      const to = new Date(AV._rep.to); to.setHours(23, 59, 59, 999);
      const all = DB.all('orders').filter(o => { const t = new Date(o.createdAt); return t >= from && t <= to; });
      const paid = all.filter(o => o.status !== 'Cancelled');
      const rev = U.sum(paid, o => o.total);
      const prodCount = {}, catRev = {};
      paid.forEach(o => o.items.forEach(i => {
        prodCount[i.name] = (prodCount[i.name] || 0) + i.qty;
        const p = DB.all('products').find(x => x.id === i.productId); const cat = p ? DB.categoryName(p.categoryId) : 'Other';
        catRev[cat] = (catRev[cat] || 0) + i.price * i.qty;
      }));
      const best = Object.entries(prodCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const cats = Object.entries(catRev).sort((a, b) => b[1] - a[1]);
      const newCust = DB.all('customers').filter(c => { const t = new Date(c.joined); return t >= from && t <= to; }).length;
      const days = Math.max(1, Math.round((to - from) / 86400000));
      U.el('repBody').innerHTML = `
        <div class="stats" style="margin-bottom:1rem">
          <div class="stat accent"><div class="lab">Total revenue</div><div class="val">${U.taka(rev)}</div><div class="sub">${days} day range</div></div>
          <div class="stat"><div class="lab">Orders</div><div class="val">${all.length}</div><div class="sub">${paid.length} completed/active</div></div>
          <div class="stat"><div class="lab">Avg order value</div><div class="val">${U.taka(paid.length ? Math.round(rev / paid.length) : 0)}</div></div>
          <div class="stat"><div class="lab">New customers</div><div class="val">${newCust}</div></div>
        </div>
        <div class="chart-grid">
          <div class="panel"><div class="panel-head"><h3>Best-selling products</h3></div><div class="panel-body">
            <ul class="mini-list">${best.length ? best.map(([n, c]) => `<li><span>${U.esc(n)}</span><b>${c} sold</b></li>`).join('') : '<li class="muted">No sales in range.</li>'}</ul></div></div>
          <div class="panel"><div class="panel-head"><h3>Popular categories</h3></div><div class="panel-body">
            <ul class="mini-list">${cats.length ? cats.map(([n, v]) => `<li><span>${U.esc(n)}</span><b>${U.taka(v)}</b></li>`).join('') : '<li class="muted">No data.</li>'}</ul></div></div>
        </div>`;
    };
    U.el('repFrom').addEventListener('change', e => { AV._rep.from = e.target.value; render(); });
    U.el('repTo').addEventListener('change', e => { AV._rep.to = e.target.value; render(); });
    U.el('repExport').addEventListener('click', () => {
      const from = new Date(AV._rep.from), to = new Date(AV._rep.to); to.setHours(23, 59, 59, 999);
      const rows = [['Order ID', 'Customer', 'Total', 'Status', 'Payment', 'Date']];
      DB.all('orders').filter(o => { const t = new Date(o.createdAt); return t >= from && t <= to; })
        .forEach(o => rows.push([o.id, o.customerName, o.total, o.status, o.payment, new Date(o.createdAt).toISOString()]));
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = `skg-report-${AV._rep.from}_${AV._rep.to}.csv`; a.click();
      U.toast('Report exported.', 'ok');
    });
    render();
  };
  /* ---------------- SETTINGS ---------------- */
  AV.settings = () => {
    const s = DB.settings();
    return `<div class="grid-admin" style="grid-template-columns:1fr;gap:1rem;max-width:820px">
      <div class="panel"><div class="panel-head"><h3>Restaurant information</h3></div><div class="panel-body">
        <form id="setForm"><div class="form-grid">
          <div class="field"><label>Restaurant name</label><input class="input" id="stName" value="${U.esc(s.name)}"></div>
          <div class="field"><label>Phone</label><input class="input" id="stPhone" value="${U.esc(s.phone)}"></div>
          <div class="field"><label>Email</label><input class="input" id="stEmail" value="${U.esc(s.email)}"></div>
          <div class="field"><label>Opening hours</label><input class="input" id="stHours" value="${U.esc(s.hours)}"></div>
          <div class="field full"><label>Address</label><input class="input" id="stAddr" value="${U.esc(s.address)}"></div>
          <div class="field full"><label>Description</label><textarea class="input" id="stDesc" rows="2">${U.esc(s.description)}</textarea></div>
          <div class="field"><label>Facebook URL</label><input class="input" id="stFb" value="${U.esc(s.social.facebook)}"></div>
          <div class="field"><label>Instagram URL</label><input class="input" id="stIg" value="${U.esc(s.social.instagram)}"></div>
          <div class="field"><label>WhatsApp URL</label><input class="input" id="stWa" value="${U.esc(s.social.whatsapp)}"></div>
          <div class="field"><label>Google Maps URL</label><input class="input" id="stMap" value="${U.esc(s.social.maps)}"></div>
          <label class="switch"><input type="checkbox" id="stNotify" ${s.notifyOnNewOrder ? 'checked' : ''}> Notify on new order</label>
          <label class="switch"><input type="checkbox" id="stAuto" ${s.autoConfirm ? 'checked' : ''}> Auto-confirm new orders</label>
        </div><button class="btn btn-primary" style="margin-top:1rem">Save settings</button></form>
      </div></div>
      <div class="panel"><div class="panel-head"><h3>Change admin password</h3></div><div class="panel-body">
        <form id="pwAdminForm" style="max-width:420px">
          <div class="field"><label>Current password</label><input class="input" id="apCur" type="password"></div>
          <div class="field"><label>New password</label><input class="input" id="apNew" type="password"></div>
          <div class="field"><label>Confirm new password</label><input class="input" id="apNew2" type="password"></div>
          <button class="btn btn-primary">Update password</button>
        </form>
        <p class="muted" style="font-size:.82rem;margin-top:.8rem">The admin panel is protected and hidden from customers. Credentials are validated on every admin route.</p>
      </div></div>
      <div class="panel"><div class="panel-head"><h3>Data</h3></div><div class="panel-body">
        <p class="muted">Reset all data (products, orders, customers, settings) back to the demo seed.</p>
        <button class="btn btn-ghost" data-aaction="data-reset" style="color:var(--bad)">Reset demo data</button></div></div>
    </div>`;
  };
  AV.settingsMount = () => {
    U.el('setForm').addEventListener('submit', e => { e.preventDefault();
      DB.saveSettings({ name: U.el('stName').value, phone: U.el('stPhone').value, email: U.el('stEmail').value,
        hours: U.el('stHours').value, address: U.el('stAddr').value, description: U.el('stDesc').value,
        notifyOnNewOrder: U.el('stNotify').checked, autoConfirm: U.el('stAuto').checked,
        social: { facebook: U.el('stFb').value, instagram: U.el('stIg').value, whatsapp: U.el('stWa').value, maps: U.el('stMap').value } });
      U.toast('Settings saved.', 'ok');
    });
    U.el('pwAdminForm').addEventListener('submit', e => { e.preventDefault();
      const cur = U.el('apCur').value, n = U.el('apNew').value, n2 = U.el('apNew2').value;
      if (cur !== DB.adminCreds().password) return U.toast('Current password incorrect.', 'err');
      if (n.length < 6) return U.toast('New password too short.', 'err');
      if (n !== n2) return U.toast('Passwords do not match.', 'err');
      DB.saveAdmin({ password: n }); U.toast('Admin password updated.', 'ok'); e.target.reset();
    });
  };
  /* ---------------- action dispatcher ---------------- */
  AV.handleAction = (a, ds, el) => {
    const id = ds.id;
    const cats = () => DB.all('categories').sort(U.by('order'));
    switch (a) {
      case 'order-view': AV.orderModal(id); break;

      case 'product-add': AV.productModal(); break;
      case 'product-edit': AV.productModal(id); break;
      case 'product-feature': { const p = DB.find('products', id); DB.update('products', id, { featured: !p.featured }); AV.refresh(); break; }
      case 'product-del': U.confirm({ title: 'Delete product', message: 'Delete this product? This cannot be undone.', confirmText: 'Delete', onConfirm: () => { DB.remove('products', id); U.toast('Product deleted.', 'info'); AV.refresh(); } }); break;

      case 'cat-add': U.modal({ title: 'Add category', size: 400,
        body: `<div class="field"><label>Category name</label><input class="input" id="ncName"></div>`,
        footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="ncSave">Add</button>`,
        onOpen: (r, c) => r.querySelector('#ncSave').addEventListener('click', () => { const n = r.querySelector('#ncName').value.trim(); if (!n) return; DB.add('categories', { id: U.uid('c_'), name: n, order: cats().length + 1, enabled: true }); c(); AV.refresh(); }) }); break;
      case 'cat-edit': { const cat = DB.find('categories', id); U.modal({ title: 'Rename category', size: 400,
        body: `<div class="field"><label>Name</label><input class="input" id="ecName" value="${U.esc(cat.name)}"></div>`,
        footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="ecSave">Save</button>`,
        onOpen: (r, c) => r.querySelector('#ecSave').addEventListener('click', () => { DB.update('categories', id, { name: r.querySelector('#ecName').value.trim() }); c(); AV.refresh(); }) }); break; }
      case 'cat-toggle': { const cat = DB.find('categories', id); DB.update('categories', id, { enabled: !cat.enabled }); AV.refresh(); break; }
      case 'cat-del': U.confirm({ title: 'Delete category', message: 'Products in this category will be kept but uncategorised. Continue?', confirmText: 'Delete', onConfirm: () => { DB.remove('categories', id); U.toast('Category deleted.', 'info'); AV.refresh(); } }); break;
      case 'cat-up': case 'cat-down': {
        const list = cats(); const i = list.findIndex(c => c.id === id); const j = a === 'cat-up' ? i - 1 : i + 1;
        if (j < 0 || j >= list.length) break;
        const o1 = list[i].order, o2 = list[j].order;
        DB.update('categories', list[i].id, { order: o2 }); DB.update('categories', list[j].id, { order: o1 }); AV.refresh(); break;
      }

      case 'platter-add': AV.platterModal(); break;
      case 'platter-edit': AV.platterModal(id); break;
      case 'platter-toggle': { const p = DB.find('platters', id); DB.update('platters', id, { enabled: !p.enabled }); AV.refresh(); break; }
      case 'platter-del': U.confirm({ title: 'Delete platter', message: 'Delete this platter?', confirmText: 'Delete', onConfirm: () => { DB.remove('platters', id); U.toast('Platter deleted.', 'info'); AV.refresh(); } }); break;

      case 'cust-view': AV.customerModal(id); break;
      case 'cust-toggle': { const c = DB.find('customers', id); DB.update('customers', id, { status: c.status === 'active' ? 'disabled' : 'active' }); U.toast('Customer account updated.', 'ok'); AV.refresh(); break; }

      case 'rev-approve': DB.update('reviews', id, { status: 'approved' }); U.toast('Review approved.', 'ok'); AV.refresh(); break;
      case 'rev-hide': DB.update('reviews', id, { status: 'hidden' }); U.toast('Review hidden.', 'info'); AV.refresh(); break;
      case 'rev-feature': { const r = DB.find('reviews', id); DB.update('reviews', id, { featured: !r.featured, status: r.featured ? r.status : 'approved' }); AV.refresh(); break; }
      case 'rev-del': U.confirm({ title: 'Delete review', message: 'Delete this review permanently?', confirmText: 'Delete', onConfirm: () => { DB.remove('reviews', id); U.toast('Review deleted.', 'info'); AV.refresh(); } }); break;

      case 'coupon-add': AV.couponModal(); break;
      case 'coupon-edit': AV.couponModal(id); break;
      case 'coupon-toggle': { const c = DB.find('coupons', id); DB.update('coupons', id, { active: !c.active }); AV.refresh(); break; }
      case 'coupon-del': U.confirm({ title: 'Delete discount', message: 'Delete this discount/coupon?', confirmText: 'Delete', onConfirm: () => { DB.remove('coupons', id); U.toast('Deleted.', 'info'); AV.refresh(); } }); break;

      case 'offer-add': AV.offerModal(); break;
      case 'offer-edit': AV.offerModal(id); break;
      case 'offer-toggle': { const o = DB.find('offers', id); DB.update('offers', id, { active: !o.active }); AV.refresh(); break; }
      case 'offer-del': U.confirm({ title: 'Delete offer', message: 'Delete this promotion?', confirmText: 'Delete', onConfirm: () => { DB.remove('offers', id); U.toast('Offer deleted.', 'info'); AV.refresh(); } }); break;

      case 'gal-add': AV.galleryModal(); break;
      case 'gal-edit': AV.galleryModal(id); break;
      case 'gal-feature': { const g = DB.find('gallery', id); DB.update('gallery', id, { featured: !g.featured }); AV.refresh(); break; }
      case 'gal-del': U.confirm({ title: 'Remove image', message: 'Remove this image from the gallery?', confirmText: 'Remove', onConfirm: () => { DB.remove('gallery', id); U.toast('Image removed.', 'info'); AV.refresh(); } }); break;

      case 'data-reset': U.confirm({ title: 'Reset demo data', message: 'This will erase all changes and restore the original demo data. Continue?', confirmText: 'Reset', onConfirm: () => { DB.reset(); U.toast('Demo data restored.', 'ok'); AV.refresh(); } }); break;
    }
  };
  window.AV = AV;
})();
