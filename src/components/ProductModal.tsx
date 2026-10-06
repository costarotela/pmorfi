import React, { useState } from 'react';
import { MenuItem, ProductOption, CartItemOptionSelected } from '../types';
import { X, Plus, Minus, Check, Clock, Sparkles } from 'lucide-react';

interface ProductModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, options: CartItemOptionSelected[], instructions: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ item, onClose, onAddToCart }) => {
  if (!item) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, ProductOption>>(() => {
    const initial: Record<string, ProductOption> = {};
    if (item.optionGroups) {
      item.optionGroups.forEach((group) => {
        if (group.required && group.options.length > 0) {
          initial[group.id] = group.options[0];
        }
      });
    }
    return initial;
  });
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleSelectOption = (groupId: string, option: ProductOption) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupId]: option,
    }));
  };

  // Calculate total item price including selected option price modifiers
  let unitPrice = item.price;
  Object.values(selectedOptions).forEach((opt) => {
    if (opt.priceModifier) {
      unitPrice += opt.priceModifier;
    }
  });
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    const formattedOptions: CartItemOptionSelected[] = [];
    if (item.optionGroups) {
      item.optionGroups.forEach((group) => {
        if (selectedOptions[group.id]) {
          formattedOptions.push({
            groupId: group.id,
            groupTitle: group.title,
            selectedOption: selectedOptions[group.id],
          });
        }
      });
    }

    onAddToCart(item, quantity, formattedOptions, specialInstructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Image */}
        <div className="relative h-56 sm:h-64 w-full bg-stone-950">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-stone-900/80 hover:bg-stone-800 text-stone-200 p-2 rounded-full backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {item.isHomemadeSpecial && (
            <div className="absolute top-4 left-4 bg-amber-500 text-stone-950 font-extrabold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Especialidad Casera</span>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-2xl font-black text-white leading-tight font-heading">
              {item.name}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-stone-300 font-medium">
              <span className="flex items-center gap-1 text-amber-400">
                <Clock className="w-3.5 h-3.5" /> Prep: ~{item.preparationTimeMinutes} min
              </span>
              <span>•</span>
              <span className="capitalize">{item.category}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-200">
          <p className="text-sm text-stone-300 leading-relaxed bg-stone-800/40 p-3.5 rounded-2xl border border-stone-800">
            {item.description}
          </p>

          {/* Option Groups */}
          {item.optionGroups && item.optionGroups.length > 0 && (
            <div className="space-y-5">
              {item.optionGroups.map((group) => (
                <div key={group.id} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                      <span>{group.title}</span>
                      {group.required && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20">
                          Obligatorio
                        </span>
                      )}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {group.options.map((opt) => {
                      const isSelected = selectedOptions[group.id]?.id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(group.id, opt)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-stone-100'
                              : 'bg-stone-800/60 border-stone-700/80 hover:bg-stone-800 text-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-400 text-stone-950'
                                  : 'border-stone-500'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="font-semibold">{opt.name}</span>
                          </div>
                          {opt.priceModifier !== undefined && opt.priceModifier !== 0 && (
                            <span className="font-bold text-amber-400">
                              {opt.priceModifier > 0 ? `+$${opt.priceModifier.toLocaleString('es-AR')}` : `-$${Math.abs(opt.priceModifier).toLocaleString('es-AR')}`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-300 block">
              Aclaración para la cocina (opcional):
            </label>
            <input
              type="text"
              placeholder="Ej: Sin cebolla, mayonesa aparte, bien cocido..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700/80 rounded-xl px-4 py-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-4">
          {/* Quantity selector */}
          <div className="flex items-center bg-stone-800 border border-stone-700 rounded-2xl p-1 shrink-0">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-300 hover:text-white disabled:opacity-30 disabled:hover:text-stone-300 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-9 text-center font-black text-sm text-amber-400">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-300 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add button */}
          <button
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black py-3 px-5 rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-between transition-all transform active:scale-[0.98]"
          >
            <span className="text-xs uppercase tracking-wider">Agregar al Pedido</span>
            <span className="text-sm font-black">
              ${totalPrice.toLocaleString('es-AR')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
