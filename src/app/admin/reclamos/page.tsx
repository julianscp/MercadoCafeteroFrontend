'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

type Complaint = {
  id: number;
  userId: number;
  orderId?: number;
  mensaje: string;
  respuesta?: string;
  estado: string;
  createdAt: string;
  respondedAt?: string;
  user: {
    id: number;
    nombre: string;
    email: string;
  };
};

export default function AdminReclamosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('todos'); // 'todos' | 'pendiente' | 'resuelto'

  useEffect(() => {
    if (!loading && (!user || user.rol !== 'admin')) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.rol === 'admin') {
      loadComplaints();
    }
  }, [user, filterStatus]);

  const loadComplaints = async () => {
    try {
      setLoadingComplaints(true);
      setError(null);
      const response = await api.get<Complaint[]>('/clientes/admin/reclamos');
      let filtered = response.data;
      
      if (filterStatus !== 'todos') {
        filtered = filtered.filter(c => c.estado === filterStatus);
      }
      
      setComplaints(filtered);
    } catch (err: any) {
      console.error('Error cargando reclamos:', err);
      setError(err?.response?.data?.message || 'Error al cargar reclamos');
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleOpenResponseModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setResponse(complaint.respuesta || '');
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedComplaint || !response.trim()) {
      alert('Por favor ingresa una respuesta');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/clientes/admin/reclamos/${selectedComplaint.id}/responder`, {
        respuesta: response.trim()
      });
      alert('✅ Respuesta enviada exitosamente. El cliente recibirá un correo de notificación.');
      setShowResponseModal(false);
      setSelectedComplaint(null);
      setResponse('');
      await loadComplaints();
    } catch (err: any) {
      console.error('Error enviando respuesta:', err);
      alert(err?.response?.data?.message || 'Error al enviar respuesta');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'resuelto':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rechazado':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-800 to-orange-800 bg-clip-text text-transparent">
            📋 Gestión de Reclamos
          </h1>
          
          <div className="flex gap-2">
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
            <button
              onClick={() => setFilterStatus('pendiente')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                filterStatus === 'pendiente'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilterStatus('resuelto')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                filterStatus === 'resuelto'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Resueltos
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loadingComplaints ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-500 text-lg">
              {filterStatus === 'todos' 
                ? 'No hay reclamos registrados' 
                : `No hay reclamos ${filterStatus}`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {complaints.map(complaint => (
              <div key={complaint.id} className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200 hover:shadow-2xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Reclamo #{complaint.id}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      📅 {new Date(complaint.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {complaint.orderId && (
                      <p className="text-sm text-blue-600 mt-1">
                        📦 Relacionado con Pedido #{complaint.orderId}
                      </p>
                    )}
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(complaint.estado)}`}>
                    {complaint.estado}
                  </span>
                </div>

                {/* Información del cliente */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">👤 Cliente:</h4>
                  <p className="text-sm text-blue-800">
                    <strong>Nombre:</strong> {complaint.user.nombre}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Email:</strong> {complaint.user.email}
                  </p>
                </div>

                {/* Mensaje del reclamo */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">💬 Mensaje del Cliente:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{complaint.mensaje}</p>
                </div>

                {/* Respuesta del admin */}
                {complaint.respuesta && (
                  <div className="bg-green-50 rounded-lg p-4 mb-4 border-2 border-green-300">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-green-900">✅ Respuesta del Administrador:</h4>
                      {complaint.respondedAt && (
                        <span className="text-xs text-green-700">
                          {new Date(complaint.respondedAt).toLocaleDateString('es-CO')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{complaint.respuesta}</p>
                  </div>
                )}

                {/* Botón de acción */}
                {complaint.estado === 'pendiente' && (
                  <button
                    onClick={() => handleOpenResponseModal(complaint)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    💬 Responder Reclamo
                  </button>
                )}

                {complaint.estado === 'resuelto' && !complaint.respuesta && (
                  <button
                    onClick={() => handleOpenResponseModal(complaint)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    ✏️ Editar Respuesta
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de respuesta */}
      {showResponseModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">💬 Responder Reclamo #{selectedComplaint.id}</h2>
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedComplaint(null);
                  setResponse('');
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {/* Información del reclamo */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Mensaje del Cliente:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedComplaint.mensaje}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tu Respuesta:
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={8}
                placeholder="Escribe tu respuesta aquí..."
              />
              <p className="text-xs text-gray-500 mt-2">
                El cliente recibirá un correo electrónico con esta respuesta.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedComplaint(null);
                  setResponse('');
                }}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={submitting || !response.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-bold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
              >
                {submitting ? 'Enviando...' : '📧 Enviar Respuesta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

