"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export default function SessionTimeoutWarning() {
  const { showTimeoutWarning, timeLeft, resetInactivityTimer, logout } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showTimeoutWarning) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [showTimeoutWarning]);

  const handleStayLoggedIn = () => {
    resetInactivityTimer();
    setIsVisible(false);
  };

  const handleLogout = () => {
    logout();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-8 w-8 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Sesión por expirar
            </h3>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Tu sesión expirará en <span className="font-semibold text-red-600">{timeLeft}</span> segundos debido a inactividad.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            ¿Deseas continuar con tu sesión?
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cerrar Sesión
          </button>
          <button
            onClick={handleStayLoggedIn}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continuar Sesión
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
