"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

function VerificandoPagoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [status, setStatus] = useState<'checking' | 'success' | 'error' | 'pending'>('checking');
  const [message, setMessage] = useState('Verificando tu pago con Mercado Pago...');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 6;

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      setMessage('No se encontró el número de orden');
      return;
    }

    checkPayment();
  }, [orderId]);

  const checkPayment = async () => {
    if (attempts >= maxAttempts) {
      setStatus('pending');
      setMessage('El pago está siendo procesado. Puedes verificarlo desde tu historial de pedidos.');
      setTimeout(() => {
        router.push('/cliente/carrito');
      }, 5000);
      return;
    }

    try {
      console.log(`🔍 Verificando pago (intento ${attempts + 1}/${maxAttempts})...`);
      setAttempts(prev => prev + 1);

      const response = await api.get(`/payments/check/${orderId}`);
      const data = response.data as { 
        status: string; 
        orderId?: number; 
        message?: string; 
        paymentId?: string;
      };

      console.log('📊 Respuesta:', data);

      if (data.status === 'completado') {
        setStatus('success');
        setMessage('¡Pago confirmado exitosamente! ✅');
        
        // Redirigir al historial después de 2 segundos
        setTimeout(() => {
          router.push('/cliente/carrito');
        }, 2000);
        
      } else if (data.status === 'cancelado') {
        setStatus('error');
        setMessage('El pago fue rechazado por Mercado Pago');
        
        setTimeout(() => {
          router.push('/cliente/carrito');
        }, 3000);
        
      } else if (data.status === 'pendiente') {
        // Actualizar mensaje con el número de intento
        setMessage(`Verificando con Mercado Pago... (${attempts + 1}/${maxAttempts})`);
        
        // Reintentar en 3 segundos
        setTimeout(checkPayment, 3000);
      }
    } catch (error: any) {
      console.error('❌ Error verificando pago:', error);
      
      // Si es el último intento, mostrar error
      if (attempts >= maxAttempts - 1) {
        setStatus('error');
        setMessage('No pudimos verificar tu pago. Por favor revisa tu historial de pedidos.');
        
        setTimeout(() => {
          router.push('/cliente/carrito');
        }, 3000);
      } else {
        // Reintentar
        setMessage(`Reintentando... (${attempts + 1}/${maxAttempts})`);
        setTimeout(checkPayment, 3000);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFEAEA] to-[#FFF5F5] p-4">
      <div className="bg-white p-10 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          {/* Ícono según el estado */}
          {status === 'checking' && (
            <div className="mb-6">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#B33A3A] mx-auto"></div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-green-500 text-7xl mb-6">✅</div>
          )}
          
          {status === 'error' && (
            <div className="text-red-500 text-7xl mb-6">❌</div>
          )}
          
          {status === 'pending' && (
            <div className="text-yellow-500 text-7xl mb-6">⏳</div>
          )}

          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {status === 'checking' && 'Verificando pago'}
            {status === 'success' && '¡Pago exitoso!'}
            {status === 'error' && 'Pago rechazado'}
            {status === 'pending' && 'Pago en proceso'}
          </h1>
          
          {/* Mensaje */}
          <p className="text-gray-600 mb-6 text-lg">
            {message}
          </p>

          {/* Número de orden */}
          {orderId && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-500">Orden</p>
              <p className="text-2xl font-bold text-[#B33A3A]">#{orderId}</p>
            </div>
          )}

          {/* Barra de progreso para checking */}
          {status === 'checking' && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div 
                className="bg-[#B33A3A] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(attempts / maxAttempts) * 100}%` }}
              ></div>
            </div>
          )}

          {/* Botones de acción */}
          {(status === 'error' || status === 'pending') && (
            <div className="flex flex-col gap-3">
              <Link
                href="/cliente/carrito"
                className="bg-[#B33A3A] hover:bg-[#8B2E2E] text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Ir a mis pedidos
              </Link>
              <Link
                href="/cliente/carrito"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition"
              >
                Volver al inicio
              </Link>
            </div>
          )}

          {/* Info adicional para pago exitoso */}
          {status === 'success' && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Redirigiendo al historial de pedidos...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerificandoPagoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFEAEA] to-[#FFF5F5]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#B33A3A] mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <VerificandoPagoContent />
    </Suspense>
  );
}

