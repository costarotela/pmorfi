import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  ShoppingBag,
  Bell,
  BellRing,
  Clock,
  ShieldCheck,
  Sparkles,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { pushNotifications } from '../services/pushNotifications';
import { Order, Customer } from '../types';
import { PuntoMorfiLogo } from './Logo';

export type AppViewMode = 'customer' | 'kiosk' | 'kitchen' | 'counter' | 'admin';

interface HeaderProps {
  currentView: AppViewMode;
  onChangeView: (view: AppViewMode) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  customer: Customer | null;
  activeOrder: Order | null;
  onOpenTracking: () => void;
  pendingOrdersCount: number;
  onGenerateDemoOrder: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onChangeView,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenAccount,
  customer,
  activeOrder,
  onOpenTracking,
  pendingOrdersCount,
  onGenerateDemoOrder,
}) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setNotificationPermission(pushNotifications.getPermissionStatus());
  }, []);

  const handleRequestNotifications = async () => {
    const status = await pushNotifications.requestPermission();
    setNotificationPermission(status);
    if (status === 'granted') {
      pushNotifications.sendNotification(
        '🔔 Punto Morfi: Notificaciones activadas',
        '¡Listo! Te avisaremos cuando tu comida esté lista y en camino.'
      );
    }
  };

  const getOrderStatusLabel = (order: Order) => {
    switch (order.status) {
      case 'pendiente_pago':
        return 'Pendiente Pago';
      case 'confirmado':
        return 'Confirmado';
      case 'en_cocina':
        return '🍳 En Cocina';
      case 'en_camino':
        return '🛵 En Reparto';
      case 'entregado':
        return '✅ Entregado';
      default:
        return 'En curso';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1e2d2c]/95 backdrop-blur-xl border-b border-[#2e4342]">
      {/* Top Banner Notice with Punto Morfi Teal, Coral & Yellow palette */}
      <div className="bg-gradient-to-r from-[#759694] via-[#f88d63] to-[#e2e663] text-[#1b2827] text-xs py-1.5 px-4 font-bold flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <Sparkles className="w-3.5 h-3.5 text-[#1b2827]" />
          <span>Punto Morfi • Casa de Comidas Caseras • Cobro con Mercado Pago (Alias al azar)</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[#1b2827] font-bold text-[11px]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Cocina abierta Lun a Dom 11:30 - 15:30 / 19:30 - 00:30
          </span>
          <span className="opacity-50">|</span>
          <button
            onClick={onGenerateDemoOrder}
            className="hover:underline flex items-center gap-1 font-black text-[#1b2827] bg-white/30 px-2 py-0.5 rounded-md"
            title="Simula un pedido entrante para probar panel y notificaciones"
          >
            + Simular Pedido Demo
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo Punto Morfi */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => onChangeView('customer')}
              className="cursor-pointer group flex items-center"
            >
              <PuntoMorfiLogo size="md" showSubtitle={true} />
            </div>
          </div>

          {/* Navigation View Switcher */}
          <div className="hidden lg:flex items-center bg-[#152221] p-1 rounded-2xl border border-[#2b3e3d] gap-1">
            <button
              onClick={() => onChangeView('customer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all font-['Fredoka'] ${
                currentView === 'customer'
                  ? 'bg-[#f88d63] text-[#1b2827] shadow-lg shadow-[#f88d63]/25'
                  : 'text-[#8daaa8] hover:text-white'
              }`}
            >
              🍽️ Web / Delivery
            </button>

            <button
              onClick={() => onChangeView('kiosk')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all font-['Fredoka'] ${
                currentView === 'kiosk'
                  ? 'bg-[#e2e663] text-[#1b2827] shadow-lg shadow-[#e2e663]/25'
                  : 'text-[#8daaa8] hover:text-white'
              }`}
            >
              📱 Tablet Local (Tótem)
            </button>

            <button
              onClick={() => onChangeView('kitchen')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all relative flex items-center gap-1.5 font-['Fredoka'] ${
                currentView === 'kitchen'
                  ? 'bg-[#759694] text-white shadow-lg'
                  : 'text-[#8daaa8] hover:text-white'
              }`}
            >
              <span>🍳 Cocina KDS</span>
            </button>

            <button
              onClick={() => onChangeView('counter')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all relative flex items-center gap-1.5 font-['Fredoka'] ${
                currentView === 'counter'
                  ? 'bg-[#e2e663] text-[#1b2827] shadow-lg'
                  : 'text-[#8daaa8] hover:text-white'
              }`}
            >
              <span>💵 Caja / Despacho</span>
              {pendingOrdersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#f88d63] text-[#1b2827] text-[9px] font-black flex items-center justify-center animate-pulse">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onChangeView('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all font-['Fredoka'] ${
                currentView === 'admin'
                  ? 'bg-[#243635] text-white border border-[#364e4c]'
                  : 'text-[#8daaa8] hover:text-white'
              }`}
            >
              ⚙️ Admin
            </button>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Push Notifications Opt-In */}
            <button
              onClick={handleRequestNotifications}
              className={`p-2.5 rounded-2xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                notificationPermission === 'granted'
                  ? 'bg-[#243635] border-[#364e4c] text-[#e2e663]'
                  : 'bg-[#243635] border-[#f88d63]/40 text-[#f88d63] hover:bg-[#f88d63]/10'
              }`}
              title={
                notificationPermission === 'granted'
                  ? 'Notificaciones push activadas'
                  : 'Activar notificaciones de estado'
              }
            >
              {notificationPermission === 'granted' ? (
                <BellRing className="w-4 h-4 text-[#e2e663]" />
              ) : (
                <Bell className="w-4 h-4 animate-bounce text-[#f88d63]" />
              )}
              <span className="hidden xl:inline text-xs font-bold">
                {notificationPermission === 'granted' ? 'Alertas ON' : 'Activar Alertas'}
              </span>
            </button>

            {/* Active Order Live Tracker Shortcut */}
            {activeOrder && activeOrder.status !== 'cancelado' && (
              <button
                onClick={onOpenTracking}
                className="bg-[#f88d63]/15 hover:bg-[#f88d63]/25 border border-[#f88d63]/50 text-[#fa9d79] px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-[#e2e663] animate-ping" />
                <span className="font-bold">{activeOrder.orderNumber}:</span>
                <span className="hidden sm:inline">{getOrderStatusLabel(activeOrder)}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* View Switcher Mobile/Tablet button */}
            <div className="flex lg:hidden">
              <select
                value={currentView}
                onChange={(e) => onChangeView(e.target.value as AppViewMode)}
                className="bg-[#243635] text-[#e2e663] border border-[#364e4c] text-xs font-black py-2 px-2.5 rounded-2xl outline-none font-['Fredoka'] cursor-pointer"
              >
                <option value="customer">🍽️ Web / Delivery</option>
                <option value="kiosk">📱 Tótem Tablet</option>
                <option value="kitchen">🍳 Cocina KDS</option>
                <option value="counter">💵 Caja / Despacho</option>
                <option value="admin">⚙️ Admin / Reportes</option>
              </select>
            </div>

            {/* Cuenta de cliente (perfil, direcciones, historial, re-pedido) */}
            {currentView === 'customer' && (
              <button
                onClick={onOpenAccount}
                className="p-2.5 rounded-2xl border bg-[#243635] border-[#364e4c] hover:border-[#e2e663]/60 transition-all flex items-center gap-1.5"
                title={customer ? `Mi cuenta — ${customer.name}` : 'Crear cuenta / iniciar sesión'}
              >
                {customer?.picture ? (
                  <img src={customer.picture} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-base leading-none">{customer ? '👤' : '🔑'}</span>
                )}
                <span className="hidden xl:inline text-xs font-bold text-[#e2e663]">
                  {customer ? customer.name.split(' ')[0] : 'Mi cuenta'}
                </span>
              </button>
            )}

            {/* Cart Drawer Trigger */}
            {currentView === 'customer' && (
              <button
                onClick={onOpenCart}
                className="relative bg-gradient-to-r from-[#f88d63] to-[#fa9d79] hover:from-[#f77e50] hover:to-[#f88d63] text-[#1b2827] font-black px-4 sm:px-5 py-2.5 rounded-2xl shadow-xl shadow-[#f88d63]/25 flex items-center gap-2.5 transition-all transform active:scale-95"
              >
                <ShoppingBag className="w-5 h-5 text-[#1b2827] stroke-[2.5]" />
                <span className="hidden sm:inline text-xs font-black uppercase tracking-wider font-['Fredoka']">
                  Mi Morfi
                </span>
                {cartCount > 0 && (
                  <span className="bg-[#1b2827] text-[#e2e663] text-xs font-black px-2 py-0.5 rounded-full font-mono">
                    {cartCount} • ${(cartTotal / 1000).toFixed(1)}k
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
