import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { storageService } from '../../services/storage';
import { soundEffects } from '../../services/sound';
import { generateKitchenTicketPDF } from '../../services/pdfTicket';
import {
  Flame,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Bell,
  Volume2,
  VolumeX,
  Bike,
  Store,
  ChevronRight,
  Maximize2,
  Sparkles,
} from 'lucide-react';

interface KitchenTabletViewProps {
  orders: Order[];
  onOrderUpdated: () => void;
  onOpenPrintModal: (order: Order) => void;
}

export const KitchenTabletView: React.FC<KitchenTabletViewProps> = ({
  orders,
  onOrderUpdated,
  onOpenPrintModal,
}) => {
  const [activeTab, setActiveTab] = useState<'activas' | 'en_cocina' | 'listas'>('activas');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Update clock every 20 seconds for elapsed minute timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(timer);
  }, []);

  const kitchenOrders = orders.filter((o) => {
    if (o.status === 'cancelado' || o.status === 'entregado') return false;
    if (activeTab === 'activas') return o.status === 'pendiente_pago' || o.status === 'confirmado' || o.status === 'en_cocina';
    if (activeTab === 'en_cocina') return o.status === 'en_cocina';
    if (activeTab === 'listas') return o.status === 'en_camino';
    return true;
  });

  const handleStartCooking = (order: Order) => {
    storageService.updateOrderStatus(order.id, 'en_cocina', 'Comanda tomada en cocina: cocinando');
    if (soundEnabled) soundEffects.playStatusUpdateChime();
    onOrderUpdated();
  };

  const handleMarkReady = (order: Order) => {
    storageService.updateOrderStatus(
      order.id,
      'en_camino',
      order.deliveryMethod === 'delivery'
        ? '¡Comida lista en cocina! Esperando cadete'
        : '¡Comida lista en cocina! Lista para entrega en mostrador'
    );
    if (soundEnabled) soundEffects.playNewOrderBell();
    onOrderUpdated();
  };

  const handleRingBell = () => {
    soundEffects.playNewOrderBell();
  };

  const getElapsedMinutes = (dateStr: string) => {
    const created = new Date(dateStr).getTime();
    return Math.max(1, Math.floor((now - created) / (1000 * 60)));
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Kitchen Tablet Header */}
      <div className="bg-[#192625] p-4 sm:p-6 rounded-3xl border border-[#2d4240] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#e2e663] animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Fredoka'] flex items-center gap-2">
              <span>Cocina & Comandas Digitales (KDS)</span>
              <span className="text-xs bg-[#f88d63] text-[#1b2827] px-2.5 py-0.5 rounded-full font-mono uppercase font-black">
                Tablet / Celular
              </span>
            </h2>
          </div>
          <p className="text-xs text-[#8daaa8] mt-1">
            Pantalla táctil para cocineros: comandas en tiempo real, tiempos de cocción y tickets.
          </p>
        </div>

        {/* Quick Tablet Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRingBell}
            className="bg-[#e2e663] hover:bg-[#edf169] text-[#1b2827] font-black text-xs px-3.5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg transition-all active:scale-95 font-['Fredoka']"
            title="Tocar campana de comanda"
          >
            <Bell className="w-4 h-4" />
            <span>Tocar Timbre</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-[#243635] border-[#364e4c] text-[#e2e663]'
                : 'bg-[#243635] border-rose-500/30 text-rose-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sonido ON' : 'Mudo'}</span>
          </button>

          {/* Tab Filter */}
          <div className="bg-[#152221] p-1 rounded-2xl border border-[#2b3e3d] flex items-center">
            <button
              onClick={() => setActiveTab('activas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all font-['Fredoka'] ${
                activeTab === 'activas' ? 'bg-[#f88d63] text-[#1b2827]' : 'text-[#8daaa8] hover:text-white'
              }`}
            >
              Nuevas & En Cocina ({orders.filter((o) => o.status === 'pendiente_pago' || o.status === 'confirmado' || o.status === 'en_cocina').length})
            </button>
            <button
              onClick={() => setActiveTab('en_cocina')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all font-['Fredoka'] ${
                activeTab === 'en_cocina' ? 'bg-[#e2e663] text-[#1b2827]' : 'text-[#8daaa8] hover:text-white'
              }`}
            >
              En Horno ({orders.filter((o) => o.status === 'en_cocina').length})
            </button>
            <button
              onClick={() => setActiveTab('listas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all font-['Fredoka'] ${
                activeTab === 'listas' ? 'bg-[#759694] text-white' : 'text-[#8daaa8] hover:text-white'
              }`}
            >
              Listas ({orders.filter((o) => o.status === 'en_camino').length})
            </button>
          </div>
        </div>
      </div>

      {/* Comandas Cards Grid - Touch Optimized */}
      {kitchenOrders.length === 0 ? (
        <div className="text-center py-20 bg-[#182524] rounded-3xl border border-[#2d4240] space-y-3">
          <Clock className="w-12 h-12 text-[#759694] mx-auto stroke-1" />
          <h3 className="text-lg font-black text-stone-200 font-['Fredoka']">¡Todo al día en la cocina!</h3>
          <p className="text-xs text-[#8daaa8]">No hay pedidos pendientes de cocción en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kitchenOrders.map((order) => {
            const elapsed = getElapsedMinutes(order.createdAt);
            const isCooking = order.status === 'en_cocina';
            const isReady = order.status === 'en_camino';

            // Timer color coding: Green (<15m), Yellow (15-25m), Red (>25m)
            let timerColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            if (elapsed >= 25) {
              timerColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
            } else if (elapsed >= 15) {
              timerColor = 'bg-[#e2e663]/20 text-[#e2e663] border-[#e2e663]/40';
            }

            return (
              <div
                key={order.id}
                className={`rounded-3xl border p-5 flex flex-col justify-between shadow-xl transition-all ${
                  isCooking
                    ? 'bg-[#1f302f] border-[#f88d63] ring-1 ring-[#f88d63]/40'
                    : isReady
                    ? 'bg-[#1a2928] border-emerald-500/50'
                    : 'bg-[#1a2827] border-[#2d4240]'
                }`}
              >
                <div>
                  {/* Comanda Header */}
                  <div className="flex items-start justify-between border-b border-[#2d4240] pb-3 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-white font-['Fredoka'] tracking-wide">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${timerColor}`}
                        >
                          ⏱️ {elapsed} min
                        </span>
                      </div>
                      <div className="text-xs text-[#8daaa8] font-bold mt-1 flex items-center gap-1.5">
                        {order.deliveryMethod === 'delivery' ? (
                          <span className="text-[#f88d63] flex items-center gap-1">
                            <Bike className="w-3.5 h-3.5" /> DELIVERY
                          </span>
                        ) : (
                          <span className="text-[#e2e663] flex items-center gap-1">
                            <Store className="w-3.5 h-3.5" /> RETIRO EN MOSTRADOR
                          </span>
                        )}
                        <span>•</span>
                        <span className="text-white">{order.customerName}</span>
                      </div>
                    </div>

                    {/* PDF and Print Shortcuts */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => generateKitchenTicketPDF(order, 'cocina')}
                        className="p-2 rounded-xl bg-[#243635] hover:bg-[#2c4241] text-[#e2e663] border border-[#364e4c] transition-colors"
                        title="Descargar Ticket en PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenPrintModal(order)}
                        className="p-2 rounded-xl bg-[#243635] hover:bg-[#2c4241] text-stone-200 border border-[#364e4c] transition-colors"
                        title="Imprimir comanda térmica"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Items List with Large Typography for Kitchen Staff */}
                  <div className="py-4 space-y-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="bg-[#14201f] p-3 rounded-2xl border border-[#263736] space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-base font-black text-white leading-tight font-['Fredoka']">
                            <span className="text-[#e2e663] text-lg mr-1.5">{item.quantity}x</span>
                            {item.menuItem.name}
                          </span>
                        </div>

                        {/* Options */}
                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <div className="text-xs text-[#d3e2e0] pl-4 font-semibold">
                            {item.selectedOptions.map((o) => `• ${o.selectedOption.name}`).join(' ')}
                          </div>
                        )}

                        {/* Special Kitchen Notes (Highlight) */}
                        {item.specialInstructions && (
                          <div className="bg-[#f88d63]/20 border border-[#f88d63]/40 text-[#f88d63] text-xs font-black p-2 rounded-xl mt-1">
                            ⚠️ OBS: {item.specialInstructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* General Delivery Note if any */}
                  {order.deliveryNotes && (
                    <div className="text-xs text-[#8daaa8] italic pb-2">
                      Nota cliente: &quot;{order.deliveryNotes}&quot;
                    </div>
                  )}
                </div>

                {/* Big Kitchen Action Buttons */}
                <div className="pt-3 border-t border-[#2d4240] space-y-2">
                  {!isCooking && !isReady && (
                    <button
                      onClick={() => handleStartCooking(order)}
                      className="w-full bg-[#e2e663] hover:bg-[#edf169] text-[#1b2827] font-black py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm font-['Fredoka'] tracking-wide active:scale-95 transition-all"
                    >
                      <Flame className="w-5 h-5 text-[#1b2827]" />
                      <span>Iniciar Cocción (En Marcha)</span>
                    </button>
                  )}

                  {isCooking && (
                    <button
                      onClick={() => handleMarkReady(order)}
                      className="w-full bg-gradient-to-r from-[#f88d63] to-[#fa9d79] hover:from-[#f77e50] hover:to-[#f88d63] text-[#1b2827] font-black py-4 px-4 rounded-2xl shadow-xl shadow-[#f88d63]/20 flex items-center justify-center gap-2 text-sm font-['Fredoka'] tracking-wide active:scale-95 transition-all animate-pulse"
                    >
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      <span>¡LISTO PARA DESPACHO!</span>
                    </button>
                  )}

                  {isReady && (
                    <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-center py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{order.deliveryMethod === 'delivery' ? 'Listo esperando cadete' : 'Listo en mostrador'}</span>
                    </div>
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
