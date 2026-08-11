import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import FlagIcon from '@mui/icons-material/Flag';
import dashboardService from '../services/dashboardService';
import ticketService from '../services/ticketService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsData = await dashboardService.getStats();
        setStats(statsData);

        const tickets = await ticketService.getTickets({});
        // Get the top 5 most recent tickets
        const sorted = (tickets || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setRecentTickets(sorted.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  const statusCards = [
  {
    title: 'Total Tickets',
    count: stats.totalTickets,
    icon: <ConfirmationNumberIcon />,
    color: '#6366f1',
  },
  {
    title: 'Open',
    count: stats.openTickets,
    icon: <ConfirmationNumberIcon />,
    color: '#ef4444',
  },
  {
    title: 'In Progress',
    count: stats.inProgressTickets,
    icon: <HourglassEmptyIcon />,
    color: '#f59e0b',
  },
  {
    title: 'Resolved',
    count: stats.resolvedTickets,
    icon: <CheckCircleIcon />,
    color: '#10b981',
  },
  {
    title: 'Closed',
    count: stats.closedTickets,
    icon: <LockIcon />,
    color: '#6b7280',
  },
];

  // Helper values for SVGs
  const total = stats.totalTickets || 1; // Avoid divide by zero
  const openPct = (stats.openTickets / total) * 100;
  const progressPct = (stats.inProgressTickets / total) * 100;
  const resolvedPct = (stats.resolvedTickets / total) * 100;
  const closedPct = (stats.closedTickets / total) * 100;

  // Render SVG Donut Chart
  const renderStatusDonut = () => {
    const radius = 60;
    const circ = 2 * Math.PI * radius;
    
    let currentOffset = 0;
    const slices = [
      { count: stats.openTickets, color: '#ef4444', label: 'Open' },
      { count: stats.inProgressTickets, color: '#f59e0b', label: 'In Progress' },
      { count: stats.resolvedTickets, color: '#10b981', label: 'Resolved' },
      { count: stats.closedTickets, color: '#6b7280', label: 'Closed' },
    ].filter(s => s.count > 0);

    if (slices.length === 0) {
      slices.push({ count: 1, color: '#e2e8f0', label: 'No Tickets' });
    }

    const totalTickets = slices.reduce((sum, s) => sum + s.count, 0);

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
        <svg width="180" height="180" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
          {slices.map((slice, index) => {
            const pct = (slice.count / totalTickets) * circ;
            const strokeDashOffset = circ - pct;
            const strokeDashArray = `${pct} ${circ - pct}`;
            const rotation = (currentOffset / circ) * 360;
            currentOffset += pct;

            return (
              <circle
                key={index}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth="18"
                strokeDasharray={strokeDashArray}
                strokeDashoffset="0"
                transform={`rotate(${rotation - 90} 80 80)`}
                style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
              />
            );
          })}
          <text x="80" y="86" textAnchor="middle" fill="currentColor" fontSize="18" fontWeight="bold">
            {stats.totalTickets}
          </text>
          <text x="80" y="102" textAnchor="middle" fill="#94a3b8" fontSize="10">
            Tickets
          </text>
        </svg>

        <Box>
          {slices.map((s, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: s.color }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {s.label}: <strong>{s.count}</strong>
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  // Render SVG Priority Bar Chart
  const renderPriorityBars = () => {
    const priorities = [
      { label: 'Low', count: stats.lowPriority, color: '#10b981' },
      { label: 'Medium', count: stats.mediumPriority, color: '#3b82f6' },
      { label: 'High', count: stats.highPriority, color: '#f59e0b' },
      { label: 'Urgent', count: stats.urgentPriority, color: '#ef4444' },
    ];

    const maxCount = Math.max(...priorities.map(p => p.count), 1);

    return (
      <Box sx={{ width: '100%', py: 1 }}>
        {priorities.map((p, idx) => {
          const pct = (p.count / maxCount) * 100;
          return (
            <Box key={idx} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {p.label}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {p.count}
                </Typography>
              </Box>
              <Box sx={{ width: '100%', height: 10, bgcolor: 'action.hover', borderRadius: 5, overflow: 'hidden' }}>
                <Box
                  sx={{
                    width: `${pct}%`,
                    height: '100%',
                    bgcolor: p.color,
                    borderRadius: 5,
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    );
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

  return (
    <Box>
      {/* 1. Quick Info Counters */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statusCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={2.4} key={idx}>
            <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: `5px solid ${card.color}` }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: '16px !important' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {card.count}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${card.color}15`, color: card.color }}>
                  {card.icon}
                </Avatar>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 2. Visual Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Status Distribution
              </Typography>
              {renderStatusDonut()}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Priority Breakdown
              </Typography>
              {renderPriorityBars()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Recent Activity & Categories */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent Support Tickets
                </Typography>
                <Button onClick={() => navigate('/tickets')} variant="text" size="small" sx={{ fontWeight: 700 }}>
                  View All
                </Button>
              </Box>
              <Divider />
              {recentTickets.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 3, py: 2, textAlign: 'center' }}>
                  No tickets found. Add a ticket to get started!
                </Typography>
              ) : (
                <List sx={{ pt: 1 }}>
                  {recentTickets.map((ticket, index) => (
                    <React.Fragment key={ticket.id}>
                      <ListItem
                        alignItems="flex-start"
                        disablePadding
                        sx={{
                          py: 1.5,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          px: 1,
                          borderRadius: 2,
                        }}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getPriorityColor(ticket.priority), width: 36, height: 36 }}>
                            {ticket.priority.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, noWrap: true }}>
                                {ticket.title}
                              </Typography>
                              <Chip
                                label={ticket.status.replace('_', ' ')}
                                size="small"
                                color={getStatusColor(ticket.status)}
                                sx={{ height: 20, fontSize: '0.675rem', fontWeight: 600 }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                #{ticket.id} • {ticket.category.name} • By {ticket.createdBy.fullName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentTickets.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Ticket Count By Category
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {Object.keys(stats.ticketsByCategory || {}).length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No categories populated with tickets.
                </Typography>
              ) : (
                Object.entries(stats.ticketsByCategory || {}).map(([catName, count], idx) => {
                  const pct = (count / total) * 100;
                  return (
                    <Box key={idx} sx={{ mb: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {catName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {count} ({Math.round(pct)}%)
                        </Typography>
                      </Box>
                      <Box sx={{ width: '100%', height: 6, bgcolor: 'action.hover', borderRadius: 5 }}>
                        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: 'primary.main', borderRadius: 5 }} />
                      </Box>
                    </Box>
                  );
                })
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
