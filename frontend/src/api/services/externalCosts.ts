import api from '../axios';

export interface ExternalCost {
    id: number;
    tenant_id: number;
    project_id?: number;
    description: string;
    cost_type?: string;
    amount_cents: number;
    amount: number; // Decimal representation
    date: string;
    supplier?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    project?: {
        id: number;
        project_name: string;
        project_number: string;
    };
}

export interface ExternalCostStats {
    total_costs: number;
    total_items: number;
    costs_by_type: Array<{
        cost_type: string;
        total: number;
        count: number;
    }>;
    period: {
        start: string;
        end: string;
    };
}

export interface CreateExternalCostData {
    project_id?: number;
    description: string;
    cost_type?: string;
    amount: number;
    date: string;
    supplier?: string;
    notes?: string;
}

export const externalCostService = {
    getAll: async (params?: {
        start_date?: string;
        end_date?: string;
        project_id?: number;
        cost_type?: string;
    }) => {
        const response = await api.get('/external-costs', { params });
        return response.data as ExternalCost[];
    },

    getById: async (id: number) => {
        const response = await api.get(`/external-costs/${id}`);
        return response.data as ExternalCost;
    },

    create: async (data: CreateExternalCostData) => {
        const response = await api.post('/external-costs', data);
        return response.data as ExternalCost;
    },

    update: async (id: number, data: Partial<CreateExternalCostData>) => {
        const response = await api.put(`/external-costs/${id}`, data);
        return response.data as ExternalCost;
    },

    delete: async (id: number) => {
        const response = await api.delete(`/external-costs/${id}`);
        return response.data;
    },

    getStats: async (params?: { start_date?: string; end_date?: string }) => {
        const response = await api.get('/external-costs/stats', { params });
        return response.data as ExternalCostStats;
    },
};
