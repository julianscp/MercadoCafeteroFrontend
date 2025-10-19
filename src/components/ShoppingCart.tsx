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
    } catch (err: any) {
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

    // Limpiar cantidad seleccionada
    setSelectedQuantities(prev => ({
      ...prev,
      [productId]: 0
    }));
    
    setSuccess(`Agregado al carrito: ${product.nombre} x${cantidad}`);
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

    // Validar stock antes de procesar la compra
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
      
      // Preparar productos para la orden (solo datos necesarios)
      const orderProducts = cart.map(item => ({
        productId: item.productId,
        cantidad: item.cantidad
      }));

      const orderData = {
        products: orderProducts
      };

      const response = await api.post('/clientes/pedidos', orderData);
      
      // Limpiar carrito
      setCart([]);
      
      // Marcar productos que se actualizaron
      const productIds = orderProducts.map(p => p.productId);
      markProductsAsUpdated(productIds);
      
      // Forzar recarga de productos con un pequeño delay para asegurar que el backend haya actualizado
      setTimeout(async () => {
        await loadProducts();
        console.log('Productos recargados después de compra');
      }, 500);
      
      // Recargar órdenes
      await loadOrders();
      
      setSuccess('¡Compra realizada exitosamente! El stock ha sido actualizado.');
      setTimeout(() => setSuccess(null), 5000);
      
      // Debug: mostrar respuesta del servidor
      console.log('Respuesta del servidor:', response.data);
      
      // Mostrar mensaje adicional sobre stock actualizado
      setTimeout(() => {
        setSuccess('Los productos han sido actualizados con el nuevo stock disponible.');
        setTimeout(() => setSuccess(null), 3000);
      }, 2000);
      
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error realizando la compra');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 shopping-cart-container">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Carrito de Compras</h1>

      {/* Mensajes de estado */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cerrar
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Productos Disponibles */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Productos Disponibles</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {products.map(product => {
              const precioConDescuento = product.descuento 
                ? product.precio * (1 - product.descuento / 100)
                : product.precio;
              
              return (
                <div key={product.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {product.imagenUrl ? (
                        <img 
                          src={product.imagenUrl} 
                          alt={product.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          ☕
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">{product.nombre}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{product.descripcion}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">{product.categoria}</span>
                        {product.subcategoria && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500">{product.subcategoria}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-sm ${product.stock === 0 ? 'text-red-600 font-bold' : product.stock <= 5 ? 'text-orange-600 font-medium' : 'text-gray-600'} ${updatedProducts.includes(product.id) ? 'animate-pulse' : ''}`}>
                          Stock: {product.stock}
                        </span>
                        {updatedProducts.includes(product.id) && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold animate-pulse">
                            ¡ACTUALIZADO!
                          </span>
                        )}
                        {product.stock === 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-bold">
                            AGOTADO
                          </span>
                        )}
                        {product.stock > 0 && product.stock <= 5 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                            POCO STOCK
                          </span>
                        )}
                        {product.descuento && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            -{product.descuento}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {product.descuento ? (
                          <>
                            <span className="text-lg font-semibold text-primary">
                              ${precioConDescuento.toLocaleString('es-CO')}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              ${product.precio.toLocaleString('es-CO')}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-semibold text-primary">
                            ${product.precio.toLocaleString('es-CO')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Controles de cantidad y agregar */}
                  <div className="flex items-center gap-3 mt-4 bg-gray-50 p-3 rounded">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700 font-medium">Cantidad:</label>
                      <input
                        type="number"
                        min="1"
                        max={product.stock}
                        value={selectedQuantities[product.id] || 1}
                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-gray-800 bg-white"
                        style={{ 
                          color: '#1f2937',
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db'
                        }}
                      />
                    </div>
                    <button
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      style={{ 
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {product.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carrito */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Mi Carrito</h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50"
                style={{ 
                  color: '#dc2626',
                  fontWeight: '500'
                }}
              >
                Vaciar Carrito
              </button>
            )}
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">El carrito está vacío</p>
            ) : (
              <div className="space-y-3">
                {cart.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  if (!product) return null;
                  
                  return (
                    <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <h4 className="font-medium">{product.nombre}</h4>
                        <p className="text-sm text-gray-600">
                          ${item.precioUnitario.toLocaleString('es-CO')} x {item.cantidad}
                        </p>
                        <p className="text-sm font-medium text-primary">
                          Subtotal: ${item.subtotal.toLocaleString('es-CO')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.cantidad - 1)}
                          className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 text-gray-800 font-bold"
                          style={{ 
                            backgroundColor: '#e5e7eb',
                            color: '#1f2937',
                            border: '1px solid #d1d5db'
                          }}
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-gray-800 font-medium">{item.cantidad}</span>
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.cantidad + 1)}
                          disabled={item.cantidad >= product.stock}
                          className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 text-gray-800 font-bold"
                          style={{ 
                            backgroundColor: '#e5e7eb',
                            color: '#1f2937',
                            border: '1px solid #d1d5db'
                          }}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="ml-2 text-red-600 hover:text-red-800 font-bold text-lg"
                          title="Eliminar del carrito"
                          style={{ 
                            color: '#dc2626',
                            fontSize: '18px',
                            fontWeight: 'bold'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                <div className="border-t pt-3 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-800">Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ${getCartTotal().toLocaleString('es-CO')}
                    </span>
                  </div>
                  <button
                    onClick={handleCreateOrder}
                    disabled={submitting}
                    className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                    style={{ 
                      backgroundColor: '#059669',
                      color: 'white',
                      border: 'none',
                      cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submitting ? 'Procesando Compra...' : 'Realizar Compra (Sin Pago)'}
                  </button>
                  <p className="text-xs text-gray-600 text-center mt-2">
                    Esta es una compra simulada sin procesamiento de pago
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historial de Pedidos */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Historial de Compras</h2>
        {orders.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center">
            <p className="text-gray-500">No tienes compras aún</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              console.log('Estructura de orden:', order);
              return (
              <div key={order.id} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">Compra #{order.id}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      ${order.total.toLocaleString('es-CO')}
                    </p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'completado' 
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'pendiente'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {order.products && typeof order.products === 'string' ? (
                    // Si products es un string JSON, parsearlo
                    (() => {
                      try {
                        const productsArray = JSON.parse(order.products);
                        return productsArray.map((product: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{product.nombre} x {product.cantidad}</span>
                            <span>${product.subtotal.toLocaleString('es-CO')}</span>
                          </div>
                        ));
                      } catch (error) {
                        return (
                          <div className="text-sm text-gray-500">
                            Error al cargar productos de la orden
                          </div>
                        );
                      }
                    })()
                  ) : order.products && Array.isArray(order.products) ? (
                    // Si products es un array directo
                    order.products.map((orderProduct: any, index: number) => {
                      const product = orderProduct.producto || orderProduct;
                      const cantidad = orderProduct.cantidad;
                      const precio = product.precio || 0;
                      const descuento = product.descuento || 0;
                      const precioConDescuento = descuento ? precio * (1 - descuento / 100) : precio;
                      const subtotal = cantidad * precioConDescuento;
                      
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{product.nombre} x {cantidad}</span>
                          <span>${subtotal.toLocaleString('es-CO')}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-gray-500">
                      No hay productos disponibles para esta orden
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
  );
}
