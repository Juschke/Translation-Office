import api from '../axios';

export const authService = {
    login: async (credentials: any) => {
        const response = await api.post('/login', credentials);
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
        }
        return response.data;
    },
    register: async (data: any) => {
        const response = await api.post('/register', data);
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
        }
        return response.data;
    },
    logout: async () => {
        await api.post('/logout');
        localStorage.removeItem('token');
    },
    me: async () => {
        const response = await api.get('/user');
        return response.data;
    },
    onboarding: async (data: any) => {
        const response = await api.post('/onboarding', data);
        return response.data;
    },
    updateProfile: async (data: any) => {
        const response = await api.put('/user/profile', data);
        return response.data;
    },
    changePassword: async (data: any) => {
        const response = await api.put('/user/password', data);
        return response.data;
    },
    updateLocale: async (locale: string) => {
        const response = await api.patch('/user/locale', { locale });
        return response.data;
    },
    forgotPassword: async (email: string) => {
        const response = await api.post('/forgot-password', { email });
        return response.data;
    },
    resetPassword: async (data: any) => {
        const response = await api.post('/reset-password', data);
        return response.data;
    },
};

export const twoFactorService = {
    enable: async () => {
        const response = await api.post('/user/two-factor/enable');
        return response.data;
    },
    confirm: async (code: string) => {
        const response = await api.post('/user/two-factor/confirm', { code });
        return response.data;
    },
    disable: async (password: string) => {
        const response = await api.post('/user/two-factor/disable', { password });
        return response.data;
    },
    getRecoveryCodes: async () => {
        const response = await api.get('/user/two-factor/recovery-codes');
        return response.data;
    },
    regenerateRecoveryCodes: async () => {
        const response = await api.post('/user/two-factor/recovery-codes');
        return response.data;
    },
};
