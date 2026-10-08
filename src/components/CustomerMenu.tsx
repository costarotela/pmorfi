import React, { useState, useMemo } from 'react';
import { MenuItem } from '../types';
import {
  Search,
  Sparkles,
  Flame,
  Plus,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PuntoMorfiLogo } from './Logo';

interface CustomerMenuProps {
  menuItems: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
}

type CategoryTab = 'all' | 'empanadas' | 'milanesas' | 'hamburguesas' | 'pizzas' | 'lomitos' | 'minutas' | 'bebidas' | 'postres';

const CATEGORIES: { id: CategoryTab; label: string; icon: string }[] = [
  { id: 'all', label: 'Todo el Menú', icon: '🍽️' },
  { id: 'empanadas', label: 'Empanadas', icon: '🥟' },
  { id: 'milanesas', label: 'Milanesas', icon: '🥩' },
  { id: 'hamburguesas', label: 'Burgers Smash', icon: '🍔' },
  { id: 'pizzas', label: 'Pizzas al Molde', icon: '🍕' },
  { id: 'lomitos', label: 'Lomitos', icon: '🥪' },
  { id: 'minutas', label: 'Minutas & Papas', icon: '🍟' },
  { id: 'bebidas', label: 'Bebidas', icon: '🥤' },
  { id: 'postres', label: 'Postres Caseros', icon: '🍮' },
];

export const CustomerMenu: React.FC<CustomerMenuProps> = ({
  menuItems,
  onSelectItem,
  onQuickAdd,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  return (
    <div className="space-y-8 pb-16">
      {/* Punto Morfi Brand Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1c2c2b] via-[#243736] to-[#182524] border border-[#759694]/40 p-6 sm:p-10 shadow-2xl">
        {/* Ambient Glow in Logo Coral & Lime Yellow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#f88d63]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#e2e663]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f88d63]/20 border border-[#f88d63]/40 text-[#f88d63] text-xs font-bold mb-4 font-['Fredoka']">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Casa de Comidas • Sabor 100% de Barrio y Casero</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-stone-100 tracking-tight leading-tight font-['Fredoka']">
              El verdadero sabor del morfi casero.
            </h2>
            <p className="mt-3 text-[#d3e2e0] text-sm sm:text-base leading-relaxed">
              Minutas, milanesas gigantes, empanadas cortadas a cuchillo y pizzas al molde.
              Pagá al instante con <strong className="text-[#e2e663]">Mercado Pago con rotación de Alias al azar</strong> y seguí tu comanda en tiempo real.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold">
              <div className="flex items-center gap-2 bg-[#1b2827]/80 border border-[#364e4c] px-3.5 py-2 rounded-2xl text-stone-200">
                <ShieldCheck className="w-4 h-4 text-[#e2e663]" />
                <span>Cobro con Mercado Pago (3-4 Alias al azar)</span>
              </div>
              <div className="flex items-center gap-2 bg-[#1b2827]/80 border border-[#364e4c] px-3.5 py-2 rounded-2xl text-stone-200">
                <Zap className="w-4 h-4 text-[#f88d63]" />
                <span>Notificaciones de cocina y cadete en vivo</span>
              </div>
            </div>
          </div>

          {/* Hero Logo Emblem Badge */}
          <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-[#759694]/15 rounded-3xl border border-[#759694]/30 backdrop-blur-sm shadow-xl">
            <PuntoMorfiLogo size="xl" showSubtitle={false} />
            <div className="mt-3 text-center">
              <span className="text-lg font-black text-[#f88d63] font-['Fredoka'] block tracking-wide">
                Punto Morfi
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-[#e2e663]">
                Casa de Comidas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="sticky top-28 z-30 bg-[#1b2827]/95 backdrop-blur-md py-3 -my-2 space-y-3">
        {/* Search Input */}
        <div className="relative max-w-xl">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#759694]" />
          <input
            type="text"
            placeholder="Buscar empanadas, sánguche de milanesa, pizza, smash burger..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#152221] border border-[#2b3e3d] focus:border-[#f88d63] rounded-2xl pl-12 pr-4 py-3 text-sm text-stone-100 placeholder-[#759694] outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#8daaa8] hover:text-white"
            >
              Borrar
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all shrink-0 font-['Fredoka'] tracking-wide ${
                  isActive
                    ? 'bg-[#f88d63] text-[#1b2827] shadow-lg shadow-[#f88d63]/25 scale-[1.02]'
                    : 'bg-[#243635] hover:bg-[#2c4241] text-[#d3e2e0] border border-[#364e4c]'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dishes Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-[#182524] rounded-3xl border border-[#2b3e3d]">
          <Flame className="w-12 h-12 text-[#759694] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-300 font-['Fredoka']">No encontramos platos con esa búsqueda</h3>
          <p className="text-sm text-[#8daaa8] mt-1">Probá buscando con otro nombre o seleccioná otra categoría.</p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-[#f88d63]/20 text-[#f88d63] text-xs font-bold rounded-xl border border-[#f88d63]/40 hover:bg-[#f88d63]/30"
          >
            Ver todo el menú
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group bg-[#1e2d2c] border rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-[#f88d63]/10 ${
                item.isAvailable
                  ? 'border-[#2d4240] hover:border-[#f88d63]/60'
                  : 'border-[#2d4240] opacity-60'
              }`}
            >
              <div>
                {/* Image Box */}
                <div
                  onClick={() => item.isAvailable && onSelectItem(item)}
                  className="relative h-48 w-full bg-[#152221] overflow-hidden cursor-pointer"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1e2d2c] via-transparent to-black/20" />

                  {/* Badges with Punto Morfi colors */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {item.isHomemadeSpecial && (
                      <span className="bg-[#f88d63] text-[#1b2827] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 font-['Fredoka']">
                        <Sparkles className="w-3 h-3" /> Especial Morfi
                      </span>
                    )}
                    {item.isPopular && !item.isHomemadeSpecial && (
                      <span className="bg-[#e2e663] text-[#1b2827] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 font-['Fredoka']">
                        <Flame className="w-3 h-3" /> Popular
                      </span>
                    )}
                  </div>

                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                        Agotado por hoy
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 bg-[#182524]/90 backdrop-blur-md text-[#d3e2e0] px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#e2e663]" />
                    <span>~{item.preparationTimeMinutes} min</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5">
                  <h3
                    onClick={() => item.isAvailable && onSelectItem(item)}
                    className="text-lg font-black text-stone-100 group-hover:text-[#f88d63] transition-colors cursor-pointer font-['Fredoka'] leading-snug"
                  >
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#8daaa8] mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Price & Action */}
              <div className="px-5 pb-5 pt-3 flex items-center justify-between border-t border-[#2d4240]">
                <div>
                  <span className="text-[10px] text-[#8daaa8] uppercase font-bold block">
                    {item.optionGroups && item.optionGroups.length > 0 ? 'Precio desde' : 'Valor unitario'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-[#e2e663] font-['Fredoka']">
                      ${item.price.toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] text-[#759694]">/ unid.</span>
                  </div>
                </div>

                {item.isAvailable && (
                  <button
                    onClick={() => onSelectItem(item)}
                    className="bg-gradient-to-r from-[#f88d63] to-[#fa9d79] hover:from-[#f77e50] hover:to-[#f88d63] text-[#1b2827] font-black text-xs px-4 py-2.5 rounded-2xl shadow-md shadow-[#f88d63]/25 transition-all flex items-center gap-1.5 active:scale-95 font-['Fredoka']"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>{item.optionGroups && item.optionGroups.length > 0 ? 'Elegir & Cantidad' : 'Pedir'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

