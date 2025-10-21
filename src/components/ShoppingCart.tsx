"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useProductRefresh } from '@/hooks/useProductRefresh';

type Order = {
  id: number;
  userId: number;
  products: Array<{
    id: number;
    nombre: string;
    precio: number;
    cantidad: number;
    subtotal: number;
  }>;
  total: number;
  status: string;
  createdAt: string;
};

type Product = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  subcategoria?: string;
  marca?: string;
  descuento?: number;
  imagenUrl?: string;
};

type CartItem = {
  productId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export default function ShoppingCart() {
  const { user } = useAuth();
  const { updatedProducts, markProductsAsUpdated } = useProductRefresh();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedQuantities, setSelectedQuantities] = useState<{[key: number]: number}>({});

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, []);

  const loadProducts = async () => {
    try {
      console.log('Cargando productos...');
      const response = await api.get<Product[]>('/productos');
      console.log('Productos cargados:', response.data.length);
      setProducts(response.data);
    } catch (err: any) {
      console.error('Error cargando productos:', err);
      setError('Error cargando productos');
    }
  };

  const loadOrders = async () => {
    try {
      const response = await api.get<Order[]>('/clientes/pedidos');
      console.log('Órdenes cargadas:', response.data);
      setOrders(response.data);
    } catch {
      setError('Error cargando pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: number, cantidad: number) => {
    if (cantidad < 0) return;
    setSelectedQuantities(prev => ({
      ...prev,
      [productId]: cantidad
    }));
  };

  const addToCart = (productId: number) => {
    const cantidad = selectedQuantities[productId] || 1;
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    if (cantidad > product.stock) {
      setError(`No hay suficiente stock. Disponible: ${product.stock}`);
      return;
    }

    const existingItem = cart.find(item => item.productId === productId);
    const precioConDescuento = product.descuento 
      ? product.precio * (1 - product.descuento / 100)
      : product.precio;

    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { 
              ...item, 
              cantidad: item.cantidad + cantidad,
              subtotal: (item.cantidad + cantidad) * precioConDescuento
            }
          : item
      ));
    } else {
      setCart([...cart, { 
        productId, 
        cantidad,
        precioUnitario: precioConDescuento,
        subtotal: cantidad * precioConDescuento
      }]);
    }

    setSelectedQuantities(prev => ({
      ...prev,
      [productId]: 0
    }));
    
    setSuccess(`✓ Agregado: ${product.nombre} x${cantidad}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId: number, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (cantidad > product.stock) {
      setError(`No hay suficiente stock. Disponible: ${product.stock}`);
      return;
    }

    const precioConDescuento = product.descuento 
      ? product.precio * (1 - product.descuento / 100)
      : product.precio;

    setCart(cart.map(item => 
      item.productId === productId 
        ? { 
            ...item, 
            cantidad,
            subtotal: cantidad * precioConDescuento
          }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    if (!user) {
      setError('Debes iniciar sesión para realizar una compra');
      return;
    }

    // Validar stock antes de proceder
    for (const item of cart) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        setError(`Producto con ID ${item.productId} no encontrado`);
        return;
      }
      if (item.cantidad > product.stock) {
        setError(`No hay suficiente stock para "${product.nombre}". Disponible: ${product.stock}, Solicitado: ${item.cantidad}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Preparar datos para crear la preferencia de pago
      const orderProducts = cart.map(item => ({
        productId: item.productId,
        cantidad: item.cantidad
      }));

      const preferenceData = {
        items: orderProducts
      };

      console.log('🛒 Creando preferencia de pago con Mercado Pago...');
      
      // Llamar al endpoint de payments para crear la preferencia
      const response = await api.post('/payments/create-preference', preferenceData);
      
      const { initPoint, sandboxInitPoint, orderId, preferenceId } = response.data;
      
      console.log('✅ Preferencia creada:', { orderId, preferenceId });
      console.log('🔗 Redirigiendo a Mercado Pago...');
      
      // Limpiar el carrito antes de redirigir
      setCart([]);
      localStorage.removeItem('cart');
      
      // Redirigir a Mercado Pago
      // En desarrollo usa sandboxInitPoint, en producción usa initPoint
      const paymentUrl = sandboxInitPoint || initPoint;
      
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        setError('No se pudo obtener la URL de pago');
      }
      
    } catch (err: any) {
      console.error('❌ Error creando preferencia de pago:', err);
      setError(err?.response?.data?.message || 'Error procesando el pago. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearCart = () => {
    setCart([]);
    setSuccess('Carrito vaciado');
    setTimeout(() => setSuccess(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-800 to-orange-800 bg-clip-text text-transparent">
            🛒 Mi Carrito de Compras
          </h1>
          <p className="text-gray-600 mt-2">Selecciona tus productos favoritos y realiza tu compra</p>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-md animate-slide-in">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div className="flex-1">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-md animate-slide-in">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✓</span>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Productos Disponibles - 2 columnas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-3xl">☕</span>
                  Productos Disponibles
                </h2>
                <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
                  {products.filter(p => p.stock > 0).length} disponibles
                </span>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {products.map(product => {
                  const precioConDescuento = product.descuento 
                    ? product.precio * (1 - product.descuento / 100)
                    : product.precio;
                  
                  return (
                    <div key={product.id} className="group bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-amber-300">
                      <div className="flex items-start gap-4">
                        {/* Imagen del producto */}
                        <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                          {product.imagenUrl ? (
                            <img 
                              src={product.imagenUrl} 
                              alt={product.nombre}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              ☕
                            </div>
                          )}
                        </div>
                        
                        {/* Info del producto */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-800 text-lg mb-1">{product.nombre}</h3>
                              {product.marca && (
                                <p className="text-sm text-gray-500 mb-2">{product.marca}</p>
                              )}
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.descripcion}</p>
                            </div>
                          </div>
                          
                          {/* Categoría y badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                              {product.categoria}
                            </span>
                            {product.subcategoria && (
                              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                                {product.subcategoria}
                              </span>
                            )}
                            {product.descuento && (
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold animate-pulse">
                                -{product.descuento}% OFF
                              </span>
                            )}
                          </div>

                          {/* Stock */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                              product.stock === 0 
                                ? 'bg-red-100 text-red-700' 
                                : product.stock <= 5 
                                ? 'bg-orange-100 text-orange-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {product.stock === 0 ? '❌ Agotado' : `✓ ${product.stock} disponibles`}
                            </span>
                            {updatedProducts.includes(product.id) && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold animate-pulse">
                                ¡ACTUALIZADO!
                              </span>
                            )}
                          </div>

                          {/* Precio */}
                          <div className="flex items-center gap-3 mb-4">
                            {product.descuento ? (
                              <>
                                <span className="text-2xl font-bold text-amber-700">
                                  ${precioConDescuento.toLocaleString('es-CO')}
                                </span>
                                <span className="text-lg text-gray-400 line-through">
                                  ${product.precio.toLocaleString('es-CO')}
                                </span>
                              </>
                            ) : (
                              <span className="text-2xl font-bold text-amber-700">
                                ${product.precio.toLocaleString('es-CO')}
                              </span>
                            )}
                          </div>

                          {/* Controles */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-lg px-3 py-2">
                              <label className="text-sm text-gray-700 font-semibold">Cantidad:</label>
                              <input
                                type="number"
                                min="1"
                                max={product.stock}
                                value={selectedQuantities[product.id] || 1}
                                onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-gray-800 font-semibold focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <button
                              onClick={() => addToCart(product.id)}
                              disabled={product.stock === 0}
                              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-md hover:shadow-xl transition-all transform hover:scale-105"
                            >
                              {product.stock === 0 ? 'Sin Stock' : '➕ Agregar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Carrito - 1 columna */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-amber-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-3xl">🛒</span>
                    Mi Carrito
                  </h2>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-sm text-red-600 hover:text-red-800 font-semibold px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      🗑️ Vaciar
                    </button>
                  )}
                </div>
                
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛒</div>
                    <p className="text-gray-500 font-medium text-lg">Tu carrito está vacío</p>
                    <p className="text-gray-400 text-sm mt-2">Agrega productos para comenzar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Items del carrito */}
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {cart.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        if (!product) return null;
                        
                        return (
                          <div key={item.productId} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-4 hover:border-amber-300 transition-all">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg overflow-hidden flex-shrink-0">
                                {product.imagenUrl ? (
                                  <img 
                                    src={product.imagenUrl} 
                                    alt={product.nombre}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-2xl">
                                    ☕
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm mb-1 truncate">{product.nombre}</h4>
                                <p className="text-xs text-gray-600 mb-2">
                                  ${item.precioUnitario.toLocaleString('es-CO')} c/u
                                </p>
                                <p className="text-sm font-bold text-amber-700">
                                  ${item.subtotal.toLocaleString('es-CO')}
                                </p>
                              </div>
                            </div>
                            
                            {/* Controles de cantidad */}
                            <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border-2 border-gray-200">
                              <button
                                onClick={() => updateCartQuantity(item.productId, item.cantidad - 1)}
                                className="w-8 h-8 bg-red-100 text-red-700 rounded-lg flex items-center justify-center hover:bg-red-200 font-bold text-lg transition-colors"
                              >
                                −
                              </button>
                              <span className="text-lg font-bold text-gray-800 px-4">{item.cantidad}</span>
                              <button
                                onClick={() => updateCartQuantity(item.productId, item.cantidad + 1)}
                                disabled={item.cantidad >= product.stock}
                                className="w-8 h-8 bg-green-100 text-green-700 rounded-lg flex items-center justify-center hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-colors"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeFromCart(item.productId)}
                                className="ml-2 text-red-600 hover:text-red-800 font-bold text-xl transition-colors"
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Total y botón de compra */}
                    <div className="border-t-4 border-amber-200 pt-4 space-y-4">
                      <div className="flex justify-between items-center bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4">
                        <span className="text-xl font-bold text-gray-800">Total:</span>
                        <span className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                          ${getCartTotal().toLocaleString('es-CO')}
                        </span>
                      </div>
                      
                      <button
                        onClick={handleCreateOrder}
                        disabled={submitting}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      >
                        {submitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Procesando...
                          </span>
                        ) : (
                          '💳 Realizar Compra'
                        )}
                      </button>
                      
                      <p className="text-xs text-gray-500 text-center">
                        ⚠️ Compra simulada sin procesamiento de pago
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Historial de Pedidos */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-3xl">📦</span>
            Historial de Compras
          </h2>
          
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500 font-medium text-lg">No tienes compras aún</p>
              <p className="text-gray-400 text-sm mt-2">Tus pedidos aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => {
                return (
                  <div key={order.id} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-xl text-gray-800 mb-1">Pedido #{order.id}</h3>
                        <p className="text-sm text-gray-600">
                          📅 {new Date(order.createdAt).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-700 mb-2">
                          ${order.total.toLocaleString('es-CO')}
                        </p>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          order.status === 'completado' 
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pendiente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'completado' ? '✓ Completado' : order.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 bg-white rounded-lg p-4 border border-gray-200">
                      {order.products && typeof order.products === 'string' ? (
                        (() => {
                          try {
                            const productsArray = JSON.parse(order.products);
                            return productsArray.map((product: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                                <span className="font-medium text-gray-700">{product.nombre} × {product.cantidad}</span>
                                <span className="font-bold text-amber-700">${product.subtotal.toLocaleString('es-CO')}</span>
                              </div>
                            ));
                          } catch {
                            return (
                              <div className="text-sm text-gray-500">
                                Error al cargar productos
                              </div>
                            );
                          }
                        })()
                      ) : order.products && Array.isArray(order.products) ? (
                        order.products.map((orderProduct: any, index: number) => {
                          const product = orderProduct.producto || orderProduct;
                          const cantidad = orderProduct.cantidad;
                          const precio = product.precio || 0;
                          const descuento = product.descuento || 0;
                          const precioConDescuento = descuento ? precio * (1 - descuento / 100) : precio;
                          const subtotal = cantidad * precioConDescuento;
                          
                          return (
                            <div key={index} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                              <span className="font-medium text-gray-700">{product.nombre} × {cantidad}</span>
                              <span className="font-bold text-amber-700">${subtotal.toLocaleString('es-CO')}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-sm text-gray-500">
                          No hay productos disponibles
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
