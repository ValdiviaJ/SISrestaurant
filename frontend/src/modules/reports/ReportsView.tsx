import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Loader2, AlertCircle, ShoppingBag, CreditCard, Wallet, RefreshCw, Layers } from 'lucide-react';
import api from '../../lib/axios';
import { useSettingsStore } from '../../store/useSettingsStore';

interface SalesDay {
  date: string;
  total: number | string;
}

interface SalesSummary {
  total_sales: number;
  orders_count: number;
  average_ticket: number;
  sales_by_date: SalesDay[];
}

interface BestSeller {
  name: string;
  quantity_sold: number | string;
  revenue: number | string;
}

interface OrdersVolumeResponse {
  orders_volume: {
    pendiente: number;
    preparando: number;
    listo: number;
    entregado: number;
    pagado: number;
    cancelado: number;
  };
  payment_methods: {
    payment_method: 'cash' | 'card' | 'transfer';
    count: number;
    total_amount: number | string;
  }[];
}

export const ReportsView: React.FC = () => {
  const { settings } = useSettingsStore();
  const currencySymbol = settings?.currency_symbol || 'S/';

  const getPastDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // State
  const [startDate, setStartDate] = useState<string>(getPastDate(30));
  const [endDate, setEndDate] = useState<string>(getTodayDate());
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [volumeData, setVolumeData] = useState<OrdersVolumeResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; date: string; value: number } | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { start_date: startDate, end_date: endDate };
      const [salesRes, sellersRes, volumeRes] = await Promise.all([
        api.get('/reports/sales', { params }),
        api.get('/reports/best-sellers', { params }),
        api.get('/reports/orders-count', { params }),
      ]);

      setSalesSummary(salesRes.data);
      setBestSellers(sellersRes.data);
      setVolumeData(volumeRes.data);
    } catch (err: any) {
      console.error(err);
      setError('No se pudieron cargar los reportes. Verifique que tenga rol de administrador.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // SVG Chart Calculations
  const renderSVGChart = () => {
    if (!salesSummary || !salesSummary.sales_by_date || salesSummary.sales_by_date.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-slate-400 text-xs">
          Sin registros en el rango seleccionado
        </div>
      );
    }

    const data = salesSummary.sales_by_date;
    const width = 500;
    const height = 200;
    const paddingX = 40;
    const paddingY = 20;

    const chartWidth = width - 2 * paddingX;
    const chartHeight = height - 2 * paddingY;

    const totals = data.map(d => parseFloat(d.total.toString()));
    const maxVal = Math.max(...totals, 100); // base limit is 100
    const minVal = 0;

    const points = data.map((d, index) => {
      const val = parseFloat(d.total.toString());
      const x = paddingX + (data.length > 1 ? (index / (data.length - 1)) * chartWidth : chartWidth / 2);
      const y = height - paddingY - ((val - minVal) / (maxVal - minVal)) * chartHeight;
      return { x, y, date: d.date, value: val };
    });

    // Draw lines
    const linePath = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    // Draw shaded area
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : '';

    return (
      <div className="relative w-full h-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} className="stroke-slate-100 dark:stroke-slate-800/60" strokeDasharray="4 4" />
          <line x1={paddingX} y1={paddingY + chartHeight / 2} x2={width - paddingX} y2={paddingY + chartHeight / 2} className="stroke-slate-100 dark:stroke-slate-800/60" strokeDasharray="4 4" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} className="stroke-slate-200 dark:stroke-slate-800" />

          {/* Left Y Axis Labels */}
          <text x={paddingX - 10} y={paddingY + 4} className="fill-slate-400 text-[10px] font-bold text-right" textAnchor="end">
            {currencySymbol} {maxVal.toFixed(0)}
          </text>
          <text x={paddingX - 10} y={paddingY + chartHeight / 2 + 4} className="fill-slate-400 text-[10px] font-bold text-right" textAnchor="end">
            {currencySymbol} {(maxVal / 2).toFixed(0)}
          </text>
          <text x={paddingX - 10} y={height - paddingY + 4} className="fill-slate-400 text-[10px] font-bold text-right" textAnchor="end">
            {currencySymbol} 0
          </text>

          {/* Area under curve */}
          {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

          {/* Main trend line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              className="stroke-emerald-500"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive dots */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint?.date === p.date ? 6 : 4}
              className={`fill-emerald-400 dark:fill-emerald-500 stroke-white dark:stroke-slate-900 stroke-2 cursor-pointer transition-all duration-150`}
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* Date Axis (Only render start, middle, end to avoid clutter) */}
          {points.length > 0 && (
            <>
              <text x={points[0].x} y={height - 4} className="fill-slate-400 text-[9px] font-bold" textAnchor="middle">
                {new Date(points[0].date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </text>
              {points.length > 2 && (
                <text x={points[Math.floor(points.length / 2)].x} y={height - 4} className="fill-slate-400 text-[9px] font-bold" textAnchor="middle">
                  {new Date(points[Math.floor(points.length / 2)].date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </text>
              )}
              {points.length > 1 && (
                <text x={points[points.length - 1].x} y={height - 4} className="fill-slate-400 text-[9px] font-bold" textAnchor="middle">
                  {new Date(points[points.length - 1].date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </text>
              )}
            </>
          )}
        </svg>

        {/* Floating Tooltip HTML over SVG */}
        {hoveredPoint && (
          <div 
            className="absolute z-10 bg-slate-900 border border-slate-700 text-white rounded-xl p-2 text-[10px] font-bold shadow-md -translate-x-1/2 -translate-y-full pointer-events-none"
            style={{ 
              left: `${(hoveredPoint.x / 500) * 100}%`, 
              top: `${(hoveredPoint.y / 200) * 100 - 4}%` 
            }}
          >
            <p className="text-slate-400">{new Date(hoveredPoint.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            <p className="text-emerald-400 mt-0.5">{currencySymbol} {hoveredPoint.value.toFixed(2)}</p>
          </div>
        )}
      </div>
    );
  };

  // Stacked payments breakdown calculations
  const renderPaymentsBreakdown = () => {
    if (!volumeData || !volumeData.payment_methods || volumeData.payment_methods.length === 0) {
      return (
        <p className="text-xs text-slate-400 text-center py-4">No hay pagos registrados en este periodo.</p>
      );
    }

    const methods = volumeData.payment_methods;
    const totalAmount = methods.reduce((acc, m) => acc + parseFloat(m.total_amount.toString()), 0);

    if (totalAmount === 0) {
      return (
        <p className="text-xs text-slate-400 text-center py-4">No hay ingresos recaudados.</p>
      );
    }

    const mapped = methods.map(m => {
      const val = parseFloat(m.total_amount.toString());
      const pct = (val / totalAmount) * 100;
      return { 
        method: m.payment_method,
        label: m.payment_method === 'cash' ? 'Efectivo' : m.payment_method === 'card' ? 'Tarjeta' : 'Yape/Plin',
        value: val, 
        percentage: pct,
        color: m.payment_method === 'cash' ? 'bg-emerald-500' : m.payment_method === 'card' ? 'bg-blue-500' : 'bg-indigo-500',
        textColor: m.payment_method === 'cash' ? 'text-emerald-500' : m.payment_method === 'card' ? 'text-blue-500' : 'text-indigo-500',
        icon: m.payment_method === 'cash' ? <DollarSign size={13} /> : m.payment_method === 'card' ? <CreditCard size={13} /> : <Wallet size={13} />
      };
    });

    return (
      <div className="space-y-4">
        {/* Progress bar split */}
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden flex">
          {mapped.map((m, idx) => (
            <div 
              key={idx}
              className={`${m.color} h-full transition-all`}
              style={{ width: `${m.percentage}%` }}
              title={`${m.label}: ${m.percentage.toFixed(1)}%`}
            />
          ))}
        </div>

        {/* Legend metrics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {mapped.map((m, idx) => (
            <div key={idx} className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 ${m.textColor}`}>
                  {m.icon}
                </span>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400">{m.label}</span>
                  <span className="block text-xs font-black text-slate-800 dark:text-slate-200">{currencySymbol} {m.value.toFixed(2)}</span>
                </div>
              </div>
              <span className="text-xs font-black text-slate-400">{m.percentage.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Reportes y Estadísticas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Analiza el rendimiento financiero, volumen de ventas y platos preferidos.
          </p>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm self-start sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold px-1">
            <Calendar size={14} />
            <span>Rango:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <span className="text-slate-400 text-xs font-bold">a</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={fetchReports}
            className="p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500"
            title="Refrescar datos"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-rose-700 dark:text-rose-400 text-sm font-semibold">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !salesSummary ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 size={40} className="text-emerald-500 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Calculando indicadores financieros...</span>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* KPI Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* KPI 1: Ingresos totales */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ingresos por Ventas</span>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                    {currencySymbol} {salesSummary?.total_sales ? salesSummary.total_sales.toFixed(2) : '0.00'}
                  </h2>
                </div>
                <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400">
                  <DollarSign size={20} />
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-4">Calculado sobre comisiones y cobros registrados.</p>
            </div>

            {/* KPI 2: Pedidos realizados */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ventas Cerradas</span>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                    {salesSummary?.orders_count || 0}
                  </h2>
                </div>
                <span className="p-3 rounded-2xl bg-blue-50 text-blue-500 dark:bg-blue-950/20 dark:text-blue-400">
                  <ShoppingBag size={20} />
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-4">Cantidad de comandas cobradas en caja.</p>
            </div>

            {/* KPI 3: Ticket promedio */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ticket Promedio</span>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                    {currencySymbol} {salesSummary?.average_ticket ? salesSummary.average_ticket.toFixed(2) : '0.00'}
                  </h2>
                </div>
                <span className="p-3 rounded-2xl bg-purple-50 text-purple-500 dark:bg-purple-950/20 dark:text-purple-400">
                  <TrendingUp size={20} />
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-4">Ingreso promedio por cada comanda cobrada.</p>
            </div>

          </div>

          {/* Central Grid Panel (Chart & Best Sellers) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Sales Chart (Line chart SVG) */}
            <div className="xl:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col justify-between h-80">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Evolución de Ingresos</h3>
                  <p className="text-xs text-slate-400">Tendencia de ventas por fecha</p>
                </div>
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              
              <div className="flex-1 min-h-0 relative">
                {renderSVGChart()}
              </div>
            </div>

            {/* Top Sold Dishes Panel */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col h-80">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Platos Más Vendidos</h3>
                  <p className="text-xs text-slate-400">Top 5 platos preferidos</p>
                </div>
                <BarChart3 size={18} className="text-blue-500" />
              </div>

              {/* List of best sellers */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {bestSellers.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs py-8">
                    No se registran ventas de platos en este periodo
                  </div>
                ) : (
                  (() => {
                    const quantities = bestSellers.map(b => parseFloat(b.quantity_sold.toString()));
                    const maxQty = Math.max(...quantities, 1);
                    
                    return bestSellers.map((item, idx) => {
                      const qty = parseFloat(item.quantity_sold.toString());
                      const rev = parseFloat(item.revenue.toString());
                      const percentage = (qty / maxQty) * 100;
                      
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-800 dark:text-slate-200 line-clamp-1">{item.name}</span>
                            <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {qty} u. <span className="text-slate-400 font-semibold">({currencySymbol} {rev.toFixed(0)})</span>
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>

          </div>

          {/* Bottom Grid (Payment Methods & Status Volume) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Payment Methods Breakdown */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Distribución por Método de Pago</h3>
                <p className="text-xs text-slate-400">Total recaudado según medio de pago</p>
              </div>
              
              {renderPaymentsBreakdown()}
            </div>

            {/* Orders Volume & Status Breakdown */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Volumen por Estado de Pedido</h3>
                  <p className="text-xs text-slate-400">Clasificación de estados de comandas creadas</p>
                </div>
                <Layers size={18} className="text-indigo-500" />
              </div>

              {volumeData?.orders_volume ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Pendientes', key: 'pendiente', color: 'border-amber-200 dark:border-amber-900/40 text-amber-500' },
                    { label: 'Preparación', key: 'preparando', color: 'border-blue-200 dark:border-blue-900/40 text-blue-500' },
                    { label: 'Listo', key: 'listo', color: 'border-cyan-200 dark:border-cyan-900/40 text-cyan-500' },
                    { label: 'Entregados', key: 'entregado', color: 'border-teal-200 dark:border-teal-900/40 text-teal-500' },
                    { label: 'Pagados', key: 'pagado', color: 'border-emerald-200 dark:border-emerald-900/40 text-emerald-500' },
                    { label: 'Cancelados', key: 'cancelado', color: 'border-rose-200 dark:border-rose-900/40 text-rose-500' },
                  ].map((s, idx) => {
                    const count = volumeData.orders_volume[s.key as keyof typeof volumeData.orders_volume] || 0;
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 border rounded-2xl flex flex-col justify-between h-20 bg-slate-50/20 dark:bg-slate-950/10 ${s.color}`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</span>
                        <span className="text-2xl font-black">{count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No hay datos de volumen de pedidos en este periodo.</p>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
