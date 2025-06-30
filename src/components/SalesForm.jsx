import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  Typography,
} from '@mui/material';

const SalesForm = ({ onSubmit, productOptions }) => {
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    price: '',
    date: today,
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { productName, quantity, price, date } = formData;

    if (!productName || !quantity || !price) {
      alert('Please fill in all fields');
      return;
    }

    if (isNaN(quantity) || quantity <= 0 || isNaN(price) || price <= 0) {
      alert('Quantity and Price must be valid positive numbers');
      return;
    }

    onSubmit({
      productName,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      totalPrice: parseFloat(quantity) * parseFloat(price),
      date: date || today,
    });

    setFormData({
      productName: '',
      quantity: '',
      price: '',
      date: today,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="h6" mb={2}>Sales Entry</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            name="productName"
            label="Select Product"
            value={formData.productName}
            onChange={handleChange}
            fullWidth
            required
          >
            <MenuItem value="">-- Select Product --</MenuItem>
            {productOptions.map((option, idx) => (
              <MenuItem key={idx} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={2}>
          <TextField
            name="quantity"
            label="Quantity"
            type="number"
            inputProps={{ min: 0, step: 'any' }}
            value={formData.quantity}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12} sm={2}>
          <TextField
            name="price"
            label="Price/Unit"
            type="number"
            inputProps={{ min: 0, step: '0.01' }}
            value={formData.price}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12} sm={2}>
          <TextField
            name="date"
            label="Date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={2}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ height: '56px' }}
          >
            Submit
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesForm;
