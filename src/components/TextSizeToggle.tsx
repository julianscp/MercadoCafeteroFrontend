"use client";

import { useTextSize } from "@/context/TextSizeContext";
import { useState, useRef, useEffect } from "react";

export default function TextSizeToggle() {
  const { textSize, setTextSize, isClient } = useTextSize();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const sizes = [
    { key: 'small', label: 'Pequeño', icon: 'A', size: '14px' },
    { key: 'medium', label: 'Mediano', icon: 'A', size: '16px' },
    { key: 'large', label: 'Grande', icon: 'A', size: '18px' },
    { key: 'extra-large', label: 'Muy Grande', icon: 'A', size: '20px' },
  ] as const;

  const currentSize = sizes.find(size => size.key === textSize);

  const handleSizeChange = (newSize: 'small' | 'medium' | 'large' | 'extra-large') => {
    console.log('🔄 Cambiando tamaño a:', newSize);
    setTextSize(newSize);
    setIsOpen(false);
    
    // Feedback visual
    const button = document.querySelector('[data-text-size-button]') as HTMLElement;
    if (button) {
      button.style.transform = 'scale(1.1)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 200);
    }
  };

  // Manejar clics fuera del panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        console.log('🔄 Cerrando panel por clic fuera');
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // No renderizar hasta que estemos en el cliente
  if (!isClient) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[99999] text-size-toggle">
      {/* Botón principal */}
      <button
        data-text-size-button
        onClick={(e) => {
          e.stopPropagation();
          console.log('🔄 Botón clickeado, isOpen:', isOpen);
          setIsOpen(!isOpen);
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        title="Cambiar tamaño del texto"
        aria-label="Cambiar tamaño del texto"
        style={{ zIndex: 99999 }}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Panel de opciones */}
      {isOpen && (
        <div 
          ref={panelRef}
          className="absolute bottom-16 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[200px]"
          style={{ 
            zIndex: 99999,
            position: 'absolute'
          }}
        >
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Tamaño del texto
            </h3>
            <p className="text-xs text-gray-500">
              Actual: {currentSize?.label} ({currentSize?.size})
            </p>
          </div>

          <div className="space-y-2">
            {sizes.map((size) => (
              <div
                key={size.key}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log('🔄 Opción clickeada:', size.key);
                  handleSizeChange(size.key);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-md transition-colors duration-200 cursor-pointer border ${
                  textSize === size.key
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'hover:bg-gray-100 text-gray-700 border-gray-200'
                }`}
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 99999,
                  position: 'relative'
                }}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className="font-bold"
                    style={{ fontSize: size.size }}
                  >
                    {size.icon}
                  </span>
                  <span className="text-sm">{size.label}</span>
                  <span className="text-xs text-gray-400">({size.size})</span>
                </div>
                {textSize === size.key && (
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Información adicional */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Esta configuración se guarda automáticamente
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Los cambios se aplican inmediatamente
            </p>
          </div>
        </div>
      )}
    </div>
  );
}