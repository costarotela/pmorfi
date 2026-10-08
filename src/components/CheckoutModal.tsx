import React, { useState } from 'react';
import { CartItem, DeliveryMethod, PaymentMethod, Order } from '../types';
import { storageService } from '../services/storage';
import { deliveryService } from '../services/deliveryService';
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
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  MessageSquare,
  AlertCircle,
  Clock,
  Navigation,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  deliveryMethod: DeliveryMethod;
  onOrderCreated: (order: Order) => void;
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  deliveryMethod: initialDeliveryMethod,
  onOrderCreated,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(initialDeliveryMethod);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFloorApt, setDeliveryFloorApt] = useState('');
  const [customDistanceKm, setCustomDistanceKm] = useState<number | undefined>(undefined);
  const [customerObservations, setCustomerObservations] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago_alias');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Live schedule & cutoff time check
  const scheduleCheck = deliveryService.checkStoreSchedule();

  // Live delivery zone check
  const zoneValidation = deliveryService.validateDeliveryZone(deliveryAddress, customDistanceKm);

  const subtotal = cartItems.reduce((acc, item) => acc + item.itemTotalPrice, 0);
  const deliveryFee =
    deliveryMethod === 'delivery'
      ? zoneValidation.inZone
        ? zoneValidation.deliveryFee
        : 1500
      : 0;
  const total = subtotal + deliveryFee;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // 1. Check schedule & cutoff time
    if (!scheduleCheck.canAcceptOrders) {
      newErrors.schedule = scheduleCheck.message;
    }

    if (cartItems.length === 0) {
      newErrors.cart = 'El carrito no tiene productos';
    }
    if (!customerName.trim()) {
      newErrors.customerName = 'Por favor ingresá tu nombre';
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      newErrors.customerPhone = 'Ingresá un teléfono o WhatsApp válido';
    }
    if (deliveryMethod === 'delivery') {
      if (!deliveryAddress.trim()) {
        newErrors.deliveryAddress = 'Ingresá tu calle y altura para el envío';
      } else if (!zoneValidation.canDeliver) {
        newErrors.deliveryAddress =
          zoneValidation.reason || 'Dirección fuera del radio de reparto para cadetes.';
      }
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
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress.trim() : undefined,
        deliveryFloorApt: deliveryMethod === 'delivery' ? deliveryFloorApt.trim() : undefined,
        deliveryNotes: customerObservations.trim() || undefined,
        items: cartItems,
        subtotal,
        deliveryFee,
        total,
        status: paymentMethod === 'mercadopago_alias' ? 'pendiente_pago' : 'confirmado',
        paymentMethod,
        assignedAlias,
        estimatedDeliveryMinutes:
          deliveryMethod === 'delivery' ? zoneValidation.estimatedMinutes || 35 : 20,
        vehicleType: deliveryMethod === 'delivery' ? zoneValidation.vehicleType || undefined : 'local',
        deliveryZoneName: deliveryMethod === 'delivery' ? zoneValidation.zone?.name : undefined,
        deliveryDistanceKm: deliveryMethod === 'delivery' ? zoneValidation.distanceKm : undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1e2d2c] border border-[#2d4240] rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#2d4240] flex items-center justify-between bg-[#152221]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#759694]/20 border border-[#759694]/40 flex items-center justify-center text-[#f88d63] font-black shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-['Fredoka']">Punto Morfi - Confirmar Pedido</h3>
              <p className="text-xs text-[#8daaa8]">Revisá tu carrito, agregá notas y elegí medio de pago</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Schedule / Cutoff Time Alert Banner */}
          {!scheduleCheck.canAcceptOrders ? (
            <div className="bg-rose-500/15 border border-rose-500/40 p-4 rounded-2xl flex items-center gap-3 text-rose-300">
              <Clock className="w-5 h-5 shrink-0 text-rose-400" />
              <div className="text-xs">
                <strong className="block font-['Fredoka'] text-sm text-white">Cocina Fuera de Horario / Pedidos Cerrados</strong>
                <span>{scheduleCheck.message}</span>
              </div>
            </div>
          ) : scheduleCheck.statusTag === 'por_cerrar' ? (
            <div className="bg-amber-500/15 border border-amber-500/40 p-3.5 rounded-2xl flex items-center gap-3 text-amber-200">
              <Clock className="w-5 h-5 shrink-0 text-amber-400 animate-pulse" />
              <div className="text-xs">
                <strong className="block font-['Fredoka'] text-amber-400">⚡ ¡Atención! Últimos minutos para pedir</strong>
                <span>Quedan {scheduleCheck.minutesUntilCutoff} minutos antes del horario tope de cocina ({scheduleCheck.currentShift?.cutoffTime} hs).</span>
              </div>
            </div>
          ) : null}

          {/* =========================================================
              1. EDITABLE CART SUMMARY DIRECTLY IN CHECKOUT
              ========================================================= */}
          <div className="bg-[#152221] p-4 rounded-3xl border border-[#2d4240] space-y-3">
            <div className="flex items-center justify-between border-b border-[#2b3e3d] pb-2.5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#f88d63]" />
                <h4 className="text-xs font-black text-white font-['Fredoka'] uppercase tracking-wider">
                  Tu Carrito ({cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'})
                </h4>
              </div>
              <span className="text-[11px] text-[#8daaa8]">
                Podés modificar cantidades o eliminar
              </span>
            </div>

            {cartItems.length === 0 ? (
              <div className="py-6 text-center text-[#8daaa8] space-y-2">
                <p className="text-xs">No te quedan productos en el carrito.</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#f88d63] text-[#1b2827] text-xs font-black rounded-xl font-['Fredoka']"
                >
                  Volver al Menú
                </button>
              </div>
            ) : (
              <div className="space-y-3 divide-y divide-[#243534]">
                {cartItems.map((item) => (
                  <div key={item.id} className="pt-2.5 first:pt-0 flex items-start gap-3">
                    <img
                      src={item.menuItem.image}
                      alt={item.menuItem.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#2d4240]"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-bold text-white text-xs truncate">
                          {item.menuItem.name}
                        </h5>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-[#8daaa8] hover:text-rose-400 p-1 transition-colors"
                          title="Eliminar este producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Chosen Variants / Options */}
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <p className="text-[11px] text-[#e2e663] font-medium leading-tight mt-0.5">
                          {item.selectedOptions.map((opt) => opt.selectedOption.name).join(' • ')}
                        </p>
                      )}

                      {/* Individual item instruction */}
                      {item.specialInstructions && (
                        <p className="text-[10px] text-[#fa9d79] italic mt-0.5">
                          &quot;{item.specialInstructions}&quot;
                        </p>
                      )}

                      {/* Quantity Controls & Subtotal */}
                      <div className="flex items-center justify-between mt-2 pt-1">
                        <div className="flex items-center bg-[#1b2827] border border-[#2d4240] rounded-xl p-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[#8daaa8] hover:text-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-black text-xs text-[#e2e663] font-['Fredoka']">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[#8daaa8] hover:text-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-black text-white text-xs font-['Fredoka']">
                          ${item.itemTotalPrice.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =========================================================
              2. IDENTIFIED SECTION FOR OBSERVATIONS & NOTES (Requested)
              ========================================================= */}
          <div className="bg-[#152221] p-4 rounded-3xl border border-[#f88d63]/50 shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#f88d63] font-['Fredoka'] flex items-center gap-2 uppercase tracking-wide">
                <MessageSquare className="w-4 h-4 text-[#f88d63]" />
                <span>Observaciones & Aclaraciones para el Pedido</span>
              </label>
              <span className="text-[10px] bg-[#f88d63]/20 text-[#fa9d79] px-2 py-0.5 rounded-full font-bold">
                Muy Recomendado
              </span>
            </div>
            <p className="text-[11px] text-[#8daaa8] leading-tight">
              Indicá cualquier aclaración sobre la preparación de la comida, aderezos o indicaciones para el repartidor (timbre, puerta, etc.):
            </p>
            <textarea
              placeholder="Ej: Sin cebolla la fugazzeta, carne bien cocida, mandar mayonesa extra, el timbre está roto por favor aplaudir o llamar al llegar..."
              value={customerObservations}
              onChange={(e) => setCustomerObservations(e.target.value)}
              className="w-full bg-[#1b2827] border border-[#2d4240] focus:border-[#f88d63] rounded-2xl p-3 text-xs text-white placeholder-[#759694] outline-none h-20 resize-none"
            />
          </div>

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
                    ? 'bg-[#f88d63]/15 border-[#f88d63] text-white shadow-md'
                    : 'bg-[#152221] border-[#2b3e3d] text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className={`p-2 rounded-xl ${deliveryMethod === 'delivery' ? 'bg-[#f88d63] text-[#1b2827]' : 'bg-[#1b2827] text-stone-400'}`}>
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold font-['Fredoka']">Delivery a Domicilio</div>
                  <div className="text-[11px] text-[#8daaa8]">
                    {zoneValidation.inZone
                      ? `Costo: $${zoneValidation.deliveryFee.toLocaleString('es-AR')} (~${zoneValidation.estimatedMinutes} min)`
                      : 'Costo según radio (~35 min)'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  deliveryMethod === 'pickup'
                    ? 'bg-[#e2e663]/15 border-[#e2e663] text-white shadow-md'
                    : 'bg-[#152221] border-[#2b3e3d] text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className={`p-2 rounded-xl ${deliveryMethod === 'pickup' ? 'bg-[#e2e663] text-[#1b2827]' : 'bg-[#1b2827] text-stone-400'}`}>
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold font-['Fredoka']">Retiro en Local</div>
                  <div className="text-[11px] text-[#8daaa8]">Sin costo (~20 min)</div>
                </div>
              </button>
            </div>
          </div>

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
                    className="w-full bg-[#152221] border border-[#2b3e3d] focus:border-[#f88d63] rounded-xl pl-10 pr-3 py-2.5 text-xs text-stone-100 placeholder-stone-500 outline-none"
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
                    className="w-full bg-[#152221] border border-[#2b3e3d] focus:border-[#f88d63] rounded-xl pl-10 pr-3 py-2.5 text-xs text-stone-100 placeholder-stone-500 outline-none"
                  />
                </div>
                {errors.customerPhone && (
                  <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.customerPhone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Address & Zone Verification (if Delivery) */}
          {deliveryMethod === 'delivery' && (
            <div className="space-y-3 bg-[#152221] p-4 rounded-3xl border border-[#2b3e3d]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5 font-['Fredoka']">
                  <MapPin className="w-3.5 h-3.5 text-[#f88d63]" />
                  <span>Dirección de Entrega y Validación de Radio</span>
                </label>
                <span className="text-[10px] text-[#8daaa8]">
                  Radio local: hasta 5.5 km
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Calle y altura (ej: Av. Pellegrini 2100) *"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-[#1b2827] border border-[#2d4240] focus:border-[#f88d63] rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 outline-none"
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
                    className="w-full bg-[#1b2827] border border-[#2d4240] focus:border-[#f88d63] rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder-stone-500 outline-none"
                  />
                  <div className="bg-[#1b2827] border border-[#2d4240] rounded-xl px-3 py-1 flex items-center justify-between text-[11px]">
                    <span className="text-[#8daaa8]">Distancia:</span>
                    <strong className="text-white font-mono">{zoneValidation.distanceKm} km</strong>
                  </div>
                </div>

                {/* Quick distance adjustment / validation pills */}
                <div className="pt-1 flex items-center gap-1.5 overflow-x-auto text-[10px]">
                  <span className="text-[#8daaa8] shrink-0 font-bold">Probar radio:</span>
                  {[
                    { label: '1.0 km 🚲', km: 1.0 },
                    { label: '2.2 km 🚲', km: 2.2 },
                    { label: '3.5 km 🛵', km: 3.5 },
                    { label: '5.0 km 🛵', km: 5.0 },
                    { label: '7.0 km ⚠️', km: 7.0 },
                  ].map((btn) => (
                    <button
                      key={btn.km}
                      type="button"
                      onClick={() => setCustomDistanceKm(btn.km)}
                      className={`px-2.5 py-1 rounded-lg border font-mono transition-colors shrink-0 ${
                        customDistanceKm === btn.km
                          ? 'bg-[#f88d63] text-[#1b2827] border-[#f88d63] font-bold'
                          : 'bg-[#1b2827] text-stone-300 border-[#2d4240] hover:text-white'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Live Zone Result Banner */}
                <div className={`p-3 rounded-2xl border flex items-start gap-2.5 transition-all text-xs ${
                  zoneValidation.canDeliver
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                }`}>
                  {zoneValidation.canDeliver ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <strong className={`font-['Fredoka'] ${zoneValidation.canDeliver ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {zoneValidation.message}
                      </strong>
                      {zoneValidation.canDeliver && (
                        <span className="font-mono font-bold text-[#e2e663] text-xs">
                          +${zoneValidation.deliveryFee.toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>

                    {zoneValidation.canDeliver ? (
                      <p className="text-[11px] text-[#8daaa8] mt-0.5">
                        {zoneValidation.vehicleType === 'moto'
                          ? '🛵 Asignado cadete en motocicleta para radio extendido (~40 min)'
                          : '🚲 Asignado cadete en bicicleta para las inmediaciones (~25 min)'}
                      </p>
                    ) : (
                      <div className="mt-1 space-y-1.5">
                        <p className="text-[11px] text-rose-300">
                          {zoneValidation.reason}
                        </p>
                        <button
                          type="button"
                          onClick={() => setDeliveryMethod('pickup')}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold font-['Fredoka'] flex items-center gap-1 shadow-md"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>Cambiar a Retiro en Local (Sin costo)</span>
                        </button>
                      </div>
                    )}
                  </div>
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
              <span className="text-[11px] text-[#e2e663] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Pago Seguro
              </span>
            </div>

            <div className="space-y-2">
              {/* Mercado Pago Highlighted Option */}
              <div
                onClick={() => setPaymentMethod('mercadopago_alias')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'mercadopago_alias'
                    ? 'bg-gradient-to-r from-sky-950/60 via-[#152221] to-[#1e2d2c] border-sky-400 shadow-lg shadow-sky-500/10'
                    : 'bg-[#152221] border-[#2b3e3d] hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#009ee3] flex items-center justify-center font-black text-white text-base shadow-md shrink-0">
                      MP
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white font-['Fredoka']">Mercado Pago / Transferencia</h4>
                        <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold px-2 py-0.5 rounded-full">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-0.5">
                        Te asignaremos 1 de nuestros Alias oficiales al azar con QR instantáneo.
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
                    ? 'bg-[#f88d63]/15 border-[#f88d63] text-white'
                    : 'bg-[#152221] border-[#2b3e3d] text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1b2827] flex items-center justify-center text-[#f88d63]">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Efectivo al recibir</h4>
                    <p className="text-[10px] text-stone-400">Abonás cuando el cadete llegue a tu puerta o retires</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'efectivo'}
                  onChange={() => setPaymentMethod('efectivo')}
                  className="accent-[#f88d63]"
                />
              </div>

              {/* Card / POS */}
              <div
                onClick={() => setPaymentMethod('pos_tarjeta')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === 'pos_tarjeta'
                    ? 'bg-[#e2e663]/15 border-[#e2e663] text-white'
                    : 'bg-[#152221] border-[#2b3e3d] text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1b2827] flex items-center justify-center text-[#e2e663]">
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
                  className="accent-[#e2e663]"
                />
              </div>
            </div>
          </div>

          {/* Pricing summary box */}
          <div className="bg-[#152221] p-4 rounded-2xl border border-[#2b3e3d] text-xs space-y-1.5">
            <div className="flex justify-between text-stone-400">
              <span>Subtotal ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} unidades):</span>
              <span className="font-bold text-stone-200">${subtotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>{deliveryMethod === 'delivery' ? 'Costo de envío:' : 'Retiro por local:'}</span>
              <span className="font-bold text-stone-200">
                {deliveryMethod === 'delivery' ? `$${deliveryFee.toLocaleString('es-AR')}` : 'Gratis'}
              </span>
            </div>
            <div className="flex justify-between text-stone-100 font-black text-sm pt-2 border-t border-[#2b3e3d]">
              <span>Total final:</span>
              <span className="text-[#e2e663] text-lg font-['Fredoka']">${total.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || cartItems.length === 0}
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
