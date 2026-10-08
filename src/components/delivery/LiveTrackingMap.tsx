import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Order, Cadete } from '../../types';
import { deliveryService } from '../../services/deliveryService';
import {
  Bike,
  Navigation,
  MapPin,
  Store,
  Phone,
  Clock,
  Compass,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface LiveTrackingMapProps {
  order: Order;
  heightClass?: string;
  showZoneCircles?: boolean;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  order,
  heightClass = 'h-72 sm:h-80',
  showZoneCircles = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const cadeteMarkerRef = useRef<L.Marker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [cadeteProgress, setCadeteProgress] = useState<number>(0.4); // 0 = store, 1 = client
  const [etaMinutes, setEtaMinutes] = useState<number>(() => Math.max(5, Math.round(order.estimatedDeliveryMinutes * 0.6)));
  const [distanceKmRemaining, setDistanceKmRemaining] = useState<number>(1.2);
  const [assignedCadete, setAssignedCadete] = useState<Cadete | null>(null);

  const config = deliveryService.getConfig();
  const storeLat = config.storeCoords.lat;
  const storeLng = config.storeCoords.lng;

  // Compute mock customer coordinates based on order address or distance
  const customerDistance = order.deliveryDistanceKm || deliveryService.estimateDistance(order.deliveryAddress || '');
  // Offset customer slightly northeast/northwest for a realistic city grid route
  const clientLat = storeLat + (customerDistance / 111) * 0.7;
  const clientLng = storeLng + (customerDistance / 111) * 0.75;

  // Determine cadete info
  useEffect(() => {
    const cadetes = deliveryService.getCadetes();
    let cadete = cadetes.find((c) => c.id === order.assignedCadeteId);
    if (!cadete) {
      // Pick suitable cadete according to vehicle type or first active
      const vehicle = order.vehicleType || (customerDistance > 2.5 ? 'moto' : 'bicicleta');
      cadete = cadetes.find((c) => c.vehicle === vehicle && c.status !== 'inactivo') || cadetes[0];
    }
    setAssignedCadete(cadete || null);
  }, [order.assignedCadeteId, order.vehicleType, customerDistance]);

  // Interpolate position along a realistic delivery waypoint curve
  const getRouteWaypoints = (): [number, number][] => {
    // 5 waypoints creating a city street grid path
    const p0: [number, number] = [storeLat, storeLng];
    const p1: [number, number] = [storeLat + (clientLat - storeLat) * 0.35, storeLng + (clientLng - storeLng) * 0.05];
    const p2: [number, number] = [storeLat + (clientLat - storeLat) * 0.45, storeLng + (clientLng - storeLng) * 0.6];
    const p3: [number, number] = [storeLat + (clientLat - storeLat) * 0.85, storeLng + (clientLng - storeLng) * 0.85];
    const p4: [number, number] = [clientLat, clientLng];
    return [p0, p1, p2, p3, p4];
  };

  const getPositionAtProgress = (t: number): [number, number] => {
    const waypoints = getRouteWaypoints();
    const clamped = Math.max(0, Math.min(1, t));
    const segmentCount = waypoints.length - 1;
    const segmentIndex = Math.min(Math.floor(clamped * segmentCount), segmentCount - 1);
    const segmentProgress = (clamped * segmentCount) - segmentIndex;

    const start = waypoints[segmentIndex];
    const end = waypoints[segmentIndex + 1];

    const lat = start[0] + (end[0] - start[0]) * segmentProgress;
    const lng = start[1] + (end[1] - start[1]) * segmentProgress;
    return [lat, lng];
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Dark styled OpenStreetMap tiles via CartoDB Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom buttons in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // 1. Delivery Zones Circles (Radios de entrega)
    if (showZoneCircles && config.zones) {
      config.zones.forEach((zone) => {
        if (!zone.enabled) return;
        L.circle([storeLat, storeLng], {
          radius: zone.maxDistanceKm * 1000,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.07,
          weight: 1.5,
          dashArray: '4, 6',
        }).addTo(map);
      });
    }

    // 2. Store Marker (Punto Morfi)
    const storeIconHtml = `
      <div style="
        background: #1b2827;
        color: #f88d63;
        border: 2px solid #f88d63;
        border-radius: 9999px;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
          <path d="M2 7h20"/>
        </svg>
      </div>
    `;

    const storeIcon = L.divIcon({
      html: storeIconHtml,
      className: 'store-custom-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker([storeLat, storeLng], { icon: storeIcon })
      .addTo(map)
      .bindPopup(`<b>${config.storeName}</b><br/>${config.storeAddress}<br/><small>Cocina central</small>`);

    // 3. Customer Destination Marker
    const clientIconHtml = `
      <div style="
        background: #e2e663;
        color: #1b2827;
        border: 2px solid #ffffff;
        border-radius: 9999px;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `;

    const clientIcon = L.divIcon({
      html: clientIconHtml,
      className: 'client-custom-marker',
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });

    L.marker([clientLat, clientLng], { icon: clientIcon })
      .addTo(map)
      .bindPopup(`<b>Destino: ${order.customerName}</b><br/>${order.deliveryAddress || 'Domicilio'}`);

    // 4. Route Polyline
    const routeCoords = getRouteWaypoints();
    L.polyline(routeCoords, {
      color: '#f88d63',
      weight: 4,
      opacity: 0.85,
      dashArray: '6, 6',
    }).addTo(map);

    // 5. Cadete Moving Marker
    const isMoto = order.vehicleType === 'moto' || assignedCadete?.vehicle === 'moto';
    const vehicleEmoji = isMoto ? '🛵' : '🚲';

    const cadeteIconHtml = `
      <div class="relative flex items-center justify-center">
        <!-- Uber-style pulsating radar ring -->
        <div style="
          position: absolute;
          width: 52px;
          height: 52px;
          background: rgba(248, 141, 99, 0.25);
          border-radius: 9999px;
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          background: #f88d63;
          color: #1b2827;
          border: 3px solid #ffffff;
          border-radius: 9999px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          box-shadow: 0 4px 16px rgba(248, 141, 99, 0.6);
          position: relative;
          z-index: 10;
        ">
          ${vehicleEmoji}
        </div>
      </div>
    `;

    const cadeteIcon = L.divIcon({
      html: cadeteIconHtml,
      className: 'cadete-moving-marker',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const initialPos = getPositionAtProgress(0.35);
    const cadeteMarker = L.marker(initialPos, { icon: cadeteIcon }).addTo(map);
    cadeteMarkerRef.current = cadeteMarker;

    // Fit bounds to show both store and destination with padding
    const bounds = L.latLngBounds([
      [storeLat, storeLng],
      [clientLat, clientLng],
      initialPos,
    ]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });

    // Smooth real-time Uber animation loop
    let currentT = order.status === 'en_camino' ? 0.35 : order.status === 'entregado' ? 1.0 : 0.1;
    const speed = order.status === 'en_camino' ? 0.0007 : 0.0001;

    const animate = () => {
      if (order.status === 'en_camino') {
        currentT += speed;
        if (currentT > 0.95) {
          currentT = 0.95; // Stays close to destination until confirmed delivered
        }
      } else if (order.status === 'entregado') {
        currentT = 1.0;
      }

      setCadeteProgress(currentT);
      const pos = getPositionAtProgress(currentT);

      if (cadeteMarkerRef.current) {
        cadeteMarkerRef.current.setLatLng(pos);
      }

      const kmLeft = Math.max(0.1, Math.round(customerDistance * (1 - currentT) * 10) / 10);
      setDistanceKmRemaining(kmLeft);
      const minsLeft = Math.max(2, Math.round(kmLeft * 3.5));
      setEtaMinutes(minsLeft);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [storeLat, storeLng, clientLat, clientLng, showZoneCircles, order.status]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const pos = getPositionAtProgress(cadeteProgress);
    mapInstanceRef.current.setView(pos, 15, { animate: true });
  };

  const handleFitRoute = () => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds([
      [storeLat, storeLng],
      [clientLat, clientLng],
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
  };

  const isEnCamino = order.status === 'en_camino';
  const isEntregado = order.status === 'entregado';
  const vehicleLabel = assignedCadete?.vehicle === 'moto' ? 'Moto' : 'Bicicleta';

  return (
    <div className="rounded-3xl overflow-hidden border border-[#2d4240] bg-[#152221] shadow-2xl relative flex flex-col">
      {/* Top Banner Status Bar (Uber Style) */}
      <div className="bg-[#1b2827] px-4 py-2.5 border-b border-[#2d4240] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isEnCamino ? 'bg-emerald-400' : isEntregado ? 'bg-sky-400' : 'bg-amber-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isEnCamino ? 'bg-emerald-500' : isEntregado ? 'bg-sky-500' : 'bg-amber-500'
            }`} />
          </span>

          <span className="font-bold text-white font-['Fredoka']">
            {isEnCamino
              ? 'Cadete en viaje hacia tu dirección'
              : isEntregado
              ? '¡Cadete en tu puerta / Entregado!'
              : 'En preparación para despacho'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-[#f88d63]/20 text-[#f88d63] font-black px-2.5 py-0.5 rounded-full font-mono text-[11px] border border-[#f88d63]/30">
            {isEntregado ? 'Llegó' : `~${etaMinutes} min`}
          </span>
        </div>
      </div>

      {/* Map Canvas */}
      <div className={`w-full ${heightClass} relative`}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Quick Action Overlay Buttons */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5 shadow-lg">
          <button
            type="button"
            onClick={handleRecenter}
            className="w-9 h-9 bg-[#1b2827]/90 hover:bg-[#1b2827] text-white rounded-xl backdrop-blur-md flex items-center justify-center border border-[#2d4240] transition-colors"
            title="Centrar en el cadete"
          >
            <Compass className="w-4 h-4 text-[#f88d63]" />
          </button>
          <button
            type="button"
            onClick={handleFitRoute}
            className="w-9 h-9 bg-[#1b2827]/90 hover:bg-[#1b2827] text-white rounded-xl backdrop-blur-md flex items-center justify-center border border-[#2d4240] transition-colors"
            title="Ver recorrido completo"
          >
            <RotateCcw className="w-4 h-4 text-[#8daaa8]" />
          </button>
        </div>

        {/* Real-time Progress Pill on top of map */}
        <div className="absolute top-3 left-3 z-10 bg-[#1b2827]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#2d4240] flex items-center gap-2 text-[11px] text-stone-200">
          <Navigation className="w-3.5 h-3.5 text-[#f88d63]" />
          <span>Distancia restante:</span>
          <strong className="text-white font-mono">{distanceKmRemaining} km</strong>
        </div>
      </div>

      {/* Driver / Cadete Info Footer Card (Uber Style) */}
      <div className="p-3.5 bg-[#152221] border-t border-[#2d4240] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#f88d63] to-[#fa9d79] text-[#1b2827] font-black flex items-center justify-center text-sm shadow-md shrink-0">
            {assignedCadete?.vehicle === 'moto' ? '🛵' : '🚲'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white truncate font-['Fredoka']">
                {assignedCadete?.name || 'Cadete Oficial Punto Morfi'}
              </span>
              <span className="text-[10px] bg-[#243635] text-[#8daaa8] px-1.5 py-0.5 rounded-md border border-[#2d4240] uppercase font-bold shrink-0">
                {vehicleLabel}
              </span>
            </div>

            <p className="text-[11px] text-[#8daaa8] truncate mt-0.5">
              {order.deliveryAddress || 'Reparto a domicilio'}
            </p>
          </div>
        </div>

        {/* WhatsApp Call / Chat Button */}
        {assignedCadete?.phone && (
          <a
            href={`https://wa.me/${assignedCadete.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              `Hola ${assignedCadete.name}! Te escribo por el pedido ${order.orderNumber} de Punto Morfi.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-md text-xs font-['Fredoka']"
          >
            <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        )}
      </div>
    </div>
  );
};
