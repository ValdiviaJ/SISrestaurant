import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Utensils, 
  Inbox, 
  ChefHat, 
  DollarSign, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  Sun, 
  Moon,
  ChevronLeft,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useSettingsStore } from '../store/useSettingsStore';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, sidebarOpen, toggleTheme, toggleSidebar, setSidebarOpen, initTheme } = useUIStore();
  const { fetchSettings, settings } = useSettingsStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [fetchSettings, user]);

  // Collapse sidebar by default on mobile screens
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  // Auto-close sidebar on route change for mobile users
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname, setSidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sidebar navigation setup based on role
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Platos & Menú', path: '/dishes', icon: Utensils, roles: ['admin'] },
    { name: 'Mesas', path: '/tables', icon: Inbox, roles: ['admin', 'mozo', 'cajero'] },
    { name: 'Pedidos', path: '/orders', icon: ClipboardList, roles: ['admin', 'mozo', 'cajero'] },
    { name: 'Cocina KDS', path: '/kitchen', icon: ChefHat, roles: ['admin', 'cocina'] },
    { name: 'POS Caja', path: '/pos', icon: DollarSign, roles: ['admin', 'cajero'] },
    { name: 'Reportes', path: '/reports', icon: BarChart3, roles: ['admin'] },
    { name: 'Usuarios', path: '/users', icon: Users, roles: ['admin'] },
    { name: 'Configuración', path: '/settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar Component */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 md:static md:translate-x-0
          ${sidebarOpen ? 'w-64' : 'w-20'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-2xl">🍽️</span>
            {sidebarOpen && (
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 tracking-tight whitespace-nowrap">
                {settings?.name || 'RestoSuite'}
              </span>
            )}
          </div>
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-emerald-500'} />
                {sidebarOpen && <span className="text-sm truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        
        {/* Navbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          
          {/* Left: Hamburger and Search/Context */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 md:hidden"
            >
              <Menu size={20} />
            </button>
            
            <div className="hidden sm:block">
              <span className="text-sm text-slate-400 dark:text-slate-500">Bienvenido de vuelta,</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {user?.name || 'Usuario'}
              </div>
            </div>
          </div>

          {/* Right: Theme Toggle, Notifications, User Badge */}
          <div className="flex items-center gap-4">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
              title="Cambiar Tema"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* User Profile Badge */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-inner">
                {user?.name ? user.name.substring(0,2).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold">{user?.name}</div>
                <div className="text-xs text-emerald-500 font-medium capitalize">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
