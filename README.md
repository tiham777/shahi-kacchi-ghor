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

## Deployment

### Vercel (Recommended)

```bash
# Import the GitHub repo into Vercel
# Or deploy via CLI:
vercel

# Set environment variables in Vercel dashboard:
# - No required env vars — the app seeds with default data on first load
```

On Vercel, the server runs as a serverless function. Data is stored in memory (seeded from `seed.js` on first request). For persistent data, configure a database.

### Local Development

```bash
node server.js
# Visit http://localhost:4173
```

Default admin credentials: `admin757xyz@gmail.com` / `Password8989$`

## Project Structure

```
├── index.html          # Entry point
├── server.js           # Node.js server (static files + API)
├── seed.js             # Initial dataset (menu, platters, settings)
├── package.json        # Node.js project config
├── vercel.json         # Vercel deployment config
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
