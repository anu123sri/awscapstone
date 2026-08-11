import api from './api';

const attachmentService = {
  uploadAttachment: async (file, ticketId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ticketId', ticketId);

    const response = await api.post('/api/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAttachments: async (ticketId) => {
    const response = await api.get(`/api/attachments/ticket/${ticketId}`);
    return response.data;
  },

  downloadAttachment: async (id, fileName) => {
    const response = await api.get(`/api/attachments/${id}`, {
      responseType: 'blob', // Important for downloading files
    });

    // Create a temporary link element to trigger browser download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

export default attachmentService;
