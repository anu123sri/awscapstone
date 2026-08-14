import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider,
  Chip,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Avatar,
  Paper,
  IconButton,
  List,
  ListItem,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CloudDownload as DownloadIcon,
  CloudUpload as UploadIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import ticketService from '../services/ticketService';
import commentService from '../services/commentService';
import attachmentService from '../services/attachmentService';
import categoryService from '../services/categoryService';
import authService from '../services/authService';

const STATUS_ORDER = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const TicketDetails = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Controls state
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const navigate = useNavigate();
  const currentUser = authService.getUser();
  const isAdmin = currentUser.role === 'ROLE_ADMIN';

  const loadTicketData = async () => {
    try {
      setError('');
      const ticketData = await ticketService.getTicketById(id);
      setTicket(ticketData);

      const commentsList = await commentService.getComments(id);
      setComments(commentsList);

      const files = await attachmentService.getAttachments(id);
      setAttachments(files);

      const cats = await categoryService.getCategories();
      setCategories(cats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      const updateData = {
        title: ticket.title,
        description: ticket.description,
        categoryId: ticket.category.id,
        priority: ticket.priority,
        status: newStatus,
      };
      await ticketService.updateTicket(ticket.id, updateData);
      await loadTicketData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ticket status');
      setLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      await commentService.addComment(ticket.id, newComment);
      setNewComment('');
      // Reload comments
      const list = await commentService.getComments(ticket.id);
      setComments(list);
    } catch (err) {
      setError('Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
      setUploadError('');
    }
  };

  const handleUploadAttachment = async () => {
    if (!attachedFile) return;

    setUploadLoading(true);
    setUploadError('');
    try {
      await attachmentService.uploadAttachment(attachedFile, ticket.id);
      setAttachedFile(null);
      // Reload attachments
      const files = await attachmentService.getAttachments(ticket.id);
      setAttachments(files);
    } catch (err) {
      setUploadError('Failed to upload file attachment');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket permanently?')) {
      return;
    }

    try {
      setLoading(true);
      await ticketService.deleteTicket(ticket.id);
      navigate('/tickets');
    } catch (err) {
      setError('Failed to delete ticket');
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      await attachmentService.downloadAttachment(fileId, fileName);
    } catch (err) {
      setError('Failed to download attachment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'error';
      case 'IN_PROGRESS': return 'warning';
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#3b82f6';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Ticket not found'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/tickets')} variant="outlined">
          Back to Tickets
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      {/* Header Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/tickets')} variant="outlined" sx={{ borderRadius: 2 }}>
          Back to Tickets
        </Button>

        {isAdmin && (
          <Button
            startIcon={<DeleteIcon />}
            onClick={handleDeleteTicket}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2 }}
          >
            Delete Ticket
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Ticket Main Details Panel */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    TICKET ID #{ticket.id}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, letterSpacing: '-0.02em' }}>
                    {ticket.title}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={ticket.status.replace('_', ' ')}
                    color={getStatusColor(ticket.status)}
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Chip
                    label={ticket.priority}
                    sx={{
                      bgcolor: `${getPriorityColor(ticket.priority)}15`,
                      color: getPriorityColor(ticket.priority),
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Problem Description
              </Typography>
              <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: 2, minHeight: 120 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {ticket.description}
                </Typography>
              </Paper>
            </CardContent>
          </Card>

          {/* Comments / Discussion Thread */}
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Discussion Thread
              </Typography>

              {/* Add Comment Input */}
              <Box sx={{ mb: 4 }}>
                <form onSubmit={handlePostComment}>
                  <TextField
                    fullWidth
                    placeholder="Type an update or comment to assist with this issue..."
                    variant="outlined"
                    multiline
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={commentLoading}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      endIcon={<SendIcon />}
                      disabled={commentLoading || !newComment.trim()}
                      sx={{ borderRadius: 2 }}
                    >
                      {commentLoading ? <CircularProgress size={20} color="inherit" /> : 'Post Comment'}
                    </Button>
                  </Box>
                </form>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Comments Timeline */}
              {comments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No comments posted yet.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {comments.map((comment) => (
                    <Box key={comment.id} sx={{ mb: 3, display: 'flex', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                        {comment.user.fullName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {comment.user.fullName}
                          </Typography>
                          <Chip
                            label={comment.user.role === 'ROLE_ADMIN' ? 'Staff' : 'Creator'}
                            size="small"
                            variant="outlined"
                            sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                            {new Date(comment.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                          <Typography variant="body2">{comment.content}</Typography>
                        </Paper>
                      </Box>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar Info & Controls Panel */}
        <Grid item xs={12} md={4}>
          {/* Status Transitions Panel */}
          {isAdmin && (
            <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Update Ticket Status
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant={ticket.status === 'OPEN' ? 'contained' : 'outlined'}
                    color="error"
                    onClick={() => handleStatusChange('OPEN')}
                    disabled={STATUS_ORDER.indexOf('OPEN') <= STATUS_ORDER.indexOf(ticket.status)}
                    sx={{ borderRadius: 2 }}
                  >
                    OPEN
                  </Button>
                  <Button
                    variant={ticket.status === 'IN_PROGRESS' ? 'contained' : 'outlined'}
                    color="warning"
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    disabled={STATUS_ORDER.indexOf('IN_PROGRESS') <= STATUS_ORDER.indexOf(ticket.status)}
                    sx={{ borderRadius: 2 }}
                  >
                    IN PROGRESS
                  </Button>
                  <Button
                    variant={ticket.status === 'RESOLVED' ? 'contained' : 'outlined'}
                    color="success"
                    onClick={() => handleStatusChange('RESOLVED')}
                    disabled={STATUS_ORDER.indexOf('RESOLVED') <= STATUS_ORDER.indexOf(ticket.status)}
                    sx={{ borderRadius: 2 }}
                  >
                    RESOLVED
                  </Button>
                  <Button
                    variant={ticket.status === 'CLOSED' ? 'contained' : 'outlined'}
                    color="inherit"
                    onClick={() => handleStatusChange('CLOSED')}
                    disabled={STATUS_ORDER.indexOf('CLOSED') <= STATUS_ORDER.indexOf(ticket.status)}
                    sx={{ borderRadius: 2 }}
                  >
                    CLOSED
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Ticket Information Panel */}
          <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                Ticket Details
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Category:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{ticket.category.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Priority:</Typography>
                  <Typography variant="body2" sx={{ color: getPriorityColor(ticket.priority), fontWeight: 700 }}>
                    {ticket.priority}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Creator:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{ticket.createdBy.fullName}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Contact Email:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{ticket.createdBy.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Date Raised:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(ticket.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Last Updated:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(ticket.updatedAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Attachments Panel */}
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                File Attachment
              </Typography>

              {attachments.length === 0 ? (
                <Box sx={{ py: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No document attached to this ticket.
                  </Typography>

                  {/* Add attachment option */}
                  {uploadError && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                      {uploadError}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                      size="small"
                      disabled={uploadLoading}
                      sx={{ borderRadius: 2, flexGrow: 1 }}
                    >
                      {attachedFile ? attachedFile.name : 'Select File'}
                      <input type="file" hidden onChange={handleFileChange} />
                    </Button>
                    {attachedFile && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleUploadAttachment}
                        disabled={uploadLoading}
                        sx={{ borderRadius: 2 }}
                      >
                        Upload
                      </Button>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box>
                  {attachments.map((file) => {
                    const isImg = file.fileType.startsWith('image/');
                    return (
                      <Box key={file.id}>
                        {isImg && (
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 0.5,
                              borderRadius: 2,
                              overflow: 'hidden',
                              mb: 2,
                              display: 'flex',
                              justifyContent: 'center',
                              bgcolor: 'action.hover',
                            }}
                          >
                            <img
                              src={`/api/attachments/${file.id}`}
                              alt={file.fileName}
                              style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain' }}
                            />
                          </Paper>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'action.hover', p: 1.5, borderRadius: 2 }}>
                          <Box sx={{ overflow: 'hidden', mr: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, noWrap: true }}>
                              {file.fileName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(file.fileSize / 1024)} KB
                            </Typography>
                          </Box>
                          <IconButton onClick={() => handleDownload(file.id, file.fileName)} color="primary">
                            <DownloadIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TicketDetails;
