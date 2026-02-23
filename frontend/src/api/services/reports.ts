import api from '../axios';

export const reportService = {
    getRevenue: async (params?: any) => {
        const response = await api.get('/reports/revenue', { params });
        return response.data;
    },
    getProfitMargin: async (params?: any) => {
        const response = await api.get('/reports/profit-margin', { params });
        return response.data;
    },
    getLanguageDistribution: async (params?: any) => {
        const response = await api.get('/reports/language-distribution', { params });
        return response.data;
    },
    getKPIs: async (params?: any) => {
        const response = await api.get('/reports/kpis', { params });
        return response.data;
    },
    getSummary: async (params?: any) => {
        const response = await api.get('/reports/summary', { params });
        return response.data;
    },
    getTopCustomers: async (params?: any) => {
        const response = await api.get('/reports/customers', { params });
        return response.data;
    },
    getProjectStatus: async (params?: any) => {
        const response = await api.get('/reports/project-status', { params });
        return response.data;
    },
    getTaxReport: async (params?: any) => {
        const response = await api.get('/reports/tax', { params });
        return response.data;
    },
    getProfitabilityReport: async (params?: any) => {
        const response = await api.get('/reports/profitability', { params });
        return response.data;
    },
};
