// Configura presentaciones de venta (unidad/docena/media) en ítems del menú.
// Precios PROVISIONALES coherentes con el seed de mockData — reemplazar con carta real.
import fs from 'fs';
import pg from 'pg';

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);
const passKey = ['PMORFI', 'PG', 'PASS'].join('_');
const c = new pg.Client({
  host: env.PMORFI_PG_HOST, port: +env.PMORFI_PG_PORT,
  user: env.PMORFI_PG_USER, database: env.PMORFI_PG_DB, password: env[passKey],
});

const updates = [
  { id: 'emp-1', price: 1150, presentaciones: [
    { id: 'unidad', label: 'Unidad', factor: 1 },
    { id: 'media-docena', label: 'Media docena (6 u.)', factor: 6, precioFijo: 6750 },
    { id: 'docena', label: 'Docena (12 u.)', factor: 12, precioFijo: 13500 },
  ]},
  { id: 'emp-2', price: 1200, presentaciones: [
    { id: 'unidad', label: 'Unidad', factor: 1 },
    { id: 'media-docena', label: 'Media docena (6 u.)', factor: 6, precioFijo: 7200 },
    { id: 'docena', label: 'Docena (12 u.)', factor: 12, precioFijo: 14400 },
  ]},
  { id: 'piz-1', presentaciones: [
    { id: 'unidad', label: 'Pizza entera', factor: 1 },
    { id: 'media', label: 'Media pizza', factor: 0.5 },
  ]},
  { id: 'piz-2', presentaciones: [
    { id: 'unidad', label: 'Pizza entera', factor: 1 },
    { id: 'media', label: 'Media pizza', factor: 0.5 },
  ]},
];

await c.connect();
for (const u of updates) {
  const params = u.price ? [u.id, JSON.stringify(u.presentaciones), u.price] : [u.id, JSON.stringify(u.presentaciones)];
  const q2 = u.price
    ? `UPDATE pmorfi.menu_items SET data = jsonb_set(jsonb_set(data, '{presentaciones}', $2::jsonb), '{price}', to_jsonb($3::int)), updated_at = now() WHERE id = $1`
    : `UPDATE pmorfi.menu_items SET data = jsonb_set(data, '{presentaciones}', $2::jsonb), updated_at = now() WHERE id = $1`;
  const r = await c.query(q2, params);
  console.log(u.id, '→', r.rowCount ? 'OK' : 'NO ENCONTRADO');
}
const { rows } = await c.query("SELECT data->>'id' AS id, data->>'price' AS precio, jsonb_array_length(data->'presentaciones') AS pres FROM pmorfi.menu_items WHERE data->'presentaciones' IS NOT NULL ORDER BY id");
console.table(rows);
await c.end();
