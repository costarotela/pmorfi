import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { storageService } from '../../services/storage';
import { soundEffects } from '../../services/sound';
import { generateKitchenTicketPDF } from '../../services/pdfTicket';
import {
  Banknote,
  Bike,
  Store,
  CheckCircle2,
  Printer,
  Download,
  MessageCircle,
  Clock,
  Sparkles,
  Phone,
  MapPin,
  Flame,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface CounterCashierViewProps {
  orders: Order[];
  onOrderUpdated: () => void;
  onOpenPrintModal: (order: Order) => void;
}

export const CounterCashierView: React.FC<CounterCashierViewProps> = ({
  orders,
  onOrderUpdated,
  onOpenPrintModal,
}) => {
  const [filter, setFilter] = useState<'all' | 'por_cobrar' | 'listos' | 'en_camino'>('listos');

  const filteredOrders = orders.filter((o) => {
    if (o.status === 'cancelado') return false;
    if (filter === 'por_cobrar') return o.status === 'pendiente_pago';
    if (filter === 'listos') return o.status === 'en_camino'; // Cocina lo marcó listo para despacho
    if (filter === 'en_camino') return o.status === 'en_camino' || o.status === 'entregado';
    return true;
  });

  const handleConfirmPayment = (order: Order) => {
    storageService.updateOrderStatus(order.id, 'confirmado', 'Pago confirmado en caja');
    soundEffects.playPaymentSuccessChime();
    onOrderUpdated();
  };

  const handleDispatchDelivery = (order: Order) => {
    // Delivery dispatched
    storageService.updateOrderStatus(order.id, 'en_camino', 'Pedido entregado al cadete. En viaje a domicilio');
    soundEffects.playStatusUpdateChime();
    onOrderUpdated();

    // Option to notify customer
    const text = encodeURIComponent(
      `Hola ${order.customerName}! Tu pedido ${order.orderNumber} de Punto Morfi acaba de salir con el cadete hacia tu dirección (${order.deliveryAddress}).`
    );
    window.open(`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const handleCallPickupCustomer = (order: Order) => {
    soundEffects.playNewOrderBell();
    // Notify pickup customer via WhatsApp
    const text = encodeURIComponent(
      `¡Hola ${order.customerName}! Tu pedido ${order.orderNumber} en Punto Morfi YA ESTÁ LISTO en el mostrador para retirar. ¡Te esperamos!`
    );
    window.open(`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const handleMarkDelivered = (order: Order) => {
    storageService.updateOrderStatus(order.id, 'entregado', 'Pedido completado y entregado');
    soundEffects.playPaymentSuccessChime();
    onOrderUpdated();
  };

  const handleSendToCadete = (order: Order) => {
    const text = encodeURIComponent(
      `PEDIDO CADETE PUNTO MORFI:\nOrden: ${order.orderNumber}\nCliente: ${order.customerName}\nTeléfono: ${order.customerPhone}\nDirección: ${order.deliveryAddress} ${order.deliveryFloorApt || ''}\nNotas: ${order.deliveryNotes || 'Sin notas'}\nCobrar: ${order.paymentMethod === 'efectivo' ? `$${order.total.toLocaleString('es-AR')}` : 'YA ABONADO'}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner */}
      <div className="bg-[#192625] p-6 rounded-3xl border border-[#2d4240] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#f88d63] animate-ping" />
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Fredoka'] flex items-center gap-2">
              <span>Atención al Cliente, Caja & Despacho</span>
              <span className="text-xs bg-[#e2e663] text-[#1b2827] px-2.5 py-0.5 rounded-full font-mono uppercase font-black">
                Mostrador
              </span>
            </h2>
          </div>
          <p className="text-xs text-[#8daaa8] mt-1">
            Cobro en mostrador, despacho a cadetes para envíos y entrega a clientes en el local.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#14201f] p-1.5 rounded-2xl border border-[#2d4240] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter('listos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all font-['Fredoka'] ${
              filter === 'listos' ? 'bg-[#f88d63] text-[#1b2827] shadow-md' : 'text-[#8daaa8] hover:text-white'
            }`}
          >
            🔥 Listos para Despacho ({orders.filter((o) => o.status === 'en_camino').length})
          </button>
          <button
            onClick={() => setFilter('por_cobrar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all font-['Fredoka'] ${
              filter === 'por_cobrar' ? 'bg-[#e2e663] text-[#1b2827] shadow-md' : 'text-[#8daaa8] hover:text-white'
            }`}
          >
            💵 Por Cobrar ({orders.filter((o) => o.status === 'pendiente_pago').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all font-['Fredoka'] ${
              filter === 'all' ? 'bg-[#759694] text-white shadow-md' : 'text-[#8daaa8] hover:text-white'
            }`}
          >
            Todos ({orders.filter((o) => o.status !== 'cancelado').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-[#182524] rounded-3xl border border-[#2d4240] space-y-3">
          <CheckCircle2 className="w-12 h-12 text-[#759694] mx-auto stroke-1" />
          <h3 className="text-lg font-black text-stone-200 font-['Fredoka']">No hay pedidos pendientes en esta sección</h3>
          <p className="text-xs text-[#8daaa8]">Los pedidos listos en cocina aparecerán aquí automáticamente para ser despachados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredOrders.map((order) => {
            const isDelivery = order.deliveryMethod === 'delivery';
            const isPaymentPending = order.status === 'pendiente_pago';
            const isReadyFromKitchen = order.status === 'en_camino';
            const isDelivered = order.status === 'entregado';

            return (
              <div
                key={order.id}
                className={`bg-[#1e2d2c] rounded-3xl border p-5 shadow-xl flex flex-col justify-between transition-all ${
                  isReadyFromKitchen
                    ? 'border-[#f88d63] ring-1 ring-[#f88d63]/40'
                    : 'border-[#2d4240]'
                }`}
              >
                <div>
                  {/* Order Top Bar */}
                  <div className="flex items-start justify-between border-b border-[#2d4240] pb-3 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-white font-['Fredoka'] tracking-wide">
                          {order.orderNumber}
                        </span>
                        {isDelivery ? (
                          <span className="bg-[#f88d63]/20 text-[#f88d63] border border-[#f88d63]/40 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 font-['Fredoka']">
                            <Bike className="w-3.5 h-3.5" /> ENVÍO / CADETE
                          </span>
                        ) : (
                          <span className="bg-[#e2e663]/20 text-[#e2e663] border border-[#e2e663]/40 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 font-['Fredoka']">
                            <Store className="w-3.5 h-3.5" /> RETIRO EN MOSTRADOR
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#8daaa8] block mt-1">
                        Cliente: <strong className="text-white">{order.customerName}</strong> ({order.customerPhone})
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-[#e2e663] font-['Fredoka'] block">
                        ${order.total.toLocaleString('es-AR')}
                      </span>
                      <span className="text-[10px] text-[#8daaa8] uppercase font-bold">
                        {order.paymentMethod === 'mercadopago_alias' ? 'Mercado Pago' : order.paymentMethod}
                      </span>
                    </div>
                  </div>

                  {/* Customer Delivery info */}
                  {isDelivery && order.deliveryAddress && (
                    <div className="bg-[#14201f] p-3 rounded-2xl border border-[#263736] my-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <MapPin className="w-4 h-4 text-[#f88d63]" />
                        <span>{order.deliveryAddress}</span>
                        {order.deliveryFloorApt && <span>({order.deliveryFloorApt})</span>}
                      </div>
                      {order.deliveryNotes && (
                        <p className="text-[11px] text-[#8daaa8] italic pl-5">
                          Nota: {order.deliveryNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Items Brief */}
                  <div className="py-3 text-xs space-y-1 text-stone-200">
                    {order.items.map((it) => (
                      <div key={it.id} className="flex justify-between items-center text-[12px]">
                        <span>
                          <strong className="text-[#e2e663] font-['Fredoka']">{it.quantity}x</strong> {it.menuItem.name}
                        </span>
                        <span className="text-[#8daaa8]">${it.itemTotalPrice.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mercado Pago details if used */}
                  {order.paymentMethod === 'mercadopago_alias' && order.assignedAlias && (
                    <div className="bg-[#009ee3]/10 border border-[#009ee3]/30 rounded-xl p-2.5 my-2 text-xs flex items-center justify-between text-sky-200">
                      <div>
                        <span className="text-[10px] text-sky-300 block">Alias MP Asignado:</span>
                        <span className="font-mono font-bold">{order.assignedAlias.alias}</span>
                      </div>
                      <div className="text-right">
                        {order.paymentReference ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded font-bold">
                            Ref: {order.paymentReference}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-300 font-bold">Sin ref aún</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dispatch & Cashier Actions */}
                <div className="pt-3 border-t border-[#2d4240] space-y-2.5">
                  {/* Ticket Print & PDF row */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generateKitchenTicketPDF(order, 'cliente')}
                      className="flex-1 bg-[#243635] hover:bg-[#2c4241] text-[#e2e663] border border-[#364e4c] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Ticket PDF</span>
                    </button>
                    <button
                      onClick={() => onOpenPrintModal(order)}
                      className="flex-1 bg-[#243635] hover:bg-[#2c4241] text-stone-200 border border-[#364e4c] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir Comanda</span>
                    </button>
                  </div>

                  {/* Payment pending step */}
                  {isPaymentPending && (
                    <button
                      onClick={() => handleConfirmPayment(order)}
                      className="w-full bg-[#e2e663] hover:bg-[#edf169] text-[#1b2827] font-black py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-wide transition-all shadow-md font-['Fredoka']"
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Registrar Cobro / Confirmar Pago</span>
                    </button>
                  )}

                  {/* Ready from kitchen -> Dispatching */}
                  {isReadyFromKitchen && (
                    <div className="space-y-2">
                      {isDelivery ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSendToCadete(order)}
                            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4 text-emerald-400" />
                            <span>Enviar datos al Cadete</span>
                          </button>

                          <button
                            onClick={() => handleDispatchDelivery(order)}
                            className="bg-gradient-to-r from-[#f88d63] to-[#fa9d79] hover:from-[#f77e50] hover:to-[#f88d63] text-[#1b2827] font-black py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg font-['Fredoka']"
                          >
                            <Bike className="w-4 h-4 stroke-[2.5]" />
                            <span>Despachar con Cadete</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            onClick={() => handleCallPickupCustomer(order)}
                            className="bg-[#e2e663] hover:bg-[#edf169] text-[#1b2827] font-black py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md font-['Fredoka']"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Avisar para Retirar</span>
                          </button>

                          <button
                            onClick={() => handleMarkDelivered(order)}
                            className="bg-gradient-to-r from-[#f88d63] to-[#fa9d79] hover:from-[#f77e50] hover:to-[#f88d63] text-[#1b2827] font-black py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md font-['Fredoka']"
                          >
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                            <span>Entregar en Mano</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Final mark delivered if still open */}
                  {!isDelivered && !isReadyFromKitchen && !isPaymentPending && (
                    <button
                      onClick={() => handleMarkDelivered(order)}
                      className="w-full bg-[#243635] hover:bg-emerald-600/30 hover:border-emerald-500/40 text-stone-200 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-[#364e4c]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Marcar Pedido como Finalizado / Entregado</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
