import React from 'react';
import { Order, OrderStatus } from '../types';
import { LiveTrackingMap } from './delivery/LiveTrackingMap';
import {
  X,
  Clock,
  CheckCircle2,
  Flame,
  Bike,
  Check,
  CreditCard,
  MessageCircle,
  MapPin,
  Store,
  Receipt,
  Sparkles,
} from 'lucide-react';

interface OrderTrackingModalProps {
  order: Order | null;
  onClose: () => void;
  onOpenPaymentView: () => void;
}

const STEPS: { status: OrderStatus; label: string; sublabel: string; icon: typeof CheckCircle2 }[] = [
  {
    status: 'pendiente_pago',
    label: 'Pedido Recibido',
    sublabel: 'Esperando acreditación o verificación',
    icon: Clock,
  },
  {
    status: 'confirmado',
    label: 'Confirmado por el Local',
    sublabel: 'Comanda ingresada al sistema',
    icon: CheckCircle2,
  },
  {
    status: 'en_cocina',
    label: 'En Preparación / Horno',
    sublabel: 'Cocinando al momento con ingredientes frescos',
    icon: Flame,
  },
  {
    status: 'en_camino',
    label: 'En Reparto con el Cadete',
    sublabel: 'En viaje hacia tu domicilio',
    icon: Bike,
  },
  {
    status: 'entregado',
    label: '¡Pedido Entregado!',
    sublabel: 'Buen provecho y que lo disfrutes',
    icon: Check,
  },
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  onClose,
  onOpenPaymentView,
}) => {
  if (!order) return null;

  const currentStepIndex = (() => {
    switch (order.status) {
      case 'pendiente_pago':
        return 0;
      case 'confirmado':
        return 1;
      case 'en_cocina':
        return 2;
      case 'en_camino':
        return 3;
      case 'entregado':
        return 4;
      case 'cancelado':
        return -1;
      default:
        return 0;
    }
  })();

  const whatsappMsg = encodeURIComponent(
    `Hola Punto Morfi! Quisiera consultar por el estado de mi pedido ${order.orderNumber} a nombre de ${order.customerName}.`
  );
  const whatsappUrl = `https://wa.me/5491144556677?text=${whatsappMsg}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1e2d2c] border border-[#2d4240] rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#2d4240] bg-[#152221] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[#f88d63]/20 text-[#f88d63] border border-[#f88d63]/40 font-mono">
                {order.orderNumber}
              </span>
              <span className="text-xs text-[#8daaa8] font-medium">
                {order.deliveryMethod === 'delivery' ? '🛵 Delivery' : '🏪 Retiro en local'}
              </span>
            </div>
            <h3 className="text-xl font-black text-white mt-1 font-['Fredoka']">
              Seguimiento Punto Morfi
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8daaa8] hover:text-white hover:bg-[#243635] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-200">
          {/* Estimated Time Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-black flex items-center justify-center shadow-md">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block">
                  Tiempo Estimado
                </span>
                <span className="text-lg font-black text-white font-heading">
                  {order.status === 'entregado' ? '¡Ya Entregado!' : `~${order.estimatedDeliveryMinutes} minutos`}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-stone-400 block">Cliente:</span>
              <span className="text-xs font-bold text-stone-200">{order.customerName}</span>
            </div>
          </div>

          {/* Interactive Live Tracking Map (Uber style) for delivery orders */}
          {order.deliveryMethod === 'delivery' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5 font-['Fredoka']">
                  <Bike className="w-4 h-4 text-[#f88d63]" />
                  <span>Seguimiento del Envío en Tiempo Real (GPS Cadete)</span>
                </h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  En Vivo
                </span>
              </div>
              <LiveTrackingMap order={order} />
            </div>
          )}

          {/* Stepper Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Estado en Tiempo Real
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800">
              {STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const isUpcoming = idx > currentStepIndex;
                const StepIcon = step.icon;

                return (
                  <div key={step.status} className="relative flex items-start gap-4">
                    {/* Bullet marker */}
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-stone-950'
                          : isCurrent
                          ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-lg shadow-amber-500/40 scale-110'
                          : 'bg-stone-900 border-stone-700 text-stone-600'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-stone-950' : 'bg-transparent'}`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-bold flex items-center gap-2 ${
                            isCurrent
                              ? 'text-amber-400'
                              : isCompleted
                              ? 'text-stone-200'
                              : 'text-stone-500'
                          }`}
                        >
                          <StepIcon className="w-4 h-4" />
                          <span>{step.label}</span>
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                            En Curso
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${isCurrent ? 'text-stone-300' : 'text-stone-500'}`}>
                        {step.sublabel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment & Assigned MP Alias Card */}
          {order.paymentMethod === 'mercadopago_alias' && order.assignedAlias && (
            <div className="bg-stone-950 p-4 rounded-2xl border border-sky-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#009ee3] text-white font-black text-xs flex items-center justify-center">
                    MP
                  </div>
                  <span className="text-xs font-bold text-sky-300">Mercado Pago Asignado</span>
                </div>
                <button
                  onClick={onOpenPaymentView}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 underline"
                >
                  Ver Datos de Pago
                </button>
              </div>

              <div className="bg-stone-900 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px]">Alias asignado al azar:</span>
                  <span className="font-mono font-black text-amber-400 text-sm select-all">
                    {order.assignedAlias.alias}
                  </span>
                  <span className="text-[11px] text-stone-400 block">Titular: {order.assignedAlias.holder}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 block text-[10px]">Estado pago:</span>
                  <span className={`font-bold ${order.status === 'pendiente_pago' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {order.status === 'pendiente_pago' ? 'Pendiente' : 'Acreditado'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary Dropdown */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3">
            <h5 className="text-xs font-bold text-stone-300 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Detalle de la Comanda</span>
            </h5>

            <div className="space-y-2 text-xs divide-y divide-stone-850">
              {order.items.map((item) => (
                <div key={item.id} className="pt-2 flex justify-between items-start">
                  <div>
                    <span className="font-bold text-stone-200">
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <p className="text-[10px] text-stone-400">
                        {item.selectedOptions.map((o) => o.selectedOption.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-stone-300">
                    ${item.itemTotalPrice.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>

            {order.deliveryNotes && (
              <div className="bg-[#152221] p-2.5 rounded-xl border border-[#f88d63]/40 text-[11px] space-y-0.5">
                <span className="font-bold text-[#f88d63] block">📝 Tus observaciones para la cocina:</span>
                <p className="text-stone-300 italic">&quot;{order.deliveryNotes}&quot;</p>
              </div>
            )}

            <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-xs font-black text-white">
              <span>Total Abonado / A Abonar:</span>
              <span className="text-amber-400 text-base font-heading">${order.total.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Contact Support */}
          <div className="flex gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Consultar por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
