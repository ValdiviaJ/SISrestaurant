import React, { useState, useEffect } from 'react';
import { DollarSign, ClipboardList, Utensils, Users, ShoppingBag, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../lib/axios';
import { useSettingsStore } from '../../store/useSettingsStore';

interface StatItem {
  name: string;
  value: string | number;
  change: string;
  type: 'currency' | 'number' | 'text';
}

interface ChartPoint {
  label: string;
  date: string;
  total: number;
}

interface BestSeller {
  name: string;
  quantity_sold: number;
  revenue: number;
}

export const Dashboard: React.FC = () => {
  const { settings } = useSettingsStore();
  const currencySymbol = settings?.currency_symbol || 'S/';

  // States
  const [stats, setStats] = useState<StatItem[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [period, setPeriod] = useState<'7d' | 'month' | 'year'>('7d');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; date: string; value: number } | null>(null);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [statsRes, chartRes, sellersRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/sales-chart', { params: { period } }),
        api.get('/dashboard/best-sellers'),
      ]);

      setStats(statsRes.data);
      setChartData(chartRes.data);
      setBestSellers(sellersRes.data);
    } catch (err: any) {
      console.error(err);
      if (!silent) {
        setError('No se pudo cargar la información del dashboard. Verifique sus permisos de administrador.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto polling every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // Styles and icons mapping for premium visual stats cards
  const getCardStyle = (index: number) => {
    switch (index) {
      case 0:
        return {
          icon: DollarSign,
          cardClass: 'bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/10 border-emerald-100/80 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:shadow-emerald-500/10 hover:shadow-xl',
          iconClass: 'text-emerald-600 dark:text-emerald-400 bg-white/90 dark:bg-emerald-950/50 border border-emerald-200/40 dark:border-emerald-900/30',
          glowClass: 'bg-emerald-400'
        };
      case 1:
        return {
          icon: ClipboardList,
          cardClass: 'bg-gradient-to-br from-blue-50 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/10 border-blue-100/80 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-blue-500/10 hover:shadow-xl',
          iconClass: 'text-blue-600 dark:text-blue-400 bg-white/90 dark:bg-blue-950/50 border border-blue-200/40 dark:border-blue-900/30',
          glowClass: 'bg-blue-400'
        };
      case 2:
        return {
          icon: Utensils,
          cardClass: 'bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/10 border-amber-100/80 dark:border-amber-900/30 hover:border-amber-300 dark:hover:border-amber-500/40 hover:shadow-amber-500/10 hover:shadow-xl',
          iconClass: 'text-amber-600 dark:text-amber-400 bg-white/90 dark:bg-amber-950/50 border border-amber-200/40 dark:border-amber-900/30',
          glowClass: 'bg-amber-500'
        };
      default:
        return {
          icon: Users,
          cardClass: 'bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-950/40 dark:to-indigo-900/10 border-indigo-100/80 dark:border-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-indigo-500/10 hover:shadow-xl',
          iconClass: 'text-indigo-600 dark:text-indigo-400 bg-white/90 dark:bg-indigo-950/50 border border-indigo-200/40 dark:border-indigo-900/30',
          glowClass: 'bg-indigo-500'
        };
    }
  };

  // SVG Chart Calculations
  const renderSVGChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-slate-400 text-xs">
          Sin registros en el rango seleccionado
        </div>
      );
    }

    const width = 500;
    const height = 200;
    const paddingX = 40;
    const paddingY = 20;

    const chartWidth = width - 2 * paddingX;
    const chartHeight = height - 2 * paddingY;

    const totals = chartData.map(d => d.total);
    const maxVal = Math.max(...totals, 100); // base limit is 100
    const minVal = 0;

    const points = chartData.map((d, index) => {
      const val = d.total;
      const x = paddingX + (chartData.length > 1 ? (index / (chartData.length - 1)) * chartWidth : chartWidth / 2);
      const y = height - paddingY - ((val - minVal) / (maxVal - minVal)) * chartHeight;
      return { x, y, label: d.label, value: val };
    });

    const linePath = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

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

          {/* Shaded Area under the line */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#chartGradient)"
              className="transition-all duration-300"
            />
          )}

          {/* Path Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* X Axis Labels (Sampled to avoid overlapping if month has 31 items) */}
          {points.map((p, index) => {
            const step = period === 'month' ? 5 : (period === 'year' ? 2 : 1);
            if (index % step === 0 || index === points.length - 1) {
              return (
                <text
                  key={index}
                  x={p.x}
                  y={height - paddingY + 15}
                  className="fill-slate-400 text-[9px] font-bold"
                  textAnchor="middle"
                >
                  {p.label}
                </text>
              );
            }
            return null;
          })}

          {/* Active interactive points */}
          {points.map((p, index) => (
            <g key={index}>
              <circle
                cx={p.x}
                cy={p.y}
                r={12}
                className="fill-transparent cursor-pointer"
                onMouseEnter={() => {
                  setHoveredPoint({
                    x: p.x,
                    y: p.y,
                    date: p.label,
                    value: p.value
                  });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredPoint?.x === p.x ? 5 : 3.5}
                className={`transition-all duration-150 pointer-events-none ${
                  hoveredPoint?.x === p.x 
                    ? 'fill-emerald-500 stroke-white dark:stroke-slate-900 stroke-2 shadow-md' 
                    : 'fill-emerald-400 dark:fill-emerald-500'
                }`}
              />
            </g>
          ))}
        </svg>

        {/* Chart Tooltip */}
        {hoveredPoint && (
          <div 
            className="absolute z-10 px-3 py-2 bg-slate-950/90 text-white rounded-xl shadow-xl text-[10px] pointer-events-none transition-all duration-150 border border-slate-800"
            style={{ 
              left: `${(hoveredPoint.x / width) * 100}%`, 
              top: `${(hoveredPoint.y / height) * 100 - 25}%`,
              transform: 'translate(-50%, -100%)' 
            }}
          >
            <div className="font-bold">{hoveredPoint.date}</div>
            <div className="text-emerald-400 font-extrabold mt-0.5">
              {currencySymbol} {hoveredPoint.value.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Find max seller volume for relative percentage width
  const maxSellerQty = bestSellers.length > 0 
    ? Math.max(...bestSellers.map(d => d.quantity_sold)) 
    : 1;

  if (loading && stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Cargando panel de control...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center max-w-md mx-auto">
        <div className="p-4 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Error de carga</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{error}</p>
        <button
          onClick={() => fetchDashboardData()}
          className="mt-6 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all text-sm"
        >
          Reintentar Carga
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Dashboard Administrativo
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Resumen operativo del restaurante en tiempo real.
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-semibold">
              <Loader2 className="animate-spin text-emerald-500" size={14} />
              Actualizando...
            </div>
          )}
          
          <button
            onClick={() => fetchDashboardData(false)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all shadow-sm hover:scale-[1.02] disabled:opacity-50"
            title="Sincronizar datos"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const { icon: Icon, cardClass, iconClass, glowClass } = getCardStyle(i);
          const isNegative = stat.change.startsWith('-');
          const isPositive = stat.change.startsWith('+');
          
          let changeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
          if (isPositive) changeStyle = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 dark:border-emerald-500/20';
          if (isNegative) changeStyle = 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-500/10 dark:border-rose-500/20';

          return (
            <div 
              key={i} 
              className={`relative overflow-hidden p-6 border rounded-3xl transition-all duration-300 group hover:-translate-y-1 ${cardClass}`}
            >
              {/* Animated Background Decorative Glow Circles */}
              <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-2xl opacity-40 dark:opacity-20 transition-all duration-500 group-hover:scale-150 group-hover:-translate-x-3 group-hover:-translate-y-3 ${glowClass}`} />
              <div className={`absolute -left-6 -top-6 w-16 h-16 rounded-full blur-xl opacity-20 dark:opacity-10 transition-all duration-500 group-hover:scale-125 ${glowClass}`} />

              <div className="relative z-10 flex items-center justify-between">
                <div className={`p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${iconClass}`}>
                  <Icon size={24} />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${changeStyle}`}>
                  {stat.change}
                </span>
              </div>
              <div className="relative z-10 mt-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {stat.name}
                </span>
                <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 mt-2 transition-all duration-300 group-hover:translate-x-0.5">
                  {stat.type === 'currency' 
                    ? `${currencySymbol} ${parseFloat(stat.value.toString()).toFixed(2)}` 
                    : stat.value
                  }
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Flujo de Ventas
              </h3>
              <p className="text-xs text-slate-500">Monitoreo de ingresos cobrados</p>
            </div>
            
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold outline-none cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="month">Este mes</option>
              <option value="year">Este año</option>
            </select>
          </div>
          
          {/* SVG Chart */}
          <div className="flex-1 min-h-[280px] bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {renderSVGChart()}
          </div>
        </div>

        {/* Side Panel: Popular dishes */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Más Vendidos
              </h3>
              <p className="text-xs text-slate-500">Favoritos del periodo reciente</p>
            </div>
            <ShoppingBag size={20} className="text-slate-400" />
          </div>

          <div className="flex-1 flex flex-col justify-start">
            {bestSellers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 min-h-[220px]">
                <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                  Sin datos de platos más vendidos
                </span>
                <span className="text-xs text-slate-400/80 dark:text-slate-500/80 mt-1">
                  Comienza a registrar pedidos en la caja POS
                </span>
              </div>
            ) : (
              <div className="space-y-5">
                {bestSellers.map((item, i) => {
                  const relativePercentage = (item.quantity_sold / maxSellerQty) * 100;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                          {item.name}
                        </span>
                        <span className="font-semibold text-slate-400">
                          {item.quantity_sold} uds • <span className="font-black text-emerald-500">{currencySymbol} {parseFloat(item.revenue.toString()).toFixed(0)}</span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${relativePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
