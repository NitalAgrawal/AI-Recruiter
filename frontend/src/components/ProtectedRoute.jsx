import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-text-muted text-sm font-semibold uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized for this route, bounce them to their default dashboard
    if (user.role === 'Recruiter') return <Navigate to="/dashboard" replace />;
    if (user.role === 'Candidate') return <Navigate to="/candidate-dashboard" replace />;
    if (user.role === 'Admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
