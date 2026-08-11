import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import { Person, Email, Lock, AssignmentInd } from '@mui/icons-material';
import authService from '../services/authService';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'ROLE_EMPLOYEE',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { username, fullName, email, password } = formData;

    if (!username || !fullName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (username.length < 4) {
      setError('Username must be at least 4 characters long');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.register(formData);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, letterSpacing: '-0.03em' }}>
            TicketDesk
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join the IT support workflow
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
              Create Account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleRegister}>
              <TextField
                fullWidth
                name="fullName"
                label="Full Name"
                variant="outlined"
                margin="dense"
                value={formData.fullName}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
              />
              <TextField
                fullWidth
                name="email"
                label="Email Address"
                variant="outlined"
                margin="dense"
                value={formData.email}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
              />
              <TextField
                fullWidth
                name="username"
                label="Username"
                variant="outlined"
                margin="dense"
                value={formData.username}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
              />
              <TextField
                fullWidth
                name="password"
                label="Password"
                type="password"
                variant="outlined"
                margin="dense"
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
              />
              <TextField
                select
                fullWidth
                name="role"
                label="User Role"
                variant="outlined"
                margin="dense"
                value={formData.role}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AssignmentInd fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
                sx={{ mb: 3 }}
              >
                <MenuItem value="ROLE_EMPLOYEE">Employee (Submit tickets)</MenuItem>
                <MenuItem value="ROLE_ADMIN">Admin (Solve & manage tickets)</MenuItem>
              </TextField>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
              </Button>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="text"
                  sx={{ p: 0, minWidth: 'auto', fontWeight: 'bold', fontSize: 'inherit' }}
                >
                  Log In
                </Button>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Register;
