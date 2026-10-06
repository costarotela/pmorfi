import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { storageService } from '../../services/storage';
import { generateKitchenTicketPDF } from '../../services/pdfTicket';
import {
  Clock,
  Flame,
  Bike,
  CheckCircle2,
  AlertCircle,
  Printer,
  Download,
  MessageCircle,
  Volume2,
  VolumeX,
  CreditCard,
  PlusCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { PrintTicketModal } from './PrintTicketModal';

interface OrdersKanbanProps {
  orders: Order[];
  onOrderUpdated: () => void;
  onGenerateDemoOrder: () => void;
}

export const OrdersKanban: React.FC<OrdersKanbanProps> = ({
  orders,
  onOrderUpdated,
  onGenerateDemoOrder,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const handleAdvanceStatus = (order: Order) => {
    let nextStatus: OrderStatus = 'confirmado';
    let note = '';

    if (order.status === 'pendiente_pago') {
      nextStatus = 'en_cocina';
      note = 'Pago verificado en administración y comanda enviada a cocina';
    } else if (order.status === 'confirmado') {
      nextStatus = 'en_cocina';
      note = 'Iniciando cocción en cocina';
    } else if (order.status === 'en_cocina') {
      nextStatus = 'en_camino';
      note = 'Comida lista. Despachado con el cadete';
    } else if (order.status === 'en_camino') {
      nextStatus = 'entregado';
      note = 'Pedido entregado en destino';
    }

    storageService.updateOrderStatus(order.id, nextStatus, note);
    onOrderUpdated();
  };

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('¿Estás seguro de cancelar este pedido?')) {
      storageService.updateOrderStatus(orderId, 'cancelado', 'Cancelado por administración');
      onOrderUpdated();
    }
  };

  const getNextActionLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pendiente_pago':
        return { label: 'Acreditar y Enviar a Cocina', icon: Flame, color: 'bg-emerald-500 hover:bg-emerald-400 text-stone-950' };
      case 'confirmado':
        return { label: 'Pasar a Cocina', icon: Flame, color: 'bg-orange-500 hover:bg-orange-400 text-stone-950' };
      case 'en_cocina':
        return { label: 'Despachar / En Camino', icon: Bike, color: 'bg-sky-500 hover:bg-sky-400 text-stone-950' };
      case 'en_camino':
        return { label: 'Marcar Entregado', icon: CheckCircle2, color: 'bg-emerald-500 hover:bg-emerald-400 text-stone-950' };
      default:
        return null;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pendiente_pago':
        return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">⏳ Pendiente Pago</span>;
      case 'confirmado':
        return <span className="bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">📋 Confirmado</span>;
      case 'en_cocina':
        return <span className="bg-orange-500/15 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">🍳 En Cocina</span>;
      case 'en_camino':
        return <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">🛵 En Camino</span>;
      case 'entregado':
        return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">✅ Entregado</span>;
      case 'cancelado':
        return <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">❌ Cancelado</span>;
    }
  };

  const handleSendWhatsAppNotification = (order: Order) => {
    let statusText = '';
    if (order.status === 'en_cocina') statusText = '¡tu comida casera ya está en el fuego/horno!';
    else if (order.status === 'en_camino') statusText = '¡tu pedido ya salió con el cadete hacia tu domicilio!';
    else if (order.status === 'entregado') statusText = '¡tu pedido ha sido entregado, que lo disfrutes!';
    else statusText = 'estamos procesando tu orden!';

    const text = encodeURIComponent(
      `Hola ${order.customerName}! Te avisamos desde Punto Morfi que tu pedido ${order.orderNumber} por $${order.total.toLocaleString('es-AR')}: ${statusText}`
    );
    window.open(`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-950 p-4 rounded-3xl border border-stone-800">
        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-xs text-stone-400 font-bold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'pendiente_pago', label: 'Pendientes' },
              { id: 'en_cocina', label: 'Cocina' },
              { id: 'en_camino', label: 'En Camino' },
              { id: 'entregado', label: 'Entregados' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === f.id
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-stone-900 border-stone-700 text-stone-300'
                : 'bg-stone-900 border-rose-500/30 text-rose-400'
            }`}
            title="Activar o desactivar sonido de comanda"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            <span className="hidden md:inline">{soundEnabled ? 'Sonido ON' : 'Silenciado'}</span>
          </button>

          <button
            onClick={onGenerateDemoOrder}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Simular Pedido</span>
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-stone-950 rounded-3xl border border-stone-800 space-y-3">
          <Clock className="w-12 h-12 text-stone-600 mx-auto" />
          <h4 className="text-base font-bold text-stone-300">No hay pedidos con este filtro</h4>
          <p className="text-xs text-stone-500">Probá cambiando el filtro o generá un nuevo pedido de prueba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const nextAction = getNextActionLabel(order.status);
            const isMp = order.paymentMethod === 'mercadopago_alias';

            return (
              <div
                key={order.id}
                className="bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-stone-850 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white font-mono">
                          {order.orderNumber}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <span className="text-[11px] text-stone-400 block mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {order.deliveryMethod === 'delivery' ? '🛵 Delivery' : '🏪 Retiro Local'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-amber-400 font-heading">
                        ${order.total.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="py-3 border-b border-stone-850 text-xs space-y-1">
                    <div className="font-bold text-stone-200">{order.customerName}</div>
                    <div className="text-stone-400 text-[11px] flex items-center justify-between">
                      <span>{order.customerPhone}</span>
                      <button
                        onClick={() => handleSendWhatsAppNotification(order)}
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </button>
                    </div>
                    {order.deliveryAddress && (
                      <div className="text-stone-300 text-[11px] bg-stone-900/80 p-2 rounded-xl mt-1 border border-stone-800">
                        <span className="font-bold">📍 {order.deliveryAddress}</span>
                        {order.deliveryFloorApt && <span> ({order.deliveryFloorApt})</span>}
                        {order.deliveryNotes && <p className="text-[10px] text-stone-400 mt-0.5 italic">Nota: {order.deliveryNotes}</p>}
                      </div>
                    )}
                  </div>

                  {/* Mercado Pago & Alias Used Indicator */}
                  <div className="py-2.5 border-b border-stone-850 text-[11px]">
                    {isMp ? (
                      <div className="bg-[#009ee3]/10 border border-[#009ee3]/30 rounded-xl p-2.5 space-y-1">
                        <div className="flex items-center justify-between font-bold text-sky-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-[#009ee3] text-white text-[9px] flex items-center justify-center font-black">MP</span>
                            <span>Cobro Mercado Pago</span>
                          </span>
                          <span className="text-[10px] uppercase">{order.status === 'pendiente_pago' ? 'Sin Confirmar' : 'Acreditado'}</span>
                        </div>
                        {order.assignedAlias && (
                          <div className="text-[10px] text-stone-300">
                            Alias: <strong className="text-amber-400 font-mono">{order.assignedAlias.alias}</strong> ({order.assignedAlias.holder})
                          </div>
                        )}
                        {order.paymentReference && (
                          <div className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded font-bold">
                            Comprobante: {order.paymentReference}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-stone-900 rounded-xl p-2 text-stone-400 flex items-center justify-between">
                        <span>Pago en mano:</span>
                        <strong className="text-stone-200 capitalize">{order.paymentMethod.replace('_', ' ')}</strong>
                      </div>
                    )}
                  </div>

                  {/* Items Summary */}
                  <div className="py-3 text-xs space-y-1.5">
                    {order.items.map((it) => (
                      <div key={it.id} className="flex justify-between items-start text-[11px]">
                        <span className="text-stone-300">
                          <strong className="text-amber-400">{it.quantity}x</strong> {it.menuItem.name}
                        </span>
                        <span className="text-stone-400 font-medium">
                          ${it.itemTotalPrice.toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-stone-850 flex items-center gap-2">
                  <button
                    onClick={() => generateKitchenTicketPDF(order, 'cocina')}
                    className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-[#e2e663] border border-stone-800 transition-colors"
                    title="Descargar Comanda PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSelectedTicketOrder(order)}
                    className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors"
                    title="Imprimir comanda térmica"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {nextAction && (
                    <button
                      onClick={() => handleAdvanceStatus(order)}
                      className={`flex-1 ${nextAction.color} font-black text-xs py-2.5 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95`}
                    >
                      <nextAction.icon className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{nextAction.label}</span>
                    </button>
                  )}

                  {order.status !== 'cancelado' && order.status !== 'entregado' && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-stone-500 hover:text-rose-400 p-2 text-[10px] font-bold"
                      title="Cancelar pedido"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Printer Modal */}
      {selectedTicketOrder && (
        <PrintTicketModal
          order={selectedTicketOrder}
          onClose={() => setSelectedTicketOrder(null)}
        />
      )}
    </div>
  );
};
