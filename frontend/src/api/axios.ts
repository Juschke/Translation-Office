import axios from 'axios';

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

// Add response interceptor for better error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
