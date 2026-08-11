import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

export const PrivateRoute = ({ children, adminOnly = false }) => {
  const authenticated = authService.isAuthenticated();
  const user = authService.getUser();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'ROLE_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const authenticated = authService.isAuthenticated();

  if (authenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
