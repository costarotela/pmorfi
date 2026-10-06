// ═══════════════════════════════════════════════════════════════
// CUSTOMERS MANAGER (panel admin) — clientes registrados.
// Lista con stats (pedidos, gasto, último pedido) y exportación CSV
// con teléfonos en formato WhatsApp (549…) para que el dueño los
// cargue en su lista de difusión: marketing de circuito cerrado,
// gratis, humano y sin riesgo de baneo (doctrina cápsula $0).
// ═══════════════════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';
import { Download, Users, MessageCircle, RefreshCw } from 'lucide-react';
import { Customer } from '../../types';

const API = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;

function waPhone(phone: string): string {
  // nacional (342XXXXXXX) → internacional WhatsApp (549342XXXXXXX)
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('549')) return digits;
  if (digits.startsWith('54')) return `549${digits.slice(2)}`;
  return `549${digits}`;
}

export const CustomersManager: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`${API}/customers`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => { setCustomers(d.customers || []); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const exportCsv = () => {
    const rows = [
      ['Nombre', 'Telefono', 'WhatsApp (549…)', 'Email', 'Origen', 'Direcciones', 'Pedidos', 'Gasto total', 'Ultimo pedido'],
      ...customers.map((c) => [
        c.name || '',
        c.phone || '',
        waPhone(c.phone),
        c.email || '',
        c.source === 'google' ? 'Google' : 'Teléfono',
        (c.addresses || []).map((a) => `${a.label}: ${a.text}${a.floorApt ? ' ' + a.floorApt : ''}`).join(' | '),
        String(c.stats?.ordersCount ?? 0),
        String(c.stats?.totalSpent ?? 0),
        c.stats?.lastOrderAt ? new Date(c.stats.lastOrderAt).toLocaleString('es-AR') : '',
      ]),
    ];
    const csv = '\uFEFF' + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes-punto-morfi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyPhones = async () => {
    const phones = customers.map((c) => waPhone(c.phone)).filter(Boolean).join('\n');
    if (!phones) return;
    try { await navigator.clipboard.writeText(phones); alert('✅ Teléfonos (formato WhatsApp) copiados al portapapeles'); }
    catch { alert('No se pudo copiar — usá la exportación CSV'); }
  };

  const fmt = (n: number) => `$${(n || 0).toLocaleString('es-AR')}`;

  return (
    <div className="space-y-4">
      {/* Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-['Fredoka'] font-bold text-xl text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#e2e663]" /> Clientes registrados
          </h2>
          <p className="text-xs text-[#8daaa8] mt-0.5">
            {customers.length} cliente(s) • Exportá los teléfonos y cargalos en tu lista de difusión de WhatsApp del local
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 bg-[#243635] border border-[#364e4c] text-xs font-bold text-[#8daaa8] hover:text-white px-3.5 py-2.5 rounded-xl">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
          <button onClick={copyPhones} disabled={!customers.length}
            className="flex items-center gap-1.5 bg-[#25d366]/15 border border-[#25d366]/50 text-[#4ade80] text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-[#25d366]/25 disabled:opacity-40">
            <MessageCircle className="w-3.5 h-3.5" /> Copiar teléfonos
          </button>
          <button onClick={exportCsv} disabled={!customers.length}
            className="flex items-center gap-1.5 bg-[#f88d63] text-[#1b2827] text-xs font-black px-3.5 py-2.5 rounded-xl hover:bg-[#f77e50] disabled:opacity-40">
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-rose-400 bg-rose-500/10 rounded-xl px-4 py-3">Error: {error}</p>}
      {loading && <p className="text-xs text-[#8daaa8]">Cargando clientes…</p>}

      {/* Tabla */}
      {!loading && customers.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-[#2b3e3d]">
          <table className="w-full text-xs">
            <thead className="bg-[#152221] text-[#8daaa8] uppercase text-[10px] font-black">
              <tr>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Teléfono</th>
                <th className="text-left px-4 py-3">Origen</th>
                <th className="text-right px-4 py-3">Pedidos</th>
                <th className="text-right px-4 py-3">Gasto total</th>
                <th className="text-left px-4 py-3">Último pedido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b3e3d] bg-[#1b2827]">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-[#243635] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {c.picture
                        ? <img src={c.picture} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                        : <div className="w-7 h-7 rounded-full bg-[#243635] flex items-center justify-center text-xs">🍽️</div>}
                      <div>
                        <p className="font-bold text-white">{c.name}</p>
                        {c.email && <p className="text-[10px] text-[#759694]">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#e2e663] font-mono">
                    {c.phone ? (
                      <a href={`https://wa.me/${waPhone(c.phone)}`} target="_blank" rel="noreferrer" className="hover:underline">
                        {c.phone}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-[#8daaa8]">{c.source === 'google' ? '🔵 Google' : '📱 Teléfono'}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{c.stats?.ordersCount ?? 0}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{fmt(c.stats?.totalSpent ?? 0)}</td>
                  <td className="px-4 py-3 text-[#8daaa8]">
                    {c.stats?.lastOrderAt ? new Date(c.stats.lastOrderAt).toLocaleString('es-AR') : 'sin pedidos aún'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && customers.length === 0 && !error && (
        <div className="text-center bg-[#152221] rounded-2xl px-6 py-10 text-[#759694] text-xs">
          <Users className="w-8 h-8 mx-auto mb-2 text-[#2b3e3d]" />
          Todavía no hay clientes registrados. Compartí el link de la tienda y cuando creen su cuenta aparecerán acá.
        </div>
      )}
    </div>
  );
};
