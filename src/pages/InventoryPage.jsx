// src/pages/InventoryPage.jsx
import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
  TableContainer,
  IconButton,
  Tooltip,
  Alert,
  useTheme,
  Chip,
  LinearProgress,
} from '@mui/material';
import * as XLSX from 'xlsx';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';

const InventoryPage = () => {
  const theme = useTheme();
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchInventoryData = () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const stockEntries = JSON.parse(localStorage.getItem('stock_entries')) || [];
      const salesEntries = JSON.parse(localStorage.getItem('sales_entries')) || [];

      const products = Array.from(
        new Set([...stockEntries.map(s => s.productName), ...salesEntries.map(s => s.productName)])
      ).sort((a, b) => a.localeCompare(b));

      const calculatedInventory = products.map(product => {
        const stockForProduct = stockEntries.filter(item => item.productName === product);
        const salesForProduct = salesEntries.filter(item => item.productName === product);

        const openingStock = stockForProduct.reduce((acc, cur) => acc + parseFloat(cur.quantity || 0), 0);
        const soldQuantity = salesForProduct.reduce((acc, cur) => acc + parseFloat(cur.quantity || 0), 0);
        const remainingStock = openingStock - soldQuantity;

        const totalCost = stockForProduct.reduce((acc, cur) => acc + (parseFloat(cur.price || 0) * parseFloat(cur.quantity || 0)), 0);
        const totalSell = salesForProduct.reduce((acc, cur) => acc + (parseFloat(cur.price || 0) * parseFloat(cur.quantity || 0)), 0);

        const avgCostPrice = openingStock > 0 ? totalCost / openingStock : 0;
        const avgSellPrice = soldQuantity > 0 ? totalSell / soldQuantity : 0;
        const profitMargin = avgSellPrice - avgCostPrice;
        const totalProfit = profitMargin * soldQuantity;

        return {
          productName: product,
          openingStock,
          soldQuantity,
          remainingStock,
          avgCostPrice,
          avgSellPrice,
          profitMargin,
          totalProfit,
          stockValue: remainingStock * avgCostPrice,
        };
      });

      setInventory(calculatedInventory);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load inventory data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleExport = () => {
    const formattedData = inventory.map(item => ({
      'Product Name': item.productName,
      'Opening Stock': item.openingStock,
      'Sold Quantity': item.soldQuantity,
      'Remaining Quantity': item.remainingStock,
      'Avg. Cost Price (₹)': item.avgCostPrice.toFixed(2),
      'Avg. Selling Price (₹)': item.avgSellPrice.toFixed(2),
      'Profit Margin (₹)': item.profitMargin.toFixed(2),
      'Total Profit (₹)': (item.profitMargin * item.soldQuantity).toFixed(2),
      'Stock Value (₹)': (item.remainingStock * item.avgCostPrice).toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'InventoryReport');
    XLSX.writeFile(wb, `InventoryReport_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.totalProfit - a.totalProfit);
  }, [inventory, searchTerm]);

  const totals = useMemo(() => {
    return filteredInventory.reduce((acc, item) => ({
      openingStock: acc.openingStock + item.openingStock,
      soldQuantity: acc.soldQuantity + item.soldQuantity,
      remainingStock: acc.remainingStock + item.remainingStock,
      totalProfit: acc.totalProfit + item.totalProfit,
      stockValue: acc.stockValue + item.stockValue,
    }), {
      openingStock: 0,
      soldQuantity: 0,
      remainingStock: 0,
      totalProfit: 0,
      stockValue: 0,
    });
  }, [filteredInventory]);

  const getStockStatus = (quantity) => {
    if (quantity < 0) return { label: 'Negative', color: 'error' };
    if (quantity === 0) return { label: 'Out of Stock', color: 'warning' };
    if (quantity < 5) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" sx={{ color: theme.palette.primary.main }}>
          Inventory Analytics
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {lastUpdated && (
            <Typography variant="caption" color="textSecondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Tooltip title="Refresh data">
            <IconButton onClick={fetchInventoryData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ 
        p: 3, 
        mb: 3,
        backgroundColor: 'white',
        boxShadow: theme.shadows[2]
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <TextField
            label="Search Products"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              endAdornment: searchTerm && (
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  ✕
                </IconButton>
              ),
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleExport}
              startIcon={<span>📊</span>}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Export Report
            </Button>
          </Box>
        </Box>

        <TableContainer sx={{ 
          maxHeight: 'calc(100vh - 300px)',
          overflow: 'auto',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1
        }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.primary.light }}>
                <TableCell sx={{ color: '#0073cf', fontWeight: 'bold' }}>Product</TableCell>
                <TableCell sx={{ color: '#0073cf', fontWeight: 'bold' }} align="right">Opening</TableCell>
                <TableCell sx={{ color: '#0073cf', fontWeight: 'bold' }} align="right">Sold</TableCell>
                <TableCell sx={{ color: '#0073cf', fontWeight: 'bold' }} align="right">Remaining</TableCell>
                <TableCell sx={{ color: '#0073cf', fontWeight: 'bold' }} align="right">Status</TableCell>
                <TableCell sx={{ color: '#0073cf', fontWeight: 'bold' }} align="right">Cost (₹)</TableCell>
                <TableCell sx={{ color: '#0073cf', fontWeight: 'bold' }} align="right">Sell (₹)</TableCell>
                <TableCell sx={{ color: '#0073cf', fontWeight: 'bold' }} align="right">Margin (₹)</TableCell>
                <TableCell sx={{ color: '#0073cf', fontWeight: 'bold' }} align="right">Profit (₹)</TableCell>
                <TableCell sx={{ color: '#0073cf', fontWeight: 'bold' }} align="right">Value (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.length > 0 ? (
                <>
                  {filteredInventory.map((item, index) => {
                    const status = getStockStatus(item.remainingStock);
                    return (
                      <TableRow
                        key={index}
                        hover
                        sx={{
                          '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
                          '&:hover': { backgroundColor: theme.palette.action.selected }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>{item.productName}</TableCell>
                        <TableCell align="right">{item.openingStock}</TableCell>
                        <TableCell align="right">{item.soldQuantity}</TableCell>
                        <TableCell align="right">{item.remainingStock}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={status.label} 
                            size="small" 
                            color={status.color} 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{item.avgCostPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">{item.avgSellPrice.toFixed(2)}</TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            color: item.profitMargin > 0 ? theme.palette.success.main : 
                                  item.profitMargin < 0 ? theme.palette.error.main : 'inherit',
                            fontWeight: 500
                          }}
                        >
                          {item.profitMargin.toFixed(2)}
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            color: item.totalProfit > 0 ? theme.palette.success.main : 
                                  item.totalProfit < 0 ? theme.palette.error.main : 'inherit',
                            fontWeight: 500
                          }}
                        >
                          {item.totalProfit.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">{item.stockValue.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                  
                  <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Totals</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{totals.openingStock}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{totals.soldQuantity}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{totals.remainingStock}</TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        color: totals.totalProfit > 0 ? theme.palette.success.main : 
                              totals.totalProfit < 0 ? theme.palette.error.main : 'inherit',
                        fontWeight: 'bold'
                      }}
                    >
                      {totals.totalProfit.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{totals.stockValue.toFixed(2)}</TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    {searchTerm ? (
                      <Alert severity="info" icon={<InfoIcon />}>
                        No products found matching "{searchTerm}"
                      </Alert>
                    ) : (
                      <Alert severity="info" icon={<InfoIcon />}>
                        No inventory data available
                      </Alert>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: 2,
        mb: 3
      }}>
        <Paper sx={{ 
          p: 2, 
          flex: 1,
          minWidth: 200,
          backgroundColor: theme.palette.success.light
        }}>
          <Typography variant="subtitle2" color="textSecondary">Total Products</Typography>
          <Typography variant="h4">{filteredInventory.length}</Typography>
        </Paper>
        
        <Paper sx={{ 
          p: 2, 
          flex: 1,
          minWidth: 200,
          backgroundColor: theme.palette.info.light
        }}>
          <Typography variant="subtitle2" color="textSecondary">Total Stock Value</Typography>
          <Typography variant="h4">₹{totals.stockValue.toFixed(2)}</Typography>
        </Paper>
        
        <Paper sx={{ 
          p: 2, 
          flex: 1,
          minWidth: 200,
          backgroundColor: totals.totalProfit >= 0 ? theme.palette.success.light : theme.palette.error.light
        }}>
          <Typography variant="subtitle2" color="textSecondary">Total Profit</Typography>
          <Typography variant="h4">₹{totals.totalProfit.toFixed(2)}</Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default InventoryPage;