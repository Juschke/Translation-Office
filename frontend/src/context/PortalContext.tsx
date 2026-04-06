import React, { createContext, useContext, useState, useEffect } from 'react';
import { portalAuthService } from '../api/services/portal';
import type { PortalCustomer } from '../types/portal';

interface PortalContextType {
  customer: PortalCustomer | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<PortalCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCustomer = async () => {
    const token = localStorage.getItem('portal_token');
    if (!token) {
      setCustomer(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await portalAuthService.me();
      setCustomer(data);
    } catch {
      localStorage.removeItem('portal_token');
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('portal_token', token);
    setIsLoading(true);
    try {
      const data = await portalAuthService.me();
      setCustomer(data);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await portalAuthService.logout();
    } catch {
      // ignore errors on logout
    } finally {
      localStorage.removeItem('portal_token');
      setCustomer(null);
      window.location.href = '/portal/login';
    }
  };

  return (
    <PortalContext.Provider value={{ customer, isLoading, login, logout }}>
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = (): PortalContextType => {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used within PortalProvider');
  return ctx;
};

// Inner hook for components that need navigate — used in PortalGuard
export const PortalProviderWithNavigate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <PortalProvider>{children}</PortalProvider>;
};
