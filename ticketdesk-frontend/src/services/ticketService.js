import api from './api';

const ticketService = {
  getTickets: async (filters = {}) => {
    const params = {};
    if (filters.status && filters.status !== 'ALL') params.status = filters.status;
    if (filters.priority && filters.priority !== 'ALL') params.priority = filters.priority;
    if (filters.categoryId && filters.categoryId !== 'ALL') params.categoryId = filters.categoryId;
    if (filters.search) params.search = filters.search;

    const response = await api.get('/api/tickets', { params });
    return response.data;
  },

  getTicketById: async (id) => {
    const response = await api.get(`/api/tickets/${id}`);
    return response.data;
  },

  createTicket: async (ticketData) => {
    const response = await api.post('/api/tickets', ticketCreateDto(ticketData));
    return response.data;
  },

  updateTicket: async (id, ticketData) => {
    const response = await api.put(`/api/tickets/${id}`, ticketUpdateDto(ticketData));
    return response.data;
  },

  deleteTicket: async (id) => {
    const response = await api.delete(`/api/tickets/${id}`);
    return response.data;
  }
};

// Help format payloads properly
function ticketCreateDto(data) {
  return {
    title: data.title,
    description: data.description,
    categoryId: data.categoryId,
    priority: data.priority
  };
}

function ticketUpdateDto(data) {
  return {
    title: data.title,
    description: data.description,
    categoryId: data.categoryId,
    priority: data.priority,
    status: data.status
  };
}

export default ticketService;
