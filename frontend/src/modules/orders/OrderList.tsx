import React, { useState, useEffect } from 'react';
import { Plus, Eye, X, Loader2, Search, ArrowRight, ClipboardList, Check, ShoppingCart, MessageSquare, AlertTriangle, Users, BookOpen } from 'lucide-react';
import api from '../../lib/axios';
import { Order, OrderStatus, Table, Dish, Category } from '../../types';
import { useSettingsStore } from '../../store/useSettingsStore';

export const OrderList: React.FC = () => {
  const { settings } = useSettingsStore();
  const currencySymbol = settings?.currency_symbol || 'S/';
  const taxRatePercent = settings?.tax_rate ?? 18;
  const taxFactor = 1 + (taxRatePercent / 100);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter tab
  const [activeTab, setActiveTab] = useState<'todos' | OrderStatus>('todos');

  // Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // New Order Drawer State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [dbTables, setDbTables] = useState<Table[]>([]);
  const [dbDishes, setDbDishes] = useState<Dish[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loadingFormResources, setLoadingFormResources] = useState(false);

  // Form State
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [cartItems, setCartItems] = useState<{ dish: Dish; quantity: number; notes: string }[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [dishSearchTerm, setDishSearchTerm] = useState<string>('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener el listado de pedidos. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openNewOrderDrawer = async () => {
    setIsNewOrderModalOpen(true);
    setFormError(null);
    setCartItems([]);
    setSelectedTableId('');
    setLoadingFormResources(true);

    try {
      const [tablesRes, dishesRes, categoriesRes] = await Promise.all([
        api.get('/tables'),
        api.get('/dishes'),
        api.get('/categories')
      ]);
      setDbTables(tablesRes.data);
      // Only offer active dishes
      setDbDishes(dishesRes.data.filter((d: Dish) => d.is_available));
      setDbCategories(categoriesRes.data);
    } catch (err: any) {
      console.error(err);
      setFormError('Error al precargar recursos del salón o menú.');
    } finally {
      setLoadingFormResources(false);
    }
  };

  const addToCart = (dish: Dish) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.dish.id === dish.id);
      if (existing) {
        return prev.map(item => item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { dish, quantity: 1, notes: '' }];
    });
  };

  const updateCartQuantity = (dishId: number, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.dish.id === dishId) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : null;
      }
      return item;
    }).filter(Boolean) as { dish: Dish; quantity: number; notes: string }[]);
  };

  const updateCartNotes = (dishId: number, notes: string) => {
    setCartItems(prev => prev.map(item => item.dish.id === dishId ? { ...item, notes } : item));
  };

  const getCartTotal = () => {
    return cartItems.reduce((acc, curr) => acc + (curr.dish.price * curr.quantity), 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedTableId) {
      setFormError('Por favor seleccione una mesa.');
      return;
    }

    if (cartItems.length === 0) {
      setFormError('Debe agregar al menos un plato al pedido.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const payload = {
        table_id: parseInt(selectedTableId),
        total: getCartTotal(),
        items: cartItems.map(item => ({
          dish_id: item.dish.id,
          quantity: item.quantity,
          price: item.dish.price,
          notes: item.notes.trim() || undefined
        }))
      };

      const res = await api.post('/orders', payload);
      setOrders(prev => [res.data, ...prev]);
      setIsNewOrderModalOpen(false);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        setFormError(err.response.data.message);
      } else {
        setFormError('Error al crear el pedido. Intente de nuevo.');
      }
    } finally {
      setSubmittingOrder(false);
    }
  };

  // State Transition logic
  const handleUpdateStatus = async (orderId: number, nextStatus: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      const updatedOrder = res.data.order;
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error al actualizar el estado del pedido.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pendiente':
        return 'bg-amber-100/70 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
      case 'preparando':
        return 'bg-blue-100/70 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30';
      case 'listo':
        return 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30';
      case 'entregado':
        return 'bg-slate-100/70 text-slate-700 dark:bg-slate-800/40 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800';
      case 'pagado':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      case 'cancelado':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
    }
  };

  const getNextStatusAction = (status: OrderStatus) => {
    switch (status) {
      case 'pendiente':
        return { target: 'preparando' as OrderStatus, label: 'Empezar Preparación' };
      case 'preparando':
        return { target: 'listo' as OrderStatus, label: 'Marcar como Listo' };
      case 'listo':
        return { target: 'entregado' as OrderStatus, label: 'Entregar a Mesa' };
      case 'entregado':
      case 'pagado':
      case 'cancelado':
        return null;
    }
  };

  const filteredOrders = activeTab === 'todos'
    ? orders
    : orders.filter(o => o.status === activeTab);

  const filteredDishes = dbDishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(dishSearchTerm.toLowerCase()) || 
                          dish.description?.toLowerCase().includes(dishSearchTerm.toLowerCase());
    
    if (activeCategoryFilter === 'all') return matchesSearch;
    
    const category = dbCategories.find(c => c.slug === activeCategoryFilter);
    return matchesSearch && dish.category_id === category?.id;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Gestión de Pedidos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Visualiza, toma y gestiona los estados de los pedidos en el salón.
          </p>
        </div>

        <button
          onClick={openNewOrderDrawer}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20 text-sm transition-all duration-250 transform hover:-translate-y-0.5 active:translate-y-0 self-start sm:self-auto"
        >
          <Plus size={18} />
          Nuevo Pedido
        </button>
      </div>

      {/* Tabs list with counts */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto scrollbar-thin">
        {(['todos', 'pendiente', 'preparando', 'listo', 'entregado'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const count = tab === 'todos' ? orders.length : orders.filter(o => o.status === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5
                ${isActive
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                }
              `}
            >
              <span>{tab}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-rose-700 dark:text-rose-400 text-sm font-semibold">
          <AlertTriangle size={18} className="shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={fetchOrders} className="text-xs underline hover:text-rose-800 dark:hover:text-rose-300">
            Reintentar
          </button>
        </div>
      )}

      {/* Grid or Table listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={40} className="text-slate-500 animate-spin" />
          <span className="text-slate-500 text-sm font-semibold">Cargando pedidos...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <ClipboardList size={48} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No hay pedidos disponibles</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            {activeTab === 'todos' ? 'No se ha tomado ningún pedido en el salón hoy.' : `No hay ningún pedido en estado "${activeTab}".`}
          </p>
          {activeTab === 'todos' && (
            <button
              onClick={openNewOrderDrawer}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors"
            >
              <Plus size={14} /> Tomar Comanda
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <th className="px-6 py-4">ID Pedido</th>
                    <th className="px-6 py-4">Mesa</th>
                    <th className="px-6 py-4">Mesero</th>
                    <th className="px-6 py-4">Hora</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-350">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        Mesa {order.table ? order.table.number.toString().padStart(2, '0') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">
                        {order.user?.name || 'Sistema'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-950 dark:text-white">
                        {currencySymbol} {parseFloat(order.total.toString()).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 transition-colors"
                            title="Ver Detalles"
                          >
                            <Eye size={14} />
                            <span>Detalle</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => {
                  setSelectedOrder(order);
                  setIsDetailModalOpen(true);
                }}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400">#{order.id}</span>
                    <h4 className="text-base font-bold text-slate-950 dark:text-white">
                      Mesa {order.table ? order.table.number.toString().padStart(2, '0') : 'N/A'}
                    </h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <span>Atendido por: {order.user?.name || 'Sistema'}</span>
                  <span className="font-extrabold text-slate-950 dark:text-white text-sm">
                    {currencySymbol} {parseFloat(order.total.toString()).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Order Details Modal */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-150 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    Pedido #{selectedOrder.id}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Atendido por {selectedOrder.user?.name || 'Sistema'} &bull; {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
              {/* Salón details */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Salón</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Mesa {selectedOrder.table ? selectedOrder.table.number.toString().padStart(2, '0') : 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Capacidad</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Users size={14} />
                    {selectedOrder.table?.capacity || 0} Comensales
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Detalle de Comida</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-4 bg-white dark:bg-slate-900 flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.dish?.name || 'Plato Eliminado'}
                        </span>
                        
                        {item.notes && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 px-2 py-0.5 rounded-lg border border-rose-100/40 dark:border-rose-900/10">
                            <MessageSquare size={10} className="shrink-0" />
                            <span className="font-semibold italic">Nota: "{item.notes}"</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right whitespace-nowrap">
                        <span className="text-xs text-slate-400 font-semibold">{item.quantity} x {currencySymbol} {parseFloat(item.price.toString()).toFixed(2)}</span>
                        <span className="block text-sm font-extrabold text-slate-950 dark:text-white mt-0.5">
                          {currencySymbol} {(item.quantity * parseFloat(item.price.toString())).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col items-end gap-1.5 text-sm">
                <div className="flex justify-between w-full max-w-[240px] text-slate-500">
                  <span className="font-semibold">Subtotal:</span>
                  <span className="font-bold">{currencySymbol} {(parseFloat(selectedOrder.total.toString()) / taxFactor).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[240px] text-slate-500">
                  <span className="font-semibold">Impuesto ({taxRatePercent}%):</span>
                  <span className="font-bold">{currencySymbol} {(parseFloat(selectedOrder.total.toString()) - (parseFloat(selectedOrder.total.toString()) / taxFactor)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[240px] border-t border-slate-100 dark:border-slate-800/80 pt-2 text-base text-slate-950 dark:text-white">
                  <span className="font-black">Total:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">
                    {currencySymbol} {parseFloat(selectedOrder.total.toString()).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 bg-slate-50/50 dark:bg-slate-950/20">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="flex-1 py-3 text-sm font-bold border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>

              {getNextStatusAction(selectedOrder.status) && (
                <button
                  disabled={updatingStatus}
                  onClick={() => {
                    const action = getNextStatusAction(selectedOrder.status);
                    if (action) {
                      handleUpdateStatus(selectedOrder.id, action.target);
                    }
                  }}
                  className="flex-2 py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-extrabold rounded-2xl text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <span>{getNextStatusAction(selectedOrder.status)?.label}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Order Drawer (Slide-over) */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-50 dark:bg-slate-950 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">Nueva Comanda</h3>
                  <p className="text-xs text-slate-500">Registra un nuevo pedido para el salón.</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="m-6 mb-0 flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Drawer Body (Scrollable Split view) */}
            {loadingFormResources ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="text-slate-500 animate-spin" />
                <span className="text-xs font-bold text-slate-500">Cargando menú y mesas...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Menu items panel */}
                <div className="flex-1 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-900/80 space-y-4 max-h-[50vh] lg:max-h-none scrollbar-thin">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Dish Search */}
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={dishSearchTerm}
                        onChange={(e) => setDishSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                        placeholder="Buscar plato..."
                      />
                    </div>

                    {/* Table Select */}
                    <div className="w-full sm:w-48">
                      <select
                        required
                        value={selectedTableId}
                        onChange={(e) => setSelectedTableId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                      >
                        <option value="">-- Seleccionar Mesa --</option>
                        {dbTables.map(t => (
                          <option key={t.id} value={t.id}>
                            Mesa {t.number.toString().padStart(2, '0')} ({t.status === 'free' ? 'Libre' : 'Ocupada'}, Cap. {t.capacity})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Categories list horizontal */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setActiveCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors
                        ${activeCategoryFilter === 'all'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-white hover:bg-slate-100 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800'
                        }
                      `}
                    >
                      Todos
                    </button>
                    {dbCategories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategoryFilter(cat.slug)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors
                          ${activeCategoryFilter === cat.slug
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-white hover:bg-slate-100 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800'
                          }
                        `}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Dishes grid */}
                  {filteredDishes.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
                      <span>No se encontraron platos disponibles.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredDishes.map((dish) => (
                        <div
                          key={dish.id}
                          onClick={() => addToCart(dish)}
                          className="cursor-pointer group p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl hover:shadow-md transition-all flex gap-3 items-center"
                        >
                          {/* Image Thumbnail */}
                          {dish.image_url ? (
                            <img
                              src={dish.image_url.startsWith('http') ? dish.image_url : `http://localhost:8000${dish.image_url}`}
                              alt={dish.name}
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              MENU
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors">
                              {dish.name}
                            </h4>
                            <span className="block text-xs font-black text-slate-950 dark:text-slate-100 mt-0.5">
                              {currencySymbol} {parseFloat(dish.price.toString()).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-emerald-500 group-hover:text-white text-slate-500 flex items-center justify-center text-xs font-bold transition-colors">
                            +
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cart panel right side */}
                <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border-t lg:border-t-0 border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between max-h-[50vh] lg:max-h-none">
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Lista de Pedido</span>
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-black">
                        {cartItems.reduce((acc, curr) => acc + curr.quantity, 0)} items
                      </span>
                    </h4>

                    {cartItems.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 text-xs py-10">
                        <ShoppingCart size={32} className="text-slate-300 mb-2 animate-bounce" />
                        <span>El carrito está vacío.<br />Seleccione platos del menú para agregar.</span>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                        {cartItems.map((item) => (
                          <div key={item.dish.id} className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex-1">{item.dish.name}</span>
                              <span className="text-xs font-black text-slate-950 dark:text-white">
                                {currencySymbol} {(item.dish.price * item.quantity).toFixed(2)}
                              </span>
                            </div>

                            {/* Quantity Adjuster & Notes */}
                            <div className="flex items-center justify-between gap-3">
                              <input
                                type="text"
                                value={item.notes}
                                onChange={(e) => updateCartNotes(item.dish.id, e.target.value)}
                                className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                placeholder="Nota: ej. Sin cebolla"
                              />

                              <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 text-xs font-bold">
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.dish.id, -1)}
                                  className="px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  -
                                </button>
                                <span className="px-2 text-slate-700 dark:text-slate-350">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.dish.id, 1)}
                                  className="px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit actions */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4 space-y-3 text-xs">
                    <div className="flex justify-between font-bold text-slate-500">
                      <span>Total:</span>
                      <span className="text-base font-black text-slate-950 dark:text-white">
                        {currencySymbol} {getCartTotal().toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={submittingOrder}
                      onClick={handleCreateOrder}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      {submittingOrder ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Confirmar Comanda</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
