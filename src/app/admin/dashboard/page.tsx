'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

type DashboardStats = {
  clientes: {
    total: number;
    ultimas24h: number;
    loginFallidos: number;
    clienteMVP: {
      id: number;
      nombre: string;
      email: string;
      compras: number;
    } | null;
  };
  productos: {
    total: number;
    stockCritico: number;
    movimientos: {
      entradas: number;
      salidas: number;
    };
  };
  ventas: {
    total30d: number;
    pedidosDespachados: number;
    pedidosPendientes: number;
    reclamosPendientes: number;
    reclamosResueltos: number;
    ultimoPedido: {
      id: number;
      total: number;
      status: string;
      createdAt: string;
      user: {
        id: number;
        nombre: string;
        email: string;
      };
    } | null;
  };
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.rol !== 'admin')) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.rol === 'admin') {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      setError(null);
      const response = await api.get<DashboardStats>('/clientes/admin/dashboard');
      setStats(response.data);
    } catch (err: any) {
      console.error('Error cargando estadísticas del dashboard:', err);
      setError(err?.response?.data?.message || 'Error al cargar estadísticas del dashboard');
    } finally {
      setLoadingStats(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-800 to-orange-800 bg-clip-text text-transparent mb-2">
            📊 Dashboard Administrativo
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Vista general de todas las métricas del sistema</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loadingStats ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* ===== SECCIÓN CLIENTES ===== */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-2 border-blue-200">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <span>👥</span>
                <span>Clientes</span>
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Total Clientes */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-blue-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Clientes</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700">
                        {stats.clientes.total}
                      </p>
                    </div>
                    <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">👤</div>
                  </div>
                </div>

                {/* Usuarios últimas 24h */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-green-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Últimas 24h</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700">
                        {stats.clientes.ultimas24h}
                      </p>
                    </div>
                    <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">🆕</div>
                  </div>
                </div>

                {/* Login Fallidos */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-red-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Login Fallidos</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-700">
                        {stats.clientes.loginFallidos}
                      </p>
                    </div>
                    <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">⚠️</div>
                  </div>
                </div>

                {/* Cliente MVP */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-yellow-300 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Cliente MVP</p>
                      {stats.clientes.clienteMVP ? (
                        <>
                          <p className="text-sm sm:text-base font-bold text-yellow-800 truncate">
                            {stats.clientes.clienteMVP.nombre}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {stats.clientes.clienteMVP.compras} compras
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No hay datos</p>
                      )}
                    </div>
                    <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">🏆</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== SECCIÓN PRODUCTOS ===== */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-2 border-green-200">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <span>📦</span>
                <span>Productos</span>
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* Total Productos */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-green-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Productos</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700">
                        {stats.productos.total}
                      </p>
                    </div>
                    <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">📦</div>
                  </div>
                </div>

                {/* Stock Crítico */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-red-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Stock Crítico</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-700">
                        {stats.productos.stockCritico}
                      </p>
                    </div>
                    <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">⚠️</div>
                  </div>
                </div>

                {/* Movimientos de Stock */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-blue-300">
                  <div className="flex flex-col">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Movimientos (30d)</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-gray-600">Entradas</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-700">
                          {stats.productos.movimientos.entradas}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600">Salidas</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-700">
                          {stats.productos.movimientos.salidas}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== SECCIÓN VENTAS ===== */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-2 border-amber-200">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <span>💰</span>
                <span>Ventas</span>
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {/* Ventas últimos 30d */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-green-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Ventas (30d)</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700 break-words">
                        {formatCurrency(stats.ventas.total30d)}
                      </p>
                    </div>
                    <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">💵</div>
                  </div>
                </div>

                {/* Pedidos Despachados */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-blue-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Despachados</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700">
                        {stats.ventas.pedidosDespachados}
                      </p>
                    </div>
                    <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">🚚</div>
                  </div>
                </div>

                {/* Pedidos Pendientes */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-yellow-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Pendientes</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-700">
                        {stats.ventas.pedidosPendientes}
                      </p>
                    </div>
                    <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">⏳</div>
                  </div>
                </div>

                {/* Reclamos Pendientes */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-red-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Reclamos Pendientes</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-700">
                        {stats.ventas.reclamosPendientes}
                      </p>
                    </div>
                    <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">📝</div>
                  </div>
                </div>

                {/* Reclamos Resueltos */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-green-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Reclamos Resueltos</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700">
                        {stats.ventas.reclamosResueltos}
                      </p>
                    </div>
                    <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">✅</div>
                  </div>
                </div>
              </div>

              {/* Último Pedido */}
              {stats.ventas.ultimoPedido && (
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-amber-300">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🛒</span>
                    <span>Último Pedido Recibido</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Cliente</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">
                        {stats.ventas.ultimoPedido.user.nombre}
                      </p>
                      <p className="text-xs text-gray-500">{stats.ventas.ultimoPedido.user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Total</p>
                      <p className="text-lg sm:text-xl font-bold text-green-700">
                        {formatCurrency(stats.ventas.ultimoPedido.total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Fecha</p>
                      <p className="text-sm font-medium text-gray-800">
                        {formatDate(stats.ventas.ultimoPedido.createdAt)}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                        stats.ventas.ultimoPedido.status === 'completado' 
                          ? 'bg-green-100 text-green-800'
                          : stats.ventas.ultimoPedido.status === 'despachado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {stats.ventas.ultimoPedido.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-500 text-lg">No hay datos disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}

