import React, { useState } from 'react';
import { MercadoPagoAlias } from '../../types';
import { storageService } from '../../services/storage';
import {
  Shuffle,
  Plus,
  Check,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Sparkles,
  Info,
} from 'lucide-react';

interface MercadoPagoManagerProps {
  aliases: MercadoPagoAlias[];
  onAliasesUpdated: () => void;
}

export const MercadoPagoManager: React.FC<MercadoPagoManagerProps> = ({
  aliases,
  onAliasesUpdated,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [simulatedSample, setSimulatedSample] = useState<string | null>(null);

  // Form state
  const [newAliasName, setNewAliasName] = useState('');
  const [newHolderName, setNewHolderName] = useState('');
  const [newCuit, setNewCuit] = useState('');
  const [newCvu, setNewCvu] = useState('');
  const [newBank, setNewBank] = useState('Mercado Pago');

  const handleToggle = (id: string) => {
    storageService.toggleAliasActive(id);
    onAliasesUpdated();
  };

  const handleDelete = (id: string) => {
    if (aliases.length <= 1) {
      alert('Debe quedar al menos un Alias configurado para procesar cobros.');
      return;
    }
    if (window.confirm('¿Seguro que deseas eliminar este alias?')) {
      storageService.deleteAlias(id);
      onAliasesUpdated();
    }
  };

  const handleAddAlias = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAliasName.trim() || !newHolderName.trim()) {
      alert('Completá el alias y el nombre del titular');
      return;
    }

    storageService.addAlias({
      alias: newAliasName.trim().toLowerCase(),
      holder: newHolderName.trim(),
      cuitOrDni: newCuit.trim() || '20-00000000-0',
      cvu: newCvu.trim() || '00000031' + Math.floor(10000000000000 + Math.random() * 90000000000000),
      bankOrMp: newBank.trim() || 'Mercado Pago',
      isActive: true,
      dailyLimit: 300000,
    });

    setNewAliasName('');
    setNewHolderName('');
    setNewCuit('');
    setNewCvu('');
    setShowAddForm(false);
    onAliasesUpdated();
  };

  const handleSimulatePick = () => {
    const picked = storageService.getRandomActiveAlias();
    setSimulatedSample(picked.alias);
    setTimeout(() => {
      setSimulatedSample(null);
    }, 3000);
  };

  const activeCount = aliases.filter((a) => a.isActive).length;
  const totalCollectedAll = aliases.reduce((sum, a) => sum + a.totalCollected, 0);

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-stone-900 to-sky-900/40 p-6 rounded-3xl border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30 mb-2">
            <Shuffle className="w-3.5 h-3.5" />
            <span>Sistema de Rotación Inteligente de Alias</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
            Gestión de Cobro Mercado Pago (3 a 4 Alias al Azar)
          </h3>
          <p className="text-xs text-stone-300 max-w-xl mt-1 leading-relaxed">
            Distribuye automáticamente los cobros entre tus cuentas de Mercado Pago activas. Cada cliente que elige MP recibe uno de los alias activos de forma aleatoria para evitar sobrepasar límites diarios y distribuir las transferencias.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSimulatePick}
            className="bg-stone-900 hover:bg-stone-800 text-amber-400 border border-amber-500/30 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all"
            title="Prueba la ruleta aleatoria de alias"
          >
            <Sparkles className="w-4 h-4" />
            <span>Probar Azar</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-sky-500 hover:bg-sky-400 text-stone-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agregar Alias</span>
          </button>
        </div>
      </div>

      {/* Simulated Pick Notice */}
      {simulatedSample && (
        <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 p-4 rounded-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Simulación de sorteo: El próximo cliente hubiera recibido el alias:</span>
            <span className="font-mono bg-stone-900 px-2 py-1 rounded border border-amber-500/40 text-white">
              {simulatedSample}
            </span>
          </div>
          <span className="text-[10px] text-amber-400 font-semibold">Ruleta 100% activa</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-950 border border-stone-800 p-4 rounded-2xl">
          <span className="text-[11px] text-stone-400 font-semibold block">Alias en Rotación Activa</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-sky-400 font-heading">{activeCount}</span>
            <span className="text-xs text-stone-500 font-medium">de {aliases.length} configurados</span>
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {activeCount >= 3 ? '✅ Pool óptimo (3-4 cuentas)' : '⚠️ Recomendamos mantener 3 o 4 alias activos'}
          </div>
        </div>

        <div className="bg-stone-950 border border-stone-800 p-4 rounded-2xl">
          <span className="text-[11px] text-stone-400 font-semibold block">Total Recaudado por MP</span>
          <div className="mt-1">
            <span className="text-2xl font-black text-emerald-400 font-heading">
              ${totalCollectedAll.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Sumatoria acumulada en todas las cuentas
          </div>
        </div>

        <div className="bg-stone-950 border border-stone-800 p-4 rounded-2xl">
          <span className="text-[11px] text-stone-400 font-semibold block">Distribución Aleatoria</span>
          <div className="mt-1">
            <span className="text-2xl font-black text-amber-400 font-heading">1 / {activeCount || 1}</span>
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Probabilidad uniforme por cada pedido nuevo
          </div>
        </div>
      </div>

      {/* Add New Alias Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddAlias}
          className="bg-stone-950 p-6 rounded-3xl border border-sky-500/40 space-y-4 animate-in fade-in"
        >
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Configurar Nuevo Alias de Mercado Pago</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                Alias de Mercado Pago *
              </label>
              <input
                type="text"
                placeholder="ej: pedidos.sabores.mp"
                value={newAliasName}
                onChange={(e) => setNewAliasName(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 outline-none focus:border-sky-400 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                Nombre del Titular *
              </label>
              <input
                type="text"
                placeholder="ej: Juan Pérez"
                value={newHolderName}
                onChange={(e) => setNewHolderName(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 outline-none focus:border-sky-400"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                CUIT / DNI
              </label>
              <input
                type="text"
                placeholder="ej: 20-33491204-7"
                value={newCuit}
                onChange={(e) => setNewCuit(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 outline-none focus:border-sky-400 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                CVU / CBU (opcional)
              </label>
              <input
                type="text"
                placeholder="22 dígitos"
                value={newCvu}
                onChange={(e) => setNewCvu(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 outline-none focus:border-sky-400 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                Entidad
              </label>
              <input
                type="text"
                value={newBank}
                onChange={(e) => setNewBank(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs text-stone-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-sky-500 hover:bg-sky-400 text-stone-950 font-black text-xs px-5 py-2 rounded-xl"
            >
              Guardar Alias
            </button>
          </div>
        </form>
      )}

      {/* Aliases List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aliases.map((alias) => (
          <div
            key={alias.id}
            className={`p-5 rounded-3xl border transition-all ${
              alias.isActive
                ? 'bg-stone-950 border-sky-500/30 shadow-lg shadow-sky-500/5'
                : 'bg-stone-950/60 border-stone-800 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <span className="text-base font-black text-white font-mono truncate">
                    {alias.alias}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Titular: <strong className="text-stone-200">{alias.holder}</strong>
                </p>
                <p className="text-[11px] text-stone-500 font-mono">CUIT: {alias.cuitOrDni}</p>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(alias.id)}
                  className="flex items-center gap-1 text-xs font-bold transition-colors"
                  title={alias.isActive ? 'Pausar alias de la rotación' : 'Activar alias para rotación'}
                >
                  {alias.isActive ? (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-[11px] flex items-center gap-1 font-bold">
                      <Check className="w-3 h-3 stroke-[3]" /> Activo
                    </span>
                  ) : (
                    <span className="bg-stone-800 text-stone-400 border border-stone-700 px-2.5 py-1 rounded-xl text-[11px]">
                      Pausado
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleDelete(alias.id)}
                  className="text-stone-600 hover:text-rose-400 p-1.5 rounded-lg transition-colors"
                  title="Eliminar este alias"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="mt-4 pt-3 border-t border-stone-850 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block font-semibold">Total Cobrado</span>
                <span className="text-sm font-black text-amber-400 font-heading">
                  ${alias.totalCollected.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block font-semibold">Pedidos Asignados</span>
                <span className="text-sm font-black text-sky-400 font-heading">
                  {alias.ordersCount} pedidos
                </span>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-stone-500 font-mono truncate">
              CVU: {alias.cvu}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
