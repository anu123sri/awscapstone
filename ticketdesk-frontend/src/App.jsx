import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getAppTheme } from './theme/theme';

// Page imports
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TicketsList from './pages/TicketsList';
import TicketDetails from './pages/TicketDetails';
import UsersAdmin from './pages/UsersAdmin';
import CategoriesAdmin from './pages/CategoriesAdmin';
import UserProfile from './pages/UserProfile';

// Components
import Layout from './components/Layout';
import { PrivateRoute, PublicRoute } from './components/RouteGuard';

function App() {
  // Theme state: default to system preference, otherwise 'light'
  const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || getSystemTheme();
  });

  useEffect(() => {
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const theme = getAppTheme(themeMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected Routes (Wrapped inside Layout) */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout themeMode={themeMode} toggleTheme={toggleTheme}>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <PrivateRoute>
                <Layout themeMode={themeMode} toggleTheme={toggleTheme}>
                  <TicketsList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <PrivateRoute>
                <Layout themeMode={themeMode} toggleTheme={toggleTheme}>
                  <TicketDetails />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Layout themeMode={themeMode} toggleTheme={toggleTheme}>
                  <UserProfile />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/users"
            element={
              <PrivateRoute adminOnly>
                <Layout themeMode={themeMode} toggleTheme={toggleTheme}>
                  <UsersAdmin />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <PrivateRoute adminOnly>
                <Layout themeMode={themeMode} toggleTheme={toggleTheme}>
                  <CategoriesAdmin />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
