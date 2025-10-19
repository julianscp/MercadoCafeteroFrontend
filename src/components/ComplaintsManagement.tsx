"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

type Complaint = {
  id: number;
  userId: number;
  orderId?: number;
  mensaje: string;
  estado: string;
  createdAt: string;
  user: {
    id: number;
    nombre: string;
    email: string;
  };
};

export default function ComplaintsManagement() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    orderId: '',
    mensaje: ''
  });

  useEffect(() => {
    loadComplaints();
    loadOrders();
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await api.get('/clientes/reclamos');
      setComplaints(response.data);
    } catch (err: any) {
      setError('Error cargando reclamos');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await api.get('/clientes/pedidos');
      setOrders(response.data);
    } catch (err: any) {
      console.error('Error cargando pedidos:', err);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mensaje.trim()) {
      setError('El mensaje es requerido');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        mensaje: formData.mensaje,
        ...(formData.orderId && { orderId: parseInt(formData.orderId) })
      };
      
      await api.post('/clientes/reclamos', payload);
      setFormData({ orderId: '', mensaje: '' });
      setShowForm(false);
      await loadComplaints();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error enviando reclamo');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800';
      case 'resuelto':
        return 'bg-green-100 text-green-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Reclamos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
          style={{ color: 'white', backgroundColor: '#B33A3A' }}
        >
          {showForm ? 'Cancelar' : 'Nuevo Reclamo'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            style={{ color: 'white', backgroundColor: '#DC2626' }}
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Formulario de Nuevo Reclamo */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Crear Nuevo Reclamo</h2>
          <form onSubmit={handleSubmitComplaint} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pedido relacionado (opcional)
              </label>
              <select
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-primary"
              >
                <option value="">Seleccionar pedido...</option>
                {orders.map(order => (
                  <option key={order.id} value={order.id}>
                    Pedido #{order.id} - ${order.total.toLocaleString('es-CO')} - {new Date(order.createdAt).toLocaleDateString('es-CO')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje *
              </label>
              <textarea
                value={formData.mensaje}
                onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-primary"
                rows={4}
                placeholder="Describe tu reclamo o solicitud..."
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
                style={{ color: 'white', backgroundColor: '#B33A3A' }}
              >
                {submitting ? 'Enviando...' : 'Enviar Reclamo'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 font-medium"
                style={{ color: '#374151', borderColor: '#D1D5DB' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Reclamos */}
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center">
            <p className="text-gray-500">No tienes reclamos registrados</p>
          </div>
        ) : (
          complaints.map(complaint => (
            <div key={complaint.id} className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">Reclamo #{complaint.id}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(complaint.createdAt).toLocaleDateString('es-CO')}
                  </p>
                  {complaint.orderId && (
                    <p className="text-sm text-blue-600">
                      Relacionado con Pedido #{complaint.orderId}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.estado)}`}>
                  {complaint.estado}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-800">{complaint.mensaje}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
