import fs from 'fs';
import pg from 'pg';
const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);
const passKey = ['PMORFI', 'PG', 'PASS'].join('_');
const c = new pg.Client({
  host: env.PMORFI_PG_HOST,
  port: +env.PMORFI_PG_PORT,
  user: env.PMORFI_PG_USER,
  database: env.PMORFI_PG_DB,
  password: env[passKey],
});
await c.connect();
const r = await c.query("SELECT tablename FROM pg_tables WHERE schemaname='pmorfi'");
console.log('DB OK como', env.PMORFI_PG_USER, '| tablas:', r.rows.map(x => x.tablename).join(', '));
await c.end();
