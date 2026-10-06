import React, { useState, useMemo } from 'react';
import { storageService } from '../../services/storage';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  CreditCard,
  DollarSign,
  ShoppingBag,
  Sparkles,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

const COLORS = ['#f88d63', '#e2e663', '#759694', '#fa966c', '#38bdf8', '#a855f7'];

export const SalesReports: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>('daily');

  const report = useMemo(() => {
    return storageService.getSalesReport(timeframe);
  }, [timeframe]);

  const handleExportCSV = () => {
    const orders = storageService.getOrders();
    const headers = ['Nro Orden', 'Fecha', 'Cliente', 'Telefono', 'Metodo Entrega', 'Medio Pago', 'Alias MP', 'Total', 'Estado'];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString('es-AR'),
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      o.deliveryMethod,
      o.paymentMethod,
      o.assignedAlias ? `"${o.assignedAlias.alias}"` : 'N/A',
      o.total,
      o.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `punto_morfi_reporte_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare data for Recharts Weekly Bar Chart
  const weeklyChartData = useMemo(() => {
    return (report.dailyDistribution || []).map((d) => ({
      name: d.dayLabel,
      ingresos: d.revenue,
      pedidos: d.ordersCount,
    }));
  }, [report.dailyDistribution]);

  // Prepare data for Recharts Daily Hourly Chart
  const hourlyChartData = useMemo(() => {
    return report.hourlyDistribution.map((h) => ({
      hora: h.hourLabel,
      ingresos: h.revenue,
      pedidos: h.ordersCount,
    }));
  }, [report.hourlyDistribution]);

  // Prepare data for Payment Methods Pie Chart
  const paymentMethodPieData = useMemo(() => {
    const list = [
      { name: 'Mercado Pago (Alias)', value: report.revenueByPaymentMethod.mercadopago, color: '#009ee3' },
      { name: 'Efectivo', value: report.revenueByPaymentMethod.efectivo, color: '#f88d63' },
      { name: 'POS / Débito', value: report.revenueByPaymentMethod.pos_tarjeta, color: '#e2e663' },
    ];
    return list.filter((it) => it.value > 0);
  }, [report.revenueByPaymentMethod]);

  // Prepare data for Category Distribution Pie Chart
  const categoryPieData = useMemo(() => {
    const catMap = new Map<string, number>();
    report.topSellingProducts.forEach((p) => {
      catMap.set(p.category, (catMap.get(p.category) || 0) + p.revenue);
    });
    return Array.from(catMap.entries()).map(([name, value], i) => ({
      name: name.toUpperCase(),
      value,
      color: COLORS[i % COLORS.length],
    }));
  }, [report.topSellingProducts]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1b2827] border border-[#2d4240] p-3 rounded-2xl shadow-2xl text-xs space-y-1">
          <p className="font-black text-[#e2e663] font-['Fredoka']">{label}</p>
          {(payload as { name: string; value: number; color?: string }[]).map((entry, index) => (
            <p key={`item-${index}`} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || '#f88d63' }} />
              <span className="text-stone-300 capitalize">{entry.name}:</span>
              <strong className="text-white font-mono">
                {entry.name.includes('ingresos') || entry.name.includes('monto')
                  ? `$${entry.value.toLocaleString('es-AR')}`
                  : `${entry.value} pedidos`}
              </strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Timeframe Switcher */}
      <div className="bg-[#192625] p-6 rounded-3xl border border-[#2d4240] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f88d63]/20 text-[#f88d63] text-xs font-bold border border-[#f88d63]/30 mb-2 font-['Fredoka']">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Métricas & Gráficos con Recharts en Tiempo Real</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white font-['Fredoka']">
            Reportes Visuales de Ventas
          </h3>
          <p className="text-xs text-[#8daaa8] mt-1">
            Resumen visual automático de ingresos totales, cantidad de pedidos y medios de pago.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Daily vs Weekly Toggle */}
          <div className="bg-[#14201f] p-1 rounded-2xl border border-[#2d4240] flex items-center">
            <button
              onClick={() => setTimeframe('daily')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all font-['Fredoka'] ${
                timeframe === 'daily'
                  ? 'bg-[#f88d63] text-[#1b2827] shadow-md'
                  : 'text-[#8daaa8] hover:text-white'
              }`}
            >
              📅 Ventas Diarias (Hoy)
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all font-['Fredoka'] ${
                timeframe === 'weekly'
                  ? 'bg-[#e2e663] text-[#1b2827] shadow-md'
                  : 'text-[#8daaa8] hover:text-white'
              }`}
            >
              📊 Ventas Semanales (7 días)
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="bg-[#243635] hover:bg-[#2c4241] text-[#e2e663] border border-[#364e4c] p-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors font-['Fredoka']"
            title="Exportar reporte en formato CSV para Excel"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards (Ingresos Totales y Cantidad de Pedidos Procesados) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ingresos Totales */}
        <div className="bg-[#1e2d2c] border border-[#2d4240] p-5 rounded-3xl relative overflow-hidden group hover:border-[#f88d63]/50 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs text-[#8daaa8] font-bold block">Ingresos Totales</span>
            <div className="p-2 rounded-xl bg-[#f88d63]/15 text-[#f88d63]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-[#e2e663] font-['Fredoka']">
              ${report.totalRevenue.toLocaleString('es-AR')}
            </span>
          </div>
          <span className="text-[11px] text-[#f88d63] font-bold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{timeframe === 'daily' ? 'Facturación neta hoy' : 'Total acumulado 7 días'}</span>
          </span>
        </div>

        {/* KPI 2: Cantidad de Pedidos Procesados */}
        <div className="bg-[#1e2d2c] border border-[#2d4240] p-5 rounded-3xl relative overflow-hidden group hover:border-[#e2e663]/50 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs text-[#8daaa8] font-bold block">Pedidos Procesados</span>
            <div className="p-2 rounded-xl bg-[#e2e663]/15 text-[#e2e663]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-['Fredoka']">
              {report.totalOrders} <span className="text-xs text-[#8daaa8] font-normal">pedidos</span>
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{report.completedOrdersCount} entregados con éxito</span>
          </span>
        </div>

        {/* KPI 3: Ticket Promedio */}
        <div className="bg-[#1e2d2c] border border-[#2d4240] p-5 rounded-3xl relative overflow-hidden group hover:border-[#759694]/50 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs text-[#8daaa8] font-bold block">Ticket Promedio</span>
            <div className="p-2 rounded-xl bg-[#759694]/15 text-[#759694]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-['Fredoka']">
              ${report.averageTicket.toLocaleString('es-AR')}
            </span>
          </div>
          <span className="text-[11px] text-[#8daaa8] font-medium block mt-1">
            Monto medio por comanda
          </span>
        </div>

        {/* KPI 4: Recaudado por Mercado Pago */}
        <div className="bg-[#1e2d2c] border border-[#2d4240] p-5 rounded-3xl relative overflow-hidden group hover:border-[#009ee3]/50 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs text-[#8daaa8] font-bold block">Cobrado por Mercado Pago</span>
            <div className="p-2 rounded-xl bg-[#009ee3]/15 text-[#009ee3]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-[#009ee3] font-['Fredoka']">
              ${report.revenueByPaymentMethod.mercadopago.toLocaleString('es-AR')}
            </span>
          </div>
          <span className="text-[11px] text-sky-300 font-bold block mt-1">
            {report.totalRevenue > 0
              ? `${Math.round((report.revenueByPaymentMethod.mercadopago / report.totalRevenue) * 100)}% de los ingresos`
              : '0% del total'}
          </span>
        </div>
      </div>

      {/* Main Recharts Section (Visual Chart for Daily or Weekly) */}
      <div className="bg-[#1e2d2c] border border-[#2d4240] p-6 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2d4240] pb-4">
          <div>
            <h4 className="text-base font-black text-white font-['Fredoka'] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#f88d63]" />
              <span>
                {timeframe === 'daily'
                  ? 'Curva de Ingresos y Pedidos por Hora (Hoy)'
                  : 'Evolución Semanal de Facturación & Cantidad de Pedidos'}
              </span>
            </h4>
            <p className="text-xs text-[#8daaa8] mt-0.5">
              {timeframe === 'daily'
                ? 'Monitoreo de horas pico de cocina (almuerzos y cenas).'
                : 'Comparativa diaria de los últimos 7 días.'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold font-mono">
            <span className="flex items-center gap-1.5 text-[#f88d63]">
              <span className="w-3 h-3 rounded-full bg-[#f88d63]" /> Ingresos ($ ARS)
            </span>
            <span className="flex items-center gap-1.5 text-[#e2e663]">
              <span className="w-3 h-3 rounded-full bg-[#e2e663]" /> Cant. Pedidos
            </span>
          </div>
        </div>

        {/* Responsive Container with Recharts */}
        <div className="h-72 w-full pt-4">
          {timeframe === 'daily' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f88d63" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f88d63" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d4240" />
                <XAxis dataKey="hora" stroke="#8daaa8" fontSize={11} />
                <YAxis
                  stroke="#8daaa8"
                  fontSize={11}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#f88d63"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorIngresos)"
                  name="ingresos"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d4240" />
                <XAxis dataKey="name" stroke="#8daaa8" fontSize={11} />
                <YAxis
                  yAxisId="left"
                  stroke="#f88d63"
                  fontSize={11}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <YAxis yAxisId="right" orientation="right" stroke="#e2e663" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  yAxisId="left"
                  dataKey="ingresos"
                  fill="#f88d63"
                  radius={[8, 8, 0, 0]}
                  name="ingresos"
                />
                <Bar
                  yAxisId="right"
                  dataKey="pedidos"
                  fill="#e2e663"
                  radius={[6, 6, 0, 0]}
                  name="pedidos"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two Column Grid: Recharts Pie Chart for Payment Methods + Top Products & MP Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Pie Chart: Medios de Pago */}
        <div className="bg-[#1e2d2c] border border-[#2d4240] p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#2d4240] pb-3">
            <h4 className="text-sm font-black text-white font-['Fredoka'] flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#e2e663]" />
              <span>Distribución por Medio de Pago</span>
            </h4>
            <span className="text-xs text-[#8daaa8]">Recharts Donut</span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {paymentMethodPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentMethodPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: unknown) => [`$${Number(val || 0).toLocaleString('es-AR')}`, 'Monto']}
                    contentStyle={{ backgroundColor: '#1b2827', borderColor: '#2d4240', borderRadius: '12px' }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-xs text-stone-200">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#8daaa8]">Sin cobros registrados en este período</p>
            )}
          </div>

          {/* Revenue by MP Alias Bar Progress */}
          <div className="pt-2 border-t border-[#2d4240] space-y-2">
            <span className="text-xs font-bold text-[#8daaa8] uppercase tracking-wider block">
              Recaudación por Alias Mercado Pago (Control Cuentas)
            </span>
            <div className="space-y-2">
              {report.revenueByAlias.map((alias) => {
                const pct = report.totalRevenue > 0 ? Math.round((alias.amount / report.totalRevenue) * 100) : 0;
                return (
                  <div key={alias.aliasId} className="bg-[#14201f] p-2.5 rounded-xl border border-[#263736] text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold text-white truncate">{alias.aliasName}</span>
                      <strong className="text-[#009ee3] font-['Fredoka']">${alias.amount.toLocaleString('es-AR')}</strong>
                    </div>
                    <div className="w-full bg-[#1e2d2c] h-1.5 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="bg-[#009ee3] h-full rounded-full transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Selling Dishes Ranking */}
        <div className="bg-[#1e2d2c] border border-[#2d4240] p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#2d4240] pb-3">
            <h4 className="text-sm font-black text-white font-['Fredoka'] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f88d63]" />
              <span>Platos Caseros Más Vendidos</span>
            </h4>
            <span className="text-xs text-[#8daaa8]">Por unidades</span>
          </div>

          <div className="space-y-2.5">
            {report.topSellingProducts.length === 0 ? (
              <p className="text-xs text-[#8daaa8] py-8 text-center">Sin ventas registradas en este período</p>
            ) : (
              report.topSellingProducts.map((p, idx) => (
                <div
                  key={p.productId}
                  className="bg-[#14201f] p-3 rounded-2xl border border-[#263736] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-[#243635] text-[#f88d63] font-black text-xs flex items-center justify-center shrink-0 font-['Fredoka']">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-white truncate block">
                        {p.productName}
                      </span>
                      <span className="text-[10px] text-[#8daaa8] uppercase">{p.category}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-[#e2e663] block font-['Fredoka'] text-sm">
                      {p.quantity} unid.
                    </span>
                    <span className="text-[10px] text-[#8daaa8]">
                      ${p.revenue.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
