import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Cadete,
  DeliveryConfig,
  DeliveryZoneTier,
  OperatingShift,
} from '../../types';
import { deliveryService } from '../../services/deliveryService';
import {
  Bike,
  Navigation,
  MapPin,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Phone,
  Layers,
  Save,
  Sliders,
  DollarSign,
  UserCheck,
  Send,
} from 'lucide-react';

export const DeliveryManager: React.FC = () => {
  const [config, setConfig] = useState<DeliveryConfig>(() => deliveryService.getConfig());
  const [cadetes, setCadetes] = useState<Cadete[]>(() => deliveryService.getCadetes());
  const [activeSubTab, setActiveSubTab] = useState<'zones' | 'schedule' | 'cadetes' | 'map'>('zones');

  // Simulator state
  const [simAddress, setSimAddress] = useState('Av. Pellegrini 2200');
  const [simDistance, setSimDistance] = useState<number>(2.0);

  // New Cadete Modal
  const [showAddCadeteModal, setShowAddCadeteModal] = useState(false);
  const [newCadeteName, setNewCadeteName] = useState('');
  const [newCadeteVehicle, setNewCadeteVehicle] = useState<'bicicleta' | 'moto'>('bicicleta');
  const [newCadetePhone, setNewCadetePhone] = useState('+549341');
  const [newCadeteNotes, setNewCadeteNotes] = useState('');

  // Map ref for fleet overview tab
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const unsub = deliveryService.subscribe((type) => {
      if (type === 'config_updated') {
        setConfig(deliveryService.getConfig());
      }
      if (type === 'cadetes_updated') {
        setCadetes(deliveryService.getCadetes());
      }
    });
    return unsub;
  }, []);

  const handleUpdateConfig = (updates: Partial<DeliveryConfig>) => {
    const updated = deliveryService.updateConfig(updates);
    setConfig(updated);
  };

  const handleUpdateZone = (zoneId: string, updates: Partial<DeliveryZoneTier>) => {
    const newZones = config.zones.map((z) => (z.id === zoneId ? { ...z, ...updates } : z));
    handleUpdateConfig({ zones: newZones });
  };

  const handleUpdateShift = (shiftId: string, updates: Partial<OperatingShift>) => {
    const newShifts = config.shifts.map((s) => (s.id === shiftId ? { ...s, ...updates } : s));
    handleUpdateConfig({ shifts: newShifts });
  };

  const handleAddCadete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCadeteName.trim()) return;

    deliveryService.addCadete({
      name: newCadeteName.trim(),
      vehicle: newCadeteVehicle,
      phone: newCadetePhone.trim(),
      status: 'disponible',
      notes: newCadeteNotes.trim() || undefined,
    });

    setNewCadeteName('');
    setNewCadeteNotes('');
    setShowAddCadeteModal(false);
  };

  const handleDeleteCadete = (id: string) => {
    if (window.confirm('¿Seguro de remover este cadete?')) {
      deliveryService.deleteCadete(id);
    }
  };

  const handleToggleCadeteStatus = (id: string) => {
    deliveryService.toggleCadeteStatus(id);
  };

  // Run live simulation
  const simResult = deliveryService.validateDeliveryZone(simAddress, simDistance);
  const scheduleCheck = deliveryService.checkStoreSchedule();

  // Initialize interactive zones map when on 'map' tab
  useEffect(() => {
    if (activeSubTab !== 'map' || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const storeLat = config.storeCoords.lat;
    const storeLng = config.storeCoords.lng;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([storeLat, storeLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Radii
    config.zones.forEach((zone) => {
      if (!zone.enabled) return;
      L.circle([storeLat, storeLng], {
        radius: zone.maxDistanceKm * 1000,
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 8',
      }).addTo(map).bindPopup(`<b>${zone.name}</b><br/>Radio máx: ${zone.maxDistanceKm} km<br/>Costo: $${zone.deliveryFee}`);
    });

    // Store marker
    const storeIcon = L.divIcon({
      html: `
        <div style="background:#1b2827;color:#f88d63;border:3px solid #f88d63;border-radius:9999px;width:42px;height:42px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.5);">
          🏠
        </div>
      `,
      className: 'store-icon',
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });

    L.marker([storeLat, storeLng], { icon: storeIcon })
      .addTo(map)
      .bindPopup(`<b>${config.storeName}</b><br/>${config.storeAddress}`);

    // Cadetes markers on map
    cadetes.forEach((c, idx) => {
      const angle = (idx / cadetes.length) * 2 * Math.PI;
      const dist = (c.vehicle === 'bicicleta' ? 1.2 : 2.8) / 111;
      const cLat = storeLat + dist * Math.cos(angle);
      const cLng = storeLng + dist * Math.sin(angle);

      const cadeteIcon = L.divIcon({
        html: `
          <div style="background:#f88d63;color:#1b2827;border:2px solid white;border-radius:9999px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 10px rgba(0,0,0,0.4);">
            ${c.vehicle === 'moto' ? '🛵' : '🚲'}
          </div>
        `,
        className: 'cadete-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([cLat, cLng], { icon: cadeteIcon })
        .addTo(map)
        .bindPopup(`<b>${c.name}</b> (${c.vehicle})<br/>Estado: ${c.status}<br/>Entregas hoy: ${c.dailyDeliveries}`);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeSubTab, config, cadetes]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#192625] border border-[#2d4240] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#f88d63]/20 border border-[#f88d63]/40 flex items-center justify-center text-[#f88d63]">
              <Bike className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Fredoka']">
                Administración de Envíos, Zonas & Cadetes
              </h2>
              <p className="text-xs text-[#8daaa8]">
                Restricción por radio de local (bici / moto), horario tope de toma de pedidos y cadetería
              </p>
            </div>
          </div>
        </div>

        {/* Master Switches */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Pause delivery toggle (rain/rush) */}
          <button
            type="button"
            onClick={() => handleUpdateConfig({ isDeliveryActive: !config.isDeliveryActive })}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all font-['Fredoka'] shadow-md ${
              config.isDeliveryActive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${config.isDeliveryActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span>{config.isDeliveryActive ? 'Envíos Activos' : 'Envíos Pausados (Lluvia)'}</span>
          </button>

          {/* Force open testing toggle */}
          <button
            type="button"
            onClick={() => handleUpdateConfig({ forceOpenForTesting: !config.forceOpenForTesting })}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all font-['Fredoka'] border ${
              config.forceOpenForTesting
                ? 'bg-[#e2e663] text-[#1b2827] border-[#e2e663]'
                : 'bg-[#243635] text-[#8daaa8] border-[#2d4240] hover:text-white'
            }`}
            title="Ignora el horario para probar pedidos a cualquier hora"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modo Pruebas 24/7: {config.forceOpenForTesting ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-[#2d4240] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('zones')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap font-['Fredoka'] ${
            activeSubTab === 'zones'
              ? 'bg-[#f88d63] text-[#1b2827] shadow-lg'
              : 'text-[#8daaa8] hover:text-white hover:bg-[#243635]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Radios & Tarifas (Bici vs Moto)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('schedule')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap font-['Fredoka'] ${
            activeSubTab === 'schedule'
              ? 'bg-[#f88d63] text-[#1b2827] shadow-lg'
              : 'text-[#8daaa8] hover:text-white hover:bg-[#243635]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Horario Tope de Pedidos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cadetes')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap font-['Fredoka'] ${
            activeSubTab === 'cadetes'
              ? 'bg-[#f88d63] text-[#1b2827] shadow-lg'
              : 'text-[#8daaa8] hover:text-white hover:bg-[#243635]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Flota de Cadetes ({cadetes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('map')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap font-['Fredoka'] ${
            activeSubTab === 'map'
              ? 'bg-[#f88d63] text-[#1b2827] shadow-lg'
              : 'text-[#8daaa8] hover:text-white hover:bg-[#243635]'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Mapa de Cobertura en Vivo</span>
        </button>
      </div>

      {/* ==========================================
          SUBTAB 1: ZONES & VEHICLE TIERS
          ========================================== */}
      {activeSubTab === 'zones' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Zone Cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#192625] border border-[#2d4240] rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white font-['Fredoka']">
                    Configuración de Radios Concéntricos del Local
                  </h3>
                  <p className="text-xs text-[#8daaa8]">
                    Ubicación comercial: <strong className="text-white">{config.storeAddress} ({config.storeCity})</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    deliveryService.resetConfigToDefaults();
                    setConfig(deliveryService.getConfig());
                  }}
                  className="text-xs text-[#8daaa8] hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer</span>
                </button>
              </div>

              {/* Zones List */}
              <div className="space-y-4">
                {config.zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="bg-[#14201f] border border-[#2d4240] rounded-2xl p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md"
                          style={{ backgroundColor: `${zone.color}25`, color: zone.color }}
                        >
                          {zone.vehicleType === 'moto' ? '🛵' : '🚲'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm font-['Fredoka']">{zone.name}</h4>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#243635] text-[#8daaa8]">
                              {zone.vehicleType}
                            </span>
                          </div>
                          <p className="text-xs text-[#8daaa8]">{zone.description}</p>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs font-bold text-[#8daaa8]">Habilitada:</span>
                        <input
                          type="checkbox"
                          checked={zone.enabled}
                          onChange={(e) => handleUpdateZone(zone.id, { enabled: e.target.checked })}
                          className="w-5 h-5 accent-[#f88d63] rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Numeric Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#243635]">
                      {/* Max Radius KM */}
                      <div className="bg-[#1b2827] p-3 rounded-xl border border-[#2d4240]">
                        <label className="text-[11px] text-[#8daaa8] font-bold block mb-1">
                          Radio Máximo (km):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="15"
                            value={zone.maxDistanceKm}
                            onChange={(e) =>
                              handleUpdateZone(zone.id, { maxDistanceKm: parseFloat(e.target.value) || 1 })
                            }
                            className="w-full bg-[#14201f] border border-[#2d4240] rounded-lg px-2.5 py-1 text-sm text-white font-mono font-bold outline-none"
                          />
                          <span className="text-xs text-[#8daaa8] font-bold">km</span>
                        </div>
                      </div>

                      {/* Delivery Fee */}
                      <div className="bg-[#1b2827] p-3 rounded-xl border border-[#2d4240]">
                        <label className="text-[11px] text-[#8daaa8] font-bold block mb-1">
                          Tarifa de Envío ($):
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#e2e663] font-bold">$</span>
                          <input
                            type="number"
                            step="100"
                            min="0"
                            value={zone.deliveryFee}
                            onChange={(e) =>
                              handleUpdateZone(zone.id, { deliveryFee: parseInt(e.target.value, 10) || 0 })
                            }
                            className="w-full bg-[#14201f] border border-[#2d4240] rounded-lg px-2.5 py-1 text-sm text-[#e2e663] font-mono font-bold outline-none"
                          />
                        </div>
                      </div>

                      {/* Estimated Minutes */}
                      <div className="bg-[#1b2827] p-3 rounded-xl border border-[#2d4240]">
                        <label className="text-[11px] text-[#8daaa8] font-bold block mb-1">
                          Tiempo Estimado:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="5"
                            min="5"
                            max="120"
                            value={zone.estimatedMinutes}
                            onChange={(e) =>
                              handleUpdateZone(zone.id, { estimatedMinutes: parseInt(e.target.value, 10) || 20 })
                            }
                            className="w-full bg-[#14201f] border border-[#2d4240] rounded-lg px-2.5 py-1 text-sm text-white font-mono font-bold outline-none"
                          />
                          <span className="text-xs text-[#8daaa8] font-bold">min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Live Delivery Simulator */}
          <div className="space-y-4">
            <div className="bg-[#192625] border border-[#2d4240] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-[#f88d63]" />
                <h3 className="text-base font-black text-white font-['Fredoka']">
                  Simulador de Cobertura
                </h3>
              </div>
              <p className="text-xs text-[#8daaa8]">
                Comprobá en tiempo real cómo se valida una dirección y qué cadete se asigna.
              </p>

              {/* Test Address Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">Dirección de prueba:</label>
                <input
                  type="text"
                  value={simAddress}
                  onChange={(e) => setSimAddress(e.target.value)}
                  placeholder="Ej: Av. Pellegrini 2500, Corrientes 800..."
                  className="w-full bg-[#14201f] border border-[#2d4240] focus:border-[#f88d63] rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* Distance Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-300 font-bold">Distancia simulada:</span>
                  <span className="text-[#e2e663] font-mono font-bold">{simDistance} km</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8.0"
                  step="0.1"
                  value={simDistance}
                  onChange={(e) => setSimDistance(parseFloat(e.target.value))}
                  className="w-full accent-[#f88d63] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#8daaa8]">
                  <span>0.5 km (Inmediaciones)</span>
                  <span>2.5 km (Bici)</span>
                  <span>5.5 km (Moto)</span>
                  <span>8.0 km (Excedido)</span>
                </div>
              </div>

              {/* Validation Result Box */}
              <div className={`p-4 rounded-2xl border space-y-2 transition-all ${
                simResult.canDeliver
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black uppercase font-['Fredoka'] ${
                    simResult.canDeliver ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {simResult.canDeliver ? '✅ Dentro de Cobertura' : '❌ Fuera de Radio'}
                  </span>
                  {simResult.vehicleType && (
                    <span className="text-xs bg-[#1b2827] px-2 py-0.5 rounded-full text-stone-200 border border-[#2d4240] font-bold">
                      {simResult.vehicleType === 'moto' ? '🛵 Cadete en Moto' : '🚲 Cadete en Bici'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-300 leading-tight">
                  {simResult.message}
                </p>

                {simResult.reason && (
                  <p className="text-[11px] text-[#fa9d79] italic leading-tight">
                    {simResult.reason}
                  </p>
                )}

                {simResult.canDeliver && (
                  <div className="pt-2 border-t border-[#2d4240] flex justify-between items-center text-xs">
                    <span className="text-[#8daaa8]">Costo de envío:</span>
                    <strong className="text-[#e2e663] font-mono font-bold text-sm">
                      ${simResult.deliveryFee.toLocaleString('es-AR')}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 2: OPERATING HOURS & CUTOFF TIME
          ========================================== */}
      {activeSubTab === 'schedule' && (
        <div className="bg-[#192625] border border-[#2d4240] rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white font-['Fredoka']">
                Horarios de Cocina y Horario Tope de Realización de Pedidos
              </h3>
              <p className="text-xs text-[#8daaa8]">
                El sistema valida automáticamente que no se tomen pedidos fuera del horario o superado el horario tope
              </p>
            </div>

            <div className={`px-4 py-2 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
              scheduleCheck.isOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{scheduleCheck.message}</span>
            </div>
          </div>

          {/* Shifts Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.shifts.map((shift) => (
              <div
                key={shift.id}
                className="bg-[#14201f] border border-[#2d4240] rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm font-['Fredoka'] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#f88d63]" />
                    <span>{shift.name}</span>
                  </h4>
                  <span className="text-[10px] bg-[#f88d63]/20 text-[#f88d63] px-2 py-0.5 rounded-full font-bold">
                    Lun a Dom
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Open Time */}
                  <div className="bg-[#1b2827] p-3 rounded-xl border border-[#2d4240]">
                    <label className="text-[11px] text-[#8daaa8] font-bold block mb-1">
                      Apertura Cocina:
                    </label>
                    <input
                      type="time"
                      value={shift.openTime}
                      onChange={(e) => handleUpdateShift(shift.id, { openTime: e.target.value })}
                      className="w-full bg-[#14201f] border border-[#2d4240] rounded-lg px-2 py-1 text-xs text-white font-mono outline-none"
                    />
                  </div>

                  {/* Cutoff Time (Horario Tope) */}
                  <div className="bg-[#1b2827] p-3 rounded-xl border border-[#f88d63]/40 shadow-sm">
                    <label className="text-[11px] text-[#f88d63] font-bold block mb-1">
                      Horario Tope Pedido:
                    </label>
                    <input
                      type="time"
                      value={shift.cutoffTime}
                      onChange={(e) => handleUpdateShift(shift.id, { cutoffTime: e.target.value })}
                      className="w-full bg-[#14201f] border border-[#f88d63]/60 rounded-lg px-2 py-1 text-xs text-[#f88d63] font-mono font-bold outline-none"
                    />
                  </div>

                  {/* Close Time */}
                  <div className="bg-[#1b2827] p-3 rounded-xl border border-[#2d4240]">
                    <label className="text-[11px] text-[#8daaa8] font-bold block mb-1">
                      Cierre de Turno:
                    </label>
                    <input
                      type="time"
                      value={shift.closeTime}
                      onChange={(e) => handleUpdateShift(shift.id, { closeTime: e.target.value })}
                      className="w-full bg-[#14201f] border border-[#2d4240] rounded-lg px-2 py-1 text-xs text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-[#8daaa8] italic">
                  💡 Los clientes podrán realizar pedidos hasta las <strong>{shift.cutoffTime} hs</strong>. A partir de esa hora se deshabilita la compra para permitirle a la cocina despachar todo a tiempo.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 3: CADETES ROSTER
          ========================================== */}
      {activeSubTab === 'cadetes' && (
        <div className="space-y-4">
          <div className="bg-[#192625] border border-[#2d4240] rounded-3xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white font-['Fredoka']">
                  Flota de Cadetes (Bicicletas & Motocicletas)
                </h3>
                <p className="text-xs text-[#8daaa8]">
                  Administrá el personal de reparto para asignar automáticamente según la distancia del cliente
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCadeteModal(true)}
                className="px-4 py-2.5 bg-[#f88d63] hover:bg-[#fa9d79] text-[#1b2827] font-black rounded-2xl text-xs flex items-center gap-2 shadow-lg font-['Fredoka']"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Agregar Cadete</span>
              </button>
            </div>

            {/* Cadetes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cadetes.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#14201f] border border-[#2d4240] rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#1b2827] border border-[#2d4240] flex items-center justify-center text-xl shadow-md">
                        {c.vehicle === 'moto' ? '🛵' : '🚲'}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm font-['Fredoka']">{c.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-[#8daaa8]">
                          <span className="capitalize font-bold text-[#e2e663]">{c.vehicle}</span>
                          <span>•</span>
                          <span>{c.dailyDeliveries} viajes hoy</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCadete(c.id)}
                      className="text-[#8daaa8] hover:text-rose-400 p-1"
                      title="Eliminar cadete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {c.notes && (
                    <p className="text-[11px] text-[#8daaa8] italic bg-[#1b2827] p-2 rounded-xl">
                      &quot;{c.notes}&quot;
                    </p>
                  )}

                  <div className="pt-2 border-t border-[#243635] flex items-center justify-between gap-2">
                    {/* Status switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleCadeteStatus(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                        c.status === 'disponible'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : c.status === 'en_reparto'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {c.status === 'disponible' ? '🟢 Disponible' : c.status === 'en_reparto' ? '🛵 En Reparto' : '⚪ Inactivo'}
                    </button>

                    {/* WhatsApp link */}
                    <a
                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hola ${c.name}! Te escribimos desde la cocina de Punto Morfi.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#243635] hover:bg-[#2d4240] text-emerald-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 4: INTERACTIVE MAP OVERVIEW
          ========================================== */}
      {activeSubTab === 'map' && (
        <div className="bg-[#192625] border border-[#2d4240] rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white font-['Fredoka']">
                Mapa General de Cobertura y Radios de Reparto
              </h3>
              <p className="text-xs text-[#8daaa8]">
                Visualizá el local central, el anillo verde (Inmediaciones en Bici hasta 2.5 km) y el anillo ámbar (Motos hasta 5.5 km)
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Radio Bici (2.5 km)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Radio Moto (5.5 km)
              </span>
            </div>
          </div>

          <div className="h-96 w-full rounded-2xl overflow-hidden border border-[#2d4240] relative">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
          </div>
        </div>
      )}

      {/* Add Cadete Modal */}
      {showAddCadeteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e2d2c] border border-[#2d4240] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2d4240] pb-3">
              <h3 className="text-base font-black text-white font-['Fredoka'] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#f88d63]" />
                <span>Registrar Nuevo Cadete</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCadeteModal(false)}
                className="p-1 rounded-lg text-[#8daaa8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCadete} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">Nombre completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Nicolás Gómez"
                  value={newCadeteName}
                  onChange={(e) => setNewCadeteName(e.target.value)}
                  className="w-full bg-[#14201f] border border-[#2d4240] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#f88d63]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">Vehículo:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCadeteVehicle('bicicleta')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border ${
                      newCadeteVehicle === 'bicicleta'
                        ? 'bg-[#f88d63] text-[#1b2827] border-[#f88d63]'
                        : 'bg-[#14201f] text-stone-300 border-[#2d4240]'
                    }`}
                  >
                    <span>🚲 Bicicleta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCadeteVehicle('moto')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border ${
                      newCadeteVehicle === 'moto'
                        ? 'bg-[#f88d63] text-[#1b2827] border-[#f88d63]'
                        : 'bg-[#14201f] text-stone-300 border-[#2d4240]'
                    }`}
                  >
                    <span>🛵 Moto</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">Teléfono / WhatsApp:</label>
                <input
                  type="text"
                  required
                  placeholder="+5493415551234"
                  value={newCadetePhone}
                  onChange={(e) => setNewCadetePhone(e.target.value)}
                  className="w-full bg-[#14201f] border border-[#2d4240] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#f88d63]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">Notas / Horario / Turno:</label>
                <input
                  type="text"
                  placeholder="Ej: Disponible turno noche con mochila térmica"
                  value={newCadeteNotes}
                  onChange={(e) => setNewCadeteNotes(e.target.value)}
                  className="w-full bg-[#14201f] border border-[#2d4240] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#f88d63]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCadeteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#8daaa8] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#f88d63] hover:bg-[#fa9d79] text-[#1b2827] text-xs font-black rounded-xl font-['Fredoka']"
                >
                  Guardar Cadete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
