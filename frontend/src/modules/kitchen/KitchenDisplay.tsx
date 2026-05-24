import React, { useState, useEffect } from 'react';
import { ChefHat, CheckCircle2, Clock, Wifi, Loader2, AlertTriangle } from 'lucide-react';
import api from '../../lib/axios';
import { Order, OrderStatus } from '../../types';

export const KitchenDisplay: React.FC = () => {
  const [tickets, setTickets] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    setError(null);
    try {
      const res = await api.get('/kitchen/tickets');
      setTickets(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener las comandas de cocina. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    
    // Auto polling every 10 seconds to keep the screen fresh
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  const startPreparation = async (id: number) => {
    try {
      // Optimistic update
      setTickets(prev => 
        prev.map(t => t.id === id ? { ...t, status: 'preparando' as OrderStatus } : t)
      );
      
      const res = await api.patch(`/kitchen/tickets/${id}/start`);
      const updatedTicket = res.data.ticket;
      
      setTickets(prev => 
        prev.map(t => t.id === id ? updatedTicket : t)
      );
    } catch (err: any) {
      console.error(err);
      alert('Error al iniciar la preparación del pedido.');
      fetchTickets();
    }
  };

  const markReady = async (id: number) => {
    try {
      // Optimistic update: remove from active kitchen board
      setTickets(prev => prev.filter(t => t.id !== id));
      
      await api.patch(`/kitchen/tickets/${id}/ready`);
    } catch (err: any) {
      console.error(err);
      alert('Error al marcar la comanda como lista.');
      fetchTickets();
    }
  };

  const getMinutesElapsed = (createdAtString: string) => {
    const created = new Date(createdAtString);
    const diffMs = Date.now() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins > 0 ? `${diffMins} min` : 'Hace instantes';
  };

  return (
    <div className="space-y-6">
      {/* KDS Header with real-time socket online status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Kitchen Display System (KDS)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Visualizador de pedidos en cocina para preparación en tiempo real.
          </p>
        </div>

        {/* WebSocket Signal Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-400 text-xs font-semibold">
          <Wifi size={16} className="animate-pulse" />
          <span>Servidor de Cocina Conectado</span>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-rose-700 dark:text-rose-400 text-sm font-semibold">
          <AlertTriangle size={18} className="shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={fetchTickets} className="text-xs underline hover:text-rose-800 dark:hover:text-rose-350">
            Reintentar
          </button>
        </div>
      )}

      {/* Tickets Display Grid */}
      {loading && tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={40} className="text-slate-500 animate-spin" />
          <span className="text-slate-500 text-sm font-semibold">Cargando comandas en cocina...</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
          <ChefHat size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Cocina despejada
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            No hay tickets pendientes de preparación por ahora.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className={`flex flex-col justify-between border-2 rounded-3xl bg-white dark:bg-slate-900 shadow-md transition-all duration-300 overflow-hidden
                ${ticket.status === 'preparando' 
                  ? 'border-blue-500 dark:border-blue-600' 
                  : 'border-slate-200 dark:border-slate-800'
                }
              `}
            >
              {/* Ticket Top */}
              <div className={`p-4 flex items-center justify-between text-xs font-bold text-white
                ${ticket.status === 'preparando' ? 'bg-blue-500' : 'bg-amber-500'}
              `}>
                <span className="text-sm">Ticket #{ticket.id}</span>
                <span className="uppercase tracking-wider px-2 py-0.5 rounded bg-white/25">
                  {ticket.status}
                </span>
              </div>

              {/* Ticket Body details */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <span className="block font-bold text-slate-700 dark:text-slate-300 text-sm">
                      Mesa {ticket.table ? ticket.table.number.toString().padStart(2, '0') : 'N/A'}
                    </span>
                    <span className="text-slate-400">Atiende: {ticket.user?.name || 'Sistema'}</span>
                  </div>
                  <span className="flex items-center gap-1 font-semibold text-slate-500">
                    <Clock size={14} />
                    {getMinutesElapsed(ticket.created_at)}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {ticket.items.map((item, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex justify-between font-bold">
                        <span>{item.dish?.name || 'Plato Eliminado'}</span>
                        <span className="text-emerald-600 dark:text-emerald-400">x{item.quantity}</span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1.5 rounded-lg mt-1 border border-rose-100 dark:border-rose-950">
                          Nota: {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticket Footer Action */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 flex gap-2">
                {ticket.status === 'pendiente' ? (
                  <button 
                    onClick={() => startPreparation(ticket.id)}
                    className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all"
                  >
                    Iniciar Preparación
                  </button>
                ) : (
                  <button 
                    onClick={() => markReady(ticket.id)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 size={16} />
                    Listo / Servir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
