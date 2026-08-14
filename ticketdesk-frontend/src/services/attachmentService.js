import api from './api';

const attachmentService = {
  /**
   * Direct Browser Presigned S3 Upload (M5):
   * 1. Requests a presigned S3 PUT URL from API.
   * 2. Browser streams raw file bytes directly to AWS S3 bucket (API never touches bytes).
   * 3. Confirms attachment metadata with backend database.
   */
  uploadAttachment: async (file, ticketId) => {
    try {
      // 1. Request presigned S3 PUT URL
      const presignResponse = await api.post('/api/attachments/presign', {
        ticketId,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
      });

      const { uploadUrl, s3Key } = presignResponse.data;

      // 2. Direct browser upload to AWS S3
      const s3UploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!s3UploadResponse.ok) {
        throw new Error(`S3 direct upload failed with status ${s3UploadResponse.status}`);
      }

      // 3. Confirm attachment record with backend
      const confirmResponse = await api.post('/api/attachments/confirm', {
        ticketId,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        s3Key,
        fileSize: file.size,
      });

      return confirmResponse.data;
    } catch (err) {
      console.warn('Presigned upload failed, trying fallback upload:', err);
      // Fallback multipart upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticketId', ticketId);
      const response = await api.post('/api/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }
  },

  getAttachments: async (ticketId) => {
    const response = await api.get(`/api/attachments/ticket/${ticketId}`);
    return response.data;
  },

  downloadAttachment: async (id, fileName) => {
    const response = await api.get(`/api/attachments/${id}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default attachmentService;
