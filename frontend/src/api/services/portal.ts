import axios from 'axios';
import { toast } from 'react-hot-toast';
import type {
  PortalCustomer,
  PortalProject,
  PortalInvoice,
  PortalDashboardData,
  PortalMessage,
} from '../../types/portal';

const portalApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json',
  },
  withCredentials: true,
});

portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('portal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error('Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.');
      return Promise.reject(error);
    }

    const status = error.response.status;
    const errorData = error.response.data;
    const requestUrl = String(error.config?.url || '');
    const isPortalLoginPage = window.location.pathname.startsWith('/portal/login');
    const isPortalAuthRequest =
      requestUrl.includes('/portal/auth/login') ||
      requestUrl.includes('/portal/auth/request-link') ||
      requestUrl.includes('/portal/auth/verify-reset-code') ||
      requestUrl.includes('/portal/auth/reset-password');

    switch (status) {
      case 401:
        if (isPortalAuthRequest || isPortalLoginPage) {
          toast.error(errorData?.message || 'Die Anmeldung war nicht erfolgreich.');
          break;
        }

        localStorage.removeItem('portal_token');
        window.location.href = '/portal/login';
        break;
      case 403:
        toast.error(errorData?.message || 'Sie haben keine Berechtigung für diese Aktion.');
        break;
      case 422:
        if (errorData?.errors) {
          const firstError = Object.values(errorData.errors)[0];
          toast.error(Array.isArray(firstError) ? firstError[0] as string : firstError as string);
        } else {
          toast.error(errorData?.message || 'Validierungsfehler.');
        }
        break;
      case 429:
        toast.error('Zu viele Anfragen. Bitte versuchen Sie es später erneut.');
        break;
      case 500:
      case 502:
      case 503:
        toast.error(errorData?.message || 'Serverfehler. Bitte versuchen Sie es später erneut.');
        break;
      default:
        if (errorData?.message) {
          toast.error(errorData.message);
        }
        break;
    }

    return Promise.reject(error);
  }
);

export const portalAuthService = {
  login: async (credentials: { email: string; password: string; account_type?: 'customer' | 'partner' }): Promise<{ token: string; type: string; user: any }> => {
    const response = await portalApi.post('/portal/auth/login', credentials);
    return response.data;
  },

  requestLink: async (email: string, accountType?: 'customer' | 'partner'): Promise<void> => {
    await portalApi.post('/portal/auth/request-link', { email, account_type: accountType });
  },

  verifyResetCode: async (payload: {
    email: string;
    code: string;
    account_type?: 'customer' | 'partner';
  }): Promise<{ message: string }> => {
    const response = await portalApi.post('/portal/auth/verify-reset-code', payload);
    return response.data;
  },

  resetPassword: async (payload: {
    email: string;
    code: string;
    password: string;
    password_confirmation: string;
    account_type?: 'customer' | 'partner';
  }): Promise<{ message: string }> => {
    const response = await portalApi.post('/portal/auth/reset-password', payload);
    return response.data;
  },

  verify: async (token: string): Promise<{ token: string; customer: PortalCustomer }> => {
    const response = await portalApi.get(`/portal/auth/verify/${token}`);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await portalApi.post('/portal/logout');
  },

  me: async (): Promise<PortalCustomer> => {
    const response = await portalApi.get('/portal/me');
    return response.data;
  },
};

export const portalDashboardService = {
  getDashboard: async (): Promise<PortalDashboardData> => {
    const response = await portalApi.get('/portal/dashboard');
    return response.data;
  },
};

export const portalProjectService = {
  getAll: async (): Promise<PortalProject[]> => {
    const response = await portalApi.get('/portal/projects');
    return response.data;
  },

  getById: async (id: number | string): Promise<PortalProject> => {
    const response = await portalApi.get(`/portal/projects/${id}`);
    return response.data;
  },

  sendMessage: async (id: number | string, body: string): Promise<PortalMessage> => {
    const response = await portalApi.post(`/portal/projects/${id}/message`, { content: body });
    return response.data;
  },
};

export const portalInvoiceService = {
  getAll: async (): Promise<PortalInvoice[]> => {
    const response = await portalApi.get('/portal/invoices');
    return response.data;
  },

  download: async (id: number | string): Promise<Blob> => {
    const response = await portalApi.get(`/portal/invoices/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const portalRequestService = {
  create: async (data: FormData): Promise<void> => {
    await portalApi.post('/portal/requests', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const portalProfileService = {
  update: async (data: Partial<Omit<PortalCustomer, 'id' | 'email'>>): Promise<PortalCustomer> => {
    const response = await portalApi.put('/portal/profile', data);
    return response.data;
  },
};

export { portalApi };
