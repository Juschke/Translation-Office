import api from '../axios';

export const userService = {
    getAll: async () => {
        const response = await api.get('/users');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/users', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
};

export const dashboardService = {
    getStats: async (params?: any) => {
        const response = await api.get('/dashboard/stats', { params });
        return response.data;
    },
};
