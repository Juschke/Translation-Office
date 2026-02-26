import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const { user, isLoading } = useAuth();
 const location = useLocation();

 if (isLoading) {
 return (
 <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
 </div>
 );
 }

 if (!user) {
 return <Navigate to="/login" state={{ from: location }} replace />;
 }

 // Check for onboarding
 if (!user.tenant_id && location.pathname !== '/onboarding') {
 return <Navigate to="/onboarding" replace />;
 }

 // If has tenant but tries to go to onboarding
 if (user.tenant_id && location.pathname === '/onboarding') {
 return <Navigate to="/" replace />;
 }

 return <>{children}</>;
};

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const { user, isLoading } = useAuth();

 if (isLoading) return null;

 if (user) {
 if (!user.tenant_id) {
 return <Navigate to="/onboarding" replace />;
 }
 return <Navigate to="/" replace />;
 }

 return <>{children}</>;
};

/**
 * Route guard that requires a minimum role level.
 * Redirects to dashboard if the user doesn't have the required role.
 */
export const RoleGuard: React.FC<{ minRole: UserRole; children: React.ReactNode }> = ({ minRole, children }) => {
 const { hasMinRole, isLoading, user } = useAuth();

 if (isLoading) {
 return (
 <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
 </div>
 );
 }

 if (!user || !hasMinRole(minRole)) {
 return <Navigate to="/" replace />;
 }

 return <>{children}</>;
};

/**
 * Route guard for Software Owner (is_admin = true) only.
 * Redirects to dashboard if the user is not an admin.
 */
export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const { user, isLoading } = useAuth();

 if (isLoading) {
 return (
 <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
 </div>
 );
 }

 if (!user || !user.is_admin) {
 return <Navigate to="/" replace />;
 }

 return <>{children}</>;
};
