import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import { Save as SaveIcon, AccountBox as UserIcon } from '@mui/icons-material';
import authService from '../services/authService';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        setProfile(data);
        setFormData({
          fullName: data.fullName,
          email: data.email,
          password: '',
          confirmPassword: '',
        });
      } catch (err) {
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const { fullName, email, password, confirmPassword } = formData;

    if (!fullName || !email) {
      setError('Full Name and Email are required');
      return;
    }

    if (password && password.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await authService.updateProfile(profile.id, {
        fullName,
        email,
        password: password || null,
      });
      setSuccess('Profile updated successfully!');
      setProfile(updated);
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      setError(msg);
    } finally {
      setSaving(false);
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
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
      <Grid container spacing={3}>
        {/* Profile Card Summary */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, textAlign: 'center', py: 4 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  mb: 2,
                }}
              >
                {profile.fullName.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {profile.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                @{profile.username}
              </Typography>
              <Chip
                label={profile.role === 'ROLE_ADMIN' ? 'Administrator' : 'Employee'}
                color={profile.role === 'ROLE_ADMIN' ? 'error' : 'success'}
                variant="filled"
                sx={{ fontWeight: 'bold' }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Edit Forms */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Profile Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Update your account details and security settings below.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  {success}
                </Alert>
              )}

              <form onSubmit={handleUpdateProfile}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Username"
                      variant="outlined"
                      value={profile.username}
                      disabled
                      helperText="Username cannot be changed."
                      sx={{ mb: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="fullName"
                      label="Full Name"
                      variant="outlined"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="email"
                      label="Email Address"
                      type="email"
                      variant="outlined"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Security Settings (Change Password)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Leave blank if you do not wish to update your password.
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="password"
                      label="New Password"
                      type="password"
                      variant="outlined"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="confirmPassword"
                      label="Confirm New Password"
                      type="password"
                      variant="outlined"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      disabled={saving}
                      size="large"
                      sx={{ borderRadius: 2 }}
                    >
                      Save Profile Updates
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile;
