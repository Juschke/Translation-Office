import api from '../axios';

export const subscriptionService = {
    updatePlan: async (plan: string) => {
        const response = await api.put('/subscription/plan', { plan });
        return response.data;
    },
    updatePaymentMethod: async (data: any) => {
        const response = await api.put('/subscription/payment-method', data);
        return response.data;
    },
    getInvoices: async () => {
        const response = await api.get('/subscription/invoices');
        return response.data;
    },
};
