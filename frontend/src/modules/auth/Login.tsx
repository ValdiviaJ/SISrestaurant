import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock, LogIn } from 'lucide-react';
import api from '../../lib/axios';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const setLogin = useAuthStore((state) => state.setLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      setLogin(user, token);
      
      // Redireccionar según el rol del usuario
      if (user.role === 'cocina') {
        navigate('/kitchen');
      } else if (user.role === 'mozo') {
        navigate('/tables');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data) {
        if (err.response.data.errors) {
          const validationErrors = Object.values(err.response.data.errors).flat().join(' ');
          setError(validationErrors);
        } else if (err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Las credenciales proporcionadas son incorrectas.');
        }
      } else {
        setError('Ocurrió un error al intentar conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Iniciar Sesión
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Ingresa tus credenciales para acceder al sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
            Correo Electrónico
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail size={18} />
            </span>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase">
              Contraseña
            </label>
            <Link 
              to="/forgot-password" 
              className="text-xs text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock size={18} />
            </span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
              required
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <LogIn size={18} />
          )}
          {loading ? 'Accediendo...' : 'Acceder al Sistema'}
        </button>
      </form>
    </div>
  );
};
