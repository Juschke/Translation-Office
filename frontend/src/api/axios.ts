import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Accept': 'application/json',
    },
    withCredentials: true, // Important for CORS with credentials
    // Proper parameter serialization
    paramsSerializer: {
        serialize: (params) => {
            // Filter out React Query internal params
            const cleanParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
                // Skip React Query meta fields
                if (key === 'queryKey' || key === 'signal' || key === 'meta') {
                    return acc;
                }
                // Skip object values that aren't properly serializable
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return acc;
                }
                acc[key] = value;
                return acc;
            }, {} as Record<string, any>);

            return new URLSearchParams(cleanParams).toString();
        }
    }
});

// Note: Token is now sent via HttpOnly cookie automatically
// No need to manually add it to headers
// Axios sends cookies automatically when withCredentials: true

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

// Add response interceptor for centralized error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Network error (no response)
        if (!error.response) {
            toast.error('Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.');
            return Promise.reject(error);
        }

        const status = error.response.status;
        const errorData = error.response.data;
        const originalRequest = error.config;

        switch (status) {
            case 401:
                // Unauthorized - try to refresh token
                if (!isRefreshing) {
                    isRefreshing = true;

                    try {
                        // Attempt token refresh
                        // Cookies (refresh_token) will be sent automatically
                        await api.post('/auth/refresh');
                        onRefreshed('');

                        // Retry original request
                        return api(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed - redirect to login
                        toast.error('Sitzung abgelaufen. Bitte melden Sie sich erneut an.');
                        window.location.href = '/login';
                        return Promise.reject(refreshError);
                    } finally {
                        isRefreshing = false;
                    }
                } else {
                    // Already refreshing - wait and retry
                    return new Promise((resolve) => {
                        addRefreshSubscriber(() => {
                            api(originalRequest).then(resolve).catch((err) => {
                                window.location.href = '/login';
                                return Promise.reject(err);
                            });
                        });
                    });
                }
                break;

            case 403:
                // Forbidden - insufficient permissions
                toast.error(errorData?.message || 'Sie haben keine Berechtigung für diese Aktion.');
                break;

            case 404:
                // Not Found - optional, can be handled per-request
                // toast.error(errorData?.message || 'Ressource nicht gefunden.');
                break;

            case 422:
                // Validation Error
                if (errorData?.errors) {
                    // Laravel validation errors format
                    const firstError = Object.values(errorData.errors)[0];
                    toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
                } else {
                    toast.error(errorData?.message || 'Validierungsfehler.');
                }
                break;

            case 429:
                // Too Many Requests
                toast.error('Zu viele Anfragen. Bitte versuchen Sie es später erneut.');
                break;

            case 500:
            case 502:
            case 503:
                // Server Error
                toast.error(errorData?.message || 'Serverfehler. Bitte versuchen Sie es später erneut.');
                break;

            default:
                // Generic error fallback
                if (errorData?.message) {
                    toast.error(errorData.message);
                }
                break;
        }

        return Promise.reject(error);
    }
);

export default api;
