export const LOCAL_SALES_KEY = 'sales_entries';
export const LOCAL_STOCK_KEY = 'stock_entries';

export const initialFormState = {
  productName: '',
  quantity: '',
  price: '',
  customerName: '',
  date: new Date().toISOString().split('T')[0],
};