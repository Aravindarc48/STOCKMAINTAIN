// src/pages/AnalyticsPage.jsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  useMediaQuery,
  useTheme,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Error Boundary Component
const ErrorBoundary = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error) => {
      console.error('Error caught by boundary:', error);
      setHasError(true);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  return hasError ? fallback : children;
};

// Enhanced safeParse with logging
const safeParse = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) {
    console.warn('Invalid number encountered:', val);
    return 0;
  }
  return num;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#aa46be'];

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 1 }}>
        <Typography variant="subtitle2">{label}</Typography>
        {payload.map((entry, i) => (
          <Typography key={i} sx={{ color: entry.color }}>
            {entry.name}: ₹{entry.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

// Empty State Component
const EmptyState = () => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '60vh',
    textAlign: 'center'
  }}>
    <Typography variant="h6" color="textSecondary" gutterBottom>
      No data available
    </Typography>
    <Typography variant="body1">
      Add stock and sales entries to see analytics
    </Typography>
  </Box>
);

// Chart Components
const SalesVsPurchasesChart = ({ data, colors }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Line type="monotone" dataKey="sales" stroke={colors.sales} name="Sales" />
      <Line type="monotone" dataKey="stock" stroke={colors.stock} name="Stock Purchases" />
    </LineChart>
  </ResponsiveContainer>
);

const MonthlySummaryChart = ({ data, colors }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Bar dataKey="sales" fill={colors.sales} name="Sales" />
      <Bar dataKey="stock" fill={colors.stock} name="Stock Purchases" />
    </BarChart>
  </ResponsiveContainer>
);

const BestSellingChart = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        dataKey="quantity"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius="80%"
        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.fill} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
    </PieChart>
  </ResponsiveContainer>
);

const AnalyticsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoading, setIsLoading] = useState(true);
  const [stocks, setStocks] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    try {
      const stockData = JSON.parse(localStorage.getItem('stock_entries')) || [];
      const salesData = JSON.parse(localStorage.getItem('sales_entries')) || [];
      setStocks(stockData);
      setSales(salesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoized calculations
  const bestSelling = useMemo(() => {
    const map = {};
    sales.forEach(s => {
      map[s.productName] = (map[s.productName] || 0) + safeParse(s.quantity);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity], i) => ({ name, quantity, fill: COLORS[i % COLORS.length] }));
  }, [sales]);

  const monthlySummary = useMemo(() => {
    const months = {};
    [...stocks, ...sales].forEach(entry => {
      const type = stocks.includes(entry) ? 'stock' : 'sale';
      const month = entry.date?.slice(0, 7);
      if (!months[month]) months[month] = { month, stock: 0, sales: 0 };
      months[month][type === 'stock' ? 'stock' : 'sales'] += safeParse(entry.totalPrice);
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
  }, [stocks, sales]);

  const timeSeriesData = useMemo(() => {
    const map = {};
    [...stocks, ...sales].forEach(entry => {
      const type = stocks.includes(entry) ? 'stock' : 'sales';
      const date = entry.date;
      if (!map[date]) map[date] = { date, stock: 0, sales: 0 };
      map[date][type] += safeParse(entry.totalPrice);
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [stocks, sales]);

  const { totalSales, totalStock, profit } = useMemo(() => {
    const salesTotal = sales.reduce((acc, s) => acc + safeParse(s.totalPrice), 0);
    const stockTotal = stocks.reduce((acc, s) => acc + safeParse(s.totalPrice), 0);
    return {
      totalSales: salesTotal,
      totalStock: stockTotal,
      profit: salesTotal - stockTotal
    };
  }, [sales, stocks]);

  const now = new Date().toISOString().slice(0, 16).replace('T', '_');
  const chartHeight = isMobile ? 250 : 300;
  const chartColors = {
    sales: theme.palette.success.main,
    stock: theme.palette.info.main
  };

  const formatCurrency = (val) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const handleExportExcel = useCallback(() => {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(monthlySummary);
      XLSX.utils.book_append_sheet(wb, ws, 'Monthly Summary');
      XLSX.writeFile(wb, `AnalyticsReport_${now}.xlsx`);
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Failed to generate Excel file');
    }
  }, [monthlySummary, now]);

  const handleExportPDF = useCallback(async () => {
    try {
      const input = document.getElementById('analytics-report');
      const canvas = await html2canvas(input, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AnalyticsReport_${now}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to generate PDF');
    }
  }, [now]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!stocks.length && !sales.length) {
    return <EmptyState />;
  }

  return (
    <Box id="analytics-report" sx={{ p: isMobile ? 2 : 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Analytics & Reports
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={isMobile ? 2 : 3} mb={4}>
        {[
          { label: 'Total Sales', value: totalSales, color: 'success.main' },
          { label: 'Total Stock Purchase', value: totalStock, color: 'info.main' },
          { label: 'Profit', value: profit, color: profit >= 0 ? 'success.main' : 'error.main' }
        ].map((item, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper elevation={3} sx={{
              p: 2,
              height: 120,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle2">{item.label}</Typography>
              <Typography variant="h6" fontWeight={700} color={item.color}>
                {formatCurrency(item.value)}
              </Typography>
            </Paper>
          </Grid>
        ))}

        {/* Best Seller */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{
            p: 2,
            height: 120,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Typography variant="subtitle2">Best Seller</Typography>
            <Typography variant="h6" fontWeight={700}>
              {bestSelling[0]?.name || '-'}
            </Typography>
          </Paper>
        </Grid>

        {/* Export Buttons */}
        <Grid item xs={12} sm={6} md={3}>
          <Stack spacing={1} direction="column" justifyContent="center" height="100%">
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleExportExcel}
              aria-label="Download Excel report"
              fullWidth
            >
              Download Excel
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={handleExportPDF}
              aria-label="Download PDF report"
              fullWidth
            >
              Download PDF
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Sales vs Purchases */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, minHeight: 380 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Sales vs Purchases Over Time
            </Typography>
            <Box sx={{ height: chartHeight }}>
              <ErrorBoundary fallback={<Typography color="error">Chart rendering failed</Typography>}>
                <SalesVsPurchasesChart data={timeSeriesData} colors={chartColors} />
              </ErrorBoundary>
            </Box>
          </Paper>
        </Grid>

        {/* Monthly Summary */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, minHeight: 380 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Monthly Summary
            </Typography>
            <Box sx={{ height: chartHeight }}>
              <ErrorBoundary fallback={<Typography color="error">Chart rendering failed</Typography>}>
                <MonthlySummaryChart data={monthlySummary} colors={chartColors} />
              </ErrorBoundary>
            </Box>
          </Paper>
        </Grid>

        {/* Best-selling Products */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, minHeight: 380 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Best-selling Products
            </Typography>
            <Box sx={{ height: chartHeight }}>
              <ErrorBoundary fallback={<Typography color="error">Chart rendering failed</Typography>}>
                <BestSellingChart data={bestSelling} />
              </ErrorBoundary>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;