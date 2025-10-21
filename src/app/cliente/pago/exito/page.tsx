"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (orderId) {
      loadOrderStatus();
    }
  }, [orderId]);

  const loadOrderStatus = async () => {
    try {
      const response = await api.get(`/payments/order/${orderId}`);
      setOrder(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error cargando el pedido");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFEAEA] to-[#FFF5F5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#B33A3A] mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFEAEA] to-[#FFF5F5] p-8">
        <div className="bg-white p-10 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/cliente/carrito"
            className="inline-block bg-[#B33A3A] text-white px-6 py-3 rounded-lg hover:bg-[#8B2E2E] transition"
          >
            Volver al carrito
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFEAEA] to-[#FFF5F5] p-8">
      <div className="bg-white p-10 rounded-lg shadow-md max-w-2xl w-full">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Pago Exitoso!
          </h1>
          <p className="text-gray-600 mb-6">
            Tu compra ha sido procesada correctamente
          </p>
        </div>

        {order && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Detalles del Pedido</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Número de Orden:</span>
                <span className="font-semibold">#{order.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-semibold capitalize text-green-600">
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-lg">
                  ${order.total.toLocaleString("es-CO")} COP
                </span>
              </div>
            </div>

            {order.products && Array.isArray(order.products) && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Productos:</h3>
                <div className="space-y-2">
                  {order.products.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded"
                    >
                      <div>
                        <p className="font-medium">{item.nombre}</p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.cantidad}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${item.subtotal.toLocaleString("es-CO")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <Link
            href="/cliente/carrito"
            className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition text-center"
          >
            Ver Mis Pedidos
          </Link>
          <Link
            href="/cliente/carrito"
            className="flex-1 bg-[#B33A3A] text-white px-6 py-3 rounded-lg hover:bg-[#8B2E2E] transition text-center"
          >
            Seguir Comprando
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#B33A3A]"></div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

