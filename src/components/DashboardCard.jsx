import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';

/**
 * DashboardCard Component
 *
 * Props:
 * - title: string (e.g., "Total Sales")
 * - value: string or number (e.g., "₹50,000")
 * - icon: JSX element (e.g., <ShoppingCartIcon />)
 * - color: string (optional - default: "#1976d2")
 */

const DashboardCard = ({ title, value, icon, color = '#1976d2' }) => {
  return (
    <Card
      sx={{
        backgroundColor: '#fff',
        color: '#333',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        height: '100%', // Equal height for consistency
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'transform 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" height="100%">
          {/* Icon Avatar */}
          <Avatar
            sx={{
              bgcolor: color,
              width: 56,
              height: 56,
              fontSize: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            {icon}
          </Avatar>

          {/* Text Section */}
          <Box textAlign="right">
            <Typography
              variant="subtitle2"
              fontWeight="600"
              color="text.secondary"
              sx={{ fontSize: '0.95rem' }}
            >
              {title}
            </Typography>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ mt: 1, fontSize: { xs: '1.4rem', md: '1.8rem' } }}
            >
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
