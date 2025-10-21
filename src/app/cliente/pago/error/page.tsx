"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

function PaymentErrorContent() {
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
        <div className="text-red-500 text-6xl mb-4">❌</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Pago Rechazado
        </h1>
        <p className="text-gray-600 mb-6">
          Lo sentimos, tu pago no pudo ser procesado. Esto puede deberse a:
        </p>

        <ul className="text-left text-gray-600 mb-6 space-y-2">
          <li>• Fondos insuficientes</li>
          <li>• Datos de tarjeta incorrectos</li>
          <li>• Límite de compra excedido</li>
          <li>• Problemas con el banco emisor</li>
        </ul>

        {order && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600">
              Orden #{order.orderId} - Estado:{" "}
              <span className="font-semibold capitalize">{order.status}</span>
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/cliente/carrito"
            className="block w-full bg-[#B33A3A] text-white px-6 py-3 rounded-lg hover:bg-[#8B2E2E] transition"
          >
            Intentar Nuevamente
          </Link>
          <Link
            href="/cliente/carrito"
            className="block w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            Volver al Carrito
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Si el problema persiste, contacta a tu banco o intenta con otro método
          de pago.
        </p>
      </div>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#B33A3A]"></div>
        </div>
      }
    >
      <PaymentErrorContent />
    </Suspense>
  );
}

