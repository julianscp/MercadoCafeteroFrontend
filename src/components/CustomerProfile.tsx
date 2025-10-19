"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

type CustomerProfile = {
  id: number;
  email: string;
  nombre: string;
  direccion: string;
  telefono: string;
  rol: string;
  verificado: boolean;
  createdAt: string;
  updatedAt: string;
  estadisticas: {
    totalPedidos: number;
    totalReclamos: number;
  };
};

export default function CustomerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    direccion: '',
    telefono: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  console.log('CustomerProfile component rendered', { user, loading, error, editing });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log('Loading profile...');
      const response = await api.get<CustomerProfile>('/usuarios/clientes/perfil');
      console.log('Profile loaded:', response.data);
      console.log('Statistics:', response.data.estadisticas);
      setProfile(response.data);
      setFormData({
        nombre: response.data.nombre,
        email: response.data.email,
        direccion: response.data.direccion,
        telefono: response.data.telefono
      });
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err?.response?.data?.message || 'Error cargando perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      // No enviar el email en la actualización
      const { email, ...updateData } = formData;
      const response = await api.put<CustomerProfile>('/usuarios/clientes/perfil', updateData);
      setProfile(response.data);
      setEditing(false);
      setSuccess('Perfil actualizado correctamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error actualizando perfil');
    }
  };

  if (!mounted) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={loadProfile}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {editing ? 'Cancelar' : 'Editar Perfil'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="p-3 bg-gray-100 border border-gray-300 rounded text-gray-600">
                  {formData.email}
                  <span className="ml-2 text-xs text-gray-500">(No editable)</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-primary"
                  placeholder="Ej: +57 300 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado de Verificación
                </label>
                <div className="p-3 bg-gray-100 rounded border">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    profile?.verificado 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {profile?.verificado ? 'Email Verificado' : 'Email Pendiente de Verificación'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <textarea
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-primary"
                rows={3}
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Guardar Cambios
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Nombre:</span>
                    <p className="text-gray-800">{profile?.nombre}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <p className="text-gray-800">{profile?.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Teléfono:</span>
                    <p className="text-gray-800">{profile?.telefono}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Dirección:</span>
                    <p className="text-gray-800">{profile?.direccion}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Estado:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      profile?.verificado 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {profile?.verificado ? 'Verificado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <span className="text-sm font-medium text-blue-600">Total de Pedidos</span>
                    <p className="text-2xl font-bold text-blue-800">
                      {profile?.estadisticas?.totalPedidos ?? 0}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <span className="text-sm font-medium text-orange-600">Total de Reclamos</span>
                    <p className="text-2xl font-bold text-orange-800">
                      {profile?.estadisticas?.totalReclamos ?? 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Miembro desde</span>
                    <p className="text-sm text-gray-800">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-CO') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
