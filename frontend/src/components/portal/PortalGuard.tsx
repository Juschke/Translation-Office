import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { usePortal } from '../../context/PortalContext';

interface PortalGuardProps {
  children: React.ReactNode;
}

const PortalGuard: React.FC<PortalGuardProps> = ({ children }) => {
  const { customer, isLoading } = usePortal();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spin size="large" tip="Wird geladen..." />
      </div>
    );
  }

  if (!customer) {
    return <Navigate to="/portal/login" replace />;
  }

  return <>{children}</>;
};

export default PortalGuard;
