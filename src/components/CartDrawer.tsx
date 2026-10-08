import React from 'react';
import { CartItem, DeliveryMethod } from '../types';
import { deliveryService } from '../services/deliveryService';
import { X, Trash2, Plus, Minus, ShoppingBag, Bike, Store, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  deliveryMethod: DeliveryMethod;
  onChangeDeliveryMethod: (method: DeliveryMethod) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  deliveryMethod,
  onChangeDeliveryMethod,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.itemTotalPrice, 0);
  const baseDeliveryFee = deliveryService.getConfig().zones[0]?.deliveryFee || 1200;
  const deliveryFee = deliveryMethod === 'delivery' && subtotal > 0 ? baseDeliveryFee : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-[#2d4240] flex items-center justify-between bg-[#192625]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#759694]/20 border border-[#759694]/40 flex items-center justify-center text-[#f88d63]">
                <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-['Fredoka']">Tu Pedido en Punto Morfi</h3>
                <p className="text-xs text-[#8daaa8]">{cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#8daaa8] hover:text-white hover:bg-[#243635] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Method Selector */}
          <div className="p-4 bg-[#14201f] border-b border-[#2d4240]">
            <div className="grid grid-cols-2 gap-2 bg-[#1b2827] p-1 rounded-2xl border border-[#2d4240]">
              <button
                type="button"
                onClick={() => onChangeDeliveryMethod('delivery')}
                className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all font-['Fredoka'] ${
                  deliveryMethod === 'delivery'
                    ? 'bg-[#f88d63] text-[#1b2827] shadow-md'
                    : 'text-[#8daaa8] hover:text-white'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Envío a domicilio</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeDeliveryMethod('pickup')}
                className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all font-['Fredoka'] ${
                  deliveryMethod === 'pickup'
                    ? 'bg-[#f88d63] text-[#1b2827] shadow-md'
                    : 'text-[#8daaa8] hover:text-white'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Retiro en local</span>
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-24 text-stone-500 space-y-3">
                <ShoppingBag className="w-16 h-16 mx-auto stroke-1 text-stone-700" />
                <p className="text-base font-bold text-stone-400">Tu carrito está vacío</p>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Agregá unas ricas empanadas, milanesa o hamburguesa smash para empezar tu orden.
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-stone-950/70 border border-stone-800 rounded-2xl p-4 flex gap-3.5 items-start"
                >
                  <img
                    src={item.menuItem.image}
                    alt={item.menuItem.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-800"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-stone-100 line-clamp-1">
                        {item.menuItem.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-stone-500 hover:text-rose-400 transition-colors p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                        {item.selectedOptions.map((opt) => opt.selectedOption.name).join(' • ')}
                      </p>
                    )}

                    {item.specialInstructions && (
                      <p className="text-[10px] text-amber-400/90 italic mt-0.5">
                        &quot;{item.specialInstructions}&quot;
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center bg-stone-900 border border-stone-700/80 rounded-xl p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-stone-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-sm font-black text-amber-400">
                        ${item.itemTotalPrice.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {cartItems.length > 0 && (
            <div className="p-6 bg-stone-950 border-t border-stone-800 space-y-4">
              <div className="space-y-2 text-xs text-stone-400">
                <div className="flex justify-between">
                  <span>Subtotal productos:</span>
                  <span className="text-stone-200 font-bold">${subtotal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{deliveryMethod === 'delivery' ? 'Costo de envío:' : 'Retiro por local:'}</span>
                  <span className="text-stone-200 font-bold">
                    {deliveryMethod === 'delivery' ? `$${deliveryFee.toLocaleString('es-AR')}` : 'Gratis'}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#2d4240] flex justify-between items-center text-base font-black text-white">
                  <span>Total a Pagar:</span>
                  <span className="text-[#e2e663] text-2xl font-['Fredoka']">
                    ${total.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <button
                onClick={onProceedToCheckout}
                className="w-full bg-gradient-to-r from-[#f88d63] to-[#fa9d79] hover:from-[#f77e50] hover:to-[#f88d63] text-[#1b2827] font-black py-4 px-4 rounded-2xl shadow-xl shadow-[#f88d63]/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] font-['Fredoka'] text-sm tracking-wide"
              >
                <span>Continuar al Pago</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
