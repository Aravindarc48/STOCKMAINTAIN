// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = () => {
    if (!form.email || !form.password || !form.name) {
      setError('All fields are required');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(u => u.email === form.email)) {
      setError('User already exists');
      return;
    }

    const updatedUsers = [...users, form];
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setSuccess('User registered successfully!');
    setTimeout(() => navigate('/login'), 1000);
  };

  return (
    <Box maxWidth={400} mx="auto" mt={10}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" mb={2}>Register New Admin</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <TextField label="Name" name="name" fullWidth margin="normal" onChange={handleChange} />
        <TextField label="Email" name="email" type="email" fullWidth margin="normal" onChange={handleChange} />
        <TextField label="Password" name="password" type="password" fullWidth margin="normal" onChange={handleChange} />
        <Button variant="contained" fullWidth onClick={handleRegister}>Register</Button>
        <Button fullWidth onClick={() => navigate('/login')} sx={{ mt: 1 }}>Back to Login</Button>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
