// ═══════════════════════════════════════════════════════════════
// PUNTO MORFI — BACKEND REAL (Fase 2 del plan de ejecución)
// Express (dependencia que ya traía el repo AI Studio) + Postgres
// (paperclip-db, schema pmorfi) + SSE para tiempo real entre
// dispositivos + aviso Telegram al dueño en cada pedido nuevo.
// Sirve además el frontend buildado (dist/) — un solo proceso.
// ═══════════════════════════════════════════════════════════════
import 'dotenv/config';
import express from 'express';
import pg from 'pg';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
// Verificación Google Identity (One Tap). Se importa dinámico para que el
// servidor arranque igual si la librería no está instalada todavía.
let OAuth2Client = null;
try { ({ OAuth2Client } = await import('google-auth-library')); } catch { /* sin google-auth-library: /auth/google devuelve 501 */ }

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8950;

const pool = new pg.Pool({
  host: process.env.PMORFI_PG_HOST || 'localhost',
  port: +(process.env.PMORFI_PG_PORT || 5432),
  user: process.env.PMORFI_PG_USER || 'pmorfi_app',
  database: process.env.PMORFI_PG_DB || 'business',
  password: process.env.PMORFI_PG_PASS,
  max: 5,
});

const app = express();
app.use(express.json({ limit: '2mb' }));
// Rutas API en un router: montado en /api Y /pmorfi/api (subdominio + subpath)
const api = express.Router();
api.use(express.json({ limit: '2mb' }));

// ── SSE: clientes conectados en tiempo real ────────────────────
const sseClients = new Set();

function broadcast(type, payload, origin) {
  const data = `data: ${JSON.stringify({ type, payload, origin })}\n\n`;
  for (const res of sseClients) {
    try { res.write(data); } catch { sseClients.delete(res); }
  }
}

api.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // nginx: sin buffering para SSE
  });
  res.write('data: {"type":"hello"}\n\n');
  sseClients.add(res);
  const hb = setInterval(() => { try { res.write(': hb\n\n'); } catch {} }, 30000);
  req.on('close', () => { clearInterval(hb); sseClients.delete(res); });
});

// ── API ────────────────────────────────────────────────────────
api.get('/bootstrap', async (_req, res) => {
  try {
    const [menu, orders, aliases] = await Promise.all([
      pool.query('SELECT data FROM pmorfi.menu_items'),
      pool.query('SELECT data FROM pmorfi.orders ORDER BY created_at DESC'),
      pool.query('SELECT data FROM pmorfi.aliases'),
    ]);
    res.json({
      menu: menu.rows.map((r) => r.data),
      orders: orders.rows.map((r) => r.data),
      aliases: aliases.rows.map((r) => r.data),
    });
  } catch (e) {
    console.error('bootstrap', e.message);
    res.status(500).json({ error: e.message });
  }
});

async function replaceTable(table, rows) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM pmorfi.${table}`);
    for (const r of rows || []) {
      await client.query(
        `INSERT INTO pmorfi.${table} (id, data) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
        [r.id, JSON.stringify(r)]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

api.put('/menu', async (req, res) => {
  try {
    await replaceTable('menu_items', req.body.items);
    broadcast('menu_updated', req.body.items, req.body.clientId);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.put('/aliases', async (req, res) => {
  try {
    await replaceTable('aliases', req.body.aliases);
    broadcast('alias_updated', req.body.aliases, req.body.clientId);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.post('/orders', async (req, res) => {
  const o = req.body.order;
  if (!o || !o.id) return res.status(400).json({ error: 'orden inválida' });
  try {
    // Vincular a cuenta de cliente si hay sesión (historial + re-pedido)
    const customer = await authCustomer(req).catch(() => null);
    const customerId = o.customerId || customer?.id || null;
    await pool.query(
      `INSERT INTO pmorfi.orders (id, order_number, status, customer_id, data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, status = EXCLUDED.status,
         customer_id = COALESCE(EXCLUDED.customer_id, pmorfi.orders.customer_id), updated_at = now()`,
      [o.id, o.orderNumber, o.status, customerId, JSON.stringify({ ...o, customerId })]);
    broadcast('order_created', o, req.body.clientId);
    notifyTelegram(o); // no bloquea la respuesta
    res.json({ ok: true, order: o });
  } catch (e) {
    console.error('create order', e.message);
    res.status(500).json({ error: e.message });
  }
});

api.put('/orders/:id', async (req, res) => {
  const o = req.body.order;
  if (!o) return res.status(400).json({ error: 'orden inválida' });
  try {
    await pool.query(
      `UPDATE pmorfi.orders SET data = $2, status = $3, updated_at = now() WHERE id = $1`,
      [req.params.id, JSON.stringify(o), o.status]);
    broadcast('order_updated', o, req.body.clientId);
    res.json({ ok: true, order: o });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// bulk (import/export JSON del panel admin)
api.put('/orders', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM pmorfi.orders');
      for (const o of req.body.orders || []) {
        await client.query(
          `INSERT INTO pmorfi.orders (id, order_number, status, data, created_at)
           VALUES ($1,$2,$3,$4, COALESCE($5, now())::timestamptz)
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, status = EXCLUDED.status, updated_at = now()`,
          [o.id, o.orderNumber, o.status, JSON.stringify(o), o.createdAt]);
      }
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
    broadcast('orders_bulk', null, req.body.clientId);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'up', sse_clients: sseClients.size });
  } catch (e) { res.status(500).json({ ok: false, db: e.message }); }
});

// ── Aviso Telegram al dueño (patrón vigía/guardián) ────────────
async function notifyTelegram(o) {
  const tok = process.env.PMORFI_TG_BOT_TOKEN;
  const chat = process.env.PMORFI_TG_CHAT_ID;
  if (!tok || !chat) return console.log('[tg] sin credenciales, aviso omitido');
  const items = (o.items || []).map((i) => `  • ${i.quantity}x ${i.menuItem?.name || '?'}`).join('\n');
  const text =
    `🔔 *Punto Morfi — Nuevo pedido ${o.orderNumber}*\n` +
    `👤 ${o.customerName || 's/n'} (${o.customerPhone || 's/tel'})\n` +
    `💰 $${(o.total || 0).toLocaleString('es-AR')}\n` +
    `${o.deliveryMethod === 'delivery' ? `🛵 Envío: ${o.deliveryAddress || 's/dir'}` : '🏪 Retiro en local'}\n` +
    `🍽️\n${items}\n` +
    `💳 ${o.paymentMethod || 's/p'}`;
  try {
    const r = await fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'Markdown' }),
    });
    if (!r.ok) console.error('[tg]', r.status, (await r.text()).slice(0, 120));
  } catch (e) { console.error('[tg]', e.message); }
}

// ── Cuentas de cliente: Google One Tap + registro por teléfono ────────────
// Doctrina cápsula transaccional: $0 — Google Sign-In es gratis y el
// registro por teléfono no usa OTP (SMS/WhatsApp cuestan plata o banean).
// La cuenta ES el teléfono (como PedidosYa); el antifraude real es el pago.
const googleClient =
  OAuth2Client && process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

function normalizePhone(raw) {
  let p = String(raw || '').replace(/[^\d+]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('549')) p = p.slice(3);
  else if (p.startsWith('54')) p = p.slice(2);
  if (p.startsWith('0')) p = p.slice(1);
  if (p.startsWith('15')) p = p.slice(2);
  return p; // formato nacional: 342XXXXXXX
}

async function issueToken(customerId) {
  const token = crypto.randomBytes(24).toString('hex');
  await pool.query('INSERT INTO pmorfi.customer_tokens (token, customer_id) VALUES ($1,$2)', [token, customerId]);
  return token;
}

async function authCustomer(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  const r = await pool.query(
    'SELECT c.data FROM pmorfi.customer_tokens t JOIN pmorfi.customers c ON c.id = t.customer_id WHERE t.token = $1',
    [token]);
  return r.rows[0]?.data || null;
}

async function upsertCustomer({ googleSub, email, name, phone, picture, source }) {
  let row = null;
  if (googleSub) row = (await pool.query('SELECT * FROM pmorfi.customers WHERE google_sub=$1', [googleSub])).rows[0];
  if (!row && email) row = (await pool.query('SELECT * FROM pmorfi.customers WHERE email=$1', [email])).rows[0];
  if (!row && phone) row = (await pool.query('SELECT * FROM pmorfi.customers WHERE phone=$1', [phone])).rows[0];
  if (row) {
    const data = {
      ...row.data,
      name: name || row.data.name, phone: phone || row.data.phone,
      email: email || row.data.email, picture: picture || row.data.picture,
      googleSub: googleSub || row.data.googleSub,
      lastLoginAt: new Date().toISOString(),
    };
    await pool.query(
      'UPDATE pmorfi.customers SET data=$2, phone=$3, email=$4, google_sub=COALESCE($5, google_sub), updated_at=now() WHERE id=$1',
      [row.id, JSON.stringify(data), data.phone || null, data.email || null, googleSub || null]);
    return data;
  }
  const id = 'cus-' + crypto.randomBytes(8).toString('hex');
  const data = {
    id, name: name || '', phone: phone || '', email: email || '',
    picture: picture || '', googleSub: googleSub || null, addresses: [],
    source, createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString(),
  };
  await pool.query(
    'INSERT INTO pmorfi.customers (id, phone, email, google_sub, data) VALUES ($1,$2,$3,$4,$5)',
    [id, data.phone || null, data.email || null, googleSub || null, JSON.stringify(data)]);
  return data;
}

api.get('/auth/config', (_req, res) => {
  res.json({ googleEnabled: Boolean(googleClient), googleClientId: process.env.GOOGLE_CLIENT_ID || null });
});

api.post('/auth/google', async (req, res) => {
  try {
    if (!googleClient) return res.status(501).json({ error: 'Google Sign-In no configurado (GOOGLE_CLIENT_ID en .env)' });
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    const customer = await upsertCustomer({ googleSub: p.sub, email: p.email, name: p.name, phone: '', picture: p.picture, source: 'google' });
    const token = await issueToken(customer.id);
    res.json({ token, customer });
  } catch (e) {
    res.status(401).json({ error: 'Credencial de Google inválida: ' + e.message });
  }
});

api.post('/auth/phone', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const phone = normalizePhone(req.body.phone);
    if (!name || phone.length < 8) return res.status(400).json({ error: 'Necesitamos tu nombre y un celular válido' });
    const customer = await upsertCustomer({ name, phone, source: 'telefono' });
    const token = await issueToken(customer.id);
    res.json({ token, customer });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.get('/me', async (req, res) => {
  const customer = await authCustomer(req);
  if (!customer) return res.status(401).json({ error: 'sin sesión' });
  const orders = await pool.query(
    'SELECT data FROM pmorfi.orders WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 50', [customer.id]);
  res.json({ customer, orders: orders.rows.map((r) => r.data) });
});

api.patch('/me', async (req, res) => {
  try {
    const customer = await authCustomer(req);
    if (!customer) return res.status(401).json({ error: 'sin sesión' });
    const data = { ...customer };
    if (typeof req.body.name === 'string' && req.body.name.trim()) data.name = req.body.name.trim();
    if (req.body.phone) data.phone = normalizePhone(req.body.phone);
    if (Array.isArray(req.body.addresses)) {
      data.addresses = req.body.addresses.slice(0, 10).map((a) => ({
        id: String(a.id || crypto.randomBytes(4).toString('hex')),
        label: String(a.label || 'Mi dirección').slice(0, 40),
        text: String(a.text || '').slice(0, 200),
        floorApt: String(a.floorApt || '').slice(0, 40),
        isDefault: Boolean(a.isDefault),
      }));
      if (!data.addresses.some((a) => a.isDefault) && data.addresses.length) data.addresses[0].isDefault = true;
    }
    await pool.query('UPDATE pmorfi.customers SET data=$2, phone=$3, updated_at=now() WHERE id=$1',
      [customer.id, JSON.stringify(data), data.phone || null]);
    res.json({ customer: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Panel admin: clientes registrados + stats (para lista de difusión WhatsApp)
api.get('/customers', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.data,
             (SELECT count(*) FROM pmorfi.orders o WHERE o.customer_id = c.id)::int AS orders_count,
             (SELECT COALESCE(sum((o.data->>'total')::numeric), 0) FROM pmorfi.orders o WHERE o.customer_id = c.id) AS total_spent,
             (SELECT max(o.created_at) FROM pmorfi.orders o WHERE o.customer_id = c.id) AS last_order_at
      FROM pmorfi.customers c
      ORDER BY last_order_at DESC NULLS LAST, c.created_at DESC`);
    res.json({
      customers: r.rows.map((x) => ({
        ...x.data,
        stats: { ordersCount: x.orders_count, totalSpent: Number(x.total_spent || 0), lastOrderAt: x.last_order_at },
      })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Montaje dual de la API ─────────────────────────────────────
app.use('/api', api);
app.use('/pmorfi/api', api);

// ── Frontend (dist/) — SPA en ruta raíz Y bajo /pmorfi/ ────────
// (base de Vite = /pmorfi/: el mismo build sirve en
//  puntomorfi.setubalai.org y demo.setubalai.org/pmorfi/)
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/pmorfi', express.static(path.join(__dirname, 'dist')));
app.get('/', (_req, res) => res.redirect('/pmorfi/'));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Punto Morfi backend vivo en 127.0.0.1:${PORT} (schema pmorfi @ paperclip-db)`);
});
