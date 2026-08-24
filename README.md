# Shahi Kacchi Ghor 🍛

Authentic Bangladeshi biriyani restaurant website with a full customer ordering system and admin panel.

## Features

- **Customer site**: Menu browsing, cart, checkout, order tracking
- **Admin panel**: Order management, product/category management, analytics dashboard
- **Real-time updates**: Admin panel auto-refreshes when orders are placed
- **Responsive design**: Works on desktop and mobile
- **Chattogram-themed**: Traditional South Asian food culture styling

## Tech Stack

- **Frontend**: Vanilla JS with hash-based routing, localStorage for cart
- **Backend**: Node.js HTTP server with REST API
- **Data**: JSON file store (seeds automatically on first run)
- **Deployment**: Vercel (serverless functions for API, static files via CDN)

## Deployment

### Vercel (Recommended)

The website is deployed on Vercel with auto-deploy from GitHub:

- **Production URL**: https://shahi-kacchi-ghor.vercel.app
- **GitHub Repo**: https://github.com/tiham777/shahi-kacchi-ghor

Every push to the `master` branch triggers an automatic deployment on Vercel.

#### How it works on Vercel

- **Static files** (`index.html`, `css/`, `js/`) are served directly from Vercel's CDN
- **API** (`/api/state`, `/api/coll/*`, `/api/singleton/*`) runs as a serverless function in `api/index.js`
- **Data** is seeded in-memory from `seed.js` on first request (Vercel's serverless filesystem is read-only)
- The Vercel project framework is set to "Other" to enable static + API separation

### Local Development

```bash
node dev-server.js
# Visit http://localhost:4173
```

Default admin credentials: `admin757xyz@gmail.com` / `Password8989$`

## Project Structure

```
├── index.html          # Entry point
├── api/
│   └── index.js        # Vercel serverless function (API only)
├── dev-server.js       # Local dev server (static files + API + disk persistence)
├── seed.js             # Initial dataset (menu, platters, settings)
├── package.json        # Node.js project config (local dev only)
├── vercel.json         # Vercel deployment config (routes + functions)
├── .vercelignore       # Files excluded from Vercel build
├── .gitignore
├── css/
│   ├── styles.css      # Customer-facing styles
│   └── admin.css       # Admin theme styles
└── js/
    ├── app.js          # Bootstrap & global event delegation
    ├── router.js       # Hash-based router
    ├── data.js         # Server-backed reactive DB
    ├── auth.js         # Auth (customer + admin)
    ├── cart.js         # Cart & checkout
    ├── utils.js        # Helpers (DOM, toast, modal, store)
    ├── views-customer.js  # Customer page views
    └── views-admin.js     # Admin dashboard views
```
