import React, { useState } from 'react';
import { MenuItem, ProductOption, CartItemOptionSelected } from '../types';
import {
  X,
  Plus,
  Minus,
  Check,
  Clock,
  Sparkles,
  MessageSquare,
  Calculator,
  UtensilsCrossed,
  Layers,
} from 'lucide-react';

interface ProductModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    options: CartItemOptionSelected[],
    instructions: string
  ) => void;
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

  // Calculate unit price based on base item price + selected option price modifiers
  let unitPrice = item.price;
  Object.values(selectedOptions).forEach((opt) => {
    if (opt.priceModifier) {
      unitPrice += opt.priceModifier;
    }
  });

  // Ensure unitPrice never drops below 100
  unitPrice = Math.max(100, unitPrice);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1e2d2c] border border-[#2d4240] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Image */}
        <div className="relative h-52 sm:h-60 w-full bg-[#152221] shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e2d2c] via-[#1e2d2c]/40 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-[#14201f]/80 hover:bg-[#14201f] text-stone-200 p-2 rounded-full backdrop-blur-md transition-colors border border-[#2d4240]"
          >
            <X className="w-5 h-5" />
          </button>

          {item.isHomemadeSpecial && (
            <div className="absolute top-4 left-4 bg-[#f88d63] text-[#1b2827] font-black text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg font-['Fredoka']">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Especialidad Casera</span>
            </div>
          )}

          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight font-['Fredoka']">
              {item.name}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-[#8daaa8] font-medium">
              <span className="flex items-center gap-1 text-[#e2e663] font-bold">
                <Clock className="w-3.5 h-3.5" /> Cocción: ~{item.preparationTimeMinutes} min
              </span>
              <span>•</span>
              <span className="uppercase text-[10px] tracking-wider font-bold">{item.category}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-stone-200 text-xs">
          {/* Description */}
          <p className="text-xs text-[#d3e2e0] leading-relaxed bg-[#152221] p-3.5 rounded-2xl border border-[#2b3e3d]">
            {item.description}
          </p>

          {/* Option Groups (Sizes / Portions / Varieties / Flavors) */}
          {item.optionGroups && item.optionGroups.length > 0 && (
            <div className="space-y-5">
              {item.optionGroups.map((group) => (
                <div key={group.id} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white font-['Fredoka'] flex items-center gap-1.5 tracking-wide">
                      <Layers className="w-3.5 h-3.5 text-[#f88d63]" />
                      <span>{group.title}</span>
                      {group.required && (
                        <span className="text-[10px] bg-[#e2e663]/20 text-[#e2e663] px-2 py-0.5 rounded-md border border-[#e2e663]/30">
                          Elegí 1 opción
                        </span>
                      )}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {group.options.map((opt) => {
                      const isSelected = selectedOptions[group.id]?.id === opt.id;
                      // Calculate effective price for this option
                      const optPrice = Math.max(100, item.price + (opt.priceModifier || 0));

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(group.id, opt)}
                          className={`flex items-center justify-between p-3 rounded-2xl border text-left text-xs transition-all ${
                            isSelected
                              ? 'bg-[#152221] border-[#f88d63] text-white shadow-md'
                              : 'bg-[#152221]/60 border-[#2b3e3d] hover:border-[#3a5250] text-[#8daaa8]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'border-[#f88d63] bg-[#f88d63] text-[#1b2827]'
                                  : 'border-[#3a5250]'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="font-bold text-stone-100 truncate">{opt.name}</span>
                          </div>

                          <div className="shrink-0 text-right">
                            {opt.priceModifier !== undefined && opt.priceModifier !== 0 ? (
                              <span className="font-black text-[#e2e663] font-mono text-[11px]">
                                {opt.priceModifier > 0
                                  ? `+$${opt.priceModifier.toLocaleString('es-AR')}`
                                  : `-$${Math.abs(opt.priceModifier).toLocaleString('es-AR')}`}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#759694] uppercase font-bold">
                                Base
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special Instructions / Notes */}
          <div className="space-y-2 bg-[#152221] p-3.5 rounded-2xl border border-[#2b3e3d]">
            <label className="text-xs font-black text-white font-['Fredoka'] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#e2e663]" />
              <span>Aclaraciones o Notas para la Cocina (Opcional):</span>
            </label>
            <p className="text-[11px] text-[#8daaa8]">
              Indicá detalles de preparación o gustos específicos:
            </p>
            <textarea
              placeholder="Ej: Sin cebolla, bien cocido, 4 de carne y 2 de jamón y queso, limón extra..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full bg-[#1b2827] border border-[#2d4240] focus:border-[#f88d63] rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-[#759694] outline-none h-16 resize-none"
            />
          </div>
        </div>

        {/* Footer: Live Price x Units Calculator and Add Button */}
        <div className="p-4 sm:p-5 bg-[#152221] border-t border-[#2d4240] space-y-3">
          {/* Unit calculation preview banner */}
          <div className="bg-[#1b2827] px-3.5 py-2 rounded-xl border border-[#2d4240] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[#8daaa8]">
              <Calculator className="w-3.5 h-3.5 text-[#e2e663]" />
              <span>Valor por unidad:</span>
              <strong className="text-white font-mono font-bold">
                ${unitPrice.toLocaleString('es-AR')}
              </strong>
            </div>

            <div className="text-right">
              <span className="text-[#8daaa8] text-[11px]">
                {quantity} {quantity === 1 ? 'unidad' : 'unidades'} ={' '}
              </span>
              <strong className="text-[#e2e663] font-['Fredoka'] text-sm font-black">
                ${totalPrice.toLocaleString('es-AR')}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quantity Selector with Big Buttons */}
            <div className="flex items-center bg-[#1b2827] border border-[#2d4240] rounded-2xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8daaa8] hover:text-white hover:bg-[#243635] disabled:opacity-30 transition-colors"
                title="Restar una unidad"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="w-10 text-center">
                <span className="font-black text-sm text-[#e2e663] font-['Fredoka']">
                  {quantity}
                </span>
                <span className="block text-[8px] text-[#759694] font-bold uppercase leading-none">
                  unid.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8daaa8] hover:text-white hover:bg-[#243635] transition-colors"
                title="Sumar una unidad"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 bg-gradient-to-r from-[#f88d63] to-[#fa9d79] hover:from-[#f77e50] hover:to-[#f88d63] text-[#1b2827] font-black py-3.5 px-4 rounded-2xl shadow-xl shadow-[#f88d63]/25 flex items-center justify-between transition-all transform active:scale-[0.98] font-['Fredoka']"
            >
              <span className="text-xs uppercase tracking-wide">
                Agregar ({quantity} {quantity === 1 ? 'unid' : 'unids'})
              </span>
              <span className="text-sm font-black font-['Fredoka']">
                ${totalPrice.toLocaleString('es-AR')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
