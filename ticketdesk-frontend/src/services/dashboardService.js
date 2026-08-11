import api from './api';

const dashboardService = {
  getStats: async () => {
    const response = await api.get('/api/dashboard');
    return response.data;
  }
};

export default dashboardService;
