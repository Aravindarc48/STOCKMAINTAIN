// src/pages/StockSalesPage.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useTheme,
  TableFooter,
  TablePagination,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import * as XLSX from 'xlsx';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

const LOCAL_SALES_KEY = 'sales_entries';
const LOCAL_STOCK_KEY = 'stock_entries';

const StockSalesPage = () => {
  const theme = useTheme();
  const [salesData, setSalesData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [error, setError] = useState('');
  const [availableQty, setAvailableQty] = useState(null);
  const [form, setForm] = useState({
    productName: '',
    quantity: '',
    price: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [editIndex, setEditIndex] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const savedSales = JSON.parse(localStorage.getItem(LOCAL_SALES_KEY)) || [];
    const savedStock = JSON.parse(localStorage.getItem(LOCAL_STOCK_KEY)) || [];
    setSalesData(savedSales);
    setStockData(savedStock);
  }, []);

  const getAvailableQuantity = (product) => {
    const totalStock = stockData
      .filter(item => item.productName === product)
      .reduce((acc, cur) => acc + parseInt(cur.quantity), 0);
    const totalSold = salesData
      .filter(item => item.productName === product)
      .reduce((acc, cur) => acc + parseInt(cur.quantity), 0);
    return totalStock - totalSold;
  };

  const getLatestPrice = (product) => {
    const entries = stockData.filter(item => item.productName === product);
    if (entries.length === 0) return '';
    return entries[entries.length - 1].price;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...form, [name]: value };
    
    if (name === 'productName') {
      updatedForm.price = getLatestPrice(value);
      setAvailableQty(getAvailableQuantity(value));
    } else if (name === 'quantity' || name === 'price') {
      // Ensure numeric values
      updatedForm[name] = value.replace(/[^0-9.]/g, '');
    }
    
    setForm(updatedForm);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate available quantity including the quantity being edited (if any)
    const availableQty = getAvailableQuantity(form.productName) + 
      (editIndex !== null ? parseInt(salesData[editIndex].quantity) : 0);
    
    if (parseInt(form.quantity) > availableQty) {
      setError(`Only ${availableQty} units available in stock.`);
      return;
    }

    if (!form.price || parseFloat(form.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    const totalPrice = parseFloat(form.quantity) * parseFloat(form.price);
    const newSale = { 
      ...form, 
      totalPrice,
      price: parseFloat(form.price).toFixed(2),
      quantity: parseInt(form.quantity)
    };
    
    const updatedSales = [...salesData];
    if (editIndex !== null) {
      updatedSales[editIndex] = newSale;
    } else {
      updatedSales.push(newSale);
    }
    
    setSalesData(updatedSales);
    localStorage.setItem(LOCAL_SALES_KEY, JSON.stringify(updatedSales));
    resetForm();
  };

  const resetForm = () => {
    setForm({
      productName: '',
      quantity: '',
      price: '',
      customerName: '',
      date: new Date().toISOString().split('T')[0],
    });
    setEditIndex(null);
    setAvailableQty(null);
    setError('');
  };

  const handleEdit = (index) => {
    const item = salesData[index];
    setForm({ 
      ...item,
      quantity: item.quantity.toString(),
      price: parseFloat(item.price).toString()
    });
    setEditIndex(index);
    setAvailableQty(getAvailableQuantity(item.productName) + parseInt(item.quantity));
  };

  const handleDelete = (index) => {
    setDeleteIndex(index);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    const updated = [...salesData];
    updated.splice(deleteIndex, 1);
    setSalesData(updated);
    localStorage.setItem(LOCAL_SALES_KEY, JSON.stringify(updated));
    setConfirmOpen(false);
    setDeleteIndex(null);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(salesData.map(sale => ({
      ...sale,
      totalPrice: sale.totalPrice.toFixed(2)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SalesReport');
    XLSX.writeFile(wb, 'SalesReport.xlsx');
  };

  const availableProducts = useMemo(() => {
    return Array.from(new Set(stockData.map(i => i.productName)))
      .filter(name => getAvailableQuantity(name) > 0)
      .sort();
  }, [stockData, salesData]);

  const filteredSales = salesData.filter(sale => 
    sale.productName.toLowerCase().includes(filter.toLowerCase()) ||
    (sale.customerName && sale.customerName.toLowerCase().includes(filter.toLowerCase()))
  );

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredSales.length) : 0;

  return (
    <Box sx={{ 
      p: 3, 
      backgroundColor: '#f5f9ff',
      minHeight: '100vh'
    }}>
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        backgroundColor: 'white',
        boxShadow: theme.shadows[3]
      }}>
        <Typography variant="h4" mb={3} sx={{ 
          color: theme.palette.primary.main,
          fontWeight: 'bold'
        }}>
          Stock Sales Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {form.productName && availableQty !== null && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Available Stock: {availableQty} units
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Product"
                name="productName"
                value={form.productName}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                size="small"
              >
                {availableProducts.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                label="Quantity Sold"
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                size="small"
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                label="Price per Unit"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                size="small"
                inputProps={{ step: "0.01", min: "0.01" }}
                InputProps={{
                  startAdornment: <CurrencyRupeeIcon fontSize="small" sx={{ mr: 0.5 }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Customer Name (optional)"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Sale Date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={!form.productName || !form.quantity || !form.price}
                  sx={{ px: 4 }}
                >
                  {editIndex !== null ? 'Update Sale' : 'Record Sale'}
                </Button>
                {editIndex !== null && (
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    onClick={resetForm}
                  >
                    Cancel Edit
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Paper sx={{ 
        p: 3,
        backgroundColor: 'white',
        boxShadow: theme.shadows[3]
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <Typography variant="h5" sx={{ color: theme.palette.primary.main }}>
            Sales Records
          </Typography>
          <TextField 
            size="small"
            placeholder="Search by Product or Customer"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            variant="outlined"
            sx={{ width: 300 }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleExport}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Export to Excel
          </Button>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ 
                backgroundColor: theme.palette.primary.main,
                '& th': {
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  background: "#0073cf",
                }
              }}>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price/Unit</TableCell>
                <TableCell>Total Price</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : filteredSales
              ).map((entry, index) => (
                <TableRow key={index} hover>
                  <TableCell>{entry.productName}</TableCell>
                  <TableCell>{entry.quantity}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CurrencyRupeeIcon fontSize="small" sx={{ mr: 0.5 }} />
                      {parseFloat(entry.price).toFixed(2)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CurrencyRupeeIcon fontSize="small" sx={{ mr: 0.5 }} />
                      {entry.totalPrice?.toFixed(2)}
                    </Box>
                  </TableCell>
                  <TableCell>{entry.customerName || '-'}</TableCell>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton 
                        onClick={() => handleEdit(page * rowsPerPage + index)}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        onClick={() => handleDelete(page * rowsPerPage + index)}
                        sx={{ color: theme.palette.error.main }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={7} />
                </TableRow>
              )}
              {filteredSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No sales records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                  colSpan={7}
                  count={filteredSales.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      mt: 1,
                      mb: 1
                    }
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </Box>
      </Paper>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ color: theme.palette.primary.main }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          Are you sure you want to delete this sale entry?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmDelete} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockSalesPage;