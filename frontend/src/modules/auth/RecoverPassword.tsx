import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export const RecoverPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending recovery email
    setSent(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Recuperar Contraseña
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Te enviaremos un correo para restablecer tu contraseña
        </p>
      </div>

      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm"
          >
            <Send size={18} />
            Enviar Instrucciones
          </button>
        </form>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 text-center">
          <span className="block text-2xl mb-2">📧</span>
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            ¡Correo enviado!
          </h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-1">
            Si el correo {email} está registrado, recibirás un enlace de restablecimiento pronto.
          </p>
        </div>
      )}

      <div className="text-center pt-2">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
};
