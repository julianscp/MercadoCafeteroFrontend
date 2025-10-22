'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

type OrderProduct = {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
};

type Order = {
  id: number;
  userId: number;
  products: OrderProduct[];
  total: number;
  status: string;
  direccionEnvio?: string;
  observacionesAdmin?: string;
  createdAt: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
    direccion?: string;
  };
};

export default function AdminOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [observacion, setObservacion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('pendientes'); // 'pendientes' | 'todos'

  useEffect(() => {
    if (!loading && (!user || user.rol !== 'admin')) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.rol === 'admin') {
      loadOrders();
    }
  }, [user, filterStatus]);

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      setError(null);
      
      const endpoint = filterStatus === 'pendientes' 
        ? '/clientes/admin/pedidos/pendientes'
        : '/clientes/admin/pedidos';
      
      const response = await api.get<Order[]>(endpoint);
      setOrders(response.data);
    } catch (err: any) {
      console.error('Error cargando pedidos:', err);
      setError(err?.response?.data?.message || 'Error al cargar pedidos');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleConfirmOrder = async (orderId: number) => {
    if (!confirm('¿Confirmar que este pedido ha sido despachado?')) {
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/clientes/admin/pedidos/${orderId}/confirmar`);
      alert('✅ Pedido confirmado/despachado exitosamente');
      loadOrders();
    } catch (err: any) {
      console.error('Error confirmando pedido:', err);
      alert(err?.response?.data?.message || 'Error al confirmar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenObservationModal = (order: Order) => {
    setSelectedOrder(order);
    setObservacion(order.observacionesAdmin || '');
    setShowObservationModal(true);
  };

  const handleSubmitObservation = async () => {
    if (!selectedOrder || !observacion.trim()) {
      alert('Por favor ingresa una observación');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/clientes/admin/pedidos/${selectedOrder.id}/observaciones`, {
        observacion: observacion.trim()
      });
      alert('✅ Observación agregada exitosamente');
      setShowObservationModal(false);
      setSelectedOrder(null);
      setObservacion('');
      loadOrders();
    } catch (err: any) {
      console.error('Error agregando observación:', err);
      alert(err?.response?.data?.message || 'Error al agregar observación');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente de pago' },
      completado: { bg: 'bg-green-100', text: 'text-green-800', label: 'Pagado - Por despachar' },
      confirmado: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Despachado' },
      cancelado: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' }
    };

    const config = statusConfig[status] || statusConfig.pendiente;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">📦 Gestión de Pedidos</h1>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('pendientes')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                filterStatus === 'pendientes'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilterStatus('todos')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                filterStatus === 'todos'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Todos
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loadingOrders ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-500 text-lg">
              {filterStatus === 'pendientes' 
                ? 'No hay pedidos pendientes de despacho' 
                : 'No hay pedidos registrados'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Pedido #{order.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString('es-CO')}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Información del cliente */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-bold text-blue-900 mb-2">👤 Cliente:</h4>
                    <p className="text-sm"><strong>Nombre:</strong> {order.user.nombre}</p>
                    <p className="text-sm"><strong>Email:</strong> {order.user.email}</p>
                    {order.user.telefono && (
                      <p className="text-sm"><strong>Teléfono:</strong> {order.user.telefono}</p>
                    )}
                    {order.user.direccion && (
                      <p className="text-sm"><strong>Dirección registrada:</strong> {order.user.direccion}</p>
                    )}
                  </div>

                  {/* Dirección de envío */}
                  {order.direccionEnvio && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-bold text-green-900 mb-2">📍 Dirección de envío:</h4>
                      <p className="text-sm">{order.direccionEnvio}</p>
                    </div>
                  )}
                </div>

                {/* Productos */}
                <div className="mb-4">
                  <h4 className="font-bold text-gray-800 mb-3">📦 Productos:</h4>
                  <div className="space-y-2">
                    {Array.isArray(order.products) ? (
                      order.products.map((product, idx) => (
                        <div 
                          key={idx} 
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <span className="font-medium">{product.nombre}</span>
                            <span className="text-gray-600 text-sm ml-2">
                              x{product.cantidad}
                            </span>
                          </div>
                          <span className="font-bold text-blue-600">
                            ${product.subtotal.toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Formato de productos no compatible. Pedido antiguo.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="text-xl font-bold">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${order.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Observaciones */}
                {order.observacionesAdmin && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <h4 className="font-bold text-yellow-900 mb-2">📝 Observaciones:</h4>
                    <p className="text-sm text-yellow-800">{order.observacionesAdmin}</p>
                  </div>
                )}

                {/* Botones de acción */}
                {order.status === 'completado' && (
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => handleConfirmOrder(order.id)}
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold disabled:opacity-50"
                    >
                      ✅ Confirmar Despacho
                    </button>
                    <button
                      onClick={() => handleOpenObservationModal(order)}
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-bold disabled:opacity-50"
                    >
                      📝 Agregar Observación
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de observaciones */}
      {showObservationModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">📝 Agregar Observación</h2>
              <button
                onClick={() => setShowObservationModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Pedido #{selectedOrder.id} - Cliente: {selectedOrder.user.nombre}
            </p>

            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
              rows={6}
              placeholder="Ej: Dirección no encontrada, Cliente no disponible, etc."
            />

            <div className="flex gap-4">
              <button
                onClick={() => setShowObservationModal(false)}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-bold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitObservation}
                disabled={submitting || !observacion.trim()}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Guardar Observación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

