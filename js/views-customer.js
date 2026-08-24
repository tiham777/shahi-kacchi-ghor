/* ============================================================
   views-customer.js — customer-facing pages & components
   Each page returns { html, mount? } or an HTML string.
   ============================================================ */
(function () {
  const CV = {};
  const S = () => DB.settings();

  /* ---------- shared components ---------- */
  CV.imgTag = (src, alt, cls) =>
    `<img src="${src}" alt="${U.esc(alt)}" loading="lazy" class="${cls || ''}" onerror="this.onerror=null;this.src=SKG.svgFor('${U.esc((alt || '').slice(0, 22))}')">`;

  CV.navbar = () => {
    const u = Auth.currentUser();
    const links = [['#/', 'Home'], ['#/menu', 'Menu'], ['#/platters', 'Platters'], ['#/about', 'About'], ['#/gallery', 'Gallery'], ['#/reviews', 'Reviews'], ['#/contact', 'Contact']];
    const hash = location.hash || '#/';
    return `<header class="nav">
      <div class="wrap nav-inner">
        <a class="brand" href="#/">${SKG.logoSVG}<span>Shahi Kacchi Ghor<small>Authentic Chattogram Biriyani</small></span></a>
        <button class="nav-toggle" data-navtoggle aria-label="Menu">☰</button>
        <nav class="nav-links" id="navlinks">
          ${links.map(([h, t]) => `<a href="${h}" class="${hash === h ? 'active' : ''}">${t}</a>`).join('')}
          <a href="#/account" class="${hash.startsWith('#/account') ? 'active' : ''}">${u ? 'Account' : 'Account'}</a>
        </nav>
        <div class="nav-actions">
          <a class="cart-btn" href="#/cart" aria-label="Cart">🛒<span class="cart-count" data-cartcount${Cart.count() > 0 ? '' : ' style="display:none"'}>${Cart.count()}</span></a>
          <a class="btn btn-primary btn-sm" href="#/menu">Order Now</a>
        </div>
      </div>
    </header>`;
  };

  CV.footer = () => {
    const s = S();
    return `<footer class="footer"><div class="wrap">
      <div class="cols">
        <div>
          <div class="brand" style="color:#fff">${SKG.logoSVG}<span style="color:#fff">Shahi Kacchi Ghor</span></div>
          <p style="margin-top:.8rem;max-width:34ch">${U.esc(s.description)}</p>
        </div>
        <div><h4>Explore</h4><a href="#/menu">Menu</a><br><a href="#/platters">Platters</a><br><a href="#/gallery">Gallery</a><br><a href="#/reviews">Reviews</a></div>
        <div><h4>Account</h4><a href="#/account">My Account</a><br><a href="#/login">Login</a><br><a href="#/register">Register</a><br><a href="#/cart">Cart</a></div>
        <div><h4>Visit Us</h4>${U.esc(s.address)}<br>${U.esc(s.hours)}<br>${U.esc(s.phone)}<br>${U.esc(s.email)}
          <div class="tag-line" style="margin-top:.7rem">
            <a href="${s.social.facebook}" target="_blank" rel="noopener">Facebook</a> ·
            <a href="${s.social.instagram}" target="_blank" rel="noopener">Instagram</a> ·
            <a href="${s.social.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
          </div>
        </div>
      </div>
      <div class="bottom"><span>© ${new Date().getFullYear()} Shahi Kacchi Ghor · Chattogram, Bangladesh</span><span>Slow-cooked with love · Open 24/7</span></div>
    </div></footer>`;
  };

  /* Product card (reused on home & menu) */
  CV.productCard = (p) => {
    const fav = Auth.isFavorite(p.id);
    return `<article class="card pcard" data-pid="${p.id}">
      <div class="thumb">
        ${CV.imgTag(p.image, p.name)}
        <button class="fav ${fav ? 'on' : ''}" data-action="fav" data-id="${p.id}" title="Favourite">${fav ? '♥' : '♡'}</button>
        ${p.available ? '' : '<div class="soldout">Sold out</div>'}
      </div>
      <div class="body">
        <div class="prow" style="margin-bottom:.3rem">
          <h3>${U.esc(p.name)}</h3>
          <span class="rating">★ ${p.rating.toFixed(1)} <span class="cnt">(${p.ratingCount})</span></span>
        </div>
        <p class="pdesc">${U.esc(p.desc)}</p>
        <div class="prow">
          <span class="price">${U.taka(p.price)}</span>
          ${p.available
            ? `<button class="btn btn-terra btn-sm" data-action="add-cart" data-id="${p.id}">Add to Cart</button>`
            : `<span class="badge badge-bad">Unavailable</span>`}
        </div>
      </div>
    </article>`;
  };
  /* ---------------- HOME ---------------- */
  CV.home = () => {
    const feat = DB.all('products').filter(p => p.featured).slice(0, 3);
    const revs = DB.all('reviews').filter(r => r.status === 'approved' && r.featured).slice(0, 3);
    const activeOffer = DB.all('offers').find(o => o.active);
    return { html: `
      <section class="hero">
        <div class="hero-bg" style="background-image:url('${SKG.PH.hero}')"></div>
        <div class="wrap hero-inner">
          <div class="eyebrow" style="color:#f3c98a">Chattogram · Since generations</div>
          <h1>The Taste of Biriyani You'll Remember.</h1>
          <p class="lead">Traditional Bangladeshi biriyani, slow-cooked with aromatic rice, rich spices, and authentic recipes.</p>
          <div class="hero-actions">
            <a class="btn btn-terra" href="#/menu">Explore Menu</a>
            <a class="btn btn-outline-cream" href="#/menu">Order Now</a>
          </div>
          <div class="hero-tags">
            <span><b>4.9★</b> 900+ happy diners</span>
            <span><b>24/7</b> always open</span>
            <span><b>35–50m</b> fast delivery</span>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <div class="center" style="max-width:640px;margin-inline:auto">
            <div class="eyebrow">Our signatures</div>
            <h2>Slow-cooked, the traditional way</h2>
            <p class="muted">On dum for hours — layered rice, tender meat, potato and egg, finished with saffron and warm spices.</p>
          </div>
          <div class="grid cols-3" style="margin-top:2rem">${feat.map(CV.productCard).join('')}</div>
          <div class="center" style="margin-top:1.6rem"><a class="btn btn-ghost" href="#/menu">See full menu →</a></div>
        </div>
      </section>

      <section class="section section-alt pattern">
        <div class="wrap grid cols-4">
          ${[['🍚', 'Aromatic Rice', 'Long-grain basmati, cooked to perfection.'],
             ['🔥', 'Slow Dum Cooking', 'Sealed handi, hours of gentle heat.'],
             ['🌿', 'Authentic Spices', 'Traditional Chattogram spice blend.'],
             ['🛵', 'Fast Delivery', 'Hot to your door across the city.']]
            .map(([i, t, d]) => `<div class="feature"><div class="fi">${i}</div><h3>${t}</h3><p class="muted" style="font-size:.9rem">${d}</p></div>`).join('')}
        </div>
      </section>

      <section class="section"><div class="wrap split">
        <div class="media-frame">${CV.imgTag(SKG.PH.about, 'Biriyani handi')}</div>
        <div>
          <div class="eyebrow">Our story</div>
          <h2>More than a meal — a taste people remember</h2>
          <p class="lead">Every grain of rice carries the aroma of rich spices, slow-cooked meat, and traditional cooking.</p>
          <p class="muted">Our mission is simple — to bring the authentic taste of traditional Bangladeshi biriyani to every food lover in Chattogram.</p>
          <a class="btn btn-primary" href="#/about">About Shahi Kacchi Ghor</a>
        </div>
      </div></section>

      <section class="section section-dark pattern"><div class="wrap">
        <div class="center" style="margin-bottom:2rem"><div class="eyebrow">Loved by Chattogram</div><h2>What our guests say</h2></div>
        <div class="grid cols-3">${revs.map(r => `<div class="review"><div class="stars">${'★'.repeat(r.rating)}</div><blockquote>"${U.esc(r.text)}"</blockquote><div class="who">${U.esc(r.name)} <span>· verified diner</span></div></div>`).join('')}</div>
      </div></section>

      <section class="section"><div class="wrap center">
        <h2>Hungry yet?</h2><p class="muted">Order authentic Kacchi in a few taps. Open 24/7.</p>
        <a class="btn btn-terra" href="#/menu" style="margin-top:.6rem">Order Now</a>
      </div></section>
    ` };
  };
  /* ---------------- MENU ---------------- */
  CV.menu = () => {
    const cats = DB.all('categories').filter(c => c.enabled).sort(U.by('order'));
    const html = `
      <section class="section"><div class="wrap">
        <div class="center" style="max-width:640px;margin-inline:auto">
          <div class="eyebrow">Our Menu</div>
          <h2>Biriyani, sides & traditional drinks</h2>
          <p class="muted">Fresh, made to order. Tap the heart to save favourites.</p>
        </div>
        <div class="toolbar" style="margin-top:1.8rem">
          <div class="search"><span class="ic">🔎</span><input class="input" id="mSearch" placeholder="Search dishes…"></div>
          <select class="input" id="mSort" style="max-width:200px">
            <option value="pop">Sort: Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top rated</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
        <div class="chips" id="mChips" style="margin-bottom:1.4rem">
          <button class="chip active" data-cat="all">All</button>
          ${cats.map(c => `<button class="chip" data-cat="${c.id}">${U.esc(c.name)}</button>`).join('')}
          <button class="chip" data-cat="fav">♥ Favourites</button>
        </div>
        <div class="grid cols-3" id="mGrid"></div>
      </div></section>`;

    const state = { q: '', cat: 'all', sort: 'pop' };
    function render() {
      const grid = U.el('mGrid'); if (!grid) return;
      let items = DB.all('products');
      if (state.cat === 'fav') { const u = Auth.currentUser(); items = items.filter(p => u && u.favorites.includes(p.id)); }
      else if (state.cat !== 'all') items = items.filter(p => p.categoryId === state.cat);
      if (state.q) items = items.filter(p => (p.name + ' ' + p.desc).toLowerCase().includes(state.q));
      const sorters = { 'price-asc': U.by('price'), 'price-desc': U.by('price', -1), 'rating': U.by('rating', -1), 'name': U.by('name'), 'pop': (a, b) => b.ratingCount - a.ratingCount };
      items.sort(sorters[state.sort]);
      grid.innerHTML = items.length ? items.map(CV.productCard).join('')
        : `<div class="empty" style="grid-column:1/-1"><div class="big">🍽️</div>No dishes match your search.</div>`;
    }
    function mount() {
      U.el('mSearch').addEventListener('input', U.debounce(e => { state.q = e.target.value.toLowerCase().trim(); render(); }, 200));
      U.el('mSort').addEventListener('change', e => { state.sort = e.target.value; render(); });
      U.el('mChips').addEventListener('click', e => {
        const b = e.target.closest('[data-cat]'); if (!b) return;
        U.qsa('#mChips .chip').forEach(c => c.classList.remove('active')); b.classList.add('active');
        state.cat = b.dataset.cat; render();
      });
      CV._menuUnsub = U.on('auth:change', render);
      CV._menuUnsub2 = U.on('db:change', render);
      render();
    }
    return { html, mount };
  };
  /* ---------------- PLATTERS ---------------- */
  CV.platters = () => {
    const pls = DB.all('platters').filter(p => p.enabled);
    const html = `
      <section class="section"><div class="wrap">
        <div class="center" style="max-width:640px;margin-inline:auto">
          <div class="eyebrow">Platters</div>
          <h2>Feast together, the traditional way</h2>
          <p class="muted">Curated combinations for one, two, or the whole group. Customise quantities and add extras.</p>
        </div>
        <div class="grid cols-3" style="margin-top:2rem">
          ${pls.map(p => `<article class="card pcard">
            <div class="thumb">${CV.imgTag(p.image, p.name)}</div>
            <div class="body">
              <div class="prow" style="margin-bottom:.2rem"><h3>${U.esc(p.name)}</h3></div>
              <span class="badge badge-neutral">Serves ${U.esc(p.serves)}</span>
              <p class="pdesc" style="margin-top:.6rem">${U.esc(p.desc)}</p>
              <ul style="margin:0 0 .8rem;padding-left:1.1rem;font-size:.86rem;color:var(--brown-2)">${p.items.map(i => `<li>${U.esc(i)}</li>`).join('')}</ul>
              <div class="prow">
                <span class="price">${U.taka(p.price)}</span>
                <button class="btn btn-terra btn-sm" data-action="customize-platter" data-id="${p.id}">Customise</button>
              </div>
            </div>
          </article>`).join('')}
        </div>
        <div class="notice" style="margin-top:1.6rem">Need a custom size for 6, 8 or more? Choose <b>Friends Feast</b> and set your group size, or call us — we cater for events.</div>
      </div></section>`;
    return { html };
  };

  CV.platterModal = (id) => {
    const p = DB.find('platters', id); if (!p) return;
    const extras = DB.all('products').filter(x => x.available && x.categoryId !== 'c_biriyani').slice(0, 6);
    U.modal({
      title: `Customise · ${p.name}`, size: 560,
      body: `
        <p class="muted" style="margin-top:0">Serves ${U.esc(p.serves)} · Base price ${U.taka(p.price)}</p>
        <div class="field"><label>Group size / quantity</label>
          <div class="qty" style="display:inline-flex"><button data-q="-">−</button><span id="plQty">1</span><button data-q="+">+</button></div>
        </div>
        <div class="field"><label>Add extras</label>
          <div id="plExtras" style="display:grid;gap:.5rem">
            ${extras.map(e => `<label class="switch" style="justify-content:space-between;border:1px solid var(--line);padding:.5rem .8rem;border-radius:10px">
              <span>${U.esc(e.name)} <span class="muted">(+${U.taka(e.price)})</span></span>
              <input type="checkbox" data-extra="${e.id}" data-price="${e.price}" data-name="${U.esc(e.name)}"></label>`).join('')}
          </div>
        </div>
        <div class="summary" style="position:static;box-shadow:none"><div class="sline total" style="margin:0;border:0;padding:0">Total: <span id="plTotal">${U.taka(p.price)}</span></div></div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="plAdd">Add to Cart</button>`,
      onOpen: (root, close) => {
        let qty = 1;
        const calc = () => {
          const ex = U.qsa('[data-extra]:checked', root).reduce((s, c) => s + Number(c.dataset.price), 0);
          root.querySelector('#plTotal').textContent = U.taka((p.price + ex) * qty);
        };
        root.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
          qty = Math.max(1, qty + (b.dataset.q === '+' ? 1 : -1)); root.querySelector('#plQty').textContent = qty; calc();
        }));
        root.querySelectorAll('[data-extra]').forEach(c => c.addEventListener('change', calc));
        root.querySelector('#plAdd').addEventListener('click', () => {
          const chosen = U.qsa('[data-extra]:checked', root).map(c => c.dataset.name);
          const ex = U.qsa('[data-extra]:checked', root).reduce((s, c) => s + Number(c.dataset.price), 0);
          Cart.add({ kind: 'platter', id: p.id, name: p.name, price: p.price + ex, image: p.image, qty,
            meta: { serves: p.serves, extras: chosen } });
          close();
        });
      }
    });
  };
  /* ---------------- ABOUT ---------------- */
  CV.about = () => ({ html: `
    <section class="section"><div class="wrap split">
      <div><div class="eyebrow">About us</div>
        <h2>Shahi Kacchi Ghor</h2>
        <p class="lead">Our mission is simple — to bring the authentic taste of traditional Bangladeshi biriyani to every food lover in Chattogram.</p>
        <p class="muted">Every grain of rice carries the aroma of rich spices, slow-cooked meat, and traditional cooking. We believe great biriyani is more than a meal — it is a taste people remember.</p>
        <div class="hero-tags" style="margin-top:1.4rem">
          <span style="color:var(--brown-2)"><b style="color:var(--maroon)">10k+</b> orders served</span>
          <span style="color:var(--brown-2)"><b style="color:var(--maroon)">4.9★</b> average rating</span>
          <span style="color:var(--brown-2)"><b style="color:var(--maroon)">24/7</b> kitchen open</span>
        </div>
      </div>
      <div class="media-frame">${CV.imgTag(SKG.PH.interior, 'Restaurant interior')}</div>
    </div></section>
    <section class="section section-alt pattern"><div class="wrap grid cols-3">
      ${[['Authentic recipes', 'Passed down and perfected over the years.'],
         ['Fresh every day', 'Prepared to order with quality ingredients.'],
         ['Warm hospitality', 'The comfort of a Chattogram family kitchen.']]
        .map(([t, d]) => `<div class="card" style="padding:1.6rem"><h3>${t}</h3><p class="muted" style="margin:0">${d}</p></div>`).join('')}
    </div></section>` });

  /* ---------------- GALLERY ---------------- */
  CV.gallery = () => {
    const imgs = DB.all('gallery');
    return { html: `
      <section class="section"><div class="wrap">
        <div class="center" style="max-width:620px;margin-inline:auto"><div class="eyebrow">Gallery</div><h2>A taste of Shahi Kacchi Ghor</h2><p class="muted">From the handi to the table.</p></div>
        <div class="masonry" style="margin-top:2rem">
          ${imgs.map(g => `<figure>${CV.imgTag(g.url, g.caption)}<figcaption>${U.esc(g.caption)}</figcaption></figure>`).join('')}
        </div>
      </div></section>` };
  };

  /* ---------------- REVIEWS ---------------- */
  CV.reviews = () => {
    const revs = DB.all('reviews').filter(r => r.status === 'approved');
    const avg = revs.length ? (U.sum(revs, r => r.rating) / revs.length) : 5;
    const html = `
      <section class="section"><div class="wrap">
        <div class="center" style="max-width:620px;margin-inline:auto">
          <div class="eyebrow">Reviews</div><h2>Loved by our guests</h2>
          <p class="muted">${avg.toFixed(1)}★ average from ${revs.length} approved reviews.</p>
          ${Auth.isLoggedIn() ? `<button class="btn btn-terra" id="writeReview" style="margin-top:.4rem">Write a review</button>` : `<a class="btn btn-ghost" href="#/login" style="margin-top:.4rem">Log in to write a review</a>`}
        </div>
        <div class="grid cols-3" style="margin-top:2rem">
          ${revs.map(r => `<div class="review"><div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div><blockquote>"${U.esc(r.text)}"</blockquote><div class="who">${U.esc(r.name)} <span>· ${U.date(r.date)}</span></div></div>`).join('')}
        </div>
      </div></section>`;
    function mount() {
      const b = U.el('writeReview');
      if (b) b.addEventListener('click', CV.reviewModal);
    }
    return { html, mount };
  };

  CV.reviewModal = () => {
    const u = Auth.currentUser(); if (!u) { location.hash = '#/login'; return; }
    U.modal({
      title: 'Write a review', size: 480,
      body: `<div class="field"><label>Rating</label>
          <select class="input" id="rvRating"><option value="5">★★★★★ Excellent</option><option value="4">★★★★ Good</option><option value="3">★★★ Okay</option><option value="2">★★ Poor</option><option value="1">★ Bad</option></select></div>
        <div class="field"><label>Your review</label><textarea class="input" id="rvText" rows="4" placeholder="Tell us about your experience…"></textarea></div>
        <p class="muted" style="font-size:.82rem">Reviews appear publicly once approved by our team.</p>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="rvSubmit">Submit</button>`,
      onOpen: (root, close) => root.querySelector('#rvSubmit').addEventListener('click', () => {
        const text = root.querySelector('#rvText').value.trim();
        if (!text) { U.toast('Please write something first.', 'err'); return; }
        DB.add('reviews', { id: U.uid('r_'), name: u.name, rating: Number(root.querySelector('#rvRating').value), text, status: 'pending', featured: false, date: new Date().toISOString() });
        close(); U.toast('Thank you! Your review is pending approval.', 'ok');
      })
    });
  };
  /* ---------------- CONTACT ---------------- */
  CV.contact = () => {
    const s = S();
    const html = `
      <section class="section"><div class="wrap two-col">
        <div>
          <div class="eyebrow">Contact</div><h2>Come by, or order in</h2>
          <p class="muted">We're open 24/7 in the heart of Chattogram. Reach us any time.</p>
          <div class="grid" style="gap:.8rem;margin-top:1rem">
            <div class="card" style="padding:1rem 1.2rem"><b>📍 Address</b><div class="muted">${U.esc(s.address)}</div></div>
            <div class="card" style="padding:1rem 1.2rem"><b>📞 Phone</b><div class="muted">${U.esc(s.phone)}</div></div>
            <div class="card" style="padding:1rem 1.2rem"><b>✉️ Email</b><div class="muted">${U.esc(s.email)}</div></div>
            <div class="card" style="padding:1rem 1.2rem"><b>🕒 Hours</b><div class="muted">${U.esc(s.hours)}</div></div>
          </div>
          <div class="tag-line" style="margin-top:1rem">
            <a class="btn btn-ghost btn-sm" href="${s.social.facebook}" target="_blank" rel="noopener">Facebook</a>
            <a class="btn btn-ghost btn-sm" href="${s.social.instagram}" target="_blank" rel="noopener">Instagram</a>
            <a class="btn btn-ghost btn-sm" href="${s.social.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
            <a class="btn btn-ghost btn-sm" href="${s.social.maps}" target="_blank" rel="noopener">Google Maps</a>
          </div>
        </div>
        <div>
          <div class="media-frame" style="border-radius:var(--r-lg)">
            <iframe title="Map" width="100%" height="240" style="border:0;display:block" loading="lazy"
              src="https://www.openstreetmap.org/export/embed.html?bbox=91.75%2C22.30%2C91.90%2C22.40&layer=mapnik&marker=22.3569,91.7832"></iframe>
          </div>
          <form class="card" style="padding:1.4rem;margin-top:1rem" id="contactForm">
            <h3>Send us a message</h3>
            <div class="field"><label>Name</label><input class="input" required></div>
            <div class="field"><label>Message</label><textarea class="input" rows="3" required></textarea></div>
            <button class="btn btn-primary btn-block">Send Message</button>
          </form>
        </div>
      </div></section>`;
    function mount() {
      U.el('contactForm').addEventListener('submit', e => { e.preventDefault(); e.target.reset(); U.toast("Thanks! We'll get back to you shortly.", 'ok'); });
    }
    return { html, mount };
  };
  /* ---------------- LOGIN ---------------- */
  CV.login = () => {
    if (Auth.isLoggedIn()) { location.hash = '#/account'; return { html: '' }; }
    const html = `
      <div class="auth-wrap"><div class="auth-card">
        <div class="center" style="margin-bottom:1.2rem"><div class="brand" style="justify-content:center">${SKG.logoSVG}</div><h2 style="margin:.6rem 0 0">Welcome back</h2><p class="muted" style="margin:0">Log in to order and track deliveries.</p></div>
        <form id="loginForm">
          <div class="field"><label>Email or phone</label><input class="input" id="lEmail" required></div>
          <div class="field"><label>Password</label><input class="input" id="lPass" type="password" required></div>
          <button class="btn btn-primary btn-block">Log In</button>
        </form>
        <div class="divider-word">new here?</div>
        <a class="btn btn-ghost btn-block" href="#/register">Create an account</a>
      </div></div>`;
    function mount() {
      U.el('loginForm').addEventListener('submit', e => {
        e.preventDefault();
        const r = Auth.login(U.el('lEmail').value, U.el('lPass').value);
        if (r.ok) { U.toast('Logged in. Welcome back!', 'ok'); location.hash = '#/account'; }
        else U.toast(r.msg, 'err');
      });
    }
    return { html, mount };
  };

  /* ---------------- REGISTER ---------------- */
  CV.register = () => {
    if (Auth.isLoggedIn()) { location.hash = '#/account'; return { html: '' }; }
    const html = `
      <div class="auth-wrap"><div class="auth-card">
        <div class="center" style="margin-bottom:1.2rem"><div class="brand" style="justify-content:center">${SKG.logoSVG}</div><h2 style="margin:.6rem 0 0">Create your account</h2><p class="muted" style="margin:0">Join Shahi Kacchi Ghor.</p></div>
        <form id="regForm">
          <div class="field"><label>Full name</label><input class="input" id="rName" required></div>
          <div class="row-2">
            <div class="field"><label>Email</label><input class="input" id="rEmail" type="email" required></div>
            <div class="field"><label>Phone</label><input class="input" id="rPhone" required></div>
          </div>
          <div class="row-2">
            <div class="field"><label>Password</label><input class="input" id="rPass" type="password" required><div class="err" id="rErr"></div></div>
            <div class="field"><label>Confirm password</label><input class="input" id="rPass2" type="password" required></div>
          </div>
          <button class="btn btn-primary btn-block">Register</button>
        </form>
        <div class="divider-word">already a member?</div>
        <a class="btn btn-ghost btn-block" href="#/login">Log in instead</a>
      </div></div>`;
    function mount() {
      U.el('regForm').addEventListener('submit', e => {
        e.preventDefault();
        const p = U.el('rPass').value, p2 = U.el('rPass2').value;
        const err = U.el('rErr');
        if (p.length < 6) { err.textContent = 'Password must be at least 6 characters.'; return; }
        if (p !== p2) { err.textContent = 'Passwords do not match.'; return; }
        const r = Auth.register({ name: U.el('rName').value, email: U.el('rEmail').value, phone: U.el('rPhone').value, password: p });
        if (r.ok) { U.toast('Account created. Welcome!', 'ok'); location.hash = '#/account'; }
        else U.toast(r.msg, 'err');
      });
    }
    return { html, mount };
  };
  /* ---------------- ACCOUNT (protected) ---------------- */
  CV.account = (params) => {
    const u = Auth.currentUser();
    if (!u) { location.hash = '#/login'; return { html: '' }; }
    const tab = (params && params.tab) || 'profile';
    const tabs = [['profile', '👤 Profile'], ['edit', '✏️ Edit info'], ['password', '🔒 Password'],
      ['addresses', '📍 Addresses'], ['orders', '📦 Order history'], ['current', '🚚 Current orders'],
      ['favorites', '♥ Favourites'], ['preferences', '⚙️ Preferences']];
    const html = `
      <section class="section"><div class="wrap">
        <div class="prow" style="margin-bottom:1.4rem"><div><div class="eyebrow">My Account</div><h2 style="margin:0">Hello, ${U.esc(u.name.split(' ')[0])}</h2></div></div>
        <div class="acct">
          <div class="acct-nav">
            ${tabs.map(([k, t]) => `<button class="${k === tab ? 'active' : ''}" onclick="location.hash='#/account/${k}'">${t}</button>`).join('')}
            <button data-action="logout" style="color:var(--bad)">↩ Logout</button>
          </div>
          <div id="acctPanel">${CV.acctTab(tab, u)}</div>
        </div>
      </div></section>`;
    function mount() { CV.acctMount(tab); }
    return { html, mount };
  };

  CV.acctTab = (tab, u) => {
    if (tab === 'profile') {
      const orders = DB.all('orders').filter(o => o.customerId === u.id);
      const spent = U.sum(orders.filter(o => o.status !== 'Cancelled'), o => o.total);
      return `<div class="card" style="padding:1.6rem">
        <h3>Profile</h3>
        <div class="grid cols-2" style="gap:.8rem">
          <div><small class="muted">Name</small><div>${U.esc(u.name)}</div></div>
          <div><small class="muted">Email</small><div>${U.esc(u.email)}</div></div>
          <div><small class="muted">Phone</small><div>${U.esc(u.phone)}</div></div>
          <div><small class="muted">Member since</small><div>${U.date(u.joined)}</div></div>
        </div>
        <hr class="hairline" style="margin:1.2rem 0">
        <div class="kpi-row">
          <div class="stat" style="flex:1"><div class="lab">Total orders</div><div class="val">${orders.length}</div></div>
          <div class="stat" style="flex:1"><div class="lab">Total spent</div><div class="val">${U.taka(spent)}</div></div>
          <div class="stat" style="flex:1"><div class="lab">Favourites</div><div class="val">${u.favorites.length}</div></div>
        </div>
      </div>`;
    }
    if (tab === 'edit') return `<div class="card" style="padding:1.6rem"><h3>Edit personal information</h3>
      <form id="editForm"><div class="row-2">
        <div class="field"><label>Full name</label><input class="input" id="eName" value="${U.esc(u.name)}"></div>
        <div class="field"><label>Phone</label><input class="input" id="ePhone" value="${U.esc(u.phone)}"></div>
      </div><div class="field"><label>Email</label><input class="input" id="eEmail" value="${U.esc(u.email)}"></div>
      <button class="btn btn-primary">Save changes</button></form></div>`;
    if (tab === 'password') return `<div class="card" style="padding:1.6rem"><h3>Change password</h3>
      <form id="pwForm">
        <div class="field"><label>Current password</label><input class="input" id="pwCur" type="password"></div>
        <div class="row-2">
          <div class="field"><label>New password</label><input class="input" id="pwNew" type="password"></div>
          <div class="field"><label>Confirm new</label><input class="input" id="pwNew2" type="password"></div>
        </div><button class="btn btn-primary">Update password</button></form></div>`;
    if (tab === 'preferences') return `<div class="card" style="padding:1.6rem"><h3>Saved preferences</h3>
      <form id="prefForm">
        <div class="field"><label>Preferred spice level</label>
          <select class="input" id="prefSpice">${['Mild', 'Medium', 'Hot'].map(s => `<option ${u.preferences && u.preferences.spice === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
        <div class="field"><label>Delivery notes</label><textarea class="input" id="prefNotes" rows="3">${U.esc(u.preferences && u.preferences.notes || '')}</textarea></div>
        <button class="btn btn-primary">Save preferences</button></form></div>`;
    return CV.acctTab2(tab, u);
  };
  CV.acctTab2 = (tab, u) => {
    if (tab === 'addresses') {
      return `<div class="card" style="padding:1.6rem"><div class="prow"><h3 style="margin:0">Saved addresses</h3><button class="btn btn-terra btn-sm" data-action="add-address">+ Add address</button></div>
        <div style="margin-top:1rem;display:grid;gap:.7rem">
          ${u.addresses.length ? u.addresses.map(a => `<div class="opt ${a.isDefault ? 'sel' : ''}" style="cursor:default">
            <div style="flex:1"><b>${U.esc(a.label)}</b> ${a.isDefault ? '<span class="badge badge-good">Default</span>' : ''}
              <div class="muted">${U.esc(a.line)}, ${U.esc(a.area)} · ${U.esc(a.phone)}</div></div>
            <div class="actions-cell">${a.isDefault ? '' : `<button class="icon-btn" data-action="default-address" data-id="${a.id}">Set default</button>`}
              <button class="icon-btn danger" data-action="remove-address" data-id="${a.id}">Remove</button></div>
          </div>`).join('') : '<p class="muted">No saved addresses yet.</p>'}
        </div></div>`;
    }
    if (tab === 'favorites') {
      const favs = DB.all('products').filter(p => u.favorites.includes(p.id));
      return `<h3>Favourites</h3>${favs.length ? `<div class="grid cols-2" style="gap:1rem">${favs.map(CV.productCard).join('')}</div>`
        : `<div class="empty"><div class="big">♡</div>No favourites yet. Tap the heart on any dish.</div>`}`;
    }
    // orders / current
    let orders = DB.all('orders').filter(o => o.customerId === u.id);
    if (tab === 'current') orders = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status));
    orders.sort(U.by('createdAt', -1));
    if (!orders.length) return `<div class="empty"><div class="big">📦</div>${tab === 'current' ? 'No active orders right now.' : 'No orders yet.'} <br><a class="link" href="#/menu">Browse the menu →</a></div>`;
    return `<div class="grid" style="gap:.9rem">${orders.map(o => `
      <div class="card" style="padding:1.1rem 1.3rem">
        <div class="prow" style="align-items:flex-start">
          <div><b>${o.id}</b> <span class="pill ${statusClass(o.status)}">${o.status}</span>
            <div class="muted" style="font-size:.85rem">${U.datetime(o.createdAt)} · ${o.items.length} item(s)</div></div>
          <div style="text-align:right"><div class="price">${U.taka(o.total)}</div>
            <a class="btn btn-ghost btn-sm" href="#/order/${o.id}" style="margin-top:.3rem">View / Track</a></div>
        </div>
      </div>`).join('')}</div>`;
  };

  CV.acctMount = (tab) => {
    const rerender = () => { const u = Auth.currentUser(); const panel = U.el('acctPanel'); if (panel && u) panel.innerHTML = CV.acctTab(tab, u); };
    const ef = U.el('editForm');
    if (ef) ef.addEventListener('submit', e => { e.preventDefault(); Auth.updateProfile({ name: U.el('eName').value, phone: U.el('ePhone').value, email: U.el('eEmail').value }); U.toast('Profile updated.', 'ok'); rerender(); });
    const pf = U.el('pwForm');
    if (pf) pf.addEventListener('submit', e => { e.preventDefault();
      if (U.el('pwNew').value.length < 6) return U.toast('New password too short.', 'err');
      if (U.el('pwNew').value !== U.el('pwNew2').value) return U.toast('Passwords do not match.', 'err');
      const r = Auth.changePassword(U.el('pwCur').value, U.el('pwNew').value);
      r.ok ? (U.toast('Password updated.', 'ok'), pf.reset()) : U.toast(r.msg, 'err');
    });
    const prf = U.el('prefForm');
    if (prf) prf.addEventListener('submit', e => { e.preventDefault(); Auth.updateProfile({ preferences: { spice: U.el('prefSpice').value, notes: U.el('prefNotes').value } }); U.toast('Preferences saved.', 'ok'); });
  };
  /* ---------------- CART ---------------- */
  CV.cart = () => {
    const html = `<section class="section"><div class="wrap"><div class="eyebrow">Your Cart</div><h2>Review your order</h2><div id="cartWrap" style="margin-top:1.4rem"></div></div></section>`;
    function renderInner() {
      const wrap = U.el('cartWrap'); if (!wrap) return;
      const items = Cart.items();
      if (!items.length) { wrap.innerHTML = `<div class="empty"><div class="big">🛒</div>Your cart is empty.<br><a class="link" href="#/menu">Browse the menu →</a></div>`; return; }
      const t = Cart.totals();
      wrap.innerHTML = `<div class="two-col">
        <div class="card" style="padding:1.2rem 1.4rem">
          ${items.map(i => `<div class="cart-line">
            ${CV.imgTag(i.image, i.name)}
            <div><b>${U.esc(i.name)}</b>${i.meta ? `<div class="muted" style="font-size:.82rem">Serves ${U.esc(i.meta.serves || '')}${i.meta.extras && i.meta.extras.length ? ' · + ' + i.meta.extras.map(U.esc).join(', ') : ''}</div>` : ''}
              <div class="muted" style="font-size:.85rem">${U.taka(i.price)} each</div>
              <button class="icon-btn danger" data-action="cart-remove" data-key="${i.key}" style="margin-top:.4rem">Remove</button></div>
            <div style="text-align:right"><div class="qty"><button data-action="cart-dec" data-key="${i.key}">−</button><span>${i.qty}</span><button data-action="cart-inc" data-key="${i.key}">+</button></div>
              <div class="price" style="margin-top:.4rem">${U.taka(i.price * i.qty)}</div></div>
          </div>`).join('')}
        </div>
        <div class="summary">
          <h3 style="margin-top:0">Order summary</h3>
          <div class="field"><label>Coupon code</label><div style="display:flex;gap:.5rem">
            <input class="input" id="cCoupon" placeholder="e.g. WELCOME10" value="${t.coupon ? t.coupon.code : ''}">
            <button class="btn btn-ghost btn-sm" id="cApply">Apply</button></div></div>
          <div class="sline"><span>Subtotal</span><b>${U.taka(t.subtotal)}</b></div>
          ${t.discount ? `<div class="sline" style="color:var(--good)"><span>Discount (${U.esc(t.coupon.code)})</span><b>−${U.taka(t.discount)}</b></div>` : ''}
          <div class="sline"><span>Delivery</span><b>${t.delivery ? U.taka(t.delivery) : 'Free'}</b></div>
          <div class="sline total"><span>Total</span><span>${U.taka(t.total)}</span></div>
          <div class="notice" style="margin:.8rem 0">Estimated delivery: ${t.eta}</div>
          <a class="btn btn-primary btn-block" href="#/checkout">Proceed to Checkout</a>
        </div>
      </div>`;
    }
    function mount() {
      renderInner();
      CV._cartUnsub = U.on('cart:change', renderInner);
      U.el('cartWrap').addEventListener('click', e => {
        if (e.target.id === 'cApply') {
          const r = Cart.applyCoupon(U.el('cCoupon').value);
          U.toast(r.ok ? `Coupon applied: ${r.coupon.code}` : r.msg, r.ok ? 'ok' : 'err');
        }
      });
    }
    return { html, mount };
  };
  /* ---------------- CHECKOUT (protected) ---------------- */
  CV.checkout = () => {
    const u = Auth.currentUser();
    if (!u) { location.hash = '#/login'; return { html: '' }; }
    if (!Cart.items().length) { location.hash = '#/cart'; return { html: '' }; }
    const html = `<section class="section"><div class="wrap">
      <div class="eyebrow">Checkout</div><h2>Complete your order</h2>
      <div class="stepper" style="margin-top:1rem">
        <div class="st done">1 · Address</div><div class="st done">2 · Delivery</div><div class="st done">3 · Payment</div><div class="st active">4 · Review</div>
      </div>
      <div class="two-col"><div id="coMain"></div><div id="coSummary"></div></div>
    </div></section>`;
    const state = { addressId: (u.addresses.find(a => a.isDefault) || u.addresses[0] || {}).id || null, payment: 'Cash on Delivery', notes: '' };
    function renderSummary() {
      const t = Cart.totals();
      U.el('coSummary').innerHTML = `<div class="summary"><h3 style="margin-top:0">Order summary</h3>
        ${Cart.items().map(i => `<div class="sline"><span>${U.esc(i.name)} × ${i.qty}</span><b>${U.taka(i.price * i.qty)}</b></div>`).join('')}
        <hr class="hairline" style="margin:.6rem 0">
        <div class="sline"><span>Subtotal</span><b>${U.taka(t.subtotal)}</b></div>
        ${t.discount ? `<div class="sline" style="color:var(--good)"><span>Discount</span><b>−${U.taka(t.discount)}</b></div>` : ''}
        <div class="sline"><span>Delivery</span><b>${t.delivery ? U.taka(t.delivery) : 'Free'}</b></div>
        <div class="sline total"><span>Total</span><span>${U.taka(t.total)}</span></div>
        <div class="notice" style="margin:.8rem 0">ETA: ${t.eta} · Min order ${U.taka(t.minOrder)}</div>
        <button class="btn btn-primary btn-block" id="placeOrder">Place Order</button></div>`;
    }
    function renderMain() {
      const addrs = Auth.currentUser().addresses;
      U.el('coMain').innerHTML = `
        <div class="card" style="padding:1.4rem;margin-bottom:1rem"><div class="prow"><h3 style="margin:0">Delivery address</h3><button class="btn btn-ghost btn-sm" data-action="add-address">+ New</button></div>
          <div style="margin-top:.8rem;display:grid;gap:.6rem">
            ${addrs.length ? addrs.map(a => `<label class="opt ${state.addressId === a.id ? 'sel' : ''}"><input type="radio" name="addr" value="${a.id}" ${state.addressId === a.id ? 'checked' : ''}>
              <div><b>${U.esc(a.label)}</b> ${a.isDefault ? '<span class="badge badge-good">Default</span>' : ''}<div class="muted">${U.esc(a.line)}, ${U.esc(a.area)} · ${U.esc(a.phone)}</div></div></label>`).join('')
              : '<p class="muted">Add a delivery address to continue.</p>'}
          </div>
        </div>
        <div class="card" style="padding:1.4rem;margin-bottom:1rem"><h3 style="margin-top:0">Payment method</h3>
          <label class="opt ${state.payment === 'Cash on Delivery' ? 'sel' : ''}"><input type="radio" name="pay" value="Cash on Delivery" ${state.payment === 'Cash on Delivery' ? 'checked' : ''}><div><b>💵 Cash on Delivery</b><div class="muted">Pay when your order arrives.</div></div></label>
          <label class="opt ${state.payment === 'Online Payment' ? 'sel' : ''}"><input type="radio" name="pay" value="Online Payment" ${state.payment === 'Online Payment' ? 'checked' : ''}><div><b>💳 Online Payment</b><div class="muted">bKash / Nagad / Card (demo — no real charge).</div></div></label>
        </div>
        <div class="card" style="padding:1.4rem"><h3 style="margin-top:0">Delivery notes (optional)</h3>
          <textarea class="input" id="coNotes" rows="2" placeholder="Landmark, floor, instructions…">${U.esc(state.notes)}</textarea></div>`;
      U.qsa('input[name=addr]').forEach(r => r.addEventListener('change', e => { state.addressId = e.target.value; renderMain(); }));
      U.qsa('input[name=pay]').forEach(r => r.addEventListener('change', e => { state.payment = e.target.value; renderMain(); }));
      const n = U.el('coNotes'); if (n) n.addEventListener('input', e => state.notes = e.target.value);
    }
    function mount() {
      renderMain(); renderSummary();
      CV._coUnsub = U.on('auth:change', renderMain);
      U.el('coSummary').addEventListener('click', e => {
        if (e.target.id !== 'placeOrder') return;
        const u2 = Auth.currentUser();
        const addr = u2.addresses.find(a => a.id === state.addressId);
        if (!addr) return U.toast('Please select a delivery address.', 'err');
        const r = Cart.placeOrder({ address: addr, payment: state.payment, notes: state.notes });
        if (!r.ok) return U.toast(r.msg, 'err');
        U.toast('Order placed! 🎉', 'ok'); location.hash = '#/order/' + r.order.id + '?new=1';
      });
    }
    return { html, mount };
  };
  /* ---------------- ORDER DETAILS / TRACKING (protected) ---------------- */
  CV.order = (params) => {
    const u = Auth.currentUser();
    if (!u) { location.hash = '#/login'; return { html: '' }; }
    const o = DB.find('orders', params.id);
    if (!o || o.customerId !== u.id) return { html: `<section class="section"><div class="wrap empty"><div class="big">🔍</div>Order not found.<br><a class="link" href="#/account/orders">Back to orders →</a></div></section>` };
    const isNew = params.query && params.query.new;
    const flow = ORDER_FLOW;
    const idx = flow.indexOf(o.status);
    const cancelled = o.status === 'Cancelled';
    const track = cancelled
      ? `<div class="notice" style="border-left-color:var(--bad)">This order was cancelled.</div>`
      : `<div class="track">${flow.map((s, i) => `<div class="node ${i < idx ? 'done' : ''} ${i === idx ? 'cur' : ''}"><div class="dot">${i < idx ? '✓' : i + 1}</div>${s}</div>`).join('')}</div>`;
    const canCancel = ['Pending', 'Confirmed'].includes(o.status);
    const html = `<section class="section"><div class="wrap">
      ${isNew ? `<div class="notice" style="border-left-color:var(--good);background:#eef6ee">✓ Thank you! Your order <b>${o.id}</b> has been placed. Estimated delivery ${U.esc(o.eta)}.</div>` : ''}
      <div class="prow" style="margin:1rem 0"><div><div class="eyebrow">Order ${o.id}</div><h2 style="margin:0">Order ${cancelled ? '' : 'tracking'} <span class="pill ${statusClass(o.status)}">${o.status}</span></h2>
        <div class="muted">Placed ${U.datetime(o.createdAt)}</div></div>
        <a class="btn btn-ghost btn-sm" href="#/account/orders">← All orders</a></div>
      <div class="card" style="padding:1.6rem;margin-bottom:1rem">${track}</div>
      <div class="two-col">
        <div class="card" style="padding:1.4rem"><h3 style="margin-top:0">Items</h3>
          ${o.items.map(i => `<div class="sline"><span>${U.esc(i.name)} × ${i.qty}${i.meta && i.meta.extras && i.meta.extras.length ? ` <span class="muted">(+${i.meta.extras.map(U.esc).join(', ')})</span>` : ''}</span><b>${U.taka(i.price * i.qty)}</b></div>`).join('')}
          <hr class="hairline" style="margin:.6rem 0">
          <div class="sline"><span>Subtotal</span><b>${U.taka(o.subtotal)}</b></div>
          ${o.discount ? `<div class="sline" style="color:var(--good)"><span>Discount${o.coupon ? ' (' + U.esc(o.coupon) + ')' : ''}</span><b>−${U.taka(o.discount)}</b></div>` : ''}
          <div class="sline"><span>Delivery</span><b>${o.delivery ? U.taka(o.delivery) : 'Free'}</b></div>
          <div class="sline total"><span>Total</span><span>${U.taka(o.total)}</span></div>
        </div>
        <div>
          <div class="summary" style="position:static">
            <h3 style="margin-top:0">Delivery</h3>
            <p style="margin:0"><b>${U.esc(o.address.label || 'Address')}</b><br><span class="muted">${U.esc(o.address.line)}, ${U.esc(o.address.area)}<br>${U.esc(o.phone)}</span></p>
            <hr class="hairline" style="margin:.9rem 0">
            <div class="sline"><span>Payment</span><b>${U.esc(o.payment)}</b></div>
            <div class="sline"><span>Payment status</span><span class="badge ${o.paymentStatus === 'Paid' ? 'badge-good' : 'badge-warn'}">${o.paymentStatus}</span></div>
            <div class="sline"><span>ETA</span><b>${U.esc(o.eta)}</b></div>
            ${canCancel ? `<button class="btn btn-ghost btn-block" data-action="cancel-order" data-id="${o.id}" style="margin-top:1rem;color:var(--bad);border-color:#e6c4bf">Cancel order</button>` : ''}
          </div>
        </div>
      </div>
    </div></section>`;
    return { html };
  };

  /* ---------------- Address modal (shared) ---------------- */
  CV.addressModal = () => {
    const u = Auth.currentUser(); if (!u) return;
    U.modal({
      title: 'Add delivery address', size: 480,
      body: `<div class="field"><label>Label</label><input class="input" id="adLabel" placeholder="Home / Office" value="Home"></div>
        <div class="field"><label>Address line</label><input class="input" id="adLine" placeholder="House, road, area"></div>
        <div class="field"><label>Area</label><select class="input" id="adArea">${DB.deliveryCfg().areas.map(a => `<option>${U.esc(a)}</option>`).join('')}</select></div>
        <div class="field"><label>Phone</label><input class="input" id="adPhone" value="${U.esc(u.phone)}"></div>
        <label class="switch"><input type="checkbox" id="adDefault" ${u.addresses.length ? '' : 'checked'}> Set as default</label>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="adSave">Save address</button>`,
      onOpen: (root, close) => root.querySelector('#adSave').addEventListener('click', () => {
        const line = root.querySelector('#adLine').value.trim();
        if (!line) return U.toast('Please enter the address.', 'err');
        Auth.addAddress({ label: root.querySelector('#adLabel').value.trim() || 'Home', line, area: root.querySelector('#adArea').value, phone: root.querySelector('#adPhone').value.trim(), isDefault: root.querySelector('#adDefault').checked });
        close(); U.toast('Address saved.', 'ok');
      })
    });
  };
  /*__PAGES__*/
  window.CV = CV;
})();
