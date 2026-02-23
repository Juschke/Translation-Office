import api from '../axios';

export const customerService = {
    getAll: async () => {
        const response = await api.get('/customers');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`/customers/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/customers', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/customers/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/customers/${id}`);
        return response.data;
    },
    bulkUpdate: async (ids: number[], data: any) => {
        const response = await api.post('/customers/bulk-update', { ids, data });
        return response.data;
    },
    bulkDelete: async (ids: number[]) => {
        const response = await api.post('/customers/bulk-delete', { ids });
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/customers/stats');
        return response.data;
    },
    checkDuplicates: async (data: any) => {
        const response = await api.post('/customers/check-duplicates', data);
        return response.data;
    },
};
