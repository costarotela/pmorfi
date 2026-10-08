// ═══════════════════════════════════════════════════════════════
// STORAGE SERVICE — versión BACKEND REAL (Fase 2/3 del plan).
// Misma API pública que la versión AI Studio (localStorage), pero:
//   • hidrata desde Postgres (paperclip-db, schema pmorfi) vía /api/bootstrap
//   • persiste cada escritura contra el backend (fire-and-forget con log)
//   • sincroniza entre dispositivos (celular cliente ↔ tablet cocina ↔ caja)
//     vía SSE (/api/events) reemplazando el BroadcastChannel local
// Ninguna vista (cliente/cocina/caja/kiosk/admin) necesita cambios.
// Los mocks de AI Studio NO se usan como fallback: si el backend no
// responde, la app muestra error explícito (doctrina: cero datos falsos).
// ═══════════════════════════════════════════════════════════════
import { MenuItem, MercadoPagoAlias, Order, OrderStatus, SalesReportMetrics } from '../types';
import { soundEffects } from './sound';
import { pushNotifications } from './pushNotifications';

const API = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;
const CLIENT_ID =
  'cli-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
const ACTIVE_ORDER_KEY = 'punto…e_id';

type EventType =
  | 'order_created'
  | 'order_updated'
  | 'alias_updated'
  | 'menu_updated'
  | 'delivery_config_updated'
  | 'cadetes_updated'
  | 'orders_bulk';
type StorageEventCallback = (type: EventType, payload: unknown) => void;

class StorageService {
  private listeners: Set<StorageEventCallback> = new Set();
  private menu: MenuItem[] = [];
  private aliasCache: MercadoPagoAlias[] = [];
  private ordersCache: Order[] = [];
  private es: EventSource | null = null;
  public ready = false;

  // ── Arranque: hidratar desde la BD real ──────────────────────
  public async init(): Promise<void> {
    await this.refetchBootstrap();
    this.connectEvents();
  }

  private async refetchBootstrap(): Promise<void> {
    const r = await fetch(`${API}/bootstrap`);
    if (!r.ok) throw new Error(`backend respondió ${r.status}`);
    const d = await r.json();
    this.menu = d.menu || [];
    this.ordersCache = d.orders || [];
    this.aliasCache = d.aliases || [];
    this.ready = true;
    // Hidratar cadetería: deliveryService escucha este evento (backend real)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pmorfi:delivery', {
        detail: { config: d.deliveryConfig || null, cadetes: d.cadetes || null },
      }));
    }
  }

  private connectEvents() {
    if (typeof window === 'undefined') return;
    this.es = new EventSource(`${API}/events?clientId=${CLIENT_ID}`);
    this.es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (!msg.type || msg.type === 'hello') return;
        if (msg.origin === CLIENT_ID) return; // eco propio: ya aplicado local
        this.applyRemote(msg.type as EventType, msg.payload);
      } catch { /* ignore */ }
    };
    // EventSource reconecta solo ante cortes.
  }

  private applyRemote(type: EventType, payload: unknown) {
    if (type === 'order_created' && payload) {
      const o = payload as Order;
      this.ordersCache = [o, ...this.ordersCache.filter((x) => x.id !== o.id)];
      soundEffects.playNewOrderBell();
      pushNotifications.sendNotification(
        `🔔 Nuevo Pedido ${o.orderNumber}`,
        `${o.customerName} pidió por $${(o.total || 0).toLocaleString('es-AR')}`,
        o.id
      );
    } else if (type === 'order_updated' && payload) {
      const o = payload as Order;
      this.ordersCache = this.ordersCache.map((x) => (x.id === o.id ? o : x));
      soundEffects.playStatusUpdateChime();
      pushNotifications.sendNotification(
        `🔄 Pedido ${o.orderNumber}`,
        `Nuevo estado: ${o.status}`,
        o.id
      );
    } else if (type === 'menu_updated' && Array.isArray(payload)) {
      this.menu = payload as MenuItem[];
    } else if (type === 'alias_updated' && Array.isArray(payload)) {
      this.aliasCache = payload as MercadoPagoAlias[];
    } else if (type === 'delivery_config_updated' || type === 'cadetes_updated') {
      void this.refetchBootstrap();
    } else if (type === 'orders_bulk') {
      void this.refetchBootstrap();
    }
    this.notifySubscribers(type, payload);
  }

  private notifySubscribers(type: EventType, payload: unknown) {
    this.listeners.forEach((fn) => {
      try { fn(type, payload); } catch (err) { console.error('Error calling listener:', err); }
    });
  }

  public subscribe(cb: StorageEventCallback): () => void {
    this.listeners.add(cb);
    return () => { this.listeners.delete(cb); };
  }

  // ── Persistencia remota (fire-and-forget con log) ────────────
  private async put(pathname: string, body: Record<string, unknown>): Promise<void> {
    try {
      const r = await fetch(`${API}${pathname}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, clientId: CLIENT_ID }),
      });
      if (!r.ok) console.error(`PUT ${pathname} →`, r.status);
    } catch (e) {
      console.error(`PUT ${pathname} falló (¿backend caído?):`, e);
    }
  }

  private async postOrder(order: Order): Promise<void> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      // Sesión de cliente (si existe): vincula el pedido a su cuenta → historial + re-pedido
      const token = typeof window !== 'undefined' ? localStorage.getItem('punto_morfi_token') : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch(`${API}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ order, clientId: CLIENT_ID }),
      });
      if (!r.ok) console.error('POST orders →', r.status);
    } catch (e) {
      console.error('POST orders falló (¿backend caído?):', e);
    }
  }

  // --- MENU ITEMS ---
  public getMenuItems(): MenuItem[] { return this.menu; }

  public saveMenuItems(items: MenuItem[]) {
    this.menu = items;
    this.notifySubscribers('menu_updated', items);
    void this.put('/menu', { items });
  }

  public toggleItemAvailability(id: string) {
    this.saveMenuItems(this.menu.map((item) =>
      item.id === id ? { ...item, isAvailable: !item.isAvailable } : item));
  }

  public updateItemPrice(id: string, newPrice: number) {
    this.saveMenuItems(this.menu.map((item) =>
      item.id === id ? { ...item, price: newPrice } : item));
  }

  public addMenuItem(itemData: Omit<MenuItem, 'id'>): MenuItem {
    const newItem: MenuItem = { ...itemData, id: 'menu-' + Date.now() };
    this.saveMenuItems([newItem, ...this.menu]);
    return newItem;
  }

  public updateMenuItem(id: string, updates: Partial<MenuItem>) {
    this.saveMenuItems(this.menu.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }

  public deleteMenuItem(id: string) {
    this.saveMenuItems(this.menu.filter((item) => item.id !== id));
  }

  public resetMenuToDefaults() {
    // En modo backend "defaults" = menú vacío: los datos reales los carga el
    // cliente. (El mock de AI Studio no se repone: cero datos falsos.)
    this.saveMenuItems([]);
  }

  // Backup & Direct Database Access (Export/Import JSON)
  public exportDatabaseJSON(): string {
    return JSON.stringify({
      version: '2.0-backend',
      exportedAt: new Date().toISOString(),
      store: 'Punto Morfi',
      menu: this.getMenuItems(),
      aliases: this.getAliases(),
      orders: this.getOrders(),
    }, null, 2);
  }

  public importDatabaseJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.menu && Array.isArray(data.menu)) this.saveMenuItems(data.menu);
      if (data.aliases && Array.isArray(data.aliases)) this.saveAliases(data.aliases);
      if (data.orders && Array.isArray(data.orders)) this.saveOrders(data.orders);
      return true;
    } catch (e) {
      console.error('Invalid database JSON format:', e);
      return false;
    }
  }

  // --- MERCADO PAGO ALIASES ---
  public getAliases(): MercadoPagoAlias[] { return this.aliasCache; }

  public saveAliases(aliases: MercadoPagoAlias[]) {
    this.aliasCache = aliases;
    this.notifySubscribers('alias_updated', aliases);
    void this.put('/aliases', { aliases });
  }

  public toggleAliasActive(id: string) {
    this.saveAliases(this.aliasCache.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)));
  }

  public addAlias(alias: Omit<MercadoPagoAlias, 'id' | 'totalCollected' | 'ordersCount'>) {
    const newAlias: MercadoPagoAlias = {
      ...alias, id: 'alias-' + Date.now(), totalCollected: 0, ordersCount: 0,
    };
    this.saveAliases([...this.aliasCache, newAlias]);
    return newAlias;
  }

  public updateAlias(id: string, updates: Partial<MercadoPagoAlias>) {
    this.saveAliases(this.aliasCache.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }

  public deleteAlias(id: string) {
    this.saveAliases(this.aliasCache.filter((a) => a.id !== id));
  }

  /**
   * Alias activo aleatorio del pool. Si todavía no se cargaron aliases REALES
   * del cliente, devuelve un placeholder explícito (nunca datos falsos: los
   * aliases inventados de la maqueta AI Studio NO se migraron a la BD).
   */
  public getRandomActiveAlias(): MercadoPagoAlias {
    const active = this.aliasCache.filter((a) => a.isActive);
    const pool = active.length > 0 ? active : this.aliasCache;
    if (pool.length === 0) {
      return {
        id: 'sin-alias',
        alias: 'PENDIENTE-CARGAR-REAL',
        holder: 'A definir por el cliente',
        cuitOrDni: '',
        cvu: '',
        bankOrMp: 'Mercado Pago',
        isActive: false,
        totalCollected: 0,
        ordersCount: 0,
        dailyLimit: 0,
        colorTag: 'coral',
      };
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // --- ORDERS ---
  public getOrders(): Order[] { return this.ordersCache; }

  public saveOrders(orders: Order[]) {
    this.ordersCache = orders;
    void this.put('/orders', { orders });
  }

  public getOrderById(id: string): Order | undefined {
    return this.ordersCache.find((o) => o.id === id);
  }

  public getActiveCustomerOrderId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACTIVE_ORDER_KEY);
  }

  public setActiveCustomerOrderId(orderId: string | null) {
    if (typeof window === 'undefined') return;
    if (orderId) localStorage.setItem(ACTIVE_ORDER_KEY, orderId);
    else localStorage.removeItem(ACTIVE_ORDER_KEY);
  }

  public createOrder(
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'timeline'>
  ): Order {
    const now = new Date().toISOString();
    // orderNumber único por timestamp (el contador por longitud no es fiable multi-dispositivo)
    const orderNumber = `#PM-${Date.now().toString().slice(-6)}`;

    const newOrder: Order = {
      ...orderData,
      id: 'ord-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      orderNumber,
      createdAt: now,
      updatedAt: now,
      timeline: [{
        status: orderData.status,
        timestamp: now,
        note: orderData.paymentMethod === 'mercadopago_alias'
          ? `Pedido creado con alias asignado: ${orderData.assignedAlias?.alias || 'MP'}`
          : 'Pedido creado (pago en mano)',
      }],
    };

    this.ordersCache = [newOrder, ...this.ordersCache];
    this.setActiveCustomerOrderId(newOrder.id);

    // stats del alias asignado
    if (newOrder.assignedAlias) {
      const aliasId = newOrder.assignedAlias.id;
      this.saveAliases(this.aliasCache.map((a) =>
        a.id === aliasId
          ? { ...a, totalCollected: a.totalCollected + newOrder.total, ordersCount: a.ordersCount + 1 }
          : a));
    }

    soundEffects.playNewOrderBell();
    pushNotifications.sendNotification(
      `🔔 Nuevo Pedido ${newOrder.orderNumber}`,
      `${newOrder.customerName} pidió por $${newOrder.total.toLocaleString('es-AR')} (${newOrder.deliveryMethod === 'delivery' ? 'Envío' : 'Retiro'})`,
      newOrder.id
    );
    this.notifySubscribers('order_created', newOrder);
    void this.postOrder(newOrder); // → Postgres + SSE a cocina/caja + Telegram al dueño
    return newOrder;
  }

  public updateOrderStatus(orderId: string, newStatus: OrderStatus, customNote?: string): Order | null {
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

    const now = new Date().toISOString();
    let updatedOrder: Order | null = null;
    this.ordersCache = this.ordersCache.map((order) => {
      if (order.id !== orderId) return order;
      const note = customNote || defaultNotes[newStatus];
      updatedOrder = {
        ...order,
        status: newStatus,
        updatedAt: now,
        timeline: [...order.timeline, { status: newStatus, timestamp: now, note }],
      };
      return updatedOrder;
    });

    if (updatedOrder) {
      const uo = updatedOrder as Order;
      if (newStatus === 'confirmado' || newStatus === 'entregado') soundEffects.playPaymentSuccessChime();
      else soundEffects.playStatusUpdateChime();
      pushNotifications.sendNotification(
        statusTitles[newStatus],
        `${uo.orderNumber}: ${customNote || defaultNotes[newStatus]}`,
        orderId
      );
      this.notifySubscribers('order_updated', uo);
      void this.put(`/orders/${orderId}`, { order: uo });
    }
    return updatedOrder;
  }

  public recordPaymentProof(orderId: string, referenceCode: string) {
    const now = new Date().toISOString();
    let updatedOrder: Order | null = null;
    this.ordersCache = this.ordersCache.map((order) => {
      if (order.id !== orderId) return order;
      updatedOrder = {
        ...order,
        paymentReference: referenceCode,
        updatedAt: now,
        timeline: [...order.timeline, {
          status: order.status, timestamp: now,
          note: `Cliente ingresó comprobante / ref: ${referenceCode}`,
        }],
      };
      return updatedOrder;
    });
    if (updatedOrder) {
      const uo = updatedOrder as Order;
      pushNotifications.sendNotification(
        '💰 Comprobante Registrado',
        `Pedido ${uo.orderNumber}: Ref ${referenceCode}`,
        orderId
      );
      this.notifySubscribers('order_updated', uo);
      void this.put(`/orders/${orderId}`, { order: uo });
    }
  }

  // --- SALES REPORTS GENERATOR (cálculo puro sobre la cache — idéntico) ---
  public getSalesReport(timeframe: 'daily' | 'weekly'): SalesReportMetrics {
    const orders = this.getOrders();
    const now = new Date();

    const relevantOrders = orders.filter((order) => {
      if (order.status === 'cancelado') return false;
      const orderDate = new Date(order.createdAt);
      if (timeframe === 'daily') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      const diffMs = now.getTime() - orderDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });

    const totalRevenue = relevantOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = relevantOrders.length;
    const averageTicket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const completedOrdersCount = relevantOrders.filter((o) => o.status === 'entregado').length;
    const pendingOrdersCount = relevantOrders.filter((o) => o.status !== 'entregado' && o.status !== 'cancelado').length;
    const canceledOrdersCount = orders.filter((o) => o.status === 'cancelado').length;

    const revenueByPaymentMethod = { mercadopago: 0, efectivo: 0, pos_tarjeta: 0 };
    relevantOrders.forEach((o) => {
      if (o.paymentMethod === 'mercadopago_alias') revenueByPaymentMethod.mercadopago += o.total;
      else if (o.paymentMethod === 'efectivo') revenueByPaymentMethod.efectivo += o.total;
      else revenueByPaymentMethod.pos_tarjeta += o.total;
    });

    const aliasMap = new Map<string, { aliasId: string; aliasName: string; holder: string; amount: number; ordersCount: number }>();
    this.getAliases().forEach((a) => {
      aliasMap.set(a.id, { aliasId: a.id, aliasName: a.alias, holder: a.holder, amount: 0, ordersCount: 0 });
    });
    relevantOrders.forEach((o) => {
      if (o.assignedAlias && aliasMap.has(o.assignedAlias.id)) {
        const item = aliasMap.get(o.assignedAlias.id)!;
        item.amount += o.total;
        item.ordersCount += 1;
      }
    });
    const revenueByAlias = Array.from(aliasMap.values());

    const productStats = new Map<string, { productId: string; productName: string; category: string; quantity: number; revenue: number }>();
    relevantOrders.forEach((o) => {
      o.items.forEach((item) => {
        const pId = item.menuItem.id;
        if (!productStats.has(pId)) {
          productStats.set(pId, {
            productId: pId, productName: item.menuItem.name,
            category: item.menuItem.category, quantity: 0, revenue: 0,
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

    const hourlyBuckets = new Array(24).fill(0).map((_, hour) => ({
      hourLabel: `${hour}:00`, revenue: 0, ordersCount: 0,
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
      totalRevenue, totalOrders, averageTicket,
      completedOrdersCount, pendingOrdersCount, canceledOrdersCount,
      revenueByPaymentMethod, revenueByAlias, topSellingProducts,
      hourlyDistribution: hourlyBuckets.filter((_, idx) => idx >= 11 && idx <= 23), // foco fast food 11:00-23:00
      dailyDistribution,
    };
  }

  // Pedido de prueba E2E — queda REAL en la BD (marcado como prueba)
  public generateDemoOrder(): Order {
    const menu = this.getMenuItems();
    if (menu.length < 2) {
      throw new Error('Cargá el menú real antes de generar pedidos de prueba');
    }
    const item1 = menu[Math.floor(Math.random() * menu.length)];
    const item2 = menu[Math.floor(Math.random() * menu.length)];
    const subtotal = item1.price + item2.price;
    const deliveryFee = 1500;
    const total = subtotal + deliveryFee;

    return this.createOrder({
      customerName: 'CLIENTE DE PRUEBA',
      customerPhone: '+54 9 342 000-0000',
      deliveryMethod: 'pickup',
      deliveryNotes: 'Pedido de prueba E2E — se puede cancelar.',
      items: [
        { id: 'item-demo-1', menuItem: item1, quantity: 1, itemTotalPrice: item1.price },
        { id: 'item-demo-2', menuItem: item2, quantity: 1, itemTotalPrice: item2.price },
      ],
      subtotal,
      deliveryFee,
      total,
      status: 'pendiente_pago',
      paymentMethod: 'efectivo',
      estimatedDeliveryMinutes: 30,
    } as Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'timeline'>);
  }
}

export const storageService = new StorageService();
