import { MenuItem, MercadoPagoAlias, Order, OrderStatus, SalesReportMetrics } from '../types';
import { INITIAL_MENU_ITEMS, INITIAL_MP_ALIASES, INITIAL_HISTORICAL_ORDERS } from '../data/mockData';
import { soundEffects } from './sound';
import { pushNotifications } from './pushNotifications';

const STORAGE_KEYS = {
  MENU: 'punto_morfi_menu_v2',
  ALIASES: 'punto_morfi_mp_aliases_v2',
  ORDERS: 'punto_morfi_orders_v2',
  ACTIVE_ORDER_ID: 'punto_morfi_active_order_id',
};

type StorageEventCallback = (type: 'order_created' | 'order_updated' | 'alias_updated' | 'menu_updated', payload: unknown) => void;

class StorageService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<StorageEventCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('punto_morfi_sync_channel');
        this.channel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          this.notifySubscribers(type, payload, false);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }

      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEYS.ORDERS) {
          this.notifySubscribers('order_updated', null, false);
        }
      });
    }
  }

  private notifySubscribers(type: 'order_created' | 'order_updated' | 'alias_updated' | 'menu_updated', payload: unknown, broadcast = true) {
    this.listeners.forEach((fn) => {
      try {
        fn(type, payload);
      } catch (err) {
        console.error('Error calling listener:', err);
      }
    });

    if (broadcast && this.channel) {
      this.channel.postMessage({ type, payload });
    }
  }

  public subscribe(cb: StorageEventCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  // --- MENU ITEMS ---
  public getMenuItems(): MenuItem[] {
    if (typeof window === 'undefined') return INITIAL_MENU_ITEMS;
    const stored = localStorage.getItem(STORAGE_KEYS.MENU);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(INITIAL_MENU_ITEMS));
      return INITIAL_MENU_ITEMS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_MENU_ITEMS;
    }
  }

  public saveMenuItems(items: MenuItem[]) {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(items));
    this.notifySubscribers('menu_updated', items);
  }

  public toggleItemAvailability(id: string) {
    const items = this.getMenuItems().map((item) =>
      item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
    );
    this.saveMenuItems(items);
  }

  public updateItemPrice(id: string, newPrice: number) {
    const items = this.getMenuItems().map((item) =>
      item.id === id ? { ...item, price: newPrice } : item
    );
    this.saveMenuItems(items);
  }

  public addMenuItem(itemData: Omit<MenuItem, 'id'>): MenuItem {
    const newItem: MenuItem = {
      ...itemData,
      id: 'menu-' + Date.now(),
    };
    const items = [newItem, ...this.getMenuItems()];
    this.saveMenuItems(items);
    return newItem;
  }

  public updateMenuItem(id: string, updates: Partial<MenuItem>) {
    const items = this.getMenuItems().map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    this.saveMenuItems(items);
  }

  public deleteMenuItem(id: string) {
    const items = this.getMenuItems().filter((item) => item.id !== id);
    this.saveMenuItems(items);
  }

  public resetMenuToDefaults() {
    this.saveMenuItems(INITIAL_MENU_ITEMS);
  }

  // Backup & Direct Database Access (Export/Import JSON)
  public exportDatabaseJSON(): string {
    const database = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      store: 'Punto Morfi',
      menu: this.getMenuItems(),
      aliases: this.getAliases(),
      orders: this.getOrders(),
    };
    return JSON.stringify(database, null, 2);
  }

  public importDatabaseJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.menu && Array.isArray(data.menu)) {
        this.saveMenuItems(data.menu);
      }
      if (data.aliases && Array.isArray(data.aliases)) {
        this.saveAliases(data.aliases);
      }
      if (data.orders && Array.isArray(data.orders)) {
        this.saveOrders(data.orders);
      }
      return true;
    } catch (e) {
      console.error('Invalid database JSON format:', e);
      return false;
    }
  }

  // --- MERCADO PAGO ALIASES ---
  public getAliases(): MercadoPagoAlias[] {
    if (typeof window === 'undefined') return INITIAL_MP_ALIASES;
    const stored = localStorage.getItem(STORAGE_KEYS.ALIASES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.ALIASES, JSON.stringify(INITIAL_MP_ALIASES));
      return INITIAL_MP_ALIASES;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_MP_ALIASES;
    }
  }

  public saveAliases(aliases: MercadoPagoAlias[]) {
    localStorage.setItem(STORAGE_KEYS.ALIASES, JSON.stringify(aliases));
    this.notifySubscribers('alias_updated', aliases);
  }

  public toggleAliasActive(id: string) {
    const aliases = this.getAliases().map((a) =>
      a.id === id ? { ...a, isActive: !a.isActive } : a
    );
    this.saveAliases(aliases);
  }

  public addAlias(alias: Omit<MercadoPagoAlias, 'id' | 'totalCollected' | 'ordersCount'>) {
    const newAlias: MercadoPagoAlias = {
      ...alias,
      id: 'alias-' + Date.now(),
      totalCollected: 0,
      ordersCount: 0,
    };
    const aliases = [...this.getAliases(), newAlias];
    this.saveAliases(aliases);
    return newAlias;
  }

  public updateAlias(id: string, updates: Partial<MercadoPagoAlias>) {
    const aliases = this.getAliases().map((a) => (a.id === id ? { ...a, ...updates } : a));
    this.saveAliases(aliases);
  }

  public deleteAlias(id: string) {
    const aliases = this.getAliases().filter((a) => a.id !== id);
    this.saveAliases(aliases);
  }

  /**
   * Selects a random active Mercado Pago alias from the pool of 3-4 configured aliases.
   * If none is active, falls back to the first available alias.
   */
  public getRandomActiveAlias(): MercadoPagoAlias {
    const aliases = this.getAliases();
    const activeAliases = aliases.filter((a) => a.isActive);
    if (activeAliases.length === 0) {
      return aliases[0] || INITIAL_MP_ALIASES[0];
    }
    const randomIndex = Math.floor(Math.random() * activeAliases.length);
    return activeAliases[randomIndex];
  }

  // --- ORDERS ---
  public getOrders(): Order[] {
    if (typeof window === 'undefined') return INITIAL_HISTORICAL_ORDERS;
    const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_HISTORICAL_ORDERS));
      return INITIAL_HISTORICAL_ORDERS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_HISTORICAL_ORDERS;
    }
  }

  public saveOrders(orders: Order[]) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }

  public getOrderById(id: string): Order | undefined {
    return this.getOrders().find((o) => o.id === id);
  }

  public getActiveCustomerOrderId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ORDER_ID);
  }

  public setActiveCustomerOrderId(orderId: string | null) {
    if (typeof window === 'undefined') return;
    if (orderId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDER_ID, orderId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ORDER_ID);
    }
  }

  public createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'timeline'>): Order {
    const orders = this.getOrders();
    const orderNumber = `#PM-${1000 + orders.length + 1}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      ...orderData,
      id: 'ord-' + Date.now(),
      orderNumber,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          status: orderData.status,
          timestamp: now,
          note: orderData.paymentMethod === 'mercadopago_alias'
            ? `Pedido creado con alias asignado: ${orderData.assignedAlias?.alias || 'MP'}`
            : 'Pedido creado (pago en mano)',
        },
      ],
    };

    const updatedOrders = [newOrder, ...orders];
    this.saveOrders(updatedOrders);
    this.setActiveCustomerOrderId(newOrder.id);

    // If assigned to an alias, increment alias stats
    if (newOrder.assignedAlias) {
      const aliasId = newOrder.assignedAlias.id;
      const aliases = this.getAliases().map((a) => {
        if (a.id === aliasId) {
          return {
            ...a,
            totalCollected: a.totalCollected + newOrder.total,
            ordersCount: a.ordersCount + 1,
          };
        }
        return a;
      });
      this.saveAliases(aliases);
    }

    // Play incoming order bell for the admin
    soundEffects.playNewOrderBell();

    // Trigger push alert
    pushNotifications.sendNotification(
      `🔔 Nuevo Pedido ${newOrder.orderNumber}`,
      `${newOrder.customerName} pidió por $${newOrder.total.toLocaleString('es-AR')} (${newOrder.deliveryMethod === 'delivery' ? 'Envío' : 'Retiro'})`,
      newOrder.id
    );

    this.notifySubscribers('order_created', newOrder);
    return newOrder;
  }

  public updateOrderStatus(orderId: string, newStatus: OrderStatus, customNote?: string): Order | null {
    const orders = this.getOrders();
    let updatedOrder: Order | null = null;
    const now = new Date().toISOString();

    const defaultNotes: Record<OrderStatus, string> = {
      pendiente_pago: 'Esperando acreditación de pago',
      confirmado: 'Pago verificado. Orden aceptada.',
      en_cocina: '¡Tu comida se está cocinando en marcha!',
      en_camino: '¡El repartidor ya está en viaje hacia tu dirección!',
      entregado: '¡Pedido entregado con éxito! Que lo disfrutes.',
      cancelado: 'Pedido cancelado.',
    };

    const statusTitles: Record<OrderStatus, string> = {
      pendiente_pago: 'Pendiente de pago',
      confirmado: '✅ ¡Pedido Confirmado!',
      en_cocina: '🍳 ¡En Preparación en Cocina!',
      en_camino: '🛵 ¡Tu Pedido está en Camino!',
      entregado: '🎉 ¡Pedido Entregado!',
      cancelado: '❌ Pedido Cancelado',
    };

    const updatedList = orders.map((order) => {
      if (order.id === orderId) {
        const note = customNote || defaultNotes[newStatus];
        const newTimeline = [
          ...order.timeline,
          {
            status: newStatus,
            timestamp: now,
            note,
          },
        ];
        updatedOrder = {
          ...order,
          status: newStatus,
          updatedAt: now,
          timeline: newTimeline,
        };
        return updatedOrder;
      }
      return order;
    });

    if (updatedOrder) {
      this.saveOrders(updatedList);

      // Play sound
      if (newStatus === 'confirmado' || newStatus === 'entregado') {
        soundEffects.playPaymentSuccessChime();
      } else {
        soundEffects.playStatusUpdateChime();
      }

      // Send push notification
      pushNotifications.sendNotification(
        statusTitles[newStatus],
        `${(updatedOrder as Order).orderNumber}: ${customNote || defaultNotes[newStatus]}`,
        orderId
      );

      this.notifySubscribers('order_updated', updatedOrder);
    }

    return updatedOrder;
  }

  public recordPaymentProof(orderId: string, referenceCode: string) {
    const orders = this.getOrders();
    let updatedOrder: Order | null = null;
    const now = new Date().toISOString();

    const updatedList = orders.map((order) => {
      if (order.id === orderId) {
        updatedOrder = {
          ...order,
          paymentReference: referenceCode,
          updatedAt: now,
          timeline: [
            ...order.timeline,
            {
              status: order.status,
              timestamp: now,
              note: `Cliente ingresó comprobante / ref: ${referenceCode}`,
            },
          ],
        };
        return updatedOrder;
      }
      return order;
    });

    if (updatedOrder) {
      this.saveOrders(updatedList);
      pushNotifications.sendNotification(
        '💰 Comprobante Registrado',
        `Pedido ${(updatedOrder as Order).orderNumber}: Ref ${referenceCode}`,
        orderId
      );
      this.notifySubscribers('order_updated', updatedOrder);
    }
  }

  // --- SALES REPORTS GENERATOR (DAILY & WEEKLY AUTOMATIC) ---
  public getSalesReport(timeframe: 'daily' | 'weekly'): SalesReportMetrics {
    const orders = this.getOrders();
    const now = new Date();

    // Filter relevant orders
    const relevantOrders = orders.filter((order) => {
      if (order.status === 'cancelado') return false;
      const orderDate = new Date(order.createdAt);
      if (timeframe === 'daily') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      } else {
        // Last 7 days
        const diffMs = now.getTime() - orderDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }
    });

    const totalRevenue = relevantOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = relevantOrders.length;
    const averageTicket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const completedOrdersCount = relevantOrders.filter((o) => o.status === 'entregado').length;
    const pendingOrdersCount = relevantOrders.filter((o) => o.status !== 'entregado' && o.status !== 'cancelado').length;
    const canceledOrdersCount = orders.filter((o) => o.status === 'cancelado').length;

    // Revenue by payment method
    const revenueByPaymentMethod = {
      mercadopago: 0,
      efectivo: 0,
      pos_tarjeta: 0,
    };
    relevantOrders.forEach((o) => {
      if (o.paymentMethod === 'mercadopago_alias') {
        revenueByPaymentMethod.mercadopago += o.total;
      } else if (o.paymentMethod === 'efectivo') {
        revenueByPaymentMethod.efectivo += o.total;
      } else {
        revenueByPaymentMethod.pos_tarjeta += o.total;
      }
    });

    // Revenue by Mercado Pago alias
    const aliasMap = new Map<string, { aliasId: string; aliasName: string; holder: string; amount: number; ordersCount: number }>();
    this.getAliases().forEach((a) => {
      aliasMap.set(a.id, {
        aliasId: a.id,
        aliasName: a.alias,
        holder: a.holder,
        amount: 0,
        ordersCount: 0,
      });
    });

    relevantOrders.forEach((o) => {
      if (o.assignedAlias && aliasMap.has(o.assignedAlias.id)) {
        const item = aliasMap.get(o.assignedAlias.id)!;
        item.amount += o.total;
        item.ordersCount += 1;
      }
    });

    const revenueByAlias = Array.from(aliasMap.values());

    // Top selling products
    const productStats = new Map<string, { productId: string; productName: string; category: string; quantity: number; revenue: number }>();
    relevantOrders.forEach((o) => {
      o.items.forEach((item) => {
        const pId = item.menuItem.id;
        if (!productStats.has(pId)) {
          productStats.set(pId, {
            productId: pId,
            productName: item.menuItem.name,
            category: item.menuItem.category,
            quantity: 0,
            revenue: 0,
          });
        }
        const stat = productStats.get(pId)!;
        stat.quantity += item.quantity;
        stat.revenue += item.itemTotalPrice;
      });
    });

    const topSellingProducts = Array.from(productStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);

    // Hourly distribution for daily report
    const hourlyBuckets = new Array(24).fill(0).map((_, hour) => ({
      hourLabel: `${hour}:00`,
      revenue: 0,
      ordersCount: 0,
    }));

    if (timeframe === 'daily') {
      relevantOrders.forEach((o) => {
        const hour = new Date(o.createdAt).getHours();
        if (hourlyBuckets[hour]) {
          hourlyBuckets[hour].revenue += o.total;
          hourlyBuckets[hour].ordersCount += 1;
        }
      });
    }

    // Daily distribution for weekly report
    const dailyDistribution: { dayLabel: string; date: string; revenue: number; ordersCount: number }[] = [];
    if (timeframe === 'weekly') {
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const dayLabel = dayNames[targetDate.getDay()];
        const dateStr = targetDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

        const dayOrders = relevantOrders.filter((o) => {
          const od = new Date(o.createdAt);
          return (
            od.getDate() === targetDate.getDate() &&
            od.getMonth() === targetDate.getMonth() &&
            od.getFullYear() === targetDate.getFullYear()
          );
        });

        const dayRevenue = dayOrders.reduce((sum, o) => sum + o.total, 0);

        dailyDistribution.push({
          dayLabel: `${dayLabel} ${dateStr}`,
          date: dateStr,
          revenue: dayRevenue,
          ordersCount: dayOrders.length,
        });
      }
    }

    return {
      totalRevenue,
      totalOrders,
      averageTicket,
      completedOrdersCount,
      pendingOrdersCount,
      canceledOrdersCount,
      revenueByPaymentMethod,
      revenueByAlias,
      topSellingProducts,
      hourlyDistribution: hourlyBuckets.filter((h, idx) => idx >= 11 && idx <= 23), // Fast food focus 11:00 to 23:00
      dailyDistribution,
    };
  }

  // Generate sample quick demo order for easy testing
  public generateDemoOrder(): Order {
    const randomMenu = this.getMenuItems();
    const item1 = randomMenu[Math.floor(Math.random() * randomMenu.length)];
    const item2 = randomMenu[Math.floor(Math.random() * randomMenu.length)];

    const subtotal = item1.price + item2.price;
    const deliveryFee = 1500;
    const total = subtotal + deliveryFee;
    const assignedAlias = this.getRandomActiveAlias();

    const sampleCustomers = [
      { name: 'Lucas Palacios', phone: '+54 9 11 5566-7788', address: 'Av. Santa Fe 2840, Piso 6 C' },
      { name: 'Micaela Gómez', phone: '+54 9 11 3344-5566', address: 'Gorriti 4920' },
      { name: 'Facundo Morales', phone: '+54 9 11 8899-0011', address: 'Thames 1630, Depto 1' },
      { name: 'Camila Rossi', phone: '+54 9 11 2233-4455', address: 'Honduras 5120' },
    ];
    const client = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];

    return this.createOrder({
      customerName: client.name,
      customerPhone: client.phone,
      deliveryMethod: 'delivery',
      deliveryAddress: client.address,
      deliveryNotes: 'Tocar timbre, dejar en recepción si no atiende.',
      items: [
        { id: 'item-demo-1', menuItem: item1, quantity: 1, itemTotalPrice: item1.price },
        { id: 'item-demo-2', menuItem: item2, quantity: 1, itemTotalPrice: item2.price },
      ],
      subtotal,
      deliveryFee,
      total,
      status: 'pendiente_pago',
      paymentMethod: 'mercadopago_alias',
      assignedAlias,
      estimatedDeliveryMinutes: 30,
    });
  }
}

export const storageService = new StorageService();
