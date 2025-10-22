"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';

type Product = {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  descuento?: number;
  imagenUrl?: string;
};

type CartItem = {
  productId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

type CheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  products: Product[];
  onUpdateCart: (updatedCart: CartItem[]) => void;
  onCartCleared: () => void;
  userDireccion?: string;
};

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  cart, 
  products, 
  onUpdateCart,
  onCartCleared,
  userDireccion
}: CheckoutModalProps) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Carrito, 2: Envío, 3: Pago, 4: Finalizado
  const [direccionEnvio, setDireccionEnvio] = useState(userDireccion || '');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setError(null);
      setDireccionEnvio(userDireccion || '');
    }
  }, [isOpen, userDireccion]);

  if (!isOpen) return null;

  const getProductInfo = (productId: number) => {
    return products.find(p => p.id === productId);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const product = getProductInfo(productId);
    if (!product) return;

    if (newQuantity > product.stock) {
      setError(`Stock máximo disponible: ${product.stock}`);
      return;
    }

    const precioConDescuento = product.descuento 
      ? product.precio * (1 - product.descuento / 100) 
      : product.precio;

    const updatedCart = cart.map(item =>
      item.productId === productId
        ? { ...item, cantidad: newQuantity, subtotal: newQuantity * precioConDescuento }
        : item
    );
    
    onUpdateCart(updatedCart);
    setError(null);
  };

  const removeFromCart = (productId: number) => {
    const updatedCart = cart.filter(item => item.productId !== productId);
    onUpdateCart(updatedCart);
  };

  const handleConfirmCart = () => {
    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  const handleConfirmAddress = () => {
    if (!direccionEnvio.trim()) {
      setError('Por favor ingresa una dirección de envío');
      return;
    }
    setError(null);
    setCurrentStep(3);
  };

  const handlePayment = async () => {
    if (!direccionEnvio.trim()) {
      setError('Por favor ingresa una dirección de envío');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Preparar datos para crear la preferencia de pago
      const orderProducts = cart.map(item => ({
        productId: item.productId,
        cantidad: item.cantidad
      }));

      const preferenceData = {
        items: orderProducts,
        direccionEnvio: direccionEnvio.trim()
      };

      console.log('🛒 Creando preferencia de pago con Mercado Pago...');
      
      // Llamar al endpoint de payments para crear la preferencia
      const response = await api.post<{
        orderId: number;
        preferenceId: string;
        initPoint: string;
        sandboxInitPoint: string;
      }>('/payments/create-preference', preferenceData);
      
      const { initPoint, orderId } = response.data;
      
      setOrderId(orderId);
      setOrderDetails({
        orderId,
        products: cart.map(item => {
          const product = getProductInfo(item.productId);
          return {
            nombre: product?.nombre || 'Producto',
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal
          };
        }),
        total: calculateTotal(),
        direccionEnvio
      });
      
      console.log('✅ Preferencia creada:', { orderId });
      console.log('🔗 Redirigiendo a Mercado Pago...');
      
      // Limpiar el carrito
      onCartCleared();
      
      // Redirigir a Mercado Pago
      if (initPoint) {
        window.location.href = initPoint;
      } else {
        setError('No se pudo obtener la URL de pago');
      }

    } catch (err: any) {
      console.error('Error creando preferencia:', err);
      setError(err?.response?.data?.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = ['Carrito', 'Envío', 'Pago', 'Finalizado'];
    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
              index + 1 === currentStep 
                ? 'bg-blue-500 text-white' 
                : index + 1 < currentStep 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-300 text-gray-600'
            }`}>
              {index + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              index + 1 === currentStep ? 'text-blue-500' : 'text-gray-500'
            }`}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-12 h-1 mx-2 ${
                index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderCartStep = () => (
    <div>
      <h3 className="text-2xl font-bold mb-4">Tu Carrito</h3>
      {cart.length === 0 ? (
        <p className="text-gray-600">El carrito está vacío</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {cart.map(item => {
            const product = getProductInfo(item.productId);
            if (!product) return null;

            return (
              <div key={item.productId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                {product.imagenUrl && (
                  <img 
                    src={product.imagenUrl} 
                    alt={product.nombre} 
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-bold">{product.nombre}</h4>
                  <p className="text-sm text-gray-600">
                    ${item.precioUnitario.toLocaleString()} x {item.cantidad}
                  </p>
                  <p className="font-bold text-blue-600">
                    Subtotal: ${item.subtotal.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.cantidad - 1)}
                    className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 bg-white border rounded">{item.cantidad}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.cantidad + 1)}
                    className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xl font-bold">Total:</span>
          <span className="text-2xl font-bold text-blue-600">
            ${calculateTotal().toLocaleString()}
          </span>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-bold"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmCart}
            disabled={cart.length === 0}
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar Carrito
          </button>
        </div>
      </div>
    </div>
  );

  const renderShippingStep = () => (
    <div>
      <h3 className="text-2xl font-bold mb-4">Dirección de Envío</h3>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Ingresa la dirección completa de envío
        </label>
        <textarea
          value={direccionEnvio}
          onChange={(e) => setDireccionEnvio(e.target.value)}
          className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Ej: Calle 123 #45-67, Apto 101, Bogotá, Colombia"
        />
      </div>

      <div className="p-4 bg-gray-50 rounded-lg mb-6">
        <h4 className="font-bold mb-2">Resumen del pedido:</h4>
        <div className="space-y-1">
          {cart.map(item => {
            const product = getProductInfo(item.productId);
            return (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>{product?.nombre} x {item.cantidad}</span>
                <span className="font-medium">${item.subtotal.toLocaleString()}</span>
              </div>
            );
          })}
          <div className="pt-2 border-t flex justify-between font-bold">
            <span>Total:</span>
            <span className="text-blue-600">${calculateTotal().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-bold"
        >
          Volver
        </button>
        <button
          onClick={handleConfirmAddress}
          disabled={!direccionEnvio.trim()}
          className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ir a Pago
        </button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div>
      <h3 className="text-2xl font-bold mb-4">Confirmar Pago</h3>

      <div className="p-4 bg-blue-50 rounded-lg mb-6">
        <p className="text-sm text-blue-800 mb-2">
          📍 <strong>Dirección de envío:</strong>
        </p>
        <p className="text-blue-900">{direccionEnvio}</p>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg mb-6">
        <h4 className="font-bold mb-3">Productos a pagar:</h4>
        <div className="space-y-2">
          {cart.map(item => {
            const product = getProductInfo(item.productId);
            return (
              <div key={item.productId} className="flex justify-between">
                <span>{product?.nombre} x {item.cantidad}</span>
                <span className="font-medium">${item.subtotal.toLocaleString()}</span>
              </div>
            );
          })}
          <div className="pt-3 border-t flex justify-between font-bold text-lg">
            <span>Total a pagar:</span>
            <span className="text-blue-600">${calculateTotal().toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg mb-6">
        <p className="text-sm text-yellow-800">
          ⚠️ Al hacer clic en "Pagar con Mercado Pago", serás redirigido a la plataforma de pago segura de Mercado Pago.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => setCurrentStep(2)}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-bold disabled:opacity-50"
        >
          Volver
        </button>
        <button
          onClick={handlePayment}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Procesando...
            </>
          ) : (
            '💳 Pagar con Mercado Pago'
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Checkout</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        {renderStepIndicator()}

        {currentStep === 1 && renderCartStep()}
        {currentStep === 2 && renderShippingStep()}
        {currentStep === 3 && renderPaymentStep()}
      </div>
    </div>
  );
}

