import axios from '../axios';

export const calendarService = {
    getEvents: async (start?: string, end?: string) => {
        const response = await axios.get('/calendar/events', {
            params: { start, end }
        });
        return response.data;
    },

    createAppointment: async (data: any) => {
        const response = await axios.post('/appointments', data);
        return response.data;
    },

    getAppointment: async (id: number | string) => {
        const response = await axios.get(`/appointments/${id}`);
        return response.data;
    },

    updateAppointment: async (id: number | string, data: any) => {
        const response = await axios.put(`/appointments/${id}`, data);
        return response.data;
    },

    getAll: async (params?: { type?: string; search?: string }) => {
        const response = await axios.get('/appointments', { params });
        return response.data;
    },
    deleteAppointment: async (id: number | string) => {

        const response = await axios.delete(`/appointments/${id}`);
        return response.data;
    }
};
