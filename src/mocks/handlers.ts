import { http, HttpResponse, delay } from 'msw';
import { getDB, saveDB } from './db';
import type { Order } from '../api/types';

// Helper to get user from cookie
const getUser = (request: Request) => {
  const cookie = request.headers.get('Cookie');
  const match = cookie?.match(/session=([^;]+)/);
  const sessionId = match?.[1] ?? request.headers.get('X-Session-Id');
  if (!sessionId) return null;
  const db = getDB();
  return db.users.find(u => u.id === sessionId) || null;
};

// Calculate cart totals
const calculateTotals = (items: { nftId: string, quantity: number }[], coupon?: string) => {
  const db = getDB();
  let subtotal = 0;
  items.forEach(item => {
    const nft = db.nfts.find(n => n.id === item.nftId);
    if (nft) subtotal += parseFloat(nft.price) * item.quantity;
  });
  
  let discount = 0;
  if (coupon === '10OFF') discount = subtotal * 0.1;
  
  const fee = subtotal * 0.05;
  const total = subtotal - discount + fee;
  
  return {
    subtotal: subtotal.toFixed(4),
    discount: discount.toFixed(4),
    fee: fee.toFixed(4),
    total: total.toFixed(4),
    coupon: discount > 0 ? coupon : undefined
  };
};

export const handlers = [
  // --- NETWORK SIMULATOR ---
  http.all('/api/*', async ({ request }) => {
    const simError = request.headers.get('x-simulate-error');
    const simLatency = request.headers.get('x-simulate-latency');
    const simOffline = request.headers.get('x-simulate-offline');

    if (simOffline === 'true') {
      return HttpResponse.error(); // Simulates network error
    }

    if (simLatency) {
      await delay(Number(simLatency));
    }

    if (simError) {
      const status = parseInt(simError, 10) || 500;
      return HttpResponse.json({ message: 'Simulated Error' }, { status });
    }
    
    // Pass through to actual handlers
    return;
  }),

  // --- AUTH ---
  http.get('/api/session', async ({ request }) => {
    await delay(300);
    const user = getUser(request);
    if (user) return HttpResponse.json({ user });
    return HttpResponse.json(null, { status: 401 });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    await delay(800);
    const { email, password } = await request.json() as any;
    const db = getDB();
    const user = db.users.find(u => u.email === email);
    if (user && db.passwords[user.id] === password) {
      return HttpResponse.json({ user }, {
        headers: { 'Set-Cookie': `session=${user.id}; HttpOnly; Path=/; Max-Age=86400` }
      });
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    await delay(800);
    const { name, email, password } = await request.json() as any;
    const db = getDB();
    if (db.users.find(u => u.email === email)) {
      return HttpResponse.json({ message: 'Email already exists' }, { status: 409 });
    }
    const newUser = { id: `u${Date.now()}`, name, email, avatar: `https://i.pravatar.cc/150?u=${Date.now()}` };
    db.users.push(newUser);
    db.passwords[newUser.id] = password;
    saveDB(db);
    return HttpResponse.json({ user: newUser }, {
      headers: { 'Set-Cookie': `session=${newUser.id}; HttpOnly; Path=/; Max-Age=86400` }
    });
  }),

  http.post('/api/auth/logout', async () => {
    await delay(300);
    return HttpResponse.json({ success: true }, {
      headers: { 'Set-Cookie': `session=; HttpOnly; Path=/; Max-Age=0` }
    });
  }),

  // --- NFTs ---
  http.get('/api/nfts', async ({ request }) => {
    await delay(500);
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const category = url.searchParams.get('category');
    const network = url.searchParams.get('network');
    const minPrice = Number(url.searchParams.get('minPrice') ?? '0.02');
    const maxPrice = Number(url.searchParams.get('maxPrice') ?? '12.3');
    const page = parseInt(url.searchParams.get('page') || '1');
    const sort = url.searchParams.get('sort') || 'newest';
    
    const db = getDB();
    let nfts = [...db.nfts];
    
    if (search) nfts = nfts.filter(n => n.title.toLowerCase().includes(search) || n.description.toLowerCase().includes(search));
    if (category) nfts = nfts.filter(n => n.category === category);
    if (network) nfts = nfts.filter(n => n.network === network);
    nfts = nfts.filter(n => Number(n.price) >= minPrice && Number(n.price) <= maxPrice);
    
    if (sort === 'price_asc') nfts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (sort === 'price_desc') nfts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    
    const limit = 12;
    const start = (page - 1) * limit;
    const paginated = nfts.slice(start, start + limit);
    
    const categoryCounts = db.nfts.reduce((acc, nft) => {
      acc[nft.category] = (acc[nft.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const networkCounts = db.nfts.reduce((acc, nft) => {
      acc[nft.network] = (acc[nft.network] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return HttpResponse.json({
      data: paginated,
      meta: { 
        total: nfts.length, 
        page, 
        limit, 
        totalPages: Math.ceil(nfts.length / limit),
        categoryCounts,
        networkCounts
      }
    });
  }),

  http.get('/api/nfts/:id', async ({ params }) => {
    await delay(300);
    const db = getDB();
    const nft = db.nfts.find(n => n.id === params.id);
    if (!nft) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json(nft);
  }),

  // --- CART & QUOTE ---
  http.get('/api/cart', async ({ request }) => {
    await delay(300);
    const user = getUser(request);
    const sid = user ? user.id : 'anonymous';
    const db = getDB();
    const storedCart = db.carts[sid] || { items: [], subtotal: '0.0000', discount: '0.0000', fee: '0.0000', total: '0.0000' };
    const cart = { ...storedCart, ...calculateTotals(storedCart.items, storedCart.coupon) };
    db.carts[sid] = cart;
    saveDB(db);
    return HttpResponse.json(cart);
  }),

  http.post('/api/cart', async ({ request }) => {
    await delay(400);
    const user = getUser(request);
    const sid = user ? user.id : 'anonymous';
    const { nftId, quantity } = await request.json() as any;
    
    const db = getDB();
    const nft = db.nfts.find((item) => item.id === nftId);
    if (!nft) return HttpResponse.json({ message: 'NFT not found' }, { status: 404 });
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > nft.available) {
      return HttpResponse.json({ message: 'Invalid quantity or insufficient availability' }, { status: 409 });
    }
    const cart = db.carts[sid] || { items: [] };
    const itemIdx = cart.items.findIndex((i: any) => i.nftId === nftId);
    
    if (quantity === 0) {
      if (itemIdx >= 0) cart.items.splice(itemIdx, 1);
    } else {
      if (itemIdx >= 0) cart.items[itemIdx].quantity = quantity;
      else cart.items.push({ nftId, quantity });
    }
    
    const totals = calculateTotals(cart.items, cart.coupon);
    db.carts[sid] = { ...cart, ...totals };
    saveDB(db);
    return HttpResponse.json(db.carts[sid]);
  }),

  http.post('/api/quote', async ({ request }) => {
    await delay(500);
    const user = getUser(request);
    const sid = user ? user.id : 'anonymous';
    const { coupon } = await request.json() as any;
    const db = getDB();
    const cart = db.carts[sid];
    if (!cart) return HttpResponse.json({ message: 'Cart empty' }, { status: 400 });
    
    if (coupon && coupon !== '10OFF') {
      return HttpResponse.json({ message: 'Invalid coupon' }, { status: 400 });
    }
    
    const totals = calculateTotals(cart.items, coupon);
    db.carts[sid] = { ...cart, ...totals };
    saveDB(db);
    return HttpResponse.json(db.carts[sid]);
  }),

  // --- ORDERS ---
  http.post('/api/orders', async ({ request }) => {
    await delay(1000);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const { idempotencyKey, walletAddress, network, walletType, paymentMethod, collectorDetails, expectedCart } = await request.json() as any;
    const db = getDB();
    
    // Check idempotency
    const existing = db.orders.find(o => o.idempotencyKey === idempotencyKey);
    if (existing) {
      // Simulate timeout recovery - if same user, return it
      if (existing.userId !== user.id) return HttpResponse.json({ message: 'Conflict' }, { status: 409 });
      return HttpResponse.json(existing);
    }
    
    const cart = db.carts[user.id];
    if (!cart || cart.items.length === 0) return HttpResponse.json({ message: 'Cart empty' }, { status: 400 });

    const totals = calculateTotals(cart.items, cart.coupon);
    const currentItems = cart.items.map(({ nftId, quantity }: { nftId: string; quantity: number }) => ({ nftId, quantity })).sort((a, b) => a.nftId.localeCompare(b.nftId));
    const expectedItems = expectedCart?.items?.map(({ nftId, quantity }: { nftId: string; quantity: number }) => ({ nftId, quantity })).sort((a: { nftId: string }, b: { nftId: string }) => a.nftId.localeCompare(b.nftId));
    const itemsChanged = expectedItems && JSON.stringify(currentItems) !== JSON.stringify(expectedItems);
    const quoteChanged = expectedCart && ['subtotal', 'discount', 'fee', 'total'].some((key) => Number(expectedCart[key]) !== Number(totals[key as keyof typeof totals]));
    if (itemsChanged || quoteChanged) {
      db.carts[user.id] = { ...cart, ...totals };
      saveDB(db);
      return HttpResponse.json({ message: 'Os itens ou preços do carrinho mudaram. Revise os valores antes de pagar.', cart: db.carts[user.id] }, { status: 409 });
    }
    
    // Validate availability
    for (const item of cart.items) {
      const nft = db.nfts.find(n => n.id === item.nftId);
      if (!nft || nft.available < item.quantity) {
        return HttpResponse.json({ message: 'Items not available or price changed' }, { status: 409 });
      }
    }
    
    // Create order
    const orderCart = { ...cart, ...totals };
    const order: Order = {
      id: `ord-${Date.now()}`,
      idempotencyKey,
      userId: user.id,
      items: orderCart.items.map((item: { nftId: string; quantity: number }) => {
        const nft = db.nfts.find((entry) => entry.id === item.nftId)!;
        return {
          nftId: item.nftId,
          title: nft.title,
          image: nft.image,
          quantity: item.quantity,
          price: nft.price,
          lineTotal: (Number(nft.price) * item.quantity).toFixed(4),
        };
      }),
      total: totals.total,
      subtotal: totals.subtotal,
      fee: totals.fee,
      discount: totals.discount,
      status: 'pending', // Initially pending
      createdAt: new Date().toISOString(),
      transactionHash: `0x${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`,
      walletAddress,
      network,
      walletType,
      paymentMethod,
      collectorDetails,
    };
    
    // Deduct inventory
    cart.items.forEach((item: any) => {
      const nft = db.nfts.find(n => n.id === item.nftId)!;
      nft.available -= item.quantity;
    });
    
    db.orders.push(order);
    db.carts[user.id] = { items: [], subtotal: '0.00', discount: '0.00', fee: '0.00', total: '0.00' };
    saveDB(db);
    
    // Simulate async processing
    setTimeout(async () => {
      const currentDb = getDB();
      const currentOrder = currentDb.orders.find(o => o.id === order.id);
      if (currentOrder) {
        currentOrder.status = 'confirmed';
        saveDB(currentDb);
        
        // Trigger local window event for the socket bridge
        window.dispatchEvent(new CustomEvent('mock-socket:order.updated', { detail: { orderId: order.id, status: 'confirmed' } }));
      }
    }, 2000);
    
    return HttpResponse.json(order);
  }),
  
  http.get('/api/orders/:id', async ({ params, request }) => {
    await delay(400);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const db = getDB();
    const order = db.orders.find(o => o.id === params.id && o.userId === user.id);
    if (!order) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json(order);
  }),

  // --- FAVORITES ---
  http.get('/api/favorites', async ({ request }) => {
    await delay(300);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const db = getDB();
    const favs = db.favorites[user.id] || [];
    return HttpResponse.json(favs);
  }),

  http.post('/api/favorites', async ({ request }) => {
    await delay(400);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { nftId } = await request.json() as any;
    const db = getDB();
    if (!db.favorites[user.id]) db.favorites[user.id] = [];
    if (!db.favorites[user.id].includes(nftId)) {
      db.favorites[user.id].push(nftId);
      saveDB(db);
    }
    return HttpResponse.json({ success: true, favorites: db.favorites[user.id] });
  }),

  http.delete('/api/favorites/:id', async ({ params, request }) => {
    await delay(400);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const db = getDB();
    if (db.favorites[user.id]) {
      db.favorites[user.id] = db.favorites[user.id].filter((id) => id !== params.id);
      saveDB(db);
    }
    return HttpResponse.json({ success: true, favorites: db.favorites[user.id] });
  }),

  // --- PROFILE & PASSWORD ---
  http.get('/api/profile', async ({ request }) => {
    await delay(300);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    return HttpResponse.json(user);
  }),

  http.patch('/api/profile', async ({ request }) => {
    await delay(600);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const updates = await request.json() as any;
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id === user.id);
    if (userIndex === -1) return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    db.users[userIndex] = { ...db.users[userIndex], ...updates };
    saveDB(db);
    return HttpResponse.json(db.users[userIndex]);
  }),

  http.patch('/api/profile/password', async ({ request }) => {
    await delay(800);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { currentPassword, newPassword } = await request.json() as any;
    const db = getDB();
    if (db.passwords[user.id] !== currentPassword) {
      return HttpResponse.json({ message: 'Senha atual incorreta' }, { status: 400 });
    }
    db.passwords[user.id] = newPassword;
    saveDB(db);
    return HttpResponse.json({ success: true });
  }),

  // --- WALLETS ---
  http.get('/api/wallets', async ({ request }) => {
    await delay(300);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const db = getDB();
    const userWallets = db.wallets[user.id] || [];
    return HttpResponse.json(userWallets);
  }),

  http.post('/api/wallets', async ({ request }) => {
    await delay(500);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const walletData = await request.json() as any;
    const db = getDB();
    if (!db.wallets[user.id]) db.wallets[user.id] = [];
    
    // If setting as primary, unset others
    if (walletData.isPrimary) {
      db.wallets[user.id].forEach(w => w.isPrimary = false);
    } else if (db.wallets[user.id].length === 0) {
      // First wallet is always primary
      walletData.isPrimary = true;
    }
    
    const newWallet = { ...walletData, id: `w-${Date.now()}` };
    db.wallets[user.id].push(newWallet);
    saveDB(db);
    return HttpResponse.json(newWallet);
  }),

  http.put('/api/wallets/:id', async ({ params, request }) => {
    await delay(500);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const updates = await request.json() as any;
    const db = getDB();
    if (!db.wallets[user.id]) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    
    const walletIdx = db.wallets[user.id].findIndex(w => w.id === params.id);
    if (walletIdx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    
    if (updates.isPrimary) {
      db.wallets[user.id].forEach(w => w.isPrimary = false);
    }
    
    db.wallets[user.id][walletIdx] = { ...db.wallets[user.id][walletIdx], ...updates };
    saveDB(db);
    return HttpResponse.json(db.wallets[user.id][walletIdx]);
  })
];
