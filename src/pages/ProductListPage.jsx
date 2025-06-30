// src/pages/ProductListPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TextField,
  Button,
  Grid,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import * as XLSX from 'xlsx';

const LOCAL_PRODUCT_KEY = 'product_list';

const defaultUnits = ['kg', 'g', 'box', 'litre'];
const defaultCategories = ['Spices', 'Instant Mixes'];

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', category: '', unit: '' });
  const [editIndex, setEditIndex] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [categories, setCategories] = useState(defaultCategories);
  const [units, setUnits] = useState(defaultUnits);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(LOCAL_PRODUCT_KEY)) || [];
    setProducts(stored);
  }, []);

  const saveToStorage = (data) => {
    localStorage.setItem(LOCAL_PRODUCT_KEY, JSON.stringify(data));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = () => {
    if (!form.name || !form.unit) {
      alert('Product name and unit are required');
      return;
    }
    if (
      editIndex === null &&
      products.some(p => p.name.toLowerCase() === form.name.toLowerCase())
    ) {
      alert('Product already exists');
      return;
    }
    const updated = [...products];
    if (editIndex !== null) {
      updated[editIndex] = form;
      setEditIndex(null);
    } else {
      updated.push(form);
    }
    setProducts(updated);
    saveToStorage(updated);
    setForm({ name: '', category: '', unit: '' });
    setOpenDialog(false);
  };

  const handleEdit = (index) => {
    setForm(products[index]);
    setEditIndex(index);
    setOpenDialog(true);
  };

  const handleDelete = () => {
    const updated = [...products];
    updated.splice(confirmDeleteIndex, 1);
    setProducts(updated);
    saveToStorage(updated);
    setConfirmDeleteIndex(null);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(products);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'ProductList.xlsx');
  };

  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Box>
      <Typography variant="h4" mb={3}>Product Management</Typography>

      <Grid container spacing={2} alignItems="center" mb={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Search Product"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6} textAlign="right">
          <Button variant="contained" onClick={() => setOpenDialog(true)} sx={{ mr: 2 }}>Add Product</Button>
          <Button variant="outlined" onClick={exportToExcel}>Export to Excel</Button>
        </Grid>
      </Grid>

      <Typography variant="subtitle1">Total Products: {products.length}</Typography>

      <Paper sx={{ overflowX: 'auto', mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((prod, index) => (
              <TableRow key={index} hover>
                <TableCell>{prod.name}</TableCell>
                <TableCell>{prod.category || '-'}</TableCell>
                <TableCell>{prod.unit}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(index)}><EditIcon /></IconButton>
                  <IconButton onClick={() => setConfirmDeleteIndex(index)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{editIndex !== null ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField name="name" label="Product Name" fullWidth value={form.name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                name="category"
                label="Category"
                fullWidth
                value={form.category}
                onChange={handleChange}
              >
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                name="unit"
                label="Unit"
                fullWidth
                value={form.unit}
                onChange={handleChange}
                required
              >
                {units.map(u => (
                  <MenuItem key={u} value={u}>{u}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{editIndex !== null ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDeleteIndex !== null} onClose={() => setConfirmDeleteIndex(null)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this product?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteIndex(null)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductListPage;
