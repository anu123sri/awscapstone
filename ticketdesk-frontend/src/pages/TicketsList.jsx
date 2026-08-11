import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import ticketService from '../services/ticketService';
import categoryService from '../services/categoryService';
import attachmentService from '../services/attachmentService';
import authService from '../services/authService';

const TicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = authService.getUser();

  // Filters state
  const [filters, setFilters] = useState({
    status: 'ALL',
    priority: 'ALL',
    categoryId: 'ALL',
    search: '',
  });

  // Create Ticket Form State
  const [openCreate, setOpenCreate] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    categoryId: '',
    priority: 'LOW',
  });
  const [attachedFile, setAttachedFile] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const navigate = useNavigate();

  const fetchTickets = async (currentFilters = filters) => {
    try {
      const list = await ticketService.getTickets(currentFilters);
      setTickets(list);
    } catch (err) {
      setError('Failed to fetch tickets');
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const cats = await categoryService.getCategories();
        setCategories(cats);
        await fetchTickets();
      } catch (err) {
        setError('Failed to load tickets page data');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleFilterChange = (e) => {
    const updatedFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(updatedFilters);
    fetchTickets(updatedFilters);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchTickets();
    }
  };

  const handleOpenCreate = () => {
    setNewTicket({
      title: '',
      description: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      priority: 'LOW',
    });
    setAttachedFile(null);
    setCreateError('');
    setOpenCreate(true);
  };

  const handleCloseCreate = () => {
    setOpenCreate(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTicket.title.trim() || !newTicket.description.trim() || !newTicket.categoryId) {
      setCreateError('Please fill in all required fields');
      return;
    }

    setCreateLoading(true);
    setCreateError('');

    try {
      // 1. Create the Ticket
      const ticket = await ticketService.createTicket(newTicket);

      // 2. Upload file if attached
      if (attachedFile) {
        await attachmentService.uploadAttachment(attachedFile, ticket.id);
      }

      await fetchTickets();
      handleCloseCreate();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to raise ticket';
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
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

  return (
    <Box>
      {/* Search and Filters Header */}
      <Card variant="outlined" sx={{ borderRadius: 3, mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search Bar */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                name="search"
                label="Search Tickets"
                variant="outlined"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyPress={handleSearchKeyPress}
                placeholder="Press Enter to search..."
                InputProps={{
                  endAdornment: (
                    <Button onClick={() => fetchTickets()} sx={{ minWidth: 'auto', p: 0.5 }}>
                      <SearchIcon />
                    </Button>
                  ),
                }}
              />
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} sm={4} md={2}>
              <TextField
                select
                fullWidth
                name="status"
                label="Status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
                <MenuItem value="CLOSED">Closed</MenuItem>
              </TextField>
            </Grid>

            {/* Priority Filter */}
            <Grid item xs={12} sm={4} md={2}>
              <TextField
                select
                fullWidth
                name="priority"
                label="Priority"
                value={filters.priority}
                onChange={handleFilterChange}
              >
                <MenuItem value="ALL">All Priorities</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
              </TextField>
            </Grid>

            {/* Category Filter */}
            <Grid item xs={12} sm={4} md={2}>
              <TextField
                select
                fullWidth
                name="categoryId"
                label="Category"
                value={filters.categoryId}
                onChange={handleFilterChange}
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Raise Ticket Button (Employee Only) */}
            <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{ borderRadius: 2, height: 56, fontWeight: 'bold' }}
              >
                Raise Ticket
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tickets List Table */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table>
  <TableHead sx={{ bgcolor: 'action.hover' }}>
    <TableRow>
      <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
      <TableCell sx={{ fontWeight: 'bold' }}>Ticket Title</TableCell>
      <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
      <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
      <TableCell sx={{ fontWeight: 'bold' }}>Raised By</TableCell>
      <TableCell sx={{ fontWeight: 'bold' }}>Date Created</TableCell>
      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
    </TableRow>
  </TableHead>

  <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No support tickets match the current search filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id} hover>
                      <TableCell>#{ticket.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{ticket.title}</TableCell>
                      <TableCell>{ticket.category.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(ticket.status)}
                          sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: getPriorityColor(ticket.priority), fontWeight: 700 }}>
                          {ticket.priority}
                        </Typography>
                      </TableCell>
                      <TableCell>{ticket.createdBy.fullName}</TableCell>
                      <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          sx={{ borderRadius: 2 }}
                        >
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Raise Ticket Dialog Modal */}
      <Dialog open={openCreate} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Raise Support Ticket</DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent dividers>
            {createError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {createError}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Ticket Summary / Title"
              placeholder="e.g. VPN error 403 or monitor flickering"
              variant="outlined"
              margin="normal"
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              disabled={createLoading}
              required
            />

            <TextField
              fullWidth
              label="Detailed Description"
              placeholder="Describe the issue you are experiencing, including any steps to reproduce or troubleshooting steps you have taken..."
              variant="outlined"
              margin="normal"
              multiline
              rows={4}
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              disabled={createLoading}
              required
            />

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={newTicket.categoryId}
                  onChange={(e) => setNewTicket({ ...newTicket, categoryId: e.target.value })}
                  disabled={createLoading}
                  required
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Priority Level"
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  disabled={createLoading}
                  required
                >
                  <MenuItem value="LOW">Low Priority</MenuItem>
                  <MenuItem value="MEDIUM">Medium Priority</MenuItem>
                  <MenuItem value="HIGH">High Priority</MenuItem>
                  <MenuItem value="URGENT">Urgent Priority</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Document/Screenshot Attachment Input */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Attach Document or Screenshot (Optional)
              </Typography>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: attachedFile ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'action.hover',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' },
                }}
                component="label"
              >
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  disabled={createLoading}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <UploadIcon color={attachedFile ? 'primary' : 'action'} sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="body2">
                  {attachedFile ? `Selected: ${attachedFile.name}` : 'Click to drag & drop or browse a screenshot/document'}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseCreate} color="inherit" disabled={createLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createLoading}>
              {createLoading ? <CircularProgress size={24} color="inherit" /> : 'Raise Ticket'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default TicketsList;
