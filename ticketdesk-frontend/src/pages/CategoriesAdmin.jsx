import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import categoryService from '../services/categoryService';

const CategoriesAdmin = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog controls
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const list = await categoryService.getCategories();
      setCategories(list);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
    setDialogError('');
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setDialogError('Category name is required');
      return;
    }

    setSaving(true);
    setDialogError('');

    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, formData);
      } else {
        await categoryService.createCategory(formData);
      }
      await fetchCategories();
      handleCloseDialog();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save category';
      setDialogError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Any associated tickets will trigger foreign constraint warnings.')) {
      return;
    }

    try {
      await categoryService.deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete category';
      setError(msg);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Service Desk Categories
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure ticket categories used by staff members to route issues.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ borderRadius: 2 }}
            >
              Add Category
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
           <Table>
  <TableHead sx={{ bgcolor: 'action.hover' }}>
    <TableRow>
      <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>
        Category Name
      </TableCell>
      <TableCell sx={{ fontWeight: 'bold', width: '55%' }}>
        Description
      </TableCell>
      <TableCell
        align="right"
        sx={{ fontWeight: 'bold', width: '20%' }}
      >
        Actions
      </TableCell>
    </TableRow>
  </TableHead>

  <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{category.name}</TableCell>
                    <TableCell>{category.description || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpenDialog(category)} color="primary" size="small" sx={{ mr: 1 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteCategory(category.id)} color="error" size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit/Create Modal Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingCategory ? 'Edit Category' : 'Create Category'}
        </DialogTitle>
        <form onSubmit={handleSaveCategory}>
          <DialogContent dividers>
            {dialogError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {dialogError}
              </Alert>
            )}

            <TextField
              fullWidth
              name="name"
              label="Category Name"
              variant="outlined"
              margin="normal"
              value={formData.name}
              onChange={handleInputChange}
              disabled={saving}
              required
            />
            <TextField
              fullWidth
              name="description"
              label="Description"
              variant="outlined"
              margin="normal"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              disabled={saving}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseDialog} color="inherit" disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Category'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CategoriesAdmin;
