"use client";

import { useApplyTextSize } from "@/hooks/useApplyTextSize";
import { ReactNode, useEffect, useState } from "react";

interface TextSizeWrapperProps {
  children: ReactNode;
}

export default function TextSizeWrapper({ children }: TextSizeWrapperProps) {
  useApplyTextSize();

  // Aplicar también cuando el componente se monta
  useEffect(() => {
    
    const applyGlobalStyles = () => {
      const style = document.createElement('style');
      style.id = 'dynamic-text-size-styles';
      
      // Remover estilos anteriores si existen
      const existingStyle = document.getElementById('dynamic-text-size-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      style.textContent = `
        .text-small * {
          font-size: 14px !important;
        }
        .text-medium * {
          font-size: 16px !important;
        }
        .text-large * {
          font-size: 18px !important;
        }
        .text-extra-large * {
          font-size: 20px !important;
        }
      `;
      
      document.head.appendChild(style);
    };

    // Aplicar estilos después de un delay para evitar problemas de hidratación
    const timeoutId = setTimeout(applyGlobalStyles, 200);

    return () => {
      clearTimeout(timeoutId);
      const style = document.getElementById('dynamic-text-size-styles');
      if (style) {
        style.remove();
      }
    };
  }, []);

  // Renderizar children inmediatamente para evitar problemas de hidratación
  return <>{children}</>;
}
