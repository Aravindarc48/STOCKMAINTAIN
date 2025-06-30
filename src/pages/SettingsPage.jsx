import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  FormGroup,
  FormControlLabel,
  Switch,
  Button,
  Snackbar,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';

// Central default settings
const defaultSettings = {
  currency: '₹ INR',
  defaultUnit: 'kg',
  adminAccess: {
    reports: true,
    analytics: true,
    productManagement: true,
  },
};

const LOCAL_SETTINGS_KEY = 'app_settings';
const LOCAL_UPDATED_KEY = 'settings_updated_time';

const currencies = ['₹ INR', '$ USD', '€ EUR'];
const units = ['kg', 'g', 'box', 'litre', 'pack'];

const SettingsPage = () => {
  const [currency, setCurrency] = useState(defaultSettings.currency);
  const [defaultUnit, setDefaultUnit] = useState(defaultSettings.defaultUnit);
  const [adminAccess, setAdminAccess] = useState(defaultSettings.adminAccess);
  const [lastUpdated, setLastUpdated] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Load saved settings
  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY));
    const savedTime = localStorage.getItem(LOCAL_UPDATED_KEY);

    if (savedSettings) {
      setCurrency(savedSettings.currency || defaultSettings.currency);
      setDefaultUnit(savedSettings.defaultUnit || defaultSettings.defaultUnit);
      setAdminAccess(savedSettings.adminAccess || defaultSettings.adminAccess);
    }

    if (savedTime) {
      setLastUpdated(savedTime);
    }
  }, []);

  const handleSave = () => {
    const settings = { currency, defaultUnit, adminAccess };
    const updatedTime = new Date().toLocaleString();

    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem(LOCAL_UPDATED_KEY, updatedTime);

    setLastUpdated(updatedTime);
    setSnackbarOpen(true);
  };

  const handleReset = () => {
    setCurrency(defaultSettings.currency);
    setDefaultUnit(defaultSettings.defaultUnit);
    setAdminAccess(defaultSettings.adminAccess);
    localStorage.removeItem(LOCAL_SETTINGS_KEY);
    localStorage.removeItem(LOCAL_UPDATED_KEY);
    setLastUpdated('');
  };

  const handleAccessToggle = (key) => {
    setAdminAccess((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Settings</Typography>

      {lastUpdated && (
        <Typography variant="subtitle2" color="text.secondary" mb={2}>
          Last Updated: {lastUpdated}
        </Typography>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Preferences</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)} label="Currency">
                {currencies.map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Default Unit</InputLabel>
              <Select value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value)} label="Default Unit">
                {units.map(u => (
                  <MenuItem key={u} value={u}>{u}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Admin User Controls</Typography>
        <FormGroup>
          <FormControlLabel
            control={<Switch checked={adminAccess.reports} onChange={() => handleAccessToggle('reports')} />}
            label="Access to Reports"
          />
          <FormControlLabel
            control={<Switch checked={adminAccess.analytics} onChange={() => handleAccessToggle('analytics')} />}
            label="Access to Analytics"
          />
          <FormControlLabel
            control={<Switch checked={adminAccess.productManagement} onChange={() => handleAccessToggle('productManagement')} />}
            label="Access to Product Management"
          />
        </FormGroup>
      </Paper>

      <Box display="flex" gap={2}>
        <Button variant="contained" onClick={handleSave}>Save Settings</Button>
        <Button variant="outlined" color="secondary" onClick={handleReset}>Reset to Default</Button>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Settings saved successfully!
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
