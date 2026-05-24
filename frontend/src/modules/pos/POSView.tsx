import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Wallet, Loader2, Search, RefreshCw, AlertCircle, CheckCircle2, User, HelpCircle, Utensils, Check, Printer } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Dish, Category, Order, Table } from '../../types';
import api from '../../lib/axios';

export const POSView: React.FC = () => {
  const { 
    items, 
    addItem, 
    updateQuantity, 
    clearCart,
    getSubtotal,
    getTax,
    getTotal
  } = useCartStore();

  const { settings } = useSettingsStore();
  const currencySymbol = settings?.currency_symbol || 'S/';
  const taxRatePercent = settings?.tax_rate ?? 18;
  const taxFactor = 1 + (taxRatePercent / 100);

  // Navigation and data states
  const [activeTab, setActiveTab] = useState<'cuentas' | 'venta-rapida'>('cuentas');
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  
  // Selection and form states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dishSearch, setDishSearch] = useState<string>('');
  const [orderSearch, setOrderSearch] = useState<string>('');

  // UX states
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Print states
  const [lastReceipt, setLastReceipt] = useState<Order | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [isPreBill, setIsPreBill] = useState<boolean>(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const [dishesRes, categoriesRes, tablesRes, ordersRes] = await Promise.all([
        api.get('/dishes'),
        api.get('/categories'),
        api.get('/tables'),
        api.get('/pos/orders')
      ]);
      setDishes(dishesRes.data.filter((d: Dish) => d.is_available));
      setCategories(categoriesRes.data);
      setTables(tablesRes.data);
      setUnpaidOrders(ordersRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar datos del punto de venta. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshOrdersAndTables = async () => {
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        api.get('/pos/orders'),
        api.get('/tables')
      ]);
      setUnpaidOrders(ordersRes.data);
      setTables(tablesRes.data);
    } catch (err) {
      console.error('Error actualizando comandas/mesas:', err);
    }
  };

  // Switch tabs cleanly
  const handleTabChange = (tab: 'cuentas' | 'venta-rapida') => {
    setActiveTab(tab);
    setSelectedOrder(null);
    setLastReceipt(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setLastReceipt(null);
    setError(null);
    setSuccessMessage(null);
  };

  // Trigger browser print modal
  const handlePrint = (order: Order, preBill: boolean) => {
    setPrintOrder(order);
    setIsPreBill(preBill);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Submit checkout/payment
  const handleProcessCheckout = async () => {
    setProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: any = {
        payment_method: selectedPaymentMethod,
      };

      if (activeTab === 'cuentas') {
        if (!selectedOrder) {
          setError('Debe seleccionar una cuenta de mesa activa.');
          setProcessing(false);
          return;
        }
        payload.order_id = selectedOrder.id;
        payload.amount = parseFloat(selectedOrder.total.toString());
      } else {
        const totalAmount = getTotal();
        if (items.length === 0) {
          setError('Debe agregar al menos un plato al carrito.');
          setProcessing(false);
          return;
        }
        payload.amount = totalAmount;
        payload.table_id = selectedTableId ? parseInt(selectedTableId) : null;
        payload.items = items.map(item => ({
          dish_id: item.dish_id,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || undefined
        }));
      }

      const res = await api.post('/pos/checkout', payload);
      setSuccessMessage(res.data.message || 'Operación realizada con éxito.');
      if (res.data.order) {
        setLastReceipt(res.data.order);
      }

      // Clear selection / cart
      if (activeTab === 'cuentas') {
        setSelectedOrder(null);
      } else {
        clearCart();
        setSelectedTableId('');
      }

      // Reload fresh table and order lists
      await refreshOrdersAndTables();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al procesar la venta. Verifique los datos e intente de nuevo.');
      }
    } finally {
      setProcessing(false);
    }
  };

  // Filters for Fast Order (Venta Rápida)
  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
                          dish.description?.toLowerCase().includes(dishSearch.toLowerCase());
    
    if (selectedCategory === 'all') return matchesSearch;
    
    const category = categories.find(c => c.slug === selectedCategory);
    return matchesSearch && dish.category_id === category?.id;
  });

  // Filters for Cuentas Abiertas
  const filteredOrders = unpaidOrders.filter(order => {
    const tableNumber = order.table ? `mesa ${order.table.number}` : '';
    const waiterName = order.user?.name.toLowerCase() || '';
    const searchLower = orderSearch.toLowerCase();
    
    return tableNumber.includes(searchLower) || 
           waiterName.includes(searchLower) || 
           order.id.toString().includes(searchLower);
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden space-y-4">
      {/* Top Navbar: Modules Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Caja y Facturación</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Genera pagos, libera mesas y procesa ventas al instante.</p>
          </div>
        </div>

        {/* Action Toggle Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
          <button
            onClick={() => handleTabChange('cuentas')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all
              ${activeTab === 'cuentas'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
              }
            `}
          >
            <Utensils size={14} />
            Cuentas Abiertas ({unpaidOrders.length})
          </button>
          <button
            onClick={() => handleTabChange('venta-rapida')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all
              ${activeTab === 'venta-rapida'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
              }
            `}
          >
            <ShoppingCart size={14} />
            Venta Rápida
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 size={40} className="text-emerald-500 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Cargando recursos del POS...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 overflow-hidden">
          
          {/* LEFT SIDE: Operations (Search and selection grid) */}
          <div className="xl:col-span-2 flex flex-col h-full space-y-4 overflow-hidden">
            
            {/* Mode 1: Cuentas Abiertas List */}
            {activeTab === 'cuentas' && (
              <div className="flex flex-col h-full space-y-4 overflow-hidden">
                {/* Search / Refresh Bar */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Buscar por número de mesa, mesero o ID de comanda..."
                    />
                  </div>
                  <button
                    onClick={refreshOrdersAndTables}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Actualizar Cuentas"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                {/* Grid of unpaid orders */}
                <div className="flex-1 overflow-y-auto pr-1 pb-4 scrollbar-thin">
                  {filteredOrders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-950/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                      <Utensils size={40} className="text-slate-300 dark:text-slate-700 mb-2" />
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">Sin comandas activas</h3>
                      <p className="text-xs text-slate-500 mt-1">No hay ninguna mesa ocupada con cuenta pendiente de cobro.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredOrders.map((order) => {
                        const isSelected = selectedOrder?.id === order.id;
                        return (
                          <div
                            key={order.id}
                            onClick={() => handleSelectOrder(order)}
                            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-40 group shadow-sm
                              ${isSelected
                                ? 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-500/80 shadow-md ring-1 ring-emerald-500'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-750 hover:scale-[1.01]'
                              }
                            `}
                          >
                            <div>
                              <div className="flex justify-between items-start">
                                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider
                                  ${order.status === 'entregado'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                                  }
                                `}>
                                  {order.status}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">#{order.id}</span>
                              </div>
                              <h3 className="text-base font-black text-slate-900 dark:text-white mt-3">
                                Mesa {order.table ? order.table.number.toString().padStart(2, '0') : 'N/A'}
                              </h3>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                <User size={10} className="shrink-0" />
                                <span>{order.user?.name || 'Mesero'}</span>
                              </p>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-2">
                              <span className="text-[10px] text-slate-400">
                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-sm font-black text-slate-900 dark:text-white">
                                {currencySymbol} {parseFloat(order.total.toString()).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode 2: Venta Rápida Dishes Selector */}
            {activeTab === 'venta-rapida' && (
              <div className="flex flex-col h-full space-y-4 overflow-hidden">
                {/* Categories & Search Bar */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={dishSearch}
                      onChange={(e) => setDishSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Buscar plato del menú..."
                    />
                  </div>
                  
                  {/* Category Selector */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                        ${selectedCategory === 'all'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800'
                        }
                      `}
                    >
                      Todos
                    </button>
                    {categories.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.slug)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                          ${selectedCategory === c.slug
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800'
                          }
                        `}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dishes Grid */}
                <div className="flex-1 overflow-y-auto pr-1 pb-4 scrollbar-thin">
                  {filteredDishes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-950/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                      <HelpCircle size={40} className="text-slate-300 dark:text-slate-700 mb-2" />
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">No hay platos disponibles</h3>
                      <p className="text-xs text-slate-500 mt-1">Intente buscando otro plato o categoría.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredDishes.map((dish) => (
                        <div
                          key={dish.id}
                          onClick={() => addItem(dish)}
                          className="group cursor-pointer flex flex-col justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-md transition-all hover:scale-[1.01]"
                        >
                          <div className="flex items-center justify-center h-24 bg-slate-50 dark:bg-slate-950/40 rounded-xl mb-3 overflow-hidden">
                            {dish.image_url ? (
                              <img
                                src={dish.image_url.startsWith('http') ? dish.image_url : `http://localhost:8000${dish.image_url}`}
                                alt={dish.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <span className="text-2xl group-hover:scale-110 transition-transform">🍳</span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{dish.name}</h3>
                            <div className="flex justify-between items-center mt-2.5">
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                {currencySymbol} {parseFloat(dish.price.toString()).toFixed(2)}
                              </span>
                              <span className="p-1 rounded-lg bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <Plus size={12} />
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: Checkout & Cart (Sticky invoice receipt card) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between h-full shadow-md overflow-hidden">
            
            {/* 1. Header Information */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              {activeTab === 'cuentas' ? (
                <div>
                  <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-sm">
                    <ShoppingCart size={16} className="text-emerald-500" />
                    <span>Cobrar Comanda de Mesa</span>
                  </div>
                  {selectedOrder ? (
                    <div className="mt-2 p-3 bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-100/40 dark:border-emerald-900/20 rounded-2xl">
                      <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Mesa {selectedOrder.table ? selectedOrder.table.number.toString().padStart(2, '0') : 'N/A'} (Comanda #{selectedOrder.id})
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Atendido por: {selectedOrder.user?.name || 'Mesero'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">Seleccione una mesa ocupada a la izquierda para procesar su cuenta.</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-sm">
                    <ShoppingCart size={16} className="text-emerald-500" />
                    <span>Detalle de Venta Rápida</span>
                  </div>
                  {items.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Trash2 size={13} /> Limpiar
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. Items List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3.5 scrollbar-thin">
              {activeTab === 'cuentas' ? (
                // Selected Order Items (Read Only)
                !selectedOrder ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <ShoppingCart size={32} className="text-slate-200 dark:text-slate-800 mb-1" />
                    <span className="text-xs text-slate-400 font-semibold">Esperando mesa...</span>
                  </div>
                ) : (
                  selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-xs border-b border-slate-50 dark:border-slate-950 pb-2">
                      <div className="flex-1 pr-2">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{item.dish?.name}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">{currencySymbol} {parseFloat(item.price.toString()).toFixed(2)} x {item.quantity}</span>
                        {item.notes && <p className="text-[9px] text-rose-500 italic mt-0.5">Nota: "{item.notes}"</p>}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">
                        {currencySymbol} {(item.quantity * parseFloat(item.price.toString())).toFixed(2)}
                      </span>
                    </div>
                  ))
                )
              ) : (
                // Cart Items (Editable)
                items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <ShoppingCart size={32} className="text-slate-200 dark:text-slate-800 mb-1" />
                    <span className="text-xs text-slate-400 font-semibold">Carrito vacío</span>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs gap-3 border-b border-slate-50 dark:border-slate-950 pb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">{item.dish?.name}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">{currencySymbol} {item.price.toFixed(2)} c/u</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.dish_id, item.quantity - 1)}
                          className="p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-950 text-slate-500"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.dish_id, item.quantity + 1)}
                          className="p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-950 text-slate-500"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            {/* 3. Totals & Checkout Panel */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-4">
              
              {/* Receipts Totals (Subtotal, IGV, Total) */}
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {currencySymbol} {activeTab === 'cuentas'
                      ? selectedOrder 
                        ? (parseFloat(selectedOrder.total.toString()) / taxFactor).toFixed(2)
                        : '0.00'
                      : (getSubtotal()).toFixed(2)
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Impuesto ({taxRatePercent}%)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {currencySymbol} {activeTab === 'cuentas'
                      ? selectedOrder 
                        ? (parseFloat(selectedOrder.total.toString()) - (parseFloat(selectedOrder.total.toString()) / taxFactor)).toFixed(2)
                        : '0.00'
                      : (getTax()).toFixed(2)
                    }
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-950 dark:text-white pt-1">
                  <span>Total a Cobrar</span>
                  <span className="text-emerald-500">
                    {currencySymbol} {activeTab === 'cuentas'
                      ? selectedOrder 
                        ? parseFloat(selectedOrder.total.toString()).toFixed(2)
                        : '0.00'
                      : (getTotal()).toFixed(2)
                    }
                  </span>
                </div>
              </div>

              {/* Table assignment selector (Only in Venta Rápida) */}
              {activeTab === 'venta-rapida' && (
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Asociar Mesa (Opcional)
                  </span>
                  <select
                    value={selectedTableId}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Para Llevar / Sin Mesa</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>
                        Mesa {t.number.toString().padStart(2, '0')} ({t.status === 'free' ? 'Libre' : 'Ocupada'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Methods */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Método de Pago
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedPaymentMethod('cash')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all
                      ${selectedPaymentMethod === 'cash'
                        ? 'border-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-750 text-slate-500 dark:text-slate-400'
                      }
                    `}
                  >
                    <DollarSign size={15} className="mb-1" />
                    <span>Efectivo</span>
                  </button>
                  <button
                    onClick={() => setSelectedPaymentMethod('card')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all
                      ${selectedPaymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50/15 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-750 text-slate-500 dark:text-slate-400'
                      }
                    `}
                  >
                    <CreditCard size={15} className="mb-1" />
                    <span>Tarjeta</span>
                  </button>
                  <button
                    onClick={() => setSelectedPaymentMethod('transfer')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all
                      ${selectedPaymentMethod === 'transfer'
                        ? 'border-indigo-500 bg-indigo-50/15 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-750 text-slate-500 dark:text-slate-400'
                      }
                    `}
                  >
                    <Wallet size={15} className="mb-1" />
                    <span>Yape/Plin</span>
                  </button>
                </div>
              </div>

              {/* Status Feedbacks */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-700 dark:text-rose-400 text-xs font-bold">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex flex-col gap-2 p-3 bg-emerald-50/30 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                  {lastReceipt && (
                    <button
                      onClick={() => handlePrint(lastReceipt, false)}
                      className="mt-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-800 dark:hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black transition-all"
                    >
                      <Printer size={12} />
                      Imprimir Comprobante de Pago
                    </button>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col gap-2">
                {activeTab === 'cuentas' && selectedOrder && (
                  <button
                    onClick={() => handlePrint(selectedOrder, true)}
                    disabled={processing}
                    className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Printer size={14} />
                    Imprimir Pre-cuenta
                  </button>
                )}

                <button
                  onClick={handleProcessCheckout}
                  disabled={processing || (activeTab === 'cuentas' && !selectedOrder) || (activeTab === 'venta-rapida' && items.length === 0)}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/15 active:scale-95 disabled:scale-100 transition-all flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Procesando pago...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>
                        {activeTab === 'cuentas'
                          ? 'Confirmar Pago / Liberar Mesa'
                          : 'Procesar Venta Directa'
                        }
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Container for printing */}
      {printOrder && (
        <div id="ticket-print" className="font-mono text-xs p-4 text-black bg-white">
          <div className="text-center mb-4">
            <h2 className="text-sm font-black uppercase">{settings?.name || 'RestoSuite'}</h2>
            {settings?.ruc && <p className="text-[10px]">RUC: {settings.ruc}</p>}
            <p className="text-[10px]">{settings?.address || 'Dirección de la empresa'}</p>
            <p className="text-[10px]">Telf: {settings?.phone || 'N/A'}</p>
            <div className="border-b border-dashed border-black my-2"></div>
            <h3 className="text-[11px] font-bold uppercase">
              {isPreBill ? 'TICKET PRE-CUENTA' : 'COMPROBANTE DE PAGO'}
            </h3>
            <p className="text-[10px] font-bold">Comanda #{printOrder.id}</p>
          </div>

          <div className="space-y-0.5 text-[10px] mb-3">
            <div className="flex justify-between">
              <span>Fecha:</span>
              <span>{new Date(printOrder.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Mesa:</span>
              <span className="font-bold">
                {printOrder.table ? `Mesa ${printOrder.table.number.toString().padStart(2, '0')}` : 'Para Llevar'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Mesero:</span>
              <span>{printOrder.user?.name || 'N/A'}</span>
            </div>
            {!isPreBill && printOrder.payment_method && (
              <div className="flex justify-between font-bold">
                <span>Método de Pago:</span>
                <span className="uppercase">
                  {printOrder.payment_method === 'cash' ? 'Efectivo' : printOrder.payment_method === 'card' ? 'Tarjeta' : 'Yape/Plin'}
                </span>
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-black my-2"></div>

          {/* Table of items */}
          <table className="w-full text-[10px] mb-3 border-collapse">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="text-left py-1 w-8">Cant</th>
                <th className="text-left py-1">Descripción</th>
                <th className="text-right py-1 w-16">P.Unit</th>
                <th className="text-right py-1 w-16">Total</th>
              </tr>
            </thead>
            <tbody>
              {printOrder.items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="py-1">{item.quantity}</td>
                  <td className="py-1">
                    {item.dish?.name}
                    {item.notes && <p className="text-[9px] italic font-sans text-slate-700 mt-0.5">* "{item.notes}"</p>}
                  </td>
                  <td className="py-1 text-right">{currencySymbol} {parseFloat(item.price.toString()).toFixed(2)}</td>
                  <td className="py-1 text-right">{currencySymbol} {(item.quantity * parseFloat(item.price.toString())).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-b border-dashed border-black my-2"></div>

          {/* Summary section */}
          <div className="space-y-1 text-[10px] font-bold">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{currencySymbol} {(parseFloat(printOrder.total.toString()) / taxFactor).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IGV ({taxRatePercent}%):</span>
              <span>{currencySymbol} {(parseFloat(printOrder.total.toString()) - (parseFloat(printOrder.total.toString()) / taxFactor)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-black font-black">
              <span>TOTAL:</span>
              <span>{currencySymbol} {parseFloat(printOrder.total.toString()).toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center mt-6 text-[9px] uppercase font-bold space-y-1">
            <p>¡Gracias por su preferencia!</p>
            <p>RestoSuite - Control de Calidad</p>
          </div>
        </div>
      )}
    </div>
  );
};
