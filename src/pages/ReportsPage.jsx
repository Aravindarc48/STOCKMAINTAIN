// src/pages/ReportsPage.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Grid, TextField, MenuItem, Button, Paper, Table,
  TableHead, TableRow, TableCell, TableBody, CircularProgress, useTheme,
  useMediaQuery, TableContainer, Alert, Stack
} from '@mui/material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  PictureAsPdf as PdfIcon,
  GridOn as ExcelIcon,
  Refresh as ResetIcon
} from '@mui/icons-material';

// Utility functions
const safeParseFloat = (value, fallback = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const ReportsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockEntries, setStockEntries] = useState([]);
  const [salesEntries, setSalesEntries] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [filterProduct, setFilterProduct] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const stock = JSON.parse(localStorage.getItem('stock_entries')) || [];
        const sales = JSON.parse(localStorage.getItem('sales_entries')) || [];

        const uniqueProducts = Array.from(new Set([
          ...stock.map(s => s.productName || 'Unknown'),
          ...sales.map(s => s.productName || 'Unknown')
        ])).filter(Boolean).sort();

        setStockEntries(stock);
        setSalesEntries(sales);
        setProductOptions(uniqueProducts);
      } catch (err) {
        console.error('Failed to load report data:', err);
        setError('Failed to load report data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const { filteredStock, filteredSales, totals } = useMemo(() => {
    const filterData = (entries) => {
      return entries.filter(entry => {
        const matchProduct = !filterProduct || (entry.productName || 'Unknown') === filterProduct;
        const entryDate = new Date(entry.date || new Date());
        const fromDate = filterFromDate ? new Date(filterFromDate) : null;
        const toDate = filterToDate ? new Date(filterToDate) : null;

        const matchFromDate = !fromDate || entryDate >= fromDate;
        const matchToDate = !toDate || entryDate <= new Date(toDate.setHours(23, 59, 59));

        return matchProduct && matchFromDate && matchToDate;
      });
    };

    const filteredStock = filterData(stockEntries);
    const filteredSales = filterData(salesEntries);

    const totalStock = filteredStock.reduce((sum, e) => sum + safeParseFloat(e.totalPrice), 0);
    const totalSales = filteredSales.reduce((sum, e) => sum + safeParseFloat(e.totalPrice), 0);
    const profit = totalSales - totalStock;

    return {
      filteredStock,
      filteredSales,
      totals: {
        stock: totalStock,
        sales: totalSales,
        profit
      }
    };
  }, [stockEntries, salesEntries, filterProduct, filterFromDate, filterToDate]);

  const handleExportExcel = useCallback(() => {
    try {
      const wb = XLSX.utils.book_new();
      const formatExportData = (data) => data.map(item => ({
        'Product Name': item.productName || 'Unknown',
        'Quantity': safeParseFloat(item.quantity),
        'Price': safeParseFloat(item.price),
        'Total Price': safeParseFloat(item.totalPrice),
        'Date': item.date || 'Unknown'
      }));

      const stockSheet = XLSX.utils.json_to_sheet(formatExportData(filteredStock));
      const salesSheet = XLSX.utils.json_to_sheet(formatExportData(filteredSales));

      XLSX.utils.book_append_sheet(wb, stockSheet, 'Stock Data');
      XLSX.utils.book_append_sheet(wb, salesSheet, 'Sales Data');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Inventory_Report_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Excel export failed:', err);
      setError('Failed to generate Excel file');
    }
  }, [filteredStock, filteredSales]);

  const handleExportPDF = useCallback(async () => {
    try {
      setExporting(true);
      const input = document.getElementById('report-section');
      input.classList.add('exporting-pdf');

      const canvas = await html2canvas(input, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: theme.palette.background.default
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`Inventory_Report_${dateStr}.pdf`);
      input.classList.remove('exporting-pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
      setError('Failed to generate PDF');
    } finally {
      setExporting(false);
    }
  }, [theme]);

  const resetFilters = useCallback(() => {
    setFilterProduct('');
    setFilterFromDate('');
    setFilterToDate('');
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress size={60} /></Box>;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>Refresh Page</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }} gutterBottom>Inventory Reports</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField select label="Filter by Product" fullWidth size="small" value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
              <MenuItem value="">All Products</MenuItem>
              {productOptions.map((product) => (
                <MenuItem key={product} value={product}>{product}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField label="From Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField label="To Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" startIcon={<ResetIcon />} onClick={resetFilters} size="small">Reset</Button>
              <Button variant="contained" startIcon={<ExcelIcon />} onClick={handleExportExcel} size="small">Excel</Button>
              <Button variant="contained" color="secondary" startIcon={<PdfIcon />} onClick={handleExportPDF} disabled={exporting} size="small">{exporting ? 'Generating...' : 'PDF'}</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Report Section */}
      <Box id="report-section" sx={{ mb: 4 }}>
        {/* Stock Entries */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>Stock Entries ({filteredStock.length})</Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Quantity</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStock.length > 0 ? (
                filteredStock.map((entry, index) => (
                  <TableRow key={`stock-${index}`}>
                    <TableCell>{entry.productName || 'Unknown'}</TableCell>
                    <TableCell align="right">{safeParseFloat(entry.quantity)}</TableCell>
                    <TableCell align="right">{formatCurrency(safeParseFloat(entry.price))}</TableCell>
                    <TableCell align="right">{formatCurrency(safeParseFloat(entry.totalPrice))}</TableCell>
                    <TableCell>{entry.date || 'Unknown'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} align="center">No stock entries found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Sales Entries */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>Sales Entries ({filteredSales.length})</Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Quantity</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((entry, index) => (
                  <TableRow key={`sales-${index}`}>
                    <TableCell>{entry.productName || 'Unknown'}</TableCell>
                    <TableCell align="right">{safeParseFloat(entry.quantity)}</TableCell>
                    <TableCell align="right">{formatCurrency(safeParseFloat(entry.price))}</TableCell>
                    <TableCell align="right">{formatCurrency(safeParseFloat(entry.totalPrice))}</TableCell>
                    <TableCell>{entry.date || 'Unknown'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} align="center">No sales entries found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary Section */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>Summary</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, bgcolor: 'primary.light' }}>
              <Typography variant="subtitle1">Total Stock Value</Typography>
              <Typography variant="h5" color="primary.dark">{formatCurrency(totals.stock)}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
              <Typography variant="subtitle1">Total Sales Value</Typography>
              <Typography variant="h5" color="success.dark">{formatCurrency(totals.sales)}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, bgcolor: totals.profit >= 0 ? 'success.light' : 'error.light' }}>
              <Typography variant="subtitle1">Profit/Loss</Typography>
              <Typography variant="h5" color={totals.profit >= 0 ? 'success.dark' : 'error.dark'}>{formatCurrency(totals.profit)}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ReportsPage;
