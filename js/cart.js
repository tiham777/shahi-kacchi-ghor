/* ============================================================
   cart.js — cart state, coupon, totals, order placement
   ============================================================ */
(function () {
  const CART = 'skg_cart';
  const COUP = 'skg_coupon';

  function read() { return U.store.get(CART, []); }
  function write(items) { U.store.set(CART, items); U.emit('cart:change'); }

  const Cart = {
    items() { return read(); },
    count() { return read().reduce((s, i) => s + i.qty, 0); },

    add(item) {
      const items = read();
      const key = item.key || (item.kind + ':' + item.id);
      const existing = items.find(i => i.key === key && !item.meta);
      if (existing) existing.qty += (item.qty || 1);
      else items.push({ key, kind: item.kind || 'product', id: item.id, name: item.name, price: item.price, image: item.image, qty: item.qty || 1, meta: item.meta || null });
      write(items);
      U.toast(`${item.name} added to cart`, 'ok', 1600);
    },
    setQty(key, qty) {
      let items = read();
      const it = items.find(i => i.key === key);
      if (!it) return;
      it.qty = Math.max(1, qty);
      write(items);
    },
    inc(key) { const it = read().find(i => i.key === key); if (it) Cart.setQty(key, it.qty + 1); },
    dec(key) { const it = read().find(i => i.key === key); if (it) { if (it.qty <= 1) Cart.remove(key); else Cart.setQty(key, it.qty - 1); } },
    remove(key) { write(read().filter(i => i.key !== key)); },
    clear() { write([]); U.store.del(COUP); },

    subtotal() { return read().reduce((s, i) => s + i.price * i.qty, 0); },

    /* coupon */
    coupon() { return U.store.get(COUP, null); },
    applyCoupon(code) {
      const sub = Cart.subtotal();
      const res = DB.activeCoupon(code);
      if (!res.ok) return res;
      if (sub < res.coupon.minOrder) return { ok: false, msg: `Minimum order of ${U.taka(res.coupon.minOrder)} required for this coupon.` };
      U.store.set(COUP, res.coupon.code);
      U.emit('cart:change');
      return { ok: true, coupon: res.coupon };
    },
    clearCoupon() { U.store.del(COUP); U.emit('cart:change'); },

    totals() {
      const cfg = DB.deliveryCfg();
      const subtotal = Cart.subtotal();
      let discount = 0, couponObj = null;
      const code = Cart.coupon();
      if (code) {
        const res = DB.activeCoupon(code);
        if (res.ok && subtotal >= res.coupon.minOrder) {
          couponObj = res.coupon;
          discount = res.coupon.type === 'percent' ? Math.round(subtotal * res.coupon.value / 100) : res.coupon.value;
        } else { U.store.del(COUP); }
      }
      const afterDisc = Math.max(0, subtotal - discount);
      const freeDelivery = afterDisc >= cfg.freeThreshold || subtotal === 0;
      const delivery = freeDelivery ? 0 : cfg.fee;
      const total = afterDisc + delivery;
      return { subtotal, discount, delivery, total, freeDelivery, coupon: couponObj, eta: `${cfg.etaMin}–${cfg.etaMax} min`, minOrder: cfg.minOrder };
    },

    /* ---------- Place order ---------- */
    placeOrder({ address, payment, notes }) {
      const user = Auth.currentUser();
      if (!user) return { ok: false, msg: 'Please log in to place an order.' };
      const items = read();
      if (!items.length) return { ok: false, msg: 'Your cart is empty.' };
      const t = Cart.totals();
      if (t.subtotal < t.minOrder) return { ok: false, msg: `Minimum order is ${U.taka(t.minOrder)}.` };

      const order = {
        id: U.orderId(),
        customerId: user.id, customerName: user.name, phone: address.phone || user.phone,
        items: items.map(i => ({ productId: i.id, name: i.name, price: i.price, qty: i.qty, meta: i.meta || null })),
        address, payment,
        paymentStatus: payment === 'Online Payment' ? 'Paid' : 'Pending',
        notes: notes || '',
        subtotal: t.subtotal, delivery: t.delivery, discount: t.discount, total: t.total,
        coupon: t.coupon ? t.coupon.code : null,
        status: 'Pending', eta: t.eta,
        statusHistory: [{ status: 'Pending', at: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
      };
      DB.add('orders', order);
      if (t.coupon) DB.update('coupons', t.coupon.id, { used: t.coupon.used + 1 });
      Cart.clear();
      return { ok: true, order };
    },
  };

  window.Cart = Cart;

  /* Order status flow shared across app */
  window.ORDER_FLOW = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];
  window.statusClass = (s) => ({
    'Pending': 's-pending', 'Confirmed': 's-confirmed', 'Preparing': 's-preparing',
    'Ready': 's-ready', 'Out for Delivery': 's-out', 'Delivered': 's-delivered', 'Cancelled': 's-cancelled',
  }[s] || 's-pending');
})();
