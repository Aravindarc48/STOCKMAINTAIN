export const getAvailableQuantity = (product, stockData, salesData) => {
  const totalStock = stockData
    .filter(item => item.productName === product)
    .reduce((acc, cur) => acc + parseInt(cur.quantity), 0);
  
  const totalSold = salesData
    .filter(item => item.productName === product)
    .reduce((acc, cur) => acc + parseInt(cur.quantity), 0);
  
  return totalStock - totalSold;
};

export const getLatestPrice = (product, stockData) => {
  const entries = stockData.filter(item => item.productName === product);
  if (entries.length === 0) return '';
  return entries[entries.length - 1].price;
};

export const getAvailableProducts = (stockData, salesData) => {
  return Array.from(new Set(stockData.map(i => i.productName)))
    .filter(name => getAvailableQuantity(name, stockData, salesData) > 0);
};

export const validateForm = (form, availableQty) => {
  const errors = {};
  
  if (!form.productName) errors.productName = 'Product is required';
  if (!form.quantity || form.quantity <= 0) errors.quantity = 'Valid quantity is required';
  if (!form.price || form.price <= 0) errors.price = 'Valid price is required';
  
  if (form.productName && availableQty !== null && parseInt(form.quantity) > availableQty) {
    errors.quantity = `Only ${availableQty} units available in stock`;
  }
  
  return errors;
};

export const createSaleRecord = (form) => {
  const totalPrice = parseFloat(form.quantity) * parseFloat(form.price);
  return { ...form, totalPrice };
};

export const filterAndSortSales = (sales, filter, sortConfig) => {
  let filtered = sales.filter(sale => 
    sale.productName.toLowerCase().includes(filter.toLowerCase()) ||
    (sale.customerName && sale.customerName.toLowerCase().includes(filter.toLowerCase()))
  );

  return filtered.sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};