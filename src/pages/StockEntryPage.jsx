import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  TablePagination,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Undo as UndoIcon,
  Search as SearchIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  FileDownload as FileDownloadIcon,
  Add as AddIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import PropTypes from 'prop-types';

// Constants
const CONSTANTS = {
  LOCAL_STORAGE_KEY: 'stock_entries',
  PRODUCT_OPTIONS_KEY: 'product_options',
  DEFAULT_PRODUCTS: ['Rasam Powder', 'Sambar Powder', 'Chilli Powder'],
  DATE_FORMAT: 'yyyy-MM-dd',
  ROWS_PER_PAGE_OPTIONS: [5, 10, 25]
};

// Custom Hooks
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

const useErrorHandler = () => {
  const [error, setError] = useState(null);
  
  const showError = (message) => {
    setError(message);
  };
  
  const clearError = () => {
    setError(null);
  };
  
  return { error, showError, clearError };
};

// Components
const MemoizedTableRow = React.memo(({ entry, index, onEdit, onDelete }) => (
  <TableRow hover>
    <TableCell>{entry.productName}</TableCell>
    <TableCell align="right">{entry.quantity}</TableCell>
    <TableCell align="right">₹{parseFloat(entry.price).toFixed(2)}</TableCell>
    <TableCell align="right">₹{parseFloat(entry.totalPrice).toFixed(2)}</TableCell>
    <TableCell>{entry.date}</TableCell>
    <TableCell align="right">
      <Tooltip title="Edit">
        <IconButton onClick={() => onEdit(index)} color="primary">
          <EditIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton onClick={() => onDelete(index)} color="error">
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </TableCell>
  </TableRow>
));

MemoizedTableRow.propTypes = {
  entry: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

const ProductForm = ({ onSubmit, onCancel, productOptions, editData }) => {
  const today = new Date().toISOString().split('T')[0];
  const { error, showError, clearError } = useErrorHandler();

  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    price: '',
    date: today
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        productName: editData.productName || '',
        quantity: editData.quantity || '',
        price: editData.price || '',
        date: editData.date || today
      });
    } else {
      setFormData({
        productName: '',
        quantity: '',
        price: '',
        date: today
      });
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.productName) {
      showError('Please select a product');
      return false;
    }
    if (!formData.quantity || isNaN(formData.quantity)) {
      showError('Quantity must be a valid number');
      return false;
    }
    if (parseFloat(formData.quantity) <= 0) {
      showError('Quantity must be positive');
      return false;
    }
    if (!formData.price || isNaN(formData.price)) {
      showError('Price must be a valid number');
      return false;
    }
    if (parseFloat(formData.price) <= 0) {
      showError('Price must be positive');
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    onSubmit({
      productName: formData.productName,
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price),
      date: formData.date || today,
      totalPrice: parseFloat(formData.quantity) * parseFloat(formData.price)
    });

    if (!editData) {
      setFormData({
        productName: '',
        quantity: '',
        price: '',
        date: today
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Product"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            SelectProps={{ native: true }}
            fullWidth
            required
            size="small"
          >
            <option value="">-- Select Product --</option>
            {productOptions.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField
            label="Quantity"
            name="quantity"
            type="number"
            inputProps={{ min: 0, step: 'any' }}
            value={formData.quantity}
            onChange={handleChange}
            fullWidth
            required
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField
            label="Price/Unit"
            name="price"
            type="number"
            inputProps={{ min: 0, step: '0.01' }}
            value={formData.price}
            onChange={handleChange}
            fullWidth
            required
            size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            startIcon={editData ? null : <AddIcon />}
            sx={{ height: '40px' }}
          >
            {editData ? 'Update' : 'Add'}
          </Button>
          {editData && (
            <Button
              onClick={onCancel}
              variant="outlined"
              color="secondary"
              fullWidth
              startIcon={<CancelIcon />}
              sx={{ mt: 1, height: '40px' }}
            >
              Cancel
            </Button>
          )}
        </Grid>
      </Grid>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

ProductForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  productOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  editData: PropTypes.shape({
    productName: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    date: PropTypes.string
  })
};

// Main Component
const StockEntryPage = () => {
  // State management
  const [stockEntries, setStockEntries] = useLocalStorage(CONSTANTS.LOCAL_STORAGE_KEY, []);
  const [productOptions, setProductOptions] = useLocalStorage(
    CONSTANTS.PRODUCT_OPTIONS_KEY, 
    CONSTANTS.DEFAULT_PRODUCTS
  );
  const [newProduct, setNewProduct] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [confirmLargeEntry, setConfirmLargeEntry] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { error, showError, clearError } = useErrorHandler();

  // Filter and sort state
  const [filters, setFilters] = useState({
    productName: '',
    dateFrom: '',
    dateTo: ''
  });
  const [sortConfig, setSortConfig] = useState({ 
    key: 'date', 
    direction: 'desc' 
  });
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10
  });

  // Calculate derived data
  const { totalQuantity, totalValue } = useMemo(() => {
    return stockEntries.reduce((acc, e) => ({
      totalQuantity: acc.totalQuantity + parseFloat(e.quantity || 0),
      totalValue: acc.totalValue + parseFloat(e.totalPrice || 0)
    }), { totalQuantity: 0, totalValue: 0 });
  }, [stockEntries]);

  // Filter, sort and paginate entries
  const processedEntries = useMemo(() => {
    // Filter
    let filtered = stockEntries.filter(entry => {
      const matchesProduct = entry.productName.toLowerCase()
        .includes(filters.productName.toLowerCase());
      const date = new Date(entry.date);
      const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const to = filters.dateTo ? new Date(filters.dateTo) : null;
      
      const matchesDate = (!from || date >= from) && (!to || date <= to);
      
      return matchesProduct && matchesDate;
    });

    // Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [stockEntries, filters, sortConfig]);

  // Pagination
  const paginatedEntries = useMemo(() => {
    return processedEntries.slice(
      pagination.page * pagination.rowsPerPage,
      (pagination.page + 1) * pagination.rowsPerPage
    );
  }, [processedEntries, pagination]);

  // Handlers
  const handleProductSubmit = (data) => {
    clearError();
    
    // Check for duplicates
    const isDuplicate = stockEntries.some(
      (entry, i) =>
        entry.productName === data.productName &&
        entry.date === data.date &&
        (editIndex === null || i !== editIndex)
    );

    if (isDuplicate) {
      showError('A stock entry for this product and date already exists.');
      return;
    }

    // Warn for large entries
    if (data.quantity > 1000 || data.price > 1000) {
      setConfirmLargeEntry({
        data,
        isEdit: editIndex !== null
      });
      return;
    }

    processSubmission(data, editIndex);
  };

  const processSubmission = (newEntry, editIndex) => {
    let updatedEntries = [...stockEntries];
    if (editIndex !== null) {
      updatedEntries[editIndex] = newEntry;
      setEditIndex(null);
    } else {
      updatedEntries.push(newEntry);
    }

    setStockEntries(updatedEntries);
  };

  const handleDelete = () => {
    const deletedItem = stockEntries[confirmDeleteIndex];
    setUndoStack(prev => [...prev, deletedItem]);
    
    const updated = stockEntries.filter((_, i) => i !== confirmDeleteIndex);
    setStockEntries(updated);
    setConfirmDeleteIndex(null);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const lastDeleted = undoStack[undoStack.length - 1];
    setStockEntries(prev => [...prev, lastDeleted]);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(processedEntries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'StockEntries');
    XLSX.writeFile(wb, 'StockEntries.xlsx');
  };

  const handleAddNewProduct = () => {
    const trimmed = newProduct.trim();
    if (!trimmed) {
      showError('Product name cannot be empty');
      return;
    }
    if (productOptions.includes(trimmed)) {
      showError('Product already exists');
      return;
    }

    setProductOptions([...productOptions, trimmed]);
    setNewProduct('');
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination(prev => ({
      ...prev,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  const SortableHeaderCell = ({ name, label }) => (
    <TableCell
      onClick={() => requestSort(name)}
      sx={{ 
        cursor: 'pointer',
        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
      }}
    >
      <Box display="flex" alignItems="center">
        {label}
        {sortConfig.key === name && (
          sortConfig.direction === 'asc' ? 
            <ArrowUpwardIcon fontSize="small" /> : 
            <ArrowDownwardIcon fontSize="small" />
        )}
      </Box>
    </TableCell>
  );

  SortableHeaderCell.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  };

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
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <Typography variant="h4" mb={3} color="primary">
          Stock Entry Management
        </Typography>

        {/* Add New Product */}
        <Grid container spacing={2} alignItems="center" mb={3}>
          <Grid item xs={12} sm={8} md={6}>
            <TextField
              label="Add New Product"
              variant="outlined"
              fullWidth
              size="small"
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleAddNewProduct}
                      color="primary"
                      disabled={!newProduct.trim()}
                    >
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        {/* Product Form */}
        <ProductForm
          onSubmit={handleProductSubmit}
          onCancel={() => setEditIndex(null)}
          productOptions={productOptions}
          editData={editIndex !== null ? stockEntries[editIndex] : null}
        />

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f0f7ff' }}>
          <Typography variant="h6" mb={2} color="primary">
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Search Product"
                variant="outlined"
                fullWidth
                size="small"
                value={filters.productName}
                onChange={(e) => setFilters({...filters, productName: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="From Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="To Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Summary and Actions */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="subtitle1">
              Total Products: <strong>{stockEntries.length}</strong> | 
              Total Quantity: <strong>{totalQuantity.toFixed(2)}</strong> units | 
              Total Value: <strong>₹{totalValue.toFixed(2)}</strong>
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Undo last delete">
              <span>
                <Button
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  variant="outlined"
                  startIcon={<UndoIcon />}
                >
                  Undo
                </Button>
              </span>
            </Tooltip>
            <Button
              onClick={handleExport}
              variant="contained"
              color="primary"
              startIcon={<FileDownloadIcon />}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Stock Entries Table */}
        <Paper sx={{ overflowX: 'auto', mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1976d2' }}>
                <SortableHeaderCell name="productName" label="Product" />
                <SortableHeaderCell name="quantity" label="Quantity" />
                <SortableHeaderCell name="price" label="Price/Unit" />
                <SortableHeaderCell name="totalPrice" label="Total Price" />
                <SortableHeaderCell name="date" label="Date" />
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEntries.length > 0 ? (
                paginatedEntries.map((entry, index) => (
                  <MemoizedTableRow
                    key={`${entry.productName}-${entry.date}-${index}`}
                    entry={entry}
                    index={index}
                    onEdit={setEditIndex}
                    onDelete={setConfirmDeleteIndex}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No stock entries found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={CONSTANTS.ROWS_PER_PAGE_OPTIONS}
                  count={processedEntries.length}
                  rowsPerPage={pagination.rowsPerPage}
                  page={pagination.page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </Paper>
      </Paper>

      {/* Confirmation Dialogs */}
      <Dialog open={confirmDeleteIndex !== null} onClose={() => setConfirmDeleteIndex(null)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this stock entry?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteIndex(null)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmLargeEntry} onClose={() => setConfirmLargeEntry(null)}>
        <DialogTitle>Confirm Large Entry</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You're about to {confirmLargeEntry?.isEdit ? 'update' : 'add'} an entry with:
            <ul>
              <li>Quantity: {confirmLargeEntry?.data.quantity} units</li>
              <li>Price: ₹{confirmLargeEntry?.data.price.toFixed(2)} each</li>
              <li>Total: ₹{confirmLargeEntry?.data.totalPrice.toFixed(2)}</li>
            </ul>
            Are you sure this is correct?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLargeEntry(null)}>Cancel</Button>
          <Button 
            color="primary" 
            onClick={() => {
              processSubmission(confirmLargeEntry.data, confirmLargeEntry.isEdit ? editIndex : null);
              setConfirmLargeEntry(null);
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={clearError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={clearError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StockEntryPage;