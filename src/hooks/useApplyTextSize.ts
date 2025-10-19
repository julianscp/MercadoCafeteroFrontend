"use client";

import { useTextSize } from "@/context/TextSizeContext";
import { useEffect, useState } from "react";

export const useApplyTextSize = () => {
  const { textSize } = useTextSize();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Función para aplicar el tamaño de texto
    const applyTextSize = () => {
      const body = document.body;
      
      // Remover todas las clases de tamaño anteriores
      body.classList.remove('text-small', 'text-medium', 'text-large', 'text-extra-large');
      
      // Aplicar la nueva clase
      body.classList.add(`text-${textSize}`);

      // También aplicar estilos inline para asegurar que funcione
      const fontSizeMap = {
        'small': '14px',
        'medium': '16px',
        'large': '18px',
        'extra-large': '20px',
      };

      // Aplicar a elementos específicos que comúnmente contienen texto
      const selectors = [
        'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'a', 'button', 'input', 'textarea', 'label', 'li', 'td', 'th'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const htmlElement = element as HTMLElement;
          if (htmlElement && htmlElement.style) {
            htmlElement.style.fontSize = fontSizeMap[textSize];
          }
        });
      });

      // Aplicar también a elementos con clases específicas de Tailwind
      const tailwindElements = document.querySelectorAll('[class*="text-"]');
      tailwindElements.forEach(element => {
        const htmlElement = element as HTMLElement;
        if (htmlElement && htmlElement.style) {
          htmlElement.style.fontSize = fontSizeMap[textSize];
        }
      });

      console.log(`Tamaño de texto aplicado: ${textSize} (${fontSizeMap[textSize]})`);
    };

    // Aplicar después de un pequeño delay para evitar problemas de hidratación
    const timeoutId = setTimeout(applyTextSize, 100);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
    };
  }, [textSize, isClient]);
};