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

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor for centralized error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Network error (no response)
        if (!error.response) {
            toast.error('Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.');
            return Promise.reject(error);
        }

        const status = error.response.status;
        const errorData = error.response.data;

        switch (status) {
            case 401:
                // Unauthorized - token expired or invalid
                localStorage.removeItem('token');
                window.location.href = '/login';
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
