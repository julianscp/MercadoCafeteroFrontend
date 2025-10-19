"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type TextSizeContextType = {
  textSize: 'small' | 'medium' | 'large' | 'extra-large';
  setTextSize: (size: 'small' | 'medium' | 'large' | 'extra-large') => void;
  fontSize: string;
  isClient: boolean;
};

const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined);

export const TextSizeProvider = ({ children }: { children: ReactNode }) => {
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large' | 'extra-large'>('medium');
  const [isClient, setIsClient] = useState(false);

  // Mapeo de tamaños a clases CSS
  const fontSizeMap = {
    'small': 'text-sm',
    'medium': 'text-base',
    'large': 'text-lg',
    'extra-large': 'text-xl'
  };

  const fontSize = fontSizeMap[textSize];

  // Cargar preferencia guardada solo en el cliente
  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      const savedSize = localStorage.getItem('textSize') as 'small' | 'medium' | 'large' | 'extra-large';
      if (savedSize && ['small', 'medium', 'large', 'extra-large'].includes(savedSize)) {
        setTextSize(savedSize);
      }
    }
  }, []);

  // Guardar preferencia solo en el cliente
  const handleSetTextSize = (size: 'small' | 'medium' | 'large' | 'extra-large') => {
    setTextSize(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('textSize', size);
    }
  };

  return (
    <TextSizeContext.Provider
      value={{
        textSize,
        setTextSize: handleSetTextSize,
        fontSize,
        isClient,
      }}
    >
      {children}
    </TextSizeContext.Provider>
  );
};

export const useTextSize = (): TextSizeContextType => {
  const ctx = useContext(TextSizeContext);
  if (!ctx) throw new Error("useTextSize must be used inside TextSizeProvider");
  return ctx;
};
