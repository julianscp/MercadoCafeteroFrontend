'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type Estado = 'ACTIVO' | 'INACTIVO' | 'AGOTADO';

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  stockMinimo?: number;
  imagenUrl?: string | null;
  categoria: string;
  subcategoria?: string | null;
  marca?: string | null;
  estado: Estado;
};

export default function UserHomePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr(null);
        // Trae todos del backend y filtra solo ACTIVO para el usuario final
        const { data } = await api.get<Producto[]>('/productos');
        setItems((data ?? []).filter((p) => p.estado === 'ACTIVO'));
      } catch (e: any) {
        setErr(e?.response?.data?.message || 'No se pudieron cargar los productos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8 shadow-lg border border-amber-200">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/20 to-transparent"></div>
          <div className="absolute top-4 left-4 w-2 h-2 bg-amber-300 rounded-full"></div>
          <div className="absolute top-8 right-8 w-1 h-1 bg-amber-400 rounded-full"></div>
          <div className="absolute bottom-6 left-12 w-1.5 h-1.5 bg-orange-300 rounded-full"></div>
          <div className="absolute bottom-12 right-4 w-2 h-2 bg-yellow-300 rounded-full"></div>
        </div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl animate-bounce">☕</div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-800 to-orange-800 bg-clip-text text-transparent">
                ¡Bienvenido{user?.nombre ? `, ${user.nombre}` : ''}!
              </h1>
              <p className="text-lg text-amber-700 font-medium">
                Descubre los mejores productos cafeteros del día
              </p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg">📦</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Productos Disponibles</p>
                  <p className="text-2xl font-bold text-gray-800">{items.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">⭐</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Calidad Premium</p>
                  <p className="text-2xl font-bold text-gray-800">100%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-lg">🚚</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Envío Rápido</p>
                  <p className="text-2xl font-bold text-gray-800">24h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-48 mt-2 animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {err && (
        <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50 p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-700 mb-2">Error al cargar productos</h3>
          <p className="text-red-600 mb-4">{err}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {!loading && !err && (
        items.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay productos disponibles</h3>
            <p className="text-gray-500">Por el momento no tenemos productos en stock. ¡Vuelve pronto!</p>
          </div>
        ) : (
          <>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Nuestros Productos</h2>
                <p className="text-gray-600 mt-1">Selecciona los mejores productos cafeteros</p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{items.length} productos disponibles</span>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((p) => (
                <article key={p.id} className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden">
                  {/* Product Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    {p.imagenUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imagenUrl}
                        alt={p.nombre}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">☕</div>
                          <div className="text-sm text-gray-400">Sin imagen</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Stock Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                          p.stock > 10
                            ? 'bg-green-100 text-green-800'
                            : p.stock > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {p.stock > 0 ? `${p.stock} disponibles` : 'Agotado'}
                      </span>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
                        {p.categoria}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
                        {p.nombre}
                      </h3>
                      {p.marca && (
                        <p className="text-sm text-gray-500 mt-1">Marca: {p.marca}</p>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {p.descripcion}
                    </p>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-gray-800">{currencyCOP(p.precio)}</span>
                        {p.subcategoria && (
                          <p className="text-xs text-gray-500">{p.subcategoria}</p>
                        )}
                      </div>
                      
                      <button 
                        className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${
                          p.stock > 0
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={p.stock === 0}
                      >
                        {p.stock > 0 ? 'Ver Detalles' : 'Agotado'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )
      )}
    </section>
  );
}

function currencyCOP(n: number) {
  try {
    return Number(n ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
  } catch {
    return `$ ${Number(n ?? 0).toLocaleString()}`;
  }
}
