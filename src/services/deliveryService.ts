import {
  Cadete,
  DeliveryConfig,
  DeliveryValidationResult,
  DeliveryZoneTier,
  OperatingShift,
  ScheduleCheckResult,
} from '../types';

const STORAGE_KEYS = {
  DELIVERY_CONFIG: 'punto_morfi_delivery_config_v2',
  CADETES: 'punto_morfi_cadetes_v2',
};

export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  storeName: 'Punto Morfi',
  storeAddress: 'Av. Pellegrini 1450',
  storeCity: 'Rosario, Santa Fe',
  storeCoords: {
    lat: -32.9542,
    lng: -60.6538,
  },
  isDeliveryActive: true,
  deliveryPauseReason: '',
  maxDeliveryRadiusKm: 6.0,
  forceOpenForTesting: false, // Normal schedule validation with demo toggle
  pickupAlwaysAllowed: true,
  zones: [
    {
      id: 'zona-bici',
      name: 'Zona 1 - Inmediaciones (Bicicleta)',
      vehicleType: 'bicicleta',
      maxDistanceKm: 2.5,
      deliveryFee: 1200,
      estimatedMinutes: 25,
      description: 'Radio cercano ideal para cadetes en bicicleta. Rápido y económico.',
      enabled: true,
      color: '#10b981',
    },
    {
      id: 'zona-moto',
      name: 'Zona 2 - Radio Extendido (Moto)',
      vehicleType: 'moto',
      maxDistanceKm: 5.5,
      deliveryFee: 1900,
      estimatedMinutes: 40,
      description: 'Radio ampliado para cadetes en motocicleta (2.5 km a 5.5 km).',
      enabled: true,
      color: '#f59e0b',
    },
  ],
  shifts: [
    {
      id: 'shift-almuerzo',
      name: 'Turno Mediodía / Almuerzo',
      openTime: '11:30',
      closeTime: '15:30',
      cutoffTime: '15:00', // Horario tope de pedidos
      days: [0, 1, 2, 3, 4, 5, 6], // Todos los días
    },
    {
      id: 'shift-cena',
      name: 'Turno Noche / Cena',
      openTime: '19:30',
      closeTime: '00:30',
      cutoffTime: '00:00', // Horario tope de pedidos
      days: [0, 1, 2, 3, 4, 5, 6],
    },
  ],
};

export const INITIAL_CADETES: Cadete[] = [
  {
    id: 'cad-1',
    name: 'Lucas Martínez',
    vehicle: 'bicicleta',
    phone: '+5493415551234',
    status: 'disponible',
    activeOrdersCount: 0,
    dailyDeliveries: 12,
    notes: 'Zona centro e inmediaciones. Cadete fijo.',
  },
  {
    id: 'cad-2',
    name: 'Franco Benítez',
    vehicle: 'moto',
    phone: '+5493415555678',
    status: 'disponible',
    activeOrdersCount: 1,
    dailyDeliveries: 16,
    notes: 'Maneja pedidos de más de 2.5 km.',
  },
  {
    id: 'cad-3',
    name: 'Santiago Gómez',
    vehicle: 'bicicleta',
    phone: '+5493415559012',
    status: 'en_reparto',
    activeOrdersCount: 2,
    dailyDeliveries: 9,
    notes: 'Bicicleta fija con caja térmica reforzada.',
  },
  {
    id: 'cad-4',
    name: 'Matías Rossi',
    vehicle: 'moto',
    phone: '+5493415553456',
    status: 'disponible',
    activeOrdersCount: 0,
    dailyDeliveries: 14,
    notes: 'Turno noche completo.',
  },
];

type DeliveryEventCallback = (type: 'config_updated' | 'cadetes_updated', payload: unknown) => void;

class DeliveryService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<DeliveryEventCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('punto_morfi_delivery_sync');
        this.channel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          this.notifySubscribers(type, payload, false);
        };
      } catch (e) {
        console.warn('BroadcastChannel error in DeliveryService', e);
      }
    }
  }

  private notifySubscribers(type: 'config_updated' | 'cadetes_updated', payload: unknown, broadcast = true) {
    this.listeners.forEach((fn) => {
      try {
        fn(type, payload);
      } catch (e) {
        console.error('Error calling listener:', e);
      }
    });

    if (broadcast && this.channel) {
      this.channel.postMessage({ type, payload });
    }
  }

  public subscribe(cb: DeliveryEventCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  // --- CONFIG ---
  public getConfig(): DeliveryConfig {
    if (typeof window === 'undefined') return DEFAULT_DELIVERY_CONFIG;
    const stored = localStorage.getItem(STORAGE_KEYS.DELIVERY_CONFIG);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.DELIVERY_CONFIG, JSON.stringify(DEFAULT_DELIVERY_CONFIG));
      return DEFAULT_DELIVERY_CONFIG;
    }
    try {
      const parsed: DeliveryConfig = JSON.parse(stored);
      // Ensure missing keys are backfilled
      return {
        ...DEFAULT_DELIVERY_CONFIG,
        ...parsed,
        zones: parsed.zones && parsed.zones.length > 0 ? parsed.zones : DEFAULT_DELIVERY_CONFIG.zones,
        shifts: parsed.shifts && parsed.shifts.length > 0 ? parsed.shifts : DEFAULT_DELIVERY_CONFIG.shifts,
      };
    } catch {
      return DEFAULT_DELIVERY_CONFIG;
    }
  }

  public saveConfig(config: DeliveryConfig) {
    localStorage.setItem(STORAGE_KEYS.DELIVERY_CONFIG, JSON.stringify(config));
    this.notifySubscribers('config_updated', config);
  }

  public updateConfig(updates: Partial<DeliveryConfig>) {
    const current = this.getConfig();
    const updated = { ...current, ...updates };
    this.saveConfig(updated);
    return updated;
  }

  public resetConfigToDefaults(): DeliveryConfig {
    this.saveConfig(DEFAULT_DELIVERY_CONFIG);
    return DEFAULT_DELIVERY_CONFIG;
  }

  // --- CADETES ---
  public getCadetes(): Cadete[] {
    if (typeof window === 'undefined') return INITIAL_CADETES;
    const stored = localStorage.getItem(STORAGE_KEYS.CADETES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.CADETES, JSON.stringify(INITIAL_CADETES));
      return INITIAL_CADETES;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_CADETES;
    }
  }

  public saveCadetes(cadetes: Cadete[]) {
    localStorage.setItem(STORAGE_KEYS.CADETES, JSON.stringify(cadetes));
    this.notifySubscribers('cadetes_updated', cadetes);
  }

  public addCadete(data: Omit<Cadete, 'id' | 'activeOrdersCount' | 'dailyDeliveries'>): Cadete {
    const newCadete: Cadete = {
      ...data,
      id: 'cad-' + Date.now(),
      activeOrdersCount: 0,
      dailyDeliveries: 0,
    };
    const updated = [...this.getCadetes(), newCadete];
    this.saveCadetes(updated);
    return newCadete;
  }

  public updateCadete(id: string, updates: Partial<Cadete>) {
    const cadetes = this.getCadetes().map((c) => (c.id === id ? { ...c, ...updates } : c));
    this.saveCadetes(cadetes);
  }

  public deleteCadete(id: string) {
    const cadetes = this.getCadetes().filter((c) => c.id !== id);
    this.saveCadetes(cadetes);
  }

  public toggleCadeteStatus(id: string) {
    const cadetes = this.getCadetes().map((c) => {
      if (c.id === id) {
        const nextStatus: Cadete['status'] =
          c.status === 'disponible' ? 'en_reparto' : c.status === 'en_reparto' ? 'inactivo' : 'disponible';
        return { ...c, status: nextStatus };
      }
      return c;
    });
    this.saveCadetes(cadetes);
  }

  // --- DISTANCE CALCULATION (Haversine) ---
  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Intelligently parses street addresses and numbers to estimate distance from the store.
   * If a distance override is given, it uses it directly.
   */
  public estimateDistance(address: string, overrideDistanceKm?: number): number {
    if (typeof overrideDistanceKm === 'number' && overrideDistanceKm >= 0) {
      return overrideDistanceKm;
    }

    if (!address || address.trim().length === 0) {
      return 1.5; // Default nearby estimate
    }

    const clean = address.toLowerCase().trim();

    // Check for explicit km indicator (e.g. "a 3.5 km", "4 km")
    const kmMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:km|kilometros|cuadras)/);
    if (kmMatch) {
      const val = parseFloat(kmMatch[1].replace(',', '.'));
      if (clean.includes('cuadras')) {
        return Math.round((val * 0.1) * 10) / 10; // 1 cuadra ~ 100m
      }
      return Math.round(val * 10) / 10;
    }

    // Heuristic based on street number (altura de calle)
    const numberMatch = clean.match(/\b(\d{1,5})\b/);
    if (numberMatch) {
      const streetNumber = parseInt(numberMatch[1], 10);
      // Pellegrini 1450 is the base store:
      // Distance grows roughly 100 meters per 100 street numbers from 1400
      const diffNumbers = Math.abs(streetNumber - 1450);
      const approxKm = 0.8 + (diffNumbers / 100) * 0.12;
      return Math.min(10, Math.max(0.5, Math.round(approxKm * 10) / 10));
    }

    // Hash address text deterministically to give a consistent realistic distance between 1.0 and 4.5 km
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
      hash = (hash << 5) - hash + clean.charCodeAt(i);
      hash |= 0;
    }
    const normalized = Math.abs(hash) % 40;
    return Math.round((1.0 + normalized * 0.1) * 10) / 10;
  }

  // --- VALIDATE DELIVERY ZONE ---
  /**
   * Validates if a customer's address and distance are within the delivery radius,
   * assigns the appropriate vehicle tier (bicicleta vs moto), and returns costs & times.
   */
  public validateDeliveryZone(
    address: string,
    overrideDistanceKm?: number
  ): DeliveryValidationResult {
    const config = this.getConfig();

    // 1. Check if delivery is globally active
    if (!config.isDeliveryActive) {
      return {
        inZone: false,
        zone: null,
        distanceKm: 0,
        deliveryFee: 0,
        estimatedMinutes: 0,
        vehicleType: null,
        canDeliver: false,
        message: 'Envíos a domicilio temporalmente pausados',
        reason: config.deliveryPauseReason || 'Por lluvia o alta demanda momentánea. Podés pedir con retiro en el local.',
      };
    }

    const distanceKm = this.estimateDistance(address, overrideDistanceKm);

    // 2. Sort zones by distance ascending (e.g. Bici 2.5 km first, Moto 5.5 km second)
    const sortedZones = [...config.zones]
      .filter((z) => z.enabled)
      .sort((a, b) => a.maxDistanceKm - b.maxDistanceKm);

    // 3. Find first matching zone
    const matchedZone = sortedZones.find((z) => distanceKm <= z.maxDistanceKm);

    if (matchedZone) {
      return {
        inZone: true,
        zone: matchedZone,
        distanceKm,
        deliveryFee: matchedZone.deliveryFee,
        estimatedMinutes: matchedZone.estimatedMinutes,
        vehicleType: matchedZone.vehicleType,
        canDeliver: true,
        message: `Dirección dentro del radio de ${matchedZone.name}`,
      };
    }

    // 4. Outside of all active zones
    const maxRadius = sortedZones.length > 0 ? sortedZones[sortedZones.length - 1].maxDistanceKm : config.maxDeliveryRadiusKm;
    return {
      inZone: false,
      zone: null,
      distanceKm,
      deliveryFee: 0,
      estimatedMinutes: 0,
      vehicleType: null,
      canDeliver: false,
      message: `Dirección fuera del radio de reparto (${distanceKm} km)`,
      reason: `Nuestros cadetes en bicicleta y moto reparten hasta un máximo de ${maxRadius} km desde el local. Te invitamos a seleccionar "Retiro en el Local".`,
    };
  }

  // --- STORE SCHEDULE & CUTOFF TIME ("HORARIO TOPE") ---
  /**
   * Verifies if the kitchen is open and if orders are allowed before the cutoff time.
   */
  public checkStoreSchedule(date: Date = new Date()): ScheduleCheckResult {
    const config = this.getConfig();

    // If testing mode is enabled in admin, force open
    if (config.forceOpenForTesting) {
      return {
        isOpen: true,
        canAcceptOrders: true,
        isPastCutoff: false,
        minutesUntilCutoff: 120,
        message: 'Modo Pruebas Activo (Cocina y pedidos abiertos 24/7)',
        statusTag: 'abierto',
      };
    }

    const currentDay = date.getDay(); // 0 is Sunday, 1 is Monday, ...
    const currentHour = date.getHours();
    const currentMinute = date.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    const timeToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    // Find shift that covers today and matches hours
    for (const shift of config.shifts) {
      if (!shift.days.includes(currentDay)) continue;

      const openMin = timeToMinutes(shift.openTime);
      let closeMin = timeToMinutes(shift.closeTime);
      let cutoffMin = timeToMinutes(shift.cutoffTime);

      // Handle shifts that cross midnight (e.g. 19:30 to 00:30)
      const crossesMidnight = closeMin < openMin;
      if (crossesMidnight) {
        closeMin += 24 * 60;
        if (cutoffMin < openMin) {
          cutoffMin += 24 * 60;
        }
      }

      let checkMin = currentTotalMinutes;
      // If past midnight and shift crosses midnight
      if (crossesMidnight && checkMin < openMin) {
        checkMin += 24 * 60;
      }

      if (checkMin >= openMin && checkMin <= closeMin) {
        // We are within shift hours! Now check cutoff time
        if (checkMin <= cutoffMin) {
          const minutesLeft = cutoffMin - checkMin;
          if (minutesLeft <= 30) {
            return {
              isOpen: true,
              canAcceptOrders: true,
              isPastCutoff: false,
              currentShift: shift,
              minutesUntilCutoff: minutesLeft,
              message: `¡Últimos ${minutesLeft} min para pedir! Horario tope: ${shift.cutoffTime} hs`,
              statusTag: 'por_cerrar',
            };
          }

          return {
            isOpen: true,
            canAcceptOrders: true,
            isPastCutoff: false,
            currentShift: shift,
            minutesUntilCutoff: minutesLeft,
            message: `Cocina abierta (${shift.name}) - Pedidos hasta las ${shift.cutoffTime} hs`,
            statusTag: 'abierto',
          };
        } else {
          // Inside shift, but PAST cutoff time!
          return {
            isOpen: true,
            canAcceptOrders: false,
            isPastCutoff: true,
            currentShift: shift,
            minutesUntilCutoff: 0,
            message: `Horario tope alcanzado (${shift.cutoffTime} hs). La cocina no toma más pedidos por hoy.`,
            statusTag: 'cerrado',
          };
        }
      }
    }

    // Outside of shifts
    const nextShift = config.shifts[0];
    return {
      isOpen: false,
      canAcceptOrders: false,
      isPastCutoff: true,
      nextShift,
      message: `Cocina cerrada en este momento. Abrimos a las ${nextShift?.openTime || '11:30'} hs`,
      statusTag: 'cerrado',
    };
  }
}

export const deliveryService = new DeliveryService();
