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
import { fileURLToPath } from 'url';

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
    await pool.query(
      `INSERT INTO pmorfi.orders (id, order_number, status, data)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, status = EXCLUDED.status, updated_at = now()`,
      [o.id, o.orderNumber, o.status, JSON.stringify(o)]);
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
