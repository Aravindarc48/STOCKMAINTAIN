import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box, Toolbar } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StockEntryPage = lazy(() => import('./pages/StockEntryPage'));
const StockSalesPage = lazy(() => import('./pages/StockSalesPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const App = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          {/* Sidebar */}
          <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
          
          {/* Main Content */}
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Navbar onMenuClick={handleDrawerToggle} />
            <Toolbar />
            <Box sx={{ p: 3 }}>
              <ErrorBoundary>
                <Suspense fallback={<div>Loading...</div>}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/stock-entry" element={<StockEntryPage />} />
                    <Route path="/stock-sales" element={<StockSalesPage />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/products-list" element={<ProductListPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<div>404 - Page Not Found</div>} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </Box>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
