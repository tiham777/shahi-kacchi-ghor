/* ============================================================
   seed.js — authoritative initial dataset for the server store.
   Required by server.js to initialise data-store.json when missing
   or when /api/reset is called. Customers & orders start EMPTY —
   they are created live by real registrations and orders.
   ============================================================ */
'use strict';

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
  interior: IMG('1517248135467-4c7edcad34c4'),
  kitchen: IMG('1556910103-1c02745aae4d'),
  plates: IMG('1567337710282-00832b415979'),
  handi: IMG('1596797038530-2c107229654b'),
  platter: IMG('1596797038530-2c107229654b'),
};

function seed() {
  const now = Date.now();
  const daysAgo = (d) => new Date(now - d * 86400000).toISOString();

  const categories = [
    { id: 'c_biriyani', name: 'Biriyani', order: 1, enabled: true },
    { id: 'c_sides', name: 'Sides', order: 2, enabled: true },
    { id: 'c_drinks', name: 'Drinks', order: 3, enabled: true },
  ];

  const products = [
    { id: 'p_kacchi', name: 'Kacchi Biriyani', categoryId: 'c_biriyani', price: 320, image: PH.kacchi, rating: 4.9, ratingCount: 214, available: true, featured: true,
      desc: 'Our signature — marinated mutton and aromatic basmati slow-cooked on dum with potato and a boiled egg.' },
    { id: 'p_mutton', name: 'Mutton Biriyani', categoryId: 'c_biriyani', price: 300, image: PH.mutton, rating: 4.8, ratingCount: 156, available: true, featured: true,
      desc: 'Tender mutton layered with fragrant rice, saffron, and traditional Chattogram spices.' },
    { id: 'p_beef', name: 'Beef Biriyani', categoryId: 'c_biriyani', price: 260, image: PH.beef, rating: 4.7, ratingCount: 132, available: true, featured: false,
      desc: 'Rich, spiced beef cooked till it falls apart, over perfectly seasoned rice.' },
    { id: 'p_jali', name: 'Jali Kabab', categoryId: 'c_sides', price: 90, image: PH.kabab, rating: 4.6, ratingCount: 88, available: true, featured: false,
      desc: 'Char-grilled minced beef kabab with a delicate lattice crust and smoky aroma.' },
    { id: 'p_roast', name: 'Chicken Roast', categoryId: 'c_sides', price: 150, image: PH.roast, rating: 4.7, ratingCount: 74, available: true, featured: true,
      desc: 'Bengali-style roast chicken simmered in a fragrant, mildly sweet gravy.' },
    { id: 'p_egg', name: 'Egg', categoryId: 'c_sides', price: 30, image: PH.egg, rating: 4.4, ratingCount: 40, available: true, featured: false,
      desc: 'Perfectly boiled egg — the classic biriyani companion.' },
    { id: 'p_potato', name: 'Extra Potato', categoryId: 'c_sides', price: 40, image: PH.potato, rating: 4.5, ratingCount: 36, available: true, featured: false,
      desc: 'An extra portion of spiced, saffron-kissed biriyani potato.' },
    { id: 'p_salad', name: 'Salad', categoryId: 'c_sides', price: 40, image: PH.salad, rating: 4.3, ratingCount: 29, available: true, featured: false,
      desc: 'Fresh cucumber, onion, carrot and green chili with a squeeze of lemon.' },
    { id: 'p_borhani', name: 'Borhani', categoryId: 'c_drinks', price: 60, image: PH.borhani, rating: 4.8, ratingCount: 121, available: true, featured: true,
      desc: 'Traditional spiced yogurt drink — the perfect balance to rich biriyani.' },
    { id: 'p_sweetlacchi', name: 'Sweet Lacchi', categoryId: 'c_drinks', price: 90, image: PH.lacchi, rating: 4.7, ratingCount: 66, available: true, featured: false,
      desc: 'Thick, creamy sweet yogurt lassi, chilled and refreshing.' },
    { id: 'p_saltlacchi', name: 'Salted Lacchi', categoryId: 'c_drinks', price: 90, image: PH.lacchi, rating: 4.5, ratingCount: 41, available: true, featured: false,
      desc: 'Cooling salted lassi with a hint of roasted cumin.' },
    { id: 'p_badam', name: 'Badamer Shorbot', categoryId: 'c_drinks', price: 80, image: PH.shorbot, rating: 4.6, ratingCount: 52, available: true, featured: false,
      desc: 'Chilled almond sherbet, lightly sweet and nutty.' },
    { id: 'p_mango', name: 'Organic Mango Juice', categoryId: 'c_drinks', price: 120, image: PH.mango, rating: 4.8, ratingCount: 70, available: true, featured: false,
      desc: 'Fresh seasonal mango, blended pure with no added sugar.' },
    { id: 'p_orange', name: 'Orange Juice', categoryId: 'c_drinks', price: 110, image: PH.orange, rating: 4.4, ratingCount: 33, available: true, featured: false,
      desc: 'Freshly squeezed oranges, bright and zesty.' },
    { id: 'p_mixed', name: 'Mixed Fruit Juice', categoryId: 'c_drinks', price: 130, image: PH.fruit, rating: 4.6, ratingCount: 45, available: true, featured: false,
      desc: 'A blend of seasonal fruits for a refreshing lift.' },
    { id: 'p_lemon', name: 'Lemon Mint', categoryId: 'c_drinks', price: 70, image: PH.lemon, rating: 4.7, ratingCount: 58, available: false, featured: false,
      desc: 'Cooling lemon and fresh mint cooler — a summer favourite.' },
  ];

  const platters = [
    { id: 'pl_single', name: 'Single Platter', serves: '1 person', price: 380, enabled: true, image: PH.plates,
      desc: 'A complete meal for one.', items: ['Kacchi Biriyani', 'Jali Kabab', 'Borhani'] },
    { id: 'pl_couple', name: 'Couple Platter', serves: '2 people', price: 720, enabled: true, image: PH.plates,
      desc: 'Made to share between two.', items: ['2× Kacchi Biriyani', 'Chicken Roast', '2× Borhani', 'Salad'] },
    { id: 'pl_friends', name: 'Friends Feast', serves: '4–8 people', price: 1450, enabled: true, image: PH.platter,
      desc: 'A generous spread for the whole group. Choose 4, 6, 8 or a custom size.', items: ['4× Kacchi Biriyani', '4× Jali Kabab', 'Chicken Roast', '4× Borhani', 'Salad'] },
  ];

  const reviews = [
    { id: 'r1', name: 'Tanvir Hasan', rating: 5, text: "The best Kacchi Biriyani I've tasted in years.", status: 'approved', featured: true, date: daysAgo(4) },
    { id: 'r2', name: 'Nusrat Jahan', rating: 5, text: 'Authentic flavor, generous portions, and excellent service.', status: 'approved', featured: true, date: daysAgo(9) },
    { id: 'r3', name: 'Rakib Chowdhury', rating: 5, text: 'Perfect Dum Biriyani. Absolutely loved it.', status: 'approved', featured: true, date: daysAgo(12) },
    { id: 'r4', name: 'Sadia Afrin', rating: 4, text: 'Lovely borhani and the mutton was so tender. Will order again.', status: 'approved', featured: false, date: daysAgo(2) },
  ];

  const gallery = [
    { id: 'g1', url: PH.handi, caption: 'Biriyani Handi', category: 'Food', featured: true },
    { id: 'g2', url: PH.kacchi, caption: 'Kacchi Biriyani', category: 'Food', featured: true },
    { id: 'g3', url: PH.kabab, caption: 'Jali Kabab', category: 'Food', featured: false },
    { id: 'g4', url: PH.borhani, caption: 'Borhani', category: 'Drinks', featured: false },
    { id: 'g5', url: PH.lacchi, caption: 'Lacchi', category: 'Drinks', featured: false },
    { id: 'g6', url: PH.shorbot, caption: 'Badamer Shorbot', category: 'Drinks', featured: false },
    { id: 'g7', url: PH.mango, caption: 'Fresh Juice', category: 'Drinks', featured: false },
    { id: 'g8', url: PH.interior, caption: 'Restaurant Interior', category: 'Place', featured: true },
    { id: 'g9', url: PH.kitchen, caption: 'Our Kitchen', category: 'Place', featured: false },
    { id: 'g10', url: PH.plates, caption: 'Traditional Serving Plates', category: 'Place', featured: false },
    { id: 'g11', url: PH.platter, caption: 'Platters', category: 'Food', featured: false },
  ];

  const offers = [
    { id: 'o1', title: 'Friday Family Offer', desc: '10% off on Friends Feast every Friday.', tag: 'Friday', active: true },
    { id: 'o2', title: 'Weekend Kacchi Special', desc: 'Free Borhani with every Kacchi Biriyani platter.', tag: 'Weekend', active: true },
    { id: 'o3', title: 'Eid Mubarak Feast', desc: 'Special festive platters available during Eid.', tag: 'Eid', active: false },
  ];

  const coupons = [
    { id: 'cp1', code: 'WELCOME10', type: 'percent', value: 10, minOrder: 300, expires: daysAgo(-60), usageLimit: 500, used: 0, active: true },
    { id: 'cp2', code: 'FLAT50', type: 'fixed', value: 50, minOrder: 500, expires: daysAgo(-30), usageLimit: 200, used: 0, active: true },
    { id: 'cp3', code: 'EID2026', type: 'percent', value: 15, minOrder: 800, expires: daysAgo(-90), usageLimit: 100, used: 0, active: true },
  ];

  const delivery = { fee: 60, freeThreshold: 1000, minOrder: 200, etaMin: 35, etaMax: 50, available: true,
    areas: ['GEC Circle', 'Agrabad', 'Nasirabad', 'Khulshi', 'Chawkbazar', 'Halishahar', 'Panchlaish'] };

  const settings = {
    name: 'Shahi Kacchi Ghor', phone: '+880 1810-000000', email: 'hello@shahikacchighor.com',
    address: 'Station Road, Kotwali, Chattogram, Bangladesh', hours: 'Open 24/7',
    description: 'Traditional Bangladeshi biriyani, slow-cooked with aromatic rice, rich spices, and authentic recipes.',
    logo: '', minOrderNote: true,
    social: { facebook: 'https://facebook.com', instagram: 'https://instagram.com', whatsapp: 'https://wa.me/8801810000000', maps: 'https://maps.google.com/?q=Chattogram' },
    notifyOnNewOrder: true, autoConfirm: false,
  };

  return {
    categories, products, platters, reviews, gallery, offers, coupons, delivery, settings,
    customers: [], orders: [],
    admin: { username: 'admin777xyz@gmail.com', password: 'Password8989$' },
    meta: { seededAt: new Date().toISOString() },
  };
}

module.exports = { seed };
