// src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo, Fragment } from 'react';
import {
  Grid,
  Box,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Button,
  Tooltip
} from '@mui/material';
import DashboardCard from '../components/DashboardCard';
import {
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  MonetizationOn as MonetizationOnIcon,
  BarChart as BarChartIcon,
  Store as StoreIcon,
  ProductionQuantityLimits as ProductionQuantityLimitsIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';

// Utility Functions
const safeParse = (value, fallback = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
};

const formatUnits = (value) => `${Math.round(value)} unit${Math.round(value) !== 1 ? 's' : ''}`;

// Main Dashboard Component
const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalStockValue: 0,
    totalSalesValue: 0,
    totalQuantity: 0,
    stockLeftQuantity: 0,
    distinctProducts: 0,
    profit: 0
  });
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch Data
  const fetchData = () => {
    setIsLoading(true);
    setError(null);
    try {
      const stockEntries = JSON.parse(localStorage.getItem('stock_entries')) || [];
      const salesEntries = JSON.parse(localStorage.getItem('sales_entries')) || [];

      const totalStock = stockEntries.reduce((acc, item) => acc + safeParse(item.totalPrice), 0);
      const totalSales = salesEntries.reduce((acc, item) => acc + safeParse(item.totalPrice), 0);
      const quantityTotal = stockEntries.reduce((acc, item) => acc + safeParse(item.quantity), 0);

      const stockMap = {};
      stockEntries.forEach((entry) => {
        const productName = entry.productName || 'Unknown';
        if (!stockMap[productName]) stockMap[productName] = 0;
        stockMap[productName] += safeParse(entry.quantity);
      });

      salesEntries.forEach((entry) => {
        const productName = entry.productName || 'Unknown';
        if (stockMap[productName]) {
          stockMap[productName] -= safeParse(entry.quantity);
        }
      });

      const totalStockLeft = Object.values(stockMap).reduce((acc, qty) => acc + qty, 0);
      const uniqueProducts = new Set(stockEntries.map((e) => e.productName || 'Unknown')).size;

      setMetrics({
        totalStockValue: totalStock,
        totalSalesValue: totalSales,
        totalQuantity: quantityTotal,
        stockLeftQuantity: totalStockLeft,
        distinctProducts: uniqueProducts,
        profit: totalSales - totalStock
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard data error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dashboard Cards
  const cards = useMemo(() => [
    {
      title: 'Total Stock Value',
      value: formatCurrency(metrics.totalStockValue),
      icon: <InventoryIcon fontSize="inherit" />,
      color: theme.palette.primary.main
    },
    {
      title: 'Total Sales Value',
      value: formatCurrency(metrics.totalSalesValue),
      icon: <ShoppingCartIcon fontSize="inherit" />,
      color: theme.palette.warning.main
    },
    {
      title: (
        <Box display="flex" alignItems="center" gap={1}>
          Profit
          <Tooltip title="Sales Value - Stock Cost">
            <InfoIcon fontSize="small" />
          </Tooltip>
        </Box>
      ),
      value: (
        <Box display="flex" alignItems="center" gap={0.5}>
          {formatCurrency(metrics.profit)}
          {metrics.profit >= 0 ? (
            <ArrowUpward fontSize="small" color="success" />
          ) : (
            <ArrowDownward fontSize="small" color="error" />
          )}
        </Box>
      ),
      icon: <MonetizationOnIcon fontSize="inherit" />,
      color: metrics.profit >= 0 ? theme.palette.success.main : theme.palette.error.main
    },
    {
      title: 'Total Stocked Quantity',
      value: formatUnits(metrics.totalQuantity),
      icon: <BarChartIcon fontSize="inherit" />,
      color: theme.palette.secondary.main
    },
    {
      title: 'Stock Remaining',
      value: formatUnits(metrics.stockLeftQuantity),
      icon: <StoreIcon fontSize="inherit" />,
      color: theme.palette.info.main
    },
    {
      title: 'Product Types',
      value: metrics.distinctProducts,
      icon: <ProductionQuantityLimitsIcon fontSize="inherit" />,
      color: theme.palette.error.main
    }
  ], [metrics, theme]);

  // Loading State
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error State
  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="80vh" textAlign="center">
        <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h6" color="error" gutterBottom>{error}</Typography>
        <Typography gutterBottom>Please refresh the page or check your data</Typography>
        <Button onClick={fetchData} variant="contained" color="primary">Retry</Button>
      </Box>
    );
  }

  // Success UI
  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 1 }}>
        Dashboard Overview
      </Typography>
      <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
        Last updated: {lastUpdated?.toLocaleString()}
      </Typography>

      <Grid container spacing={isMobile ? 2 : 3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={typeof card.title === 'string' ? card.title : index}>
            <DashboardCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
            />
          </Grid>
        ))}
      </Grid>

      {/* Optional: Add chart here in future */}
      {/* <Box mt={4}>
        <Typography variant="h6" gutterBottom>Sales vs Stock Chart</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[{ name: 'Stock', value: metrics.totalStockValue }, { name: 'Sales', value: metrics.totalSalesValue }]}>
            ...
          </BarChart>
        </ResponsiveContainer>
      </Box> */}
    </Box>
  );
};

export default Dashboard;
