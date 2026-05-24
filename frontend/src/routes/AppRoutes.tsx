import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../store/useAuthStore';

// Module Screens (Lazy or direct imports. Direct is easier to set up)
import { Login } from '../modules/auth/Login';
import { RecoverPassword } from '../modules/auth/RecoverPassword';
import { Dashboard } from '../modules/dashboard/Dashboard';
import { DishList } from '../modules/dishes/DishList';
import { TableView } from '../modules/tables/TableView';
import { OrderList } from '../modules/orders/OrderList';
import { KitchenDisplay } from '../modules/kitchen/KitchenDisplay';
import { POSView } from '../modules/pos/POSView';
import { ReportsView } from '../modules/reports/ReportsView';
import { UserCRUD } from '../modules/users/UserCRUD';
import { SettingsView } from '../modules/settings/SettingsView';

export const AppRoutes: React.FC = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
        </div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          Iniciando RestoSuite...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<RecoverPassword />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route element={<DashboardLayout />}>
        {/* Redirect empty path to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dishes" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DishList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tables" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'mozo', 'cajero']}>
              <TableView />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'mozo', 'cajero']}>
              <OrderList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/kitchen" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'cocina']}>
              <KitchenDisplay />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pos" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'cajero']}>
              <POSView />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ReportsView />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserCRUD />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SettingsView />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
