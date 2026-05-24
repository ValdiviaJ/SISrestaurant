import React, { useState, useEffect, useRef } from 'react';
import { Plus, Users2, Edit, Trash2, X, Loader2, AlertTriangle, Check, Shield } from 'lucide-react';
import api from '../../lib/axios';
import { Table, TableStatus } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';

export const TableView: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [savingTable, setSavingTable] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tableForm, setTableForm] = useState({
    number: '',
    capacity: '4',
    status: 'free' as TableStatus,
  });

  // Quick Status Menu State
  const [activeMenuTableId, setActiveMenuTableId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/tables');
      // Sort tables by number ascending
      const sortedTables = res.data.sort((a: Table, b: Table) => a.number - b.number);
      setTables(sortedTables);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar el mapa de mesas. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Close status menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuTableId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTableCardStyle = (status: TableStatus) => {
    switch (status) {
      case 'free':
        return {
          card: 'border-emerald-300 dark:border-emerald-850/40 bg-gradient-to-br from-emerald-100/70 via-emerald-50/30 to-teal-100/40 dark:from-emerald-950/20 dark:via-emerald-950/10 dark:to-teal-950/5 text-emerald-900 dark:text-emerald-300 hover:border-emerald-500 dark:hover:border-emerald-500/60 shadow-md shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20',
          glow: 'bg-emerald-500',
          tableCenter: 'bg-emerald-500 dark:bg-emerald-600 border-emerald-400 dark:border-emerald-500 text-white shadow-md shadow-emerald-500/20',
          tableLabel: 'text-emerald-100/90 dark:text-emerald-200/90',
          tableNumber: 'text-white',
          badge: 'bg-emerald-200/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/40',
          chair: 'bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-700 shadow-sm',
          btnEdit: 'bg-emerald-200/60 hover:bg-emerald-300/60 text-emerald-900 border border-emerald-300/60 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/50',
          btnDelete: 'bg-rose-200/60 hover:bg-rose-300/60 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-300 dark:border-rose-900/50'
        };
      case 'busy':
        return {
          card: 'border-rose-300 dark:border-rose-800/40 bg-gradient-to-br from-rose-100/60 via-rose-50/20 to-orange-100/30 dark:from-rose-950/20 dark:via-rose-950/10 dark:to-orange-950/5 text-rose-900 dark:text-rose-300 hover:border-rose-500 dark:hover:border-rose-500/60 shadow-md shadow-rose-500/10 hover:shadow-xl hover:shadow-rose-500/20',
          glow: 'bg-rose-500',
          tableCenter: 'bg-rose-500 dark:bg-rose-600 border-rose-400 dark:border-rose-500 text-white shadow-md shadow-rose-500/20',
          tableLabel: 'text-rose-100/90 dark:text-rose-200/90',
          tableNumber: 'text-white',
          badge: 'bg-rose-200/80 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-300/60 dark:border-rose-800/40',
          chair: 'bg-white dark:bg-slate-900 border-rose-400 dark:border-rose-700 shadow-sm',
          btnEdit: 'bg-rose-200/60 hover:bg-rose-300/60 text-rose-900 border border-rose-300/60 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800/50',
          btnDelete: 'bg-red-200/70 hover:bg-red-300/70 text-red-700 border border-red-300/60 dark:bg-red-950/40 dark:hover:bg-red-900/40 dark:text-red-300 dark:border-red-900/50'
        };
      case 'reserved':
        return {
          card: 'border-indigo-300 dark:border-indigo-800/40 bg-gradient-to-br from-indigo-100/60 via-indigo-50/20 to-violet-100/30 dark:from-indigo-950/20 dark:via-indigo-950/10 dark:to-violet-950/5 text-indigo-900 dark:text-indigo-300 hover:border-indigo-500 dark:hover:border-indigo-500/60 shadow-md shadow-indigo-500/10 hover:shadow-xl hover:shadow-indigo-500/20',
          glow: 'bg-indigo-500',
          tableCenter: 'bg-indigo-500 dark:bg-indigo-600 border-indigo-400 dark:border-indigo-500 text-white shadow-md shadow-indigo-500/20',
          tableLabel: 'text-indigo-100/90 dark:text-indigo-200/90',
          tableNumber: 'text-white',
          badge: 'bg-indigo-200/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border border-indigo-300/60 dark:border-indigo-800/40',
          chair: 'bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-700 shadow-sm',
          btnEdit: 'bg-indigo-200/60 hover:bg-indigo-300/60 text-indigo-900 border border-indigo-300/60 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800/50',
          btnDelete: 'bg-rose-200/60 hover:bg-rose-350/60 text-rose-700 border border-rose-300/60 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-300 dark:border-rose-900/50'
        };
    }
  };

  const getStatusLabel = (status: TableStatus) => {
    switch (status) {
      case 'free':
        return 'Libre';
      case 'busy':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
    }
  };

  const getStatusColorClass = (status: TableStatus) => {
    switch (status) {
      case 'free': return 'bg-emerald-500';
      case 'busy': return 'bg-rose-500';
      case 'reserved': return 'bg-indigo-500';
    }
  };

  // Quick status update with optimistic UI updates
  const handleStatusChange = async (id: number, nextStatus: TableStatus) => {
    const previousTables = [...tables];
    
    // Optimistic Update
    setTables(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    setActiveMenuTableId(null);

    try {
      await api.patch(`/tables/${id}/status`, { status: nextStatus });
    } catch (err: any) {
      console.error(err);
      // Revert if request fails
      setTables(previousTables);
      alert('No se pudo actualizar el estado de la mesa en el servidor.');
    }
  };

  // Admin Create/Edit actions
  const handleOpenCreate = () => {
    setSelectedTable(null);
    // Find next logical table number
    const maxNum = tables.length > 0 ? Math.max(...tables.map(t => t.number)) : 0;
    setTableForm({
      number: (maxNum + 1).toString(),
      capacity: '4',
      status: 'free',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (table: Table, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering status menu
    setSelectedTable(table);
    setTableForm({
      number: table.number.toString(),
      capacity: table.capacity.toString(),
      status: table.status,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDeleteTable = async (id: number, number: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering status menu
    if (!confirm(`¿Estás seguro de que deseas eliminar la Mesa ${number.toString().padStart(2, '0')}?`)) return;

    try {
      await api.delete(`/tables/${id}`);
      setTables(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.error(err);
      alert('Error al eliminar la mesa.');
    }
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numValue = parseInt(tableForm.number);
    const capacityValue = parseInt(tableForm.capacity);

    if (isNaN(numValue) || numValue <= 0) {
      setFormError('El número de mesa debe ser un número entero positivo.');
      return;
    }

    if (isNaN(capacityValue) || capacityValue <= 0) {
      setFormError('La capacidad debe ser al menos 1.');
      return;
    }

    setSavingTable(true);
    try {
      const payload = {
        number: numValue,
        capacity: capacityValue,
        status: tableForm.status,
      };

      if (selectedTable) {
        const res = await api.put(`/tables/${selectedTable.id}`, payload);
        setTables(prev => 
          prev.map(t => t.id === selectedTable.id ? res.data : t)
            .sort((a, b) => a.number - b.number)
        );
      } else {
        const res = await api.post('/tables', payload);
        setTables(prev => 
          [...prev, res.data]
            .sort((a, b) => a.number - b.number)
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.errors?.number) {
        setFormError('El número de mesa ya está registrado por otra mesa.');
      } else if (err.response?.data?.message) {
        setFormError(err.response.data.message);
      } else {
        setFormError('Ocurrió un error al guardar la mesa. Por favor, intente de nuevo.');
      }
    } finally {
      setSavingTable(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Mapa Visual de Mesas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Visualiza y administra la disponibilidad y estado de las mesas del salón.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg hover:shadow-xl dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-sm transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 self-start sm:self-auto"
          >
            <Plus size={18} />
            Agregar Mesa
          </button>
        )}
      </div>

      {/* Legend Indicators & Loading/Error status */}
      <div className="flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-rose-700 dark:text-rose-400 text-sm font-semibold">
            <AlertTriangle size={18} className="shrink-0" />
            <div className="flex-1">{error}</div>
            <button 
              onClick={fetchTables} 
              className="text-xs underline hover:text-rose-800 dark:hover:text-rose-300"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold">
          <span className="text-slate-400">Estados de Mesa:</span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Libre ({tables.filter(t => t.status === 'free').length})
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-100/50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Ocupada ({tables.filter(t => t.status === 'busy').length})
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-100/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Reservada ({tables.filter(t => t.status === 'reserved').length})
          </span>
        </div>
      </div>

      {/* Grid of Tables */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={40} className="text-slate-500 animate-spin" />
          <span className="text-slate-500 text-sm font-semibold">Cargando mapa de mesas...</span>
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <Users2 size={48} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No hay mesas registradas</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            {isAdmin ? 'Comienza registrando tu primera mesa para el salón.' : 'No se encontraron mesas disponibles.'}
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              <Plus size={14} /> Registrar Mesa
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map((table) => {
            const isMenuOpen = activeMenuTableId === table.id;
            const style = getTableCardStyle(table.status);

            return (
              <div
                key={table.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuTableId(isMenuOpen ? null : table.id);
                }}
                className={`relative group flex flex-col items-center justify-between p-5 border rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer select-none active:scale-[0.98] overflow-hidden
                  ${style.card}
                `}
              >
                {/* Abstract Background Dotted Pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px] rounded-3xl pointer-events-none" />

                {/* Glowing Backlights */}
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-[0.07] dark:opacity-[0.15] blur-xl pointer-events-none transition-all duration-300 group-hover:scale-150 ${style.glow}`} />
                <div className={`absolute bottom-0 left-0 w-20 h-20 -ml-6 -mb-6 rounded-full opacity-[0.03] dark:opacity-[0.08] blur-xl pointer-events-none transition-all duration-300 group-hover:scale-150 ${style.glow}`} />

                {/* Table Header */}
                <div className="relative flex justify-between items-center w-full z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Mesa
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Capacity Badge */}
                    <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-sm border ${style.badge}`}>
                      <Users2 size={11} />
                      {table.capacity}
                    </span>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 ml-1">
                        <button
                          onClick={(e) => handleOpenEdit(table, e)}
                          className={`p-1 rounded-md border ${style.btnEdit}`}
                        >
                          <Edit size={10} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTable(table.id, table.number, e)}
                          className={`p-1 rounded-md border ${style.btnDelete}`}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Table & Chairs Representation */}
                <div className="relative my-7 flex items-center justify-center w-32 h-32 z-10">
                  {/* Chairs surrounding the table */}
                  {Array.from({ length: Math.min(table.capacity, 8) }).map((_, index) => {
                    const angle = (index * 360) / Math.min(table.capacity, 8);
                    const radius = 38; // Distance from center
                    const x = Math.cos((angle * Math.PI) / 180) * radius;
                    const y = Math.sin((angle * Math.PI) / 180) * radius;
                    
                    return (
                      <span
                        key={index}
                        className={`absolute w-2.5 h-2.5 rounded-full border shadow-sm transition-all duration-300 group-hover:scale-125 ${style.chair}`}
                        style={{
                          transform: `translate(${x}px, ${y}px)`,
                        }}
                      />
                    );
                  })}
                  
                  {/* The Physical Table Center */}
                  <div className={`relative w-16 h-16 rounded-full flex flex-col items-center justify-center border shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.03] ${style.tableCenter}`}>
                    <span className={`text-[8px] font-bold uppercase tracking-widest leading-none mb-0.5 ${style.tableLabel}`}>
                      MESA
                    </span>
                    <span className={`text-2xl font-black tracking-tight leading-none ${style.tableNumber}`}>
                      {table.number.toString().padStart(2, '0')}
                    </span>
                    {table.capacity > 8 && (
                      <span className="absolute -bottom-1.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-bold px-1 rounded-full border dark:border-slate-700 text-slate-500 dark:text-slate-400">
                        +{table.capacity - 8}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Indicator Pill & Instruction */}
                <div className="relative w-full flex flex-col items-center gap-1.5 mt-1 z-10">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${style.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusColorClass(table.status)} ${table.status === 'free' ? 'animate-pulse' : ''}`}></span>
                    {getStatusLabel(table.status)}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                    {isMenuOpen ? 'Abierto' : 'Click para cambiar'}
                  </span>
                </div>

                {/* Interactive Status Switcher Overlay / Context Menu */}
                {isMenuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-3xl p-4 flex flex-col justify-center items-stretch gap-2 z-20 border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()} // Prevent closing immediately
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 text-center">
                      Cambiar Estado
                    </span>

                    <button
                      onClick={() => handleStatusChange(table.id, 'free')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors
                        ${table.status === 'free'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }
                      `}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>Libre</span>
                      {table.status === 'free' && <Check size={14} className="ml-auto text-emerald-600" />}
                    </button>

                    <button
                      onClick={() => handleStatusChange(table.id, 'busy')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors
                        ${table.status === 'busy'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }
                      `}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>Ocupada</span>
                      {table.status === 'busy' && <Check size={14} className="ml-auto text-rose-600" />}
                    </button>

                    <button
                      onClick={() => handleStatusChange(table.id, 'reserved')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors
                        ${table.status === 'reserved'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }
                      `}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                      <span>Reservada</span>
                      {table.status === 'reserved' && <Check size={14} className="ml-auto text-indigo-600" />}
                    </button>

                    <button
                      onClick={() => setActiveMenuTableId(null)}
                      className="mt-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-center py-1 border-t border-slate-100 dark:border-slate-800"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Table CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Shield size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  {selectedTable ? 'Editar Mesa' : 'Nueva Mesa'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Error Alert */}
            {formError && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSaveTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Número de Mesa
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={tableForm.number}
                  onChange={(e) => setTableForm(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all font-semibold"
                  placeholder="Ej. 5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Capacidad de Comensales
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={tableForm.capacity}
                  onChange={(e) => setTableForm(prev => ({ ...prev, capacity: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all font-semibold"
                  placeholder="Ej. 4"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Estado Inicial
                </label>
                <select
                  value={tableForm.status}
                  onChange={(e) => setTableForm(prev => ({ ...prev, status: e.target.value as TableStatus }))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all font-semibold"
                >
                  <option value="free">Libre</option>
                  <option value="busy">Ocupada</option>
                  <option value="reserved">Reservada</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTable}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold rounded-2xl text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  {savingTable ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Mesa</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
