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
