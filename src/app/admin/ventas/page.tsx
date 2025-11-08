'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

type SalesStats = {
  period: 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  totalSales: number;
  orderCount: number;
  topProduct: {
    id: number;
    nombre: string;
    cantidad: number;
    total: number;
  } | null;
  products: Array<{
    id: number;
    nombre: string;
    cantidad: number;
    total: number;
  }>;
};

export default function VentasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [stats, setStats] = useState<SalesStats | null>(null);
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
  }, [user, period]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      setError(null);
      const response = await api.get<SalesStats>(`/clientes/admin/ventas/estadisticas/${period}`);
      setStats(response.data);
    } catch (err: any) {
      console.error('Error cargando estadísticas:', err);
      setError(err?.response?.data?.message || 'Error al cargar estadísticas');
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
    });
  };

  const getPeriodLabel = (p: 'day' | 'week' | 'month') => {
    switch (p) {
      case 'day':
        return 'Hoy';
      case 'week':
        return 'Última Semana';
      case 'month':
        return 'Este Mes';
      default:
        return 'Este Mes';
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-800 to-orange-800 bg-clip-text text-transparent mb-4">
            📊 Estadísticas de Ventas
          </h1>
          
          {/* Selector de período */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 min-h-[44px] text-sm sm:text-base ${
                  period === p
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-amber-100 hover:text-amber-800 shadow-md'
                }`}
              >
                {getPeriodLabel(p)}
              </button>
            ))}
          </div>
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
            {/* Cards de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total de Ventas</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-700 mt-2 break-words">
                      {formatCurrency(stats.totalSales)}
                    </p>
                  </div>
                  <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">💰</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Pedidos Realizados</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-700 mt-2">
                      {stats.orderCount}
                    </p>
                  </div>
                  <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">📦</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-purple-200 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Promedio por Pedido</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-700 mt-2 break-words">
                      {stats.orderCount > 0
                        ? formatCurrency(stats.totalSales / stats.orderCount)
                        : formatCurrency(0)}
                    </p>
                  </div>
                  <div className="text-3xl sm:text-4xl ml-2 flex-shrink-0">📈</div>
                </div>
              </div>
            </div>

            {/* Producto más vendido */}
            {stats.topProduct && (
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-2 border-amber-200">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <span>🏆</span>
                  <span>Producto Más Vendido</span>
                </h2>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 sm:p-6 border-2 border-amber-300">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
                        {stats.topProduct.nombre}
                      </h3>
                      <p className="text-base sm:text-lg text-gray-600 mt-2">
                        Cantidad vendida: <span className="font-bold text-amber-700">{stats.topProduct.cantidad}</span> unidades
                      </p>
                      <p className="text-base sm:text-lg text-gray-600">
                        Total generado: <span className="font-bold text-green-700">{formatCurrency(stats.topProduct.total)}</span>
                      </p>
                    </div>
                    <div className="text-4xl sm:text-6xl flex-shrink-0">🎯</div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de productos vendidos */}
            {stats.products.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-2 border-gray-200">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <span>📋</span>
                  <span>Productos Vendidos</span>
                </h2>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                          Cantidad
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.products.map((product) => (
                        <tr key={product.id} className="hover:bg-amber-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.nombre}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {product.cantidad}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-bold text-green-700">
                              {formatCurrency(product.total)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Información del período */}
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">
                Período: <span className="font-semibold">{formatDate(stats.startDate)}</span> hasta{' '}
                <span className="font-semibold">{formatDate(stats.endDate)}</span>
              </p>
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

