import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Typography,
  TableSortLabel,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';

const SalesTable = ({
  sales,
  onEdit,
  onDelete,
  filter,
  onFilterChange,
  onExport,
  sortConfig,
  onSort,
}) => {
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(sales);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SalesReport');
    XLSX.writeFile(wb, 'SalesReport.xlsx');
    onExport();
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Sales Records</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search by Product or Customer"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            sx={{ width: 250 }}
          />
          
          <Button variant="outlined" onClick={handleExport}>
            Export to Excel
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table stickyHeader aria-label="sales records table">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'productName'}
                  direction={sortConfig.key === 'productName' ? sortConfig.direction : 'asc'}
                  onClick={() => onSort('productName')}
                >
                  Product
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortConfig.key === 'quantity'}
                  direction={sortConfig.key === 'quantity' ? sortConfig.direction : 'asc'}
                  onClick={() => onSort('quantity')}
                >
                  Quantity
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Price/Unit</TableCell>
              <TableCell align="right">Total Price</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'date'}
                  direction={sortConfig.key === 'date' ? sortConfig.direction : 'desc'}
                  onClick={() => onSort('date')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No sales records found
                </TableCell>
              </TableRow>
            ) : (
              sales.map((entry, index) => (
                <TableRow key={index} hover>
                  <TableCell>{entry.productName}</TableCell>
                  <TableCell align="right">{entry.quantity}</TableCell>
                  <TableCell align="right">{parseFloat(entry.price).toFixed(2)}</TableCell>
                  <TableCell align="right">{entry.totalPrice?.toFixed(2)}</TableCell>
                  <TableCell>{entry.customerName || '-'}</TableCell>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => onEdit(index)} aria-label="edit">
                        <EditIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => onDelete(index)} aria-label="delete">
                        <DeleteIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SalesTable;