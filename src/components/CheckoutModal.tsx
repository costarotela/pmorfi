import React, { useState, useEffect } from 'react';
import { CartItem, DeliveryMethod, PaymentMethod, Order, Customer } from '../types';
import { storageService } from '../services/storage';
import {
  X,
  Bike,
  Store,
  Phone,
  User,
  MapPin,
  FileText,
  CreditCard,
  Banknote,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  deliveryMethod: DeliveryMethod;
  onOrderCreated: (order: Order) => void;
  customer?: Customer | null;
  onOpenAccount?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  deliveryMethod: initialDeliveryMethod,
  onOrderCreated,
  customer,
  onOpenAccount,
}) => {
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(initialDeliveryMethod);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFloorApt, setDeliveryFloorApt] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago_alias');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cuenta activa → autocompletar nombre, teléfono y dirección predeterminada
  useEffect(() => {
    if (!isOpen || !customer) return;
    setCustomerName(customer.name || '');
    setCustomerPhone(customer.phone || '');
    const def = (customer.addresses || []).find((a) => a.isDefault) || customer.addresses?.[0];
    if (def) {
      setDeliveryAddress(def.text || '');
      setDeliveryFloorApt(def.floorApt || '');
    }
  }, [isOpen, customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.itemTotalPrice, 0);
  const deliveryFee = deliveryMethod === 'delivery' ? 1500 : 0;
  const total = subtotal + deliveryFee;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!customerName.trim()) {
      newErrors.customerName = 'Por favor ingresá tu nombre';
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      newErrors.customerPhone = 'Ingresá un teléfono o WhatsApp válido';
    }
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Ingresá tu calle y altura para el envío';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Pick random active alias if Mercado Pago
      const assignedAlias =
        paymentMethod === 'mercadopago_alias'
          ? storageService.getRandomActiveAlias()
          : undefined;

      const newOrder = storageService.createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerId: customer?.id || null,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress.trim() : undefined,
        deliveryFloorApt: deliveryMethod === 'delivery' ? deliveryFloorApt.trim() : undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        items: cartItems,
        subtotal,
        deliveryFee,
        total,
        status: paymentMethod === 'mercadopago_alias' ? 'pendiente_pago' : 'confirmado',
        paymentMethod,
        assignedAlias,
        estimatedDeliveryMinutes: deliveryMethod === 'delivery' ? 35 : 20,
      });

      // Confetti effect
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#f88d63', '#e2e663', '#759694', '#fa966c'],
        });
      } catch {
        // Ignored
      }

      onOrderCreated(newOrder);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1e2d2c] border border-[#2d4240] rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#2d4240] flex items-center justify-between bg-[#152221]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#759694]/20 border border-[#759694]/40 flex items-center justify-center text-[#f88d63] font-black shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-['Fredoka']">Punto Morfi - Confirmar Pedido</h3>
              <p className="text-xs text-[#8daaa8]">Datos de entrega y forma de pago</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8daaa8] hover:text-white hover:bg-[#243635] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Delivery Method Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
              Forma de Entrega
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod('delivery')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  deliveryMethod === 'delivery'
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className={`p-2 rounded-xl ${deliveryMethod === 'delivery' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'}`}>
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Delivery a Domicilio</div>
                  <div className="text-[11px] text-stone-400">Costo: $1.500 (~35 min)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  deliveryMethod === 'pickup'
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className={`p-2 rounded-xl ${deliveryMethod === 'pickup' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'}`}>
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Retiro en Local</div>
                  <div className="text-[11px] text-stone-400">Sin costo (~20 min)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Cuenta: autocompletar datos o crear cuenta rápida */}
          {!customer && onOpenAccount && (
            <button
              type="button"
              onClick={onOpenAccount}
              className="w-full mb-4 bg-[#243635] hover:bg-[#2c4240] border border-[#e2e663]/40 rounded-2xl px-4 py-3 flex items-center gap-3 text-left transition-all"
            >
              <span className="text-xl">🔑</span>
              <span className="flex-1">
                <span className="block text-xs font-black text-[#e2e663] font-['Fredoka']">¿Ya tenés cuenta? Entrá con Google o tu celular</span>
                <span className="block text-[10px] text-[#8daaa8]">Tus datos se completan solos y podés re-pedir en un toque</span>
              </span>
              <ArrowRight className="w-4 h-4 text-[#e2e663]" />
            </button>
          )}
          {customer && (
            <div className="mb-4 bg-[#243635] border border-[#364e4c] rounded-2xl px-4 py-2.5 flex items-center gap-2 text-[11px] text-[#8daaa8]">
              <span className="text-sm">✅</span> Datos de tu cuenta — podés modificarlos igual
            </div>
          )}

          {/* Customer Personal Details */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
              Tus Datos de Contacto
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    placeholder="Tu nombre y apellido *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-stone-100 placeholder-stone-500 outline-none"
                  />
                </div>
                {errors.customerName && (
                  <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.customerName}</p>
                )}
              </div>

              <div>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="tel"
                    placeholder="Celular / WhatsApp *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-stone-100 placeholder-stone-500 outline-none"
                  />
                </div>
                {errors.customerPhone && (
                  <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.customerPhone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Address (if Delivery) */}
          {deliveryMethod === 'delivery' && (
            <div className="space-y-3 bg-stone-950/60 p-4 rounded-2xl border border-stone-800/80">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Dirección de Entrega</span>
              </label>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Calle y altura (ej: Av. Rivadavia 4520) *"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700/80 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 outline-none"
                />
                {errors.deliveryAddress && (
                  <p className="text-[11px] text-rose-400 font-medium">{errors.deliveryAddress}</p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Piso / Depto (opcional)"
                    value={deliveryFloorApt}
                    onChange={(e) => setDeliveryFloorApt(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700/80 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder-stone-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Timbre / Portero"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700/80 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder-stone-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                Método de Pago
              </label>
              <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Pago Seguro
              </span>
            </div>

            <div className="space-y-2">
              {/* Mercado Pago Highlighted Option */}
              <div
                onClick={() => setPaymentMethod('mercadopago_alias')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'mercadopago_alias'
                    ? 'bg-gradient-to-r from-sky-950/60 via-stone-900 to-amber-950/30 border-sky-400 shadow-lg shadow-sky-500/10'
                    : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#009ee3] flex items-center justify-center font-black text-white text-base shadow-md shrink-0">
                      MP
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">Mercado Pago / Transferencia</h4>
                        <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold px-2 py-0.5 rounded-full">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-0.5">
                        Te asignaremos 1 de nuestros 4 Alias oficiales al azar con QR instantáneo.
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'mercadopago_alias'}
                    onChange={() => setPaymentMethod('mercadopago_alias')}
                    className="accent-sky-400 mt-1"
                  />
                </div>

                {paymentMethod === 'mercadopago_alias' && (
                  <div className="mt-3 pt-3 border-t border-stone-800/80 text-[11px] text-stone-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Rotación activa de Alias (sin límites ni demoras de acreditación).</span>
                  </div>
                )}
              </div>

              {/* Cash on delivery */}
              <div
                onClick={() => setPaymentMethod('efectivo')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === 'efectivo'
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center text-amber-400">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Efectivo al recibir</h4>
                    <p className="text-[10px] text-stone-400">Abonás cuando el cadete llegue a tu puerta</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'efectivo'}
                  onChange={() => setPaymentMethod('efectivo')}
                  className="accent-amber-400"
                />
              </div>

              {/* Card / POS */}
              <div
                onClick={() => setPaymentMethod('pos_tarjeta')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === 'pos_tarjeta'
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center text-amber-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Tarjeta Débito / Crédito contra entrega</h4>
                    <p className="text-[10px] text-stone-400">El repartidor lleva terminal inalámbrica POS</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'pos_tarjeta'}
                  onChange={() => setPaymentMethod('pos_tarjeta')}
                  className="accent-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Pricing summary box */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 text-xs space-y-1.5">
            <div className="flex justify-between text-stone-400">
              <span>Subtotal ({cartItems.length} ítems):</span>
              <span className="font-bold text-stone-200">${subtotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>{deliveryMethod === 'delivery' ? 'Costo de envío:' : 'Retiro por local:'}</span>
              <span className="font-bold text-stone-200">
                {deliveryMethod === 'delivery' ? `$${deliveryFee.toLocaleString('es-AR')}` : 'Gratis'}
              </span>
            </div>
            <div className="flex justify-between text-stone-100 font-black text-sm pt-2 border-t border-stone-800">
              <span>Total final:</span>
              <span className="text-amber-400 text-lg font-heading">${total.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#f88d63] to-[#fa9d79] hover:from-[#f77e50] hover:to-[#f88d63] text-[#1b2827] font-black py-4 px-6 rounded-2xl shadow-xl shadow-[#f88d63]/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50 font-['Fredoka'] text-sm tracking-wide"
          >
            <span>{paymentMethod === 'mercadopago_alias' ? 'Confirmar y Ver Alias Mercado Pago' : 'Confirmar Pedido Punto Morfi'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </form>
      </div>
    </div>
  );
};
