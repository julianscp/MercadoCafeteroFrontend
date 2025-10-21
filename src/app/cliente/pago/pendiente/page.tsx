"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

function PaymentPendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrderStatus();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const loadOrderStatus = async () => {
    try {
      const response = await api.get(`/payments/order/${orderId}`);
      setOrder(response.data);
    } catch (err) {
      console.error("Error cargando orden:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFEAEA] to-[#FFF5F5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#B33A3A] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFEAEA] to-[#FFF5F5] p-8">
      <div className="bg-white p-10 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="text-yellow-500 text-6xl mb-4">⏳</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Pago Pendiente
        </h1>
        <p className="text-gray-600 mb-6">
          Tu pago está siendo procesado. Esto puede tomar algunos minutos.
        </p>

        {order && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-semibold">Orden:</span> #{order.orderId}
            </p>
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-semibold">Estado:</span>{" "}
              <span className="capitalize">{order.status}</span>
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Total:</span> $
              {order.total.toLocaleString("es-CO")} COP
            </p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-800">
            <strong>Importante:</strong> Recibirás una confirmación por email
            cuando el pago sea aprobado. Puedes verificar el estado de tu pedido
            en tu historial de compras.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={loadOrderStatus}
            className="w-full bg-[#B33A3A] text-white px-6 py-3 rounded-lg hover:bg-[#8B2E2E] transition"
          >
            🔄 Verificar Estado
          </button>
          <Link
            href="/cliente/carrito"
            className="block w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            Ver Mis Pedidos
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Los pagos pueden tardar hasta 48 horas en ser confirmados según el
          método de pago utilizado.
        </p>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#B33A3A]"></div>
        </div>
      }
    >
      <PaymentPendingContent />
    </Suspense>
  );
}

