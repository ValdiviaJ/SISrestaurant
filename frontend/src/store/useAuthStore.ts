import { create } from 'zustand';
import { User, UserRole } from '../types';
import api from '../lib/axios';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  setLogin: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: false,
  isCheckingAuth: !!localStorage.getItem('auth_token'),

  setLogin: (user, token) => {
    localStorage.setItem('auth_token', token);
    set({ user, token, isAuthenticated: true, isCheckingAuth: false });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignorar errores si el token ya expiró o es inválido en el backend
    }
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false, isCheckingAuth: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      set({
        user: response.data.user,
        isAuthenticated: true,
        isCheckingAuth: false,
      });
    } catch (error) {
      localStorage.removeItem('auth_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isCheckingAuth: false,
      });
    }
  },

  hasRole: (roles) => {
    const user = get().user;
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  },
}));
