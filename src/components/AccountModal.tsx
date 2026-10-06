// ═══════════════════════════════════════════════════════════════
// ACCOUNT MODAL — sesión del cliente de Punto Morfi.
// Sin sesión: "Continuar con Google" (botón oficial GIS, un toque)
// o registro rápido por teléfono (nombre + celular, sin contraseña).
// Con sesión: perfil editable, direcciones guardadas e historial
// con re-pedido en un toque ("pedir lo mismo de la vez pasada").
// ═══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, User, MapPin, Plus, Trash2, Star, RotateCcw, Smartphone, LogOut, History } from 'lucide-react';
import { Customer, CustomerAddress, Order } from '../types';
import { authService } from '../services/auth';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onCustomerChange: (c: Customer | null) => void;
  onReorder: (order: Order) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen, onClose, customer, onCustomerChange, onReorder,
}) => {
  // ── Login ────────────────────────────────────────────────────
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleAvailable, setGoogleAvailable] = useState<boolean | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [phoneName, setPhoneName] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Perfil ───────────────────────────────────────────────────
  const [tab, setTab] = useState<'perfil' | 'historial'>('perfil');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  // editor de dirección
  const [editingAddr, setEditingAddr] = useState<CustomerAddress | null>(null);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrText, setAddrText] = useState('');
  const [addrFloor, setAddrFloor] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setGoogleError(null); setPhoneError(null);
    if (!customer) {
      // botón de Google solo si el backend tiene GOOGLE_CLIENT_ID
      let cancelled = false;
      authService.renderGoogleButton(
        googleBtnRef.current!,
        (d) => { onCustomerChange(d.customer); },
        (msg) => { if (!cancelled) setGoogleError(msg); }
      ).then(() => { if (!cancelled) setGoogleAvailable(true); })
        .catch(() => { if (!cancelled) setGoogleAvailable(false); });
      return () => { cancelled = true; if (googleBtnRef.current) googleBtnRef.current.innerHTML = ''; };
    }
    setTab('perfil');
    setEditName(customer.name || '');
    setEditPhone(customer.phone || '');
    setAddresses(customer.addresses || []);
    setSaved(false);
    authService.getMe().then((me) => { if (me) { setOrders(me.orders); onCustomerChange(me.customer); } });
  }, [isOpen, customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistAddresses = useCallback(async (next: CustomerAddress[], name?: string, phone?: string) => {
    setSaving(true);
    try {
      const updated = await authService.updateMe({
        addresses: next,
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
      });
      setAddresses(updated.addresses || []);
      onCustomerChange(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setPhoneError(e instanceof Error ? e.message : 'no se pudo guardar');
    } finally { setSaving(false); }
  }, [onCustomerChange]);

  const handlePhoneRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setSubmitting(true);
    try {
      const d = await authService.loginPhone(phoneName, phoneNum);
      onCustomerChange(d.customer);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'no se pudo crear la cuenta');
    } finally { setSubmitting(false); }
  };

  const saveAddress = () => {
    if (!addrText.trim()) return;
    let next: CustomerAddress[];
    if (editingAddr && addresses.some((a) => a.id === editingAddr.id)) {
      next = addresses.map((a) => a.id === editingAddr.id
        ? { ...a, label: addrLabel.trim() || 'Mi dirección', text: addrText.trim(), floorApt: addrFloor.trim() }
        : a);
    } else {
      next = [...addresses, {
        id: 'addr-' + Date.now().toString(36),
        label: addrLabel.trim() || 'Mi dirección',
        text: addrText.trim(),
        floorApt: addrFloor.trim(),
        isDefault: addresses.length === 0,
      }];
    }
    setEditingAddr(null); setAddrLabel(''); setAddrText(''); setAddrFloor('');
    persistAddresses(next);
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-[#1e2d2c] border border-[#2e4342] rounded-t-3xl sm:rounded-3xl shadow-2xl pointer-events-auto">

        {/* Cabecera */}
        <div className="sticky top-0 z-10 bg-[#1e2d2c] border-b border-[#2b3e3d] px-5 py-4 flex items-center justify-between">
          <h2 className="font-['Fredoka'] font-bold text-lg text-white flex items-center gap-2">
            <User className="w-5 h-5 text-[#f88d63]" />
            {customer ? 'Mi cuenta' : 'Creá tu cuenta'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#243635] text-[#8daaa8]"><X className="w-5 h-5" /></button>
        </div>

        {!customer ? (
          /* ── LOGIN / REGISTRO ─────────────────────────────── */
          <div className="p-5 space-y-5">
            <p className="text-xs text-[#8daaa8] leading-relaxed">
              Con tu cuenta guardamos tus direcciones, ves tu historial y podés
              <span className="text-[#e2e663] font-bold"> re-pedir lo mismo en un toque</span>. También podés comprar como invitado sin registrarte.
            </p>

            {/* Google (un toque en Android) */}
            <div className="flex flex-col items-center gap-2">
              <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center" />
              {googleAvailable === false && (
                <p className="text-[10px] text-[#759694]">Inicio con Google próximamente — usá tu teléfono 👇</p>
              )}
              {googleError && <p className="text-[11px] text-rose-400">{googleError}</p>}
            </div>

            <div className="flex items-center gap-3 text-[10px] text-[#759694] font-bold uppercase">
              <div className="flex-1 h-px bg-[#2b3e3d]" /> o con tu celular <div className="flex-1 h-px bg-[#2b3e3d]" />
            </div>

            {/* Teléfono (sin contraseña — la cuenta ES el teléfono) */}
            <form onSubmit={handlePhoneRegister} className="space-y-3">
              <input
                value={phoneName} onChange={(e) => setPhoneName(e.target.value)}
                placeholder="Tu nombre y apellido"
                className="w-full bg-[#152221] border border-[#2b3e3d] rounded-xl px-4 py-3 text-sm text-white placeholder-[#759694] outline-none focus:border-[#f88d63]"
              />
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-[#759694]" />
                <input
                  value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)}
                  placeholder="342 5XX XXXX" inputMode="tel" type="tel"
                  className="w-full bg-[#152221] border border-[#2b3e3d] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#759694] outline-none focus:border-[#f88d63]"
                />
              </div>
              {phoneError && <p className="text-[11px] text-rose-400">{phoneError}</p>}
              <button
                type="submit" disabled={submitting}
                className="w-full bg-gradient-to-r from-[#f88d63] to-[#fa9d79] text-[#1b2827] font-black py-3 rounded-xl font-['Fredoka'] text-sm uppercase tracking-wide shadow-lg shadow-[#f88d63]/25 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? 'Creando cuenta…' : 'Continuar con mi teléfono'}
              </button>
              <p className="text-[10px] text-[#759694] text-center">Sin contraseña ni códigos: tu celular es tu cuenta (igual que PedidosYa).</p>
            </form>
          </div>
        ) : (
          /* ── CUENTA ACTIVA ────────────────────────────────── */
          <div>
            {/* Tabs perfil / historial */}
            <div className="flex gap-1 px-5 pt-4">
              {(['perfil', 'historial'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-black font-['Fredoka'] capitalize transition-all ${tab === t ? 'bg-[#f88d63] text-[#1b2827]' : 'text-[#8daaa8] hover:text-white'}`}>
                  {t === 'perfil' ? '👤 Perfil' : `🧾 Historial (${orders.length})`}
                </button>
              ))}
            </div>

            {tab === 'perfil' ? (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  {customer.picture
                    ? <img src={customer.picture} alt="" className="w-12 h-12 rounded-full border-2 border-[#e2e663]" referrerPolicy="no-referrer" />
                    : <div className="w-12 h-12 rounded-full bg-[#243635] flex items-center justify-center text-xl">🍽️</div>}
                  <div>
                    <p className="text-sm font-bold text-white">{customer.name}</p>
                    <p className="text-xs text-[#8daaa8]">{customer.email || `📱 ${customer.phone}`}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nombre"
                    className="bg-[#152221] border border-[#2b3e3d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#f88d63]" />
                  <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Celular" inputMode="tel"
                    className="bg-[#152221] border border-[#2b3e3d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#f88d63]" />
                </div>

                {/* Direcciones */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black text-[#e2e663] font-['Fredoka'] flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Mis direcciones</p>
                    <button onClick={() => setEditingAddr({ id: '', label: '', text: '' })}
                      className="text-[11px] font-bold text-[#f88d63] flex items-center gap-1 hover:underline"><Plus className="w-3.5 h-3.5" /> Agregar</button>
                  </div>
                  {addresses.length === 0 && !editingAddr && (
                    <p className="text-[11px] text-[#759694] bg-[#152221] rounded-xl px-4 py-3">Sin direcciones guardadas. Agregá la tuya y se autocompleta en cada pedido.</p>
                  )}
                  <div className="space-y-2">
                    {addresses.map((a) => (
                      <div key={a.id} className="bg-[#152221] border border-[#2b3e3d] rounded-xl px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            {a.label} {a.isDefault && <span className="text-[9px] bg-[#e2e663]/20 text-[#e2e663] px-1.5 py-0.5 rounded-full font-black">PREDETERMINADA</span>}
                          </p>
                          <p className="text-[11px] text-[#8daaa8] truncate">{a.text}{a.floorApt ? ` — ${a.floorApt}` : ''}</p>
                        </div>
                        {!a.isDefault && (
                          <button title="Hacer predeterminada" onClick={() => persistAddresses(addresses.map((x) => ({ ...x, isDefault: x.id === a.id })))}
                            className="p-1.5 text-[#759694] hover:text-[#e2e663]"><Star className="w-4 h-4" /></button>
                        )}
                        <button title="Editar" onClick={() => { setEditingAddr(a); setAddrLabel(a.label); setAddrText(a.text); setAddrFloor(a.floorApt || ''); }}
                          className="p-1.5 text-[#759694] hover:text-white"><User className="w-4 h-4" /></button>
                        <button title="Eliminar" onClick={() => persistAddresses(addresses.filter((x) => x.id !== a.id))}
                          className="p-1.5 text-[#759694] hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                  {editingAddr && (
                    <div className="mt-2 bg-[#152221] border border-[#f88d63]/40 rounded-xl p-3 space-y-2">
                      <input value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} placeholder="Etiqueta (Casa, Trabajo…)"
                        className="w-full bg-[#1b2827] border border-[#2b3e3d] rounded-lg px-3 py-2 text-xs text-white outline-none" />
                      <input value={addrText} onChange={(e) => setAddrText(e.target.value)} placeholder="Calle y altura *"
                        className="w-full bg-[#1b2827] border border-[#2b3e3d] rounded-lg px-3 py-2 text-xs text-white outline-none" />
                      <input value={addrFloor} onChange={(e) => setAddrFloor(e.target.value)} placeholder="Piso / depto (opcional)"
                        className="w-full bg-[#1b2827] border border-[#2b3e3d] rounded-lg px-3 py-2 text-xs text-white outline-none" />
                      <div className="flex gap-2">
                        <button onClick={saveAddress} disabled={saving || !addrText.trim()}
                          className="flex-1 bg-[#f88d63] text-[#1b2827] text-xs font-black py-2 rounded-lg disabled:opacity-40">Guardar dirección</button>
                        <button onClick={() => setEditingAddr(null)} className="px-4 bg-[#243635] text-xs font-bold text-[#8daaa8] rounded-lg">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => persistAddresses(addresses, editName.trim(), editPhone.trim())} disabled={saving}
                    className="flex-1 bg-[#e2e663] text-[#1b2827] font-black text-xs py-3 rounded-xl font-['Fredoka'] uppercase disabled:opacity-50">
                    {saved ? '✓ Guardado' : saving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                  <button onClick={() => { authService.logout(); onCustomerChange(null); }}
                    className="px-4 bg-[#243635] border border-[#2b3e3d] text-rose-300 rounded-xl flex items-center gap-1.5 text-xs font-bold hover:bg-rose-500/10">
                    <LogOut className="w-4 h-4" /> Salir
                  </button>
                </div>
                {phoneError && <p className="text-[11px] text-rose-400">{phoneError}</p>}
              </div>
            ) : (
              /* Historial + re-pedido */
              <div className="p-5 space-y-3">
                {orders.length === 0 && (
                  <p className="text-xs text-[#759694] bg-[#152221] rounded-xl px-4 py-6 text-center">
                    <History className="w-6 h-6 mx-auto mb-2 text-[#2b3e3d]" />
                    Todavía no hiciste pedidos con tu cuenta. ¡Estrenala! 🍕
                  </p>
                )}
                {orders.map((o) => (
                  <div key={o.id} className="bg-[#152221] border border-[#2b3e3d] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-black text-[#e2e663] font-['Fredoka']">{o.orderNumber} • {fmtDate(o.createdAt)}</p>
                      <p className="text-sm font-black text-white">${o.total.toLocaleString('es-AR')}</p>
                    </div>
                    <p className="text-[11px] text-[#8daaa8] mb-2.5">
                      {o.items.map((i) => `${i.quantity}x ${i.menuItem?.name}`).join(' · ')}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-[#759694]">{o.status.replace('_', ' ')}</span>
                      <button onClick={() => { onReorder(o); onClose(); }}
                        className="flex items-center gap-1.5 bg-[#f88d63]/15 hover:bg-[#f88d63]/25 border border-[#f88d63]/50 text-[#fa9d79] text-[11px] font-black px-3 py-1.5 rounded-lg transition-all">
                        <RotateCcw className="w-3.5 h-3.5" /> Pedir lo mismo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
