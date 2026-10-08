export type OrderStatus =
  | 'pendiente_pago'
  | 'confirmado'
  | 'en_cocina'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export type PaymentMethod =
  | 'mercadopago_alias'
  | 'efectivo'
  | 'pos_tarjeta';

export type DeliveryMethod = 'delivery' | 'pickup';

export interface ProductOption {
  id: string;
  name: string;
  priceModifier?: number;
}

export interface ProductOptionGroup {
  id: string;
  title: string;
  required: boolean;
  maxSelectable?: number;
  options: ProductOption[];
}

export interface Presentacion {
  id: string;           // 'unidad' | 'docena' | 'media' | custom ('media-docena', ...)
  label: string;        // 'Unidad', 'Docena (12 u.)', 'Media pizza', ...
  factor: number;       // multiplicador del precio base (1, 12, 0.5, ...)
  precioFijo?: number;  // override opcional (ej. precio promo de docena)
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'empanadas' | 'milanesas' | 'hamburguesas' | 'pizzas' | 'lomitos' | 'minutas' | 'bebidas' | 'postres';
  image: string;
  isPopular?: boolean;
  isHomemadeSpecial?: boolean;
  preparationTimeMinutes: number;
  isAvailable: boolean;
  optionGroups?: ProductOptionGroup[];
  presentaciones?: Presentacion[];
}

export interface CartItemOptionSelected {
  groupId: string;
  groupTitle: string;
  selectedOption: ProductOption;
}

export interface CartItem {
  id: string; // unique cart line id
  menuItem: MenuItem;
  quantity: number;
  selectedOptions?: CartItemOptionSelected[];
  specialInstructions?: string;
  itemTotalPrice: number;
}

export interface MercadoPagoAlias {
  id: string;
  alias: string;
  holder: string; // Titular
  cuitOrDni: string;
  cvu: string;
  bankOrMp: string; // ej: Mercado Pago / BNA
  isActive: boolean;
  totalCollected: number;
  ordersCount: number;
  dailyLimit?: number;
  colorTag?: string;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

// ── Cuentas de cliente (Google One Tap / registro por teléfono) ──
export interface CustomerAddress {
  id: string;
  label: string;          // 'Casa', 'Trabajo', ...
  text: string;           // calle y altura
  floorApt?: string;      // piso/depto
  isDefault?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;          // nacional normalizado: 342XXXXXXX
  email?: string;
  picture?: string;       // avatar de Google
  googleSub?: string | null;
  addresses: CustomerAddress[];
  source?: 'google' | 'telefono';
  createdAt?: string;
  lastLoginAt?: string;
  stats?: { ordersCount: number; totalSpent: number; lastOrderAt: string | null };
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. #SC-1045
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  customerId?: string | null;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  deliveryFloorApt?: string;
  deliveryNotes?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  assignedAlias?: MercadoPagoAlias;
  paymentReceiptProof?: string;
  paymentReference?: string;
  estimatedDeliveryMinutes: number;
  timeline: OrderStatusHistory[];
  assignedCadeteId?: string;
  deliveryZoneName?: string;
  deliveryDistanceKm?: number;
  vehicleType?: 'bicicleta' | 'moto' | 'local';
}

export type CadeteVehicle = 'bicicleta' | 'moto';

export interface Cadete {
  id: string;
  name: string;
  vehicle: CadeteVehicle;
  phone: string;
  status: 'disponible' | 'en_reparto' | 'inactivo';
  activeOrdersCount: number;
  dailyDeliveries: number;
  notes?: string;
}

export interface DeliveryZoneTier {
  id: string;
  name: string;
  vehicleType: CadeteVehicle;
  maxDistanceKm: number; // e.g. 2.5 km for bici, 5.5 km for moto
  deliveryFee: number; // e.g. 1200 ARS for bici, 1900 ARS for moto
  estimatedMinutes: number; // e.g. 25 min vs 40 min
  description: string;
  enabled: boolean;
  color: string;
}

export interface OperatingShift {
  id: string;
  name: string; // e.g. 'Turno Mediodía', 'Turno Noche'
  openTime: string; // '11:30'
  closeTime: string; // '15:30'
  cutoffTime: string; // '15:00' (horario tope para pedir)
  days: number[]; // 0: domingo, 1: lunes, ..., 6: sabado
}

export interface DeliveryConfig {
  storeName: string;
  storeAddress: string;
  storeCity: string;
  storeCoords: {
    lat: number;
    lng: number;
  };
  isDeliveryActive: boolean; // Master switch (e.g. pause delivery due to rain/storm)
  deliveryPauseReason?: string;
  maxDeliveryRadiusKm: number; // Global maximum radius (e.g. 6.0 km)
  zones: DeliveryZoneTier[];
  shifts: OperatingShift[];
  forceOpenForTesting: boolean; // Toggle in Admin for testing outside normal hours
  pickupAlwaysAllowed: boolean; // Allow pickup even if delivery is paused
}

export interface ScheduleCheckResult {
  isOpen: boolean;
  canAcceptOrders: boolean; // Not past cutoff time
  isPastCutoff: boolean;
  currentShift?: OperatingShift;
  nextShift?: OperatingShift;
  minutesUntilCutoff?: number;
  message: string;
  statusTag: 'abierto' | 'por_cerrar' | 'cerrado';
}

export interface DeliveryValidationResult {
  inZone: boolean;
  zone: DeliveryZoneTier | null;
  distanceKm: number;
  deliveryFee: number;
  estimatedMinutes: number;
  vehicleType: CadeteVehicle | null;
  canDeliver: boolean;
  message: string;
  reason?: string;
}

export interface SalesReportMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  completedOrdersCount: number;
  pendingOrdersCount: number;
  canceledOrdersCount: number;
  revenueByPaymentMethod: {
    mercadopago: number;
    efectivo: number;
    pos_tarjeta: number;
  };
  revenueByAlias: {
    aliasId: string;
    aliasName: string;
    holder: string;
    amount: number;
    ordersCount: number;
  }[];
  topSellingProducts: {
    productId: string;
    productName: string;
    category: string;
    quantity: number;
    revenue: number;
  }[];
  hourlyDistribution: {
    hourLabel: string;
    revenue: number;
    ordersCount: number;
  }[];
  dailyDistribution?: {
    dayLabel: string;
    date: string;
    revenue: number;
    ordersCount: number;
  }[];
}
