import api from './api';

const commentService = {
  getComments: async (ticketId) => {
    const response = await api.get(`/api/comments/${ticketId}`);
    return response.data;
  },

  addComment: async (ticketId, content) => {
    const response = await api.post('/api/comments', { ticketId, content });
    return response.data;
  }
};

export default commentService;
