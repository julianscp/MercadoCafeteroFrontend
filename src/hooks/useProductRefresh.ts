"use client";

import { useState, useCallback } from 'react';

export const useProductRefresh = () => {
  const [updatedProducts, setUpdatedProducts] = useState<number[]>([]);

  const markProductsAsUpdated = useCallback((productIds: number[]) => {
    setUpdatedProducts(productIds);
    
    // Limpiar indicador después de 3 segundos
    setTimeout(() => {
      setUpdatedProducts([]);
    }, 3000);
  }, []);

  const clearUpdatedProducts = useCallback(() => {
    setUpdatedProducts([]);
  }, []);

  return {
    updatedProducts,
    markProductsAsUpdated,
    clearUpdatedProducts
  };
};
