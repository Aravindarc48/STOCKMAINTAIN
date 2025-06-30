import { useState, useEffect } from 'react';
import { LOCAL_SALES_KEY } from '../config';

export const useSalesData = () => {
  const [salesData, setSalesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const savedSales = JSON.parse(localStorage.getItem(LOCAL_SALES_KEY)) || [];
        setSalesData(savedSales);
      } catch (error) {
        console.error('Failed to load sales data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const saveSalesData = (newData) => {
    setIsLoading(true);
    try {
      localStorage.setItem(LOCAL_SALES_KEY, JSON.stringify(newData));
      setSalesData(newData);
    } catch (error) {
      console.error('Failed to save sales data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return [salesData, saveSalesData, isLoading];
};