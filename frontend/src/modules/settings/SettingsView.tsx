import React, { useState, useEffect } from 'react';
import { Store, Percent, Coins, Save, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export const SettingsView: React.FC = () => {
  const { settings, loading: isFetching, updateSettings } = useSettingsStore();

  const [formData, setFormData] = useState({
    name: '',
    ruc: '',
    address: '',
    phone: '',
    tax_rate: 18,
    currency: 'PEN',
  });

  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load store settings into local form state
  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || '',
        ruc: settings.ruc || '',
        address: settings.address || '',
        phone: settings.phone || '',
        tax_rate: settings.tax_rate ?? 18,
        currency: settings.currency || 'PEN',
      });
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);
    setIsSaving(true);

    try {
      await updateSettings(formData);
      setSuccess(true);
      // Auto dismiss success message after 4 seconds
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching && !settings) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3">
        <Loader2 className="text-emerald-500 animate-spin" size={40} />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Cargando configuración del sistema...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Configuración del Sistema</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Ajusta los datos del negocio, tasas de impuestos, tipo de moneda y opciones operativas globales.
        </p>
      </div>

      {/* Dynamic Banners */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-2xl animate-fade-in text-sm font-medium">
          <Check className="shrink-0 text-emerald-500" size={18} />
          ¡Configuración guardada correctamente en el sistema!
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-2xl animate-fade-in text-sm font-medium">
          <AlertTriangle className="shrink-0 text-rose-500" size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Restaurant Profile Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Store className="text-emerald-500" size={20} />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Datos del Restaurante</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nombre Comercial</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">RUC / Identificación Fiscal</label>
              <input
                type="text"
                value={formData.ruc}
                onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                placeholder="Ej. 20123456789"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Teléfono de Contacto</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Dirección Física</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                required
              />
            </div>
          </div>
        </div>

        {/* Currency and Taxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Taxes */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Percent className="text-blue-500" size={20} />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Impuestos y Tasas</h3>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tasa de Impuesto (%)</label>
              <input
                type="number"
                step="any"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Aplicado a cada venta y reflejado en el ticket (e.g. 18% para IGV / IVA).
              </span>
            </div>
          </div>

          {/* Currency */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Coins className="text-amber-500" size={20} />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Divisa y Moneda</h3>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Código de Moneda (ISO)</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-medium transition-colors"
              >
                <option value="PEN">Soles (PEN)</option>
                <option value="USD">Dólares (USD)</option>
                <option value="EUR">Euros (EUR)</option>
                <option value="COP">Peso Colombiano (COP)</option>
                <option value="MXN">Peso Mexicano (MXN)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-[0.98]"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>

      </form>
    </div>
  );
};
