import { create } from 'zustand';
import { RestaurantConfig } from '../types';
import api from '../lib/axios';

interface SettingsState {
  settings: RestaurantConfig | null;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<RestaurantConfig>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/settings');
      set({ settings: response.data, loading: false });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Error al obtener la configuración';
      // If we get 403 (unauthorized/not admin), we don't log an error to user UI, we just keep settings null
      if (error.response?.status === 403) {
        set({ settings: null, loading: false });
      } else {
        set({ error: errMsg, loading: false });
      }
    }
  },

  updateSettings: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put('/settings', data);
      set({ settings: response.data, loading: false });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Error al actualizar la configuración';
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    }
  },
}));
