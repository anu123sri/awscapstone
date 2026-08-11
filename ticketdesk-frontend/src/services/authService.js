import api from './api';

const authService = {
  login: async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    if (response.data && response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('role', response.data.role);
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getUser: () => {
    return {
      username: localStorage.getItem('username'),
      role: localStorage.getItem('role'),
    };
  },

  getProfile: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },

  updateProfile: async (id, profileData) => {
    const response = await api.put(`/api/users/${id}`, profileData);
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/api/users');
    return response.data;
  }
};

export default authService;
