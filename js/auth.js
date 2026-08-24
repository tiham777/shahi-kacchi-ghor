/* ============================================================
   auth.js — customer + admin authentication, RBAC, profile
   ============================================================ */
(function () {
  const SESS = 'skg_session';     // customer id
  const ADMIN = 'skg_admin';      // admin flag

  const Auth = {
    /* ---------- Customer ---------- */
    currentUser() {
      const id = U.store.get(SESS, null);
      if (!id) return null;
      const u = DB.find('customers', id);
      if (!u || u.status === 'disabled') { U.store.del(SESS); return null; }
      return u;
    },
    isLoggedIn() { return !!Auth.currentUser(); },

    register({ name, email, phone, password }) {
      email = String(email).trim().toLowerCase();
      if (DB.all('customers').some(c => c.email.toLowerCase() === email))
        return { ok: false, msg: 'An account with this email already exists.' };
      const u = DB.add('customers', {
        id: U.uid('u_'), name: name.trim(), email, phone: phone.trim(), password,
        joined: new Date().toISOString(), status: 'active', favorites: [], addresses: [], preferences: {},
      });
      U.store.set(SESS, u.id);
      U.emit('auth:change');
      return { ok: true, user: u };
    },

    login(email, password) {
      email = String(email).trim().toLowerCase();
      const u = DB.all('customers').find(c => c.email.toLowerCase() === email || c.phone === email);
      if (!u) return { ok: false, msg: 'No account found with those details.' };
      if (u.status === 'disabled') return { ok: false, msg: 'This account has been disabled. Contact support.' };
      if (u.password !== password) return { ok: false, msg: 'Incorrect password.' };
      U.store.set(SESS, u.id);
      U.emit('auth:change');
      return { ok: true, user: u };
    },

    logout() { U.store.del(SESS); U.emit('auth:change'); },

    /* ---------- Profile mutations ---------- */
    updateProfile(patch) {
      const u = Auth.currentUser(); if (!u) return;
      DB.update('customers', u.id, patch); U.emit('auth:change');
    },
    changePassword(current, next) {
      const u = Auth.currentUser(); if (!u) return { ok: false, msg: 'Not logged in.' };
      if (u.password !== current) return { ok: false, msg: 'Current password is incorrect.' };
      DB.update('customers', u.id, { password: next });
      return { ok: true };
    },
    addAddress(addr) {
      const u = Auth.currentUser(); if (!u) return;
      addr.id = U.uid('a_');
      const addresses = u.addresses.slice();
      if (addr.isDefault || addresses.length === 0) { addresses.forEach(a => a.isDefault = false); addr.isDefault = true; }
      addresses.push(addr);
      DB.update('customers', u.id, { addresses }); U.emit('auth:change');
    },
    removeAddress(id) {
      const u = Auth.currentUser(); if (!u) return;
      let addresses = u.addresses.filter(a => a.id !== id);
      if (addresses.length && !addresses.some(a => a.isDefault)) addresses[0].isDefault = true;
      DB.update('customers', u.id, { addresses }); U.emit('auth:change');
    },
    setDefaultAddress(id) {
      const u = Auth.currentUser(); if (!u) return;
      const addresses = u.addresses.map(a => ({ ...a, isDefault: a.id === id }));
      DB.update('customers', u.id, { addresses }); U.emit('auth:change');
    },
    toggleFavorite(productId) {
      const u = Auth.currentUser();
      if (!u) { U.toast('Please log in to save favourites.', 'info'); location.hash = '#/login'; return false; }
      const fav = u.favorites.includes(productId)
        ? u.favorites.filter(f => f !== productId)
        : [...u.favorites, productId];
      DB.update('customers', u.id, { favorites: fav }); U.emit('auth:change');
      return fav.includes(productId);
    },
    isFavorite(productId) { const u = Auth.currentUser(); return !!(u && u.favorites.includes(productId)); },

    /* ---------- Admin (separate system) ---------- */
    isAdmin() { return U.store.get(ADMIN, false) === true; },
    adminLogin(username, password) {
      const cred = DB.adminCreds();
      if (String(username).trim().toLowerCase() === String(cred.username).toLowerCase() && password === cred.password) {
        U.store.set(ADMIN, true); U.emit('auth:change');
        return { ok: true };
      }
      return { ok: false, msg: 'Invalid admin credentials.' };
    },
    adminLogout() { U.store.del(ADMIN); U.emit('auth:change'); },
  };

  window.Auth = Auth;
})();
