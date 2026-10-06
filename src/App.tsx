import React, { useState, useEffect, useCallback } from 'react';
import { MenuItem, CartItem, Order, DeliveryMethod, MercadoPagoAlias, CartItemOptionSelected, Customer } from './types';
import { storageService } from './services/storage';
import { authService } from './services/auth';
import { Header, AppViewMode } from './components/Header';
import { CustomerMenu } from './components/CustomerMenu';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AccountModal } from './components/AccountModal';
import { MercadoPagoPaymentView } from './components/MercadoPagoPaymentView';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { KitchenTabletView } from './components/kitchen/KitchenTabletView';
import { CounterCashierView } from './components/counter/CounterCashierView';
import { SelfServiceKiosk } from './components/kiosk/SelfServiceKiosk';
import { PrintTicketModal } from './components/admin/PrintTicketModal';
import { ToastAlert } from './components/ToastAlert';

export default function App() {
  // Soporte de links compartibles ?view=kitchen|counter|kiosk|admin (parity con AI Studio)
  const [currentView, _setCurrentView] = useState<AppViewMode>(() => {
    const param = new URLSearchParams(window.location.search).get('view');
    const valid: AppViewMode[] = ['customer', 'kiosk', 'kitchen', 'counter', 'admin'];
    return param && valid.includes(param as AppViewMode) ? (param as AppViewMode) : 'customer';
  });
  const setCurrentView = useCallback((v: AppViewMode) => {
    _setCurrentView(v);
    const url = new URL(window.location.href);
    if (v === 'customer') url.searchParams.delete('view');
    else url.searchParams.set('view', v);
    window.history.replaceState(null, '', url.toString());
  }, []);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => storageService.getMenuItems());
  const [aliases, setAliases] = useState<MercadoPagoAlias[]>(() => storageService.getAliases());
  const [orders, setOrders] = useState<Order[]>(() => storageService.getOrders());

  // Customer Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('punto_morfi_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Modals for payment, tracking & printing
  const [paymentViewOrder, setPaymentViewOrder] = useState<Order | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [printModalOrder, setPrintModalOrder] = useState<Order | null>(null);

  // ── Cuenta de cliente (Google One Tap / teléfono) ────────────
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // Restaurar sesión guardada al arrancar (solo en vista cliente)
  useEffect(() => {
    if (currentView !== 'customer') return;
    authService.restore().then((c) => { if (c) setCustomer(c); });
  }, [currentView]);

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('punto_morfi_cart', JSON.stringify(cart));
  }, [cart]);

  // Reload data from storage
  const reloadData = useCallback(() => {
    const updatedOrders = storageService.getOrders();
    setOrders(updatedOrders);
    setAliases(storageService.getAliases());
    setMenuItems(storageService.getMenuItems());

    // Update active modals if order state changed
    const activeCustOrderId = storageService.getActiveCustomerOrderId();
    if (activeCustOrderId) {
      const activeObj = updatedOrders.find((o) => o.id === activeCustOrderId);
      if (activeObj) {
        if (trackingOrder?.id === activeCustOrderId) {
          setTrackingOrder(activeObj);
        }
        if (paymentViewOrder?.id === activeCustOrderId) {
          setPaymentViewOrder(activeObj);
        }
      }
    }
  }, [trackingOrder?.id, paymentViewOrder?.id]);

  // Real-time synchronization
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      reloadData();
    });
    return unsubscribe;
  }, [reloadData]);

  // Get active order for customer
  const activeCustomerOrderId = storageService.getActiveCustomerOrderId();
  const activeCustomerOrder = orders.find((o) => o.id === activeCustomerOrderId) || null;

  // Cart operations
  const handleAddToCart = (
    item: MenuItem,
    quantity: number,
    options: CartItemOptionSelected[],
    instructions: string
  ) => {
    let unitPrice = item.price;
    options.forEach((opt) => {
      if (opt.selectedOption.priceModifier) {
        unitPrice += opt.selectedOption.priceModifier;
      }
    });

    const newCartItem: CartItem = {
      id: 'cart-item-' + Date.now() + Math.random().toString(36).substring(2, 6),
      menuItem: item,
      quantity,
      selectedOptions: options,
      specialInstructions: instructions,
      itemTotalPrice: unitPrice * quantity,
    };

    setCart((prev) => [...prev, newCartItem]);
    setIsCartOpen(true);
  };

  const handleQuickAdd = (item: MenuItem) => {
    handleAddToCart(item, 1, [], '');
  };

  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((it) => {
        if (it.id === cartItemId) {
          let unitPrice = it.menuItem.price;
          it.selectedOptions?.forEach((opt) => {
            if (opt.selectedOption.priceModifier) unitPrice += opt.selectedOption.priceModifier;
          });
          return {
            ...it,
            quantity: newQuantity,
            itemTotalPrice: unitPrice * newQuantity,
          };
        }
        return it;
      })
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((it) => it.id !== cartItemId));
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderCreated = (order: Order) => {
    setCart([]);
    reloadData();
    if (order.paymentMethod === 'mercadopago_alias') {
      setPaymentViewOrder(order);
    } else {
      setTrackingOrder(order);
    }
  };

  const handleGenerateDemoOrder = () => {
    storageService.generateDemoOrder();
    reloadData();
  };

  // "Pedir lo mismo de la vez pasada": re-arma el carrito desde un pedido
  // histórico, usando el menú actual (avisa si algún ítem ya no existe).
  const handleReorder = (order: Order) => {
    const menu = storageService.getMenuItems();
    const newItems: CartItem[] = [];
    let skipped = 0;
    for (const it of order.items || []) {
      const current = menu.find((m) => m.id === it.menuItem?.id && m.isAvailable);
      if (!current) { skipped++; continue; }
      let unitPrice = current.price;
      (it.selectedOptions || []).forEach((opt) => {
        if (opt.selectedOption.priceModifier) unitPrice += opt.selectedOption.priceModifier;
      });
      newItems.push({
        id: 'cart-item-' + Date.now() + Math.random().toString(36).substring(2, 6),
        menuItem: current,
        quantity: it.quantity,
        selectedOptions: it.selectedOptions || [],
        specialInstructions: it.specialInstructions || '',
        itemTotalPrice: unitPrice * it.quantity,
      });
    }
    if (newItems.length === 0) {
      alert('Los productos de ese pedido ya no están disponibles en el menú.');
      return;
    }
    setCart((prev) => [...prev, ...newItems]);
    setIsCartOpen(true);
    if (skipped > 0) alert(`Agregamos tu pedido. ${skipped} producto(s) ya no están disponibles y se omitieron.`);
  };

  const cartCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const cartTotal = cart.reduce((acc, it) => acc + it.itemTotalPrice, 0);
  const pendingCount = orders.filter(
    (o) => o.status !== 'entregado' && o.status !== 'cancelado'
  ).length;

  // Render Kiosk Fullscreen
  if (currentView === 'kiosk') {
    return (
      <SelfServiceKiosk
        menuItems={menuItems}
        onOrderCreated={handleOrderCreated}
        onExitKiosk={() => setCurrentView('customer')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#14201f] text-stone-100 flex flex-col font-sans">
      {/* Toast Alert floating notifications with chime */}
      <ToastAlert
        onOpenOrder={(orderId) => {
          const ord = orders.find((o) => o.id === orderId);
          if (ord) setTrackingOrder(ord);
        }}
      />

      {/* Main App Navigation Header */}
      <Header
        currentView={currentView}
        onChangeView={setCurrentView}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        customer={customer}
        activeOrder={activeCustomerOrder}
        onOpenTracking={() => activeCustomerOrder && setTrackingOrder(activeCustomerOrder)}
        pendingOrdersCount={pendingCount}
        onGenerateDemoOrder={handleGenerateDemoOrder}
      />

      {/* View Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentView === 'customer' && (
          <CustomerMenu
            menuItems={menuItems}
            onSelectItem={(item) => setSelectedProduct(item)}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {currentView === 'kitchen' && (
          <KitchenTabletView
            orders={orders}
            onOrderUpdated={reloadData}
            onOpenPrintModal={(ord) => setPrintModalOrder(ord)}
          />
        )}

        {currentView === 'counter' && (
          <CounterCashierView
            orders={orders}
            onOrderUpdated={reloadData}
            onOpenPrintModal={(ord) => setPrintModalOrder(ord)}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            orders={orders}
            aliases={aliases}
            menuItems={menuItems}
            onOrderUpdated={reloadData}
            onAliasesUpdated={reloadData}
            onMenuItemsUpdated={reloadData}
            onGenerateDemoOrder={handleGenerateDemoOrder}
            onBackToCustomer={() => setCurrentView('customer')}
          />
        )}
      </main>

      {/* Modals & Slide-Overs */}
      {selectedProduct && (
        <ProductModal
          item={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        deliveryMethod={deliveryMethod}
        onChangeDeliveryMethod={setDeliveryMethod}
        onProceedToCheckout={handleProceedToCheckout}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        deliveryMethod={deliveryMethod}
        onOrderCreated={handleOrderCreated}
        customer={customer}
        onOpenAccount={() => { setIsCheckoutOpen(false); setIsAccountOpen(true); }}
      />

      {/* Cuenta de cliente: login, perfil, direcciones, historial y re-pedido */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        customer={customer}
        onCustomerChange={setCustomer}
        onReorder={handleReorder}
      />

      {paymentViewOrder && (
        <MercadoPagoPaymentView
          order={paymentViewOrder}
          onClose={() => setPaymentViewOrder(null)}
          onGoToTracking={() => {
            setTrackingOrder(paymentViewOrder);
            setPaymentViewOrder(null);
          }}
        />
      )}

      {trackingOrder && (
        <OrderTrackingModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
          onOpenPaymentView={() => {
            setPaymentViewOrder(trackingOrder);
            setTrackingOrder(null);
          }}
        />
      )}

      {/* Global Thermal Ticket Print & PDF Modal */}
      {printModalOrder && (
        <PrintTicketModal
          order={printModalOrder}
          onClose={() => setPrintModalOrder(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-[#14201f] border-t border-[#263736] py-8 text-xs text-[#759694] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#f88d63] font-['Fredoka'] text-sm">Punto Morfi</span>
            <span>•</span>
            <span className="text-[#d3e2e0]">Casa de comidas caseras & minutas al instante</span>
          </div>
          <div className="flex items-center gap-4 text-[#8daaa8] flex-wrap justify-center">
            <button
              onClick={() => setCurrentView('kiosk')}
              className="text-[#e2e663] hover:underline font-bold"
            >
              📱 Modo Tótem Tablet
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentView('kitchen')}
              className="text-[#759694] hover:underline font-bold"
            >
              🍳 Cocina KDS
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentView('counter')}
              className="text-[#f88d63] hover:underline font-bold"
            >
              💵 Caja / Despacho
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentView('admin')}
              className="text-white hover:underline font-black font-['Fredoka']"
            >
              Acceso Panel Administrador
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
