import React, { useState } from 'react';
import { Order, MercadoPagoAlias, MenuItem } from '../../types';
import { OrdersKanban } from './OrdersKanban';
import { MercadoPagoManager } from './MercadoPagoManager';
import { SalesReports } from './SalesReports';
import { MenuManager } from './MenuManager';
import {
  ChefHat,
  Shuffle,
  BarChart3,
  Utensils,
  Bell,
  Clock,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
  aliases: MercadoPagoAlias[];
  menuItems: MenuItem[];
  onOrderUpdated: () => void;
  onAliasesUpdated: () => void;
  onMenuItemsUpdated: () => void;
  onGenerateDemoOrder: () => void;
  onBackToCustomer: () => void;
}

type AdminTab = 'orders' | 'mercadopago' | 'reports' | 'menu';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  aliases,
  menuItems,
  onOrderUpdated,
  onAliasesUpdated,
  onMenuItemsUpdated,
  onGenerateDemoOrder,
  onBackToCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  const pendingCount = orders.filter(
    (o) => o.status !== 'entregado' && o.status !== 'cancelado'
  ).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Admin Subheader & Tabs */}
      <div className="bg-stone-950 p-4 sm:p-5 rounded-3xl border border-stone-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCustomer}
            className="p-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors"
            title="Volver a la vista de cliente"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white font-heading">
                Panel de Administración & Cocina
              </h2>
              <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                EN VIVO
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Control de comandas en tiempo real, cobros con rotación de Mercado Pago y reportes.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-stone-900/80 p-1.5 rounded-2xl border border-stone-800">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Comandas / Pedidos</span>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('mercadopago')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'mercadopago'
                ? 'bg-[#009ee3] text-white shadow-md font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>Alias Mercado Pago ({aliases.filter((a) => a.isActive).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'reports'
                ? 'bg-orange-500 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reportes</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'menu'
                ? 'bg-emerald-500 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Precios & Imágenes</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'orders' && (
        <OrdersKanban
          orders={orders}
          onOrderUpdated={onOrderUpdated}
          onGenerateDemoOrder={onGenerateDemoOrder}
        />
      )}

      {activeTab === 'mercadopago' && (
        <MercadoPagoManager
          aliases={aliases}
          onAliasesUpdated={onAliasesUpdated}
        />
      )}

      {activeTab === 'reports' && <SalesReports />}

      {activeTab === 'menu' && (
        <MenuManager
          items={menuItems}
          onItemsUpdated={onMenuItemsUpdated}
        />
      )}
    </div>
  );
};
