import { useState, useEffect } from 'react';
import { LOCAL_STOCK_KEY } from '../config';

export const useStockData = () => {
  const [stockData, setStockData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const savedStock = JSON.parse(localStorage.getItem(LOCAL_STOCK_KEY)) || [];
        setStockData(savedStock);
      } catch (error) {
        console.error('Failed to load stock data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const saveStockData = (newData) => {
    setIsLoading(true);
    try {
      localStorage.setItem(LOCAL_STOCK_KEY, JSON.stringify(newData));
      setStockData(newData);
    } catch (error) {
      console.error('Failed to save stock data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return [stockData, saveStockData, isLoading];
};