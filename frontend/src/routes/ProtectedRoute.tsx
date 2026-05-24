import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If authenticated but role not allowed, redirect to main entry dashboard
    // Wait, let's see. If they are a chef, they don't have access to dashboard, they should go to /kitchen
    if (user.role === 'cocina') {
      return <Navigate to="/kitchen" replace />;
    }
    if (user.role === 'mozo') {
      return <Navigate to="/tables" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
