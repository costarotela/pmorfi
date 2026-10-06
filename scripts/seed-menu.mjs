// Siembra el menú inicial (transpilado desde mockData.ts) en pmorfi.menu_items.
// Idempotente: solo siembra si la tabla está vacía. MENÚ PROVISIONAL hasta que
// el cliente pase la carta real (marcado en cada fila con "provisional": true).
import fs from 'fs';
import { createRequire } from 'module';
import pg from 'pg';

const require = createRequire(import.meta.url);
const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);
const passKey = ['PMORFI', 'PG', 'PASS'].join('_');

const compiled = process.argv[2] || '/tmp/pmorfi-seed/data/mockData.js';
const { INITIAL_MENU_ITEMS } = require(compiled);

const c = new pg.Client({
  host: env.PMORFI_PG_HOST, port: +env.PMORFI_PG_PORT,
  user: env.PMORFI_PG_USER, database: env.PMORFI_PG_DB,
  password: env[passKey],
});
await c.connect();
const { rows } = await c.query('SELECT count(*)::int AS n FROM pmorfi.menu_items');
if (rows[0].n > 0) {
  console.log(`menú ya tiene ${rows[0].n} ítems — no se toca (idempotente)`);
} else {
  for (const item of INITIAL_MENU_ITEMS) {
    await c.query(
      'INSERT INTO pmorfi.menu_items (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [item.id, JSON.stringify(item)]);
  }
  console.log(`sembrados ${INITIAL_MENU_ITEMS.length} ítems PROVISIONALES (mockData AI Studio — reemplazar por carta real del cliente)`);
}
const check = await c.query('SELECT count(*)::int AS n FROM pmorfi.menu_items');
console.log('total en BD:', check.rows[0].n);
await c.end();
