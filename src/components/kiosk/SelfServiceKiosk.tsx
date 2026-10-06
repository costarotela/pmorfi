import React, { useState, useEffect } from 'react';
import { MenuItem, CartItem, Order, PaymentMethod } from '../../types';
import { storageService } from '../../services/storage';
import { soundEffects } from '../../services/sound';
import { PuntoMorfiLogo } from '../Logo';
import {
  Plus,
  Minus,
  Check,
  ShoppingBag,
  CreditCard,
  Banknote,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Clock,
  QrCode,
  Copy,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SelfServiceKioskProps {
  menuItems: MenuItem[];
  onOrderCreated: (order: Order) => void;
  onExitKiosk: () => void;
}

export const SelfServiceKiosk: React.FC<SelfServiceKioskProps> = ({
  menuItems,
  onOrderCreated,
  onExitKiosk,
}) => {
  // Kiosk step: 1 = choose dishes, 2 = customer name & payment, 3 = confirmation ticket screen
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentChoice, setPaymentChoice] = useState<PaymentMethod>('mercadopago_alias');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [copiedAlias, setCopiedAlias] = useState(false);

  // Auto reset countdown on screen 3
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 3) {
      setCountdown(15);
      timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            handleResetKiosk();
            return 15;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const handleUpdateQty = (itemId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const cartItems: CartItem[] = Object.entries(quantities)
    .map(([itemId, qty]) => {
      const item = menuItems.find((m) => m.id === itemId);
      if (!item) return null;
      return {
        id: `kiosk-${itemId}`,
        menuItem: item,
        quantity: qty,
        itemTotalPrice: item.price * qty,
      };
    })
    .filter(Boolean) as CartItem[];

  const subtotal = cartItems.reduce((acc, it) => acc + it.itemTotalPrice, 0);
  const totalCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  const handleConfirmOrder = () => {
    if (!customerName.trim()) {
      alert('Por favor ingresá tu nombre para llamarte cuando esté listo');
      return;
    }

    const assignedAlias =
      paymentChoice === 'mercadopago_alias'
        ? storageService.getRandomActiveAlias()
        : undefined;

    const newOrder = storageService.createOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || 'Tablet Local',
      deliveryMethod: 'pickup', // Kiosk orders are always pickup in store
      deliveryNotes: 'Pedido realizado desde Tótem Tablet del local',
      items: cartItems,
      subtotal,
      deliveryFee: 0,
      total: subtotal,
      status: paymentChoice === 'mercadopago_alias' ? 'pendiente_pago' : 'confirmado',
      paymentMethod: paymentChoice,
      assignedAlias,
      estimatedDeliveryMinutes: 15,
    });

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#f88d63', '#e2e663', '#759694'],
      });
    } catch {
      // Ignored
    }

    soundEffects.playPaymentSuccessChime();
    setCreatedOrder(newOrder);
    onOrderCreated(newOrder);
    setStep(3);
  };

  const handleResetKiosk = () => {
    setStep(1);
    setQuantities({});
    setCustomerName('');
    setCustomerPhone('');
    setPaymentChoice('mercadopago_alias');
    setCreatedOrder(null);
  };

  const handleCopyAlias = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#14201f] text-stone-100 flex flex-col font-sans select-none pb-20">
      {/* Top Kiosk Header */}
      <header className="bg-[#1b2827] border-b border-[#2d4240] px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <PuntoMorfiLogo size="md" showSubtitle={true} />
          <span className="hidden sm:inline-block bg-[#f88d63] text-[#1b2827] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider font-['Fredoka']">
            Tótem de Autogestión
          </span>
        </div>

        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s === 2 ? 1 : 1))}
              className="px-4 py-2 bg-[#243635] text-stone-200 rounded-2xl text-xs font-bold border border-[#364e4c] hover:bg-[#2c4241] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver Atrás</span>
            </button>
          )}

          <button
            onClick={onExitKiosk}
            className="text-xs text-[#8daaa8] hover:text-white px-3 py-2 rounded-xl"
            title="Salir del modo pantalla completa de tótem"
          >
            ✕ Salir del Tótem
          </button>
        </div>
      </header>

      {/* Main Touch Canvas */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* STEP 1: CHOOSE FOOD */}
        {step === 1 && (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black text-white font-['Fredoka']">
                ¿Qué vas a comer hoy?
              </h1>
              <p className="text-sm text-[#8daaa8]">
                Tocá los botones <strong className="text-[#f88d63]">+</strong> para sumar lo que más te guste.
              </p>
            </div>

            {/* Big Touch Dishes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 flex-1">
              {menuItems
                .filter((item) => item.isAvailable)
                .map((item) => {
                  const qty = quantities[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className={`bg-[#1e2d2c] border-2 rounded-3xl p-4 flex flex-col justify-between shadow-xl transition-all ${
                        qty > 0 ? 'border-[#f88d63] ring-2 ring-[#f88d63]/30 scale-[1.01]' : 'border-[#2d4240]'
                      }`}
                    >
                      <div>
                        <div className="relative h-44 rounded-2xl overflow-hidden bg-[#152221]">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                            <span className="text-xl font-black text-[#e2e663] font-['Fredoka'] drop-shadow-md">
                              ${item.price.toLocaleString('es-AR')}
                            </span>
                            {qty > 0 && (
                              <span className="bg-[#f88d63] text-[#1b2827] font-black text-sm px-3 py-0.5 rounded-full shadow-md font-['Fredoka']">
                                {qty} en pedido
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-3">
                          <h3 className="text-lg font-black text-white font-['Fredoka'] leading-snug line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-xs text-[#8daaa8] line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Large Touch Counter */}
                      <div className="pt-4 mt-2 border-t border-[#2d4240] flex items-center justify-between">
                        {qty === 0 ? (
                          <button
                            onClick={() => handleUpdateQty(item.id, 1)}
                            className="w-full bg-[#f88d63] hover:bg-[#fa9d79] active:scale-95 text-[#1b2827] font-black py-3 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all font-['Fredoka']"
                          >
                            <Plus className="w-5 h-5 stroke-[3]" />
                            <span>Sumar al Pedido</span>
                          </button>
                        ) : (
                          <div className="w-full flex items-center justify-between bg-[#152221] p-1.5 rounded-2xl border border-[#2b3e3d]">
                            <button
                              onClick={() => handleUpdateQty(item.id, -1)}
                              className="w-12 h-12 bg-[#243635] hover:bg-[#2c4241] rounded-xl flex items-center justify-center text-white text-lg font-black transition-all active:scale-90"
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                            <span className="text-xl font-black text-[#e2e663] font-['Fredoka']">
                              {qty}
                            </span>
                            <button
                              onClick={() => handleUpdateQty(item.id, 1)}
                              className="w-12 h-12 bg-[#f88d63] hover:bg-[#fa9d79] rounded-xl flex items-center justify-center text-[#1b2827] text-lg font-black transition-all active:scale-90"
                            >
                              <Plus className="w-5 h-5 stroke-[3]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Bottom Floating Bar */}
            {totalCount > 0 && (
              <div className="sticky bottom-4 z-40 bg-[#1e2d2c]/95 border-2 border-[#f88d63] backdrop-blur-md p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#f88d63] text-[#1b2827] flex items-center justify-center font-black text-xl font-['Fredoka']">
                    {totalCount}
                  </div>
                  <div>
                    <span className="text-xs text-[#8daaa8] uppercase font-bold block">Total a Pagar</span>
                    <span className="text-2xl font-black text-[#e2e663] font-['Fredoka']">
                      ${subtotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="bg-gradient-to-r from-[#f88d63] to-[#fa9d79] hover:from-[#f77e50] hover:to-[#f88d63] text-[#1b2827] font-black py-4 px-8 rounded-2xl text-base flex items-center gap-3 shadow-xl shadow-[#f88d63]/25 active:scale-95 transition-all font-['Fredoka']"
                >
                  <span>Listo, Continuar</span>
                  <ArrowRight className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CUSTOMER NAME & PAYMENT */}
        {step === 2 && (
          <div className="max-w-xl mx-auto w-full space-y-6 flex-1 flex flex-col justify-center">
            <div className="text-center space-y-1">
              <h2 className="text-3xl font-black text-white font-['Fredoka']">
                ¿A nombre de quién sale el pedido?
              </h2>
              <p className="text-xs text-[#8daaa8]">
                Te vamos a llamar por mostrador cuando tu comida esté caliente y lista.
              </p>
            </div>

            <div className="bg-[#1e2d2c] border border-[#2d4240] p-6 rounded-3xl shadow-xl space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-[#e2e663] block font-['Fredoka']">
                  Tu Nombre o Apodo *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Martín, Laura, Juan..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#152221] border-2 border-[#2b3e3d] focus:border-[#f88d63] rounded-2xl px-5 py-4 text-lg font-black text-white placeholder-[#759694] outline-none"
                  autoFocus
                />
              </div>

              {/* Phone Optional */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-[#8daaa8] block">
                  Teléfono / WhatsApp (Opcional para avisarte)
                </label>
                <input
                  type="tel"
                  placeholder="Ej: 11 4455-6677"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#152221] border border-[#2b3e3d] focus:border-[#f88d63] rounded-2xl px-4 py-3 text-sm text-white placeholder-[#759694] outline-none"
                />
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-[#e2e663] block font-['Fredoka']">
                  ¿Cómo vas a abonar?
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('mercadopago_alias')}
                    className={`p-4 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${
                      paymentChoice === 'mercadopago_alias'
                        ? 'bg-[#009ee3]/15 border-[#009ee3] text-white shadow-lg'
                        : 'bg-[#152221] border-[#2b3e3d] text-[#8daaa8]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#009ee3] text-white font-black flex items-center justify-center shrink-0">
                      MP
                    </div>
                    <div>
                      <div className="text-xs font-black font-['Fredoka'] text-white">Mercado Pago QR</div>
                      <div className="text-[11px] text-sky-300">Con Alias al azar</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChoice('efectivo')}
                    className={`p-4 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${
                      paymentChoice === 'efectivo'
                        ? 'bg-[#f88d63]/15 border-[#f88d63] text-white shadow-lg'
                        : 'bg-[#152221] border-[#2b3e3d] text-[#8daaa8]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#243635] text-[#f88d63] font-black flex items-center justify-center shrink-0">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black font-['Fredoka'] text-white">Pago en Caja</div>
                      <div className="text-[11px] text-[#8daaa8]">Efectivo o Posnet</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Total review */}
              <div className="bg-[#152221] p-4 rounded-2xl border border-[#2b3e3d] flex justify-between items-center">
                <span className="text-xs text-[#8daaa8] uppercase font-bold">Total a Pagar en Local:</span>
                <span className="text-2xl font-black text-[#e2e663] font-['Fredoka']">
                  ${subtotal.toLocaleString('es-AR')}
                </span>
              </div>

              {/* Confirm button */}
              <button
                onClick={handleConfirmOrder}
                disabled={!customerName.trim()}
                className="w-full bg-gradient-to-r from-[#f88d63] to-[#fa9d79] hover:from-[#f77e50] hover:to-[#f88d63] disabled:opacity-40 text-[#1b2827] font-black py-4 px-6 rounded-2xl text-lg flex items-center justify-center gap-2 shadow-xl shadow-[#f88d63]/25 active:scale-95 transition-all font-['Fredoka']"
              >
                <span>¡CONFIRMAR PEDIDO!</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS TICKET SCREEN */}
        {step === 3 && createdOrder && (
          <div className="max-w-xl mx-auto w-full space-y-6 flex-1 flex flex-col justify-center text-center">
            <div className="bg-[#1e2d2c] border-2 border-emerald-500/50 p-8 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>

              <div>
                <span className="text-xs uppercase font-black tracking-widest text-[#8daaa8] block">
                  Tu Número de Comanda
                </span>
                <h1 className="text-5xl sm:text-6xl font-black text-white font-['Fredoka'] tracking-wider my-2 text-[#e2e663]">
                  {createdOrder.orderNumber}
                </h1>
                <p className="text-base text-stone-200 font-bold">
                  ¡Muchas gracias, <strong className="text-[#f88d63]">{createdOrder.customerName}</strong>!
                </p>
                <p className="text-xs text-[#8daaa8] mt-1 max-w-sm mx-auto">
                  Tu pedido ya entró en pantalla de cocina. Por favor aguardá a que te llamemos por mostrador.
                </p>
              </div>

              {/* Mercado Pago QR and Alias Display if MP was chosen */}
              {createdOrder.paymentMethod === 'mercadopago_alias' && createdOrder.assignedAlias && (
                <div className="bg-[#14201f] border border-[#009ee3]/40 p-4 rounded-2xl text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-sky-400 font-['Fredoka']">
                      💳 Transferí con Mercado Pago al Alias:
                    </span>
                    <span className="text-xs font-black text-[#e2e663] font-mono">
                      ${createdOrder.total.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="bg-[#1e2d2c] p-3 rounded-xl flex items-center justify-between border border-[#2d4240]">
                    <span className="font-mono font-black text-base text-amber-300">
                      {createdOrder.assignedAlias.alias}
                    </span>
                    <button
                      onClick={() => handleCopyAlias(createdOrder.assignedAlias!.alias)}
                      className="px-2.5 py-1 rounded-lg bg-[#009ee3] text-white text-xs font-bold flex items-center gap-1"
                    >
                      {copiedAlias ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8daaa8]">
                    Titular: {createdOrder.assignedAlias.holder} ({createdOrder.assignedAlias.bankOrMp})
                  </p>
                </div>
              )}

              {createdOrder.paymentMethod === 'efectivo' && (
                <div className="bg-[#243635] p-3 rounded-2xl border border-[#364e4c] text-xs text-[#e2e663] font-bold">
                  💵 Por favor acércate a Caja para abonar tu orden con el número {createdOrder.orderNumber}.
                </div>
              )}

              {/* Auto reset timer bar */}
              <div className="pt-2">
                <button
                  onClick={handleResetKiosk}
                  className="w-full bg-[#f88d63] hover:bg-[#fa9d79] text-[#1b2827] font-black py-4 px-6 rounded-2xl text-base flex items-center justify-center gap-2 shadow-xl font-['Fredoka'] active:scale-95 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Hacer Otro Pedido ({countdown}s)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
