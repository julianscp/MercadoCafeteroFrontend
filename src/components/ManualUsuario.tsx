"use client";

import { useState } from "react";

export default function ManualUsuario() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#B33A3A] text-white px-6 py-3 rounded-lg shadow-lg hover:bg-[#8B2A2A] transition-all flex items-center gap-2 z-40"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Manual de Usuario
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#B33A3A] text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Manual de Usuario</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Contenido */}
            <div className="p-8 space-y-8">
              {/* Sección 1: Introducción */}
              <section>
                <h3 className="text-xl font-semibold mb-4 text-[#B33A3A]">
                  Introducción
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Este manual te guiará en el uso de la plataforma Mercado
                  Cafetero. Aquí encontrarás información sobre cómo registrarte,
                  iniciar sesión, realizar compras y gestionar tu cuenta.
                </p>
              </section>

              {/* Sección 2: Registro */}
              <section>
                <h3 className="text-xl font-semibold mb-4 text-[#B33A3A]">
                  Registro de Usuario
                </h3>
                <div className="space-y-3 text-gray-700">
                  <p>
                    Para crear una cuenta en la plataforma, sigue estos pasos:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>
                      Haz clic en el botón "Regístrate" en la página de inicio
                      de sesión
                    </li>
                    <li>
                      Completa el formulario con tus datos personales:
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li>Nombre completo</li>
                        <li>Correo electrónico</li>
                        <li>Contraseña (mínimo 6 caracteres)</li>
                        <li>Dirección de residencia</li>
                        <li>Número de teléfono</li>
                      </ul>
                    </li>
                    <li>
                      Revisa tu correo electrónico para verificar tu cuenta
                    </li>
                    <li>
                      Ingresa el código de verificación que recibiste
                    </li>
                    <li>Tu cuenta estará lista para usar</li>
                  </ol>
                </div>
              </section>

              {/* Sección 3: Inicio de Sesión */}
              <section>
                <h3 className="text-xl font-semibold mb-4 text-[#B33A3A]">
                  Inicio de Sesión
                </h3>
                <div className="space-y-3 text-gray-700">
                  <p>Para acceder a tu cuenta:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>
                      Ingresa tu correo electrónico y contraseña en los campos
                      correspondientes
                    </li>
                    <li>
                      Haz clic en el botón "Ingresar"
                    </li>
                    <li>
                      Serás redirigido automáticamente según tu tipo de cuenta
                    </li>
                  </ol>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
                    <p className="text-sm">
                      Si olvidaste tu contraseña, haz clic en "Recuperar
                      contraseña" y sigue las instrucciones que recibirás por
                      correo.
                    </p>
                  </div>
                </div>
              </section>

              {/* Sección 4: Cliente */}
              <section>
                <h3 className="text-xl font-semibold mb-4 text-[#B33A3A]">
                  Funcionalidades para Clientes
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Explorar Productos</h4>
                    <p className="text-gray-700">
                      Navega por el catálogo de productos disponibles. Puedes
                      ver detalles, precios y disponibilidad de cada artículo.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Ver Detalles</h4>
                    <p className="text-gray-700">
                      Haz clic en "Ver Detalles" para obtener información
                      completa sobre un producto, incluyendo descripción,
                      características y stock disponible.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Carrito de Compras</h4>
                    <p className="text-gray-700">
                      Agrega productos a tu carrito y ajusta las cantidades
                      según necesites. El carrito muestra el total de tu compra
                      en tiempo real.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Realizar Pedido</h4>
                    <p className="text-gray-700">
                      Una vez que hayas seleccionado tus productos, procede a
                      realizar tu pedido. Recibirás una confirmación con los
                      detalles de tu compra.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Ver Mis Pedidos</h4>
                    <p className="text-gray-700">
                      Accede a la sección "Mis Pedidos" para ver el historial
                      de tus compras, estados y detalles de cada orden.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Perfil de Usuario</h4>
                    <p className="text-gray-700">
                      Actualiza tu información personal, dirección y datos de
                      contacto desde tu perfil.
                    </p>
                  </div>
                </div>
              </section>

              {/* Sección 5: Administrador */}
              <section>
                <h3 className="text-xl font-semibold mb-4 text-[#B33A3A]">
                  Funcionalidades para Administradores
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Gestión de Productos</h4>
                    <p className="text-gray-700">
                      Crea, edita y elimina productos del catálogo. Puedes
                      subir imágenes, actualizar precios y gestionar el stock
                      disponible.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">
                      Control de Inventario
                    </h4>
                    <p className="text-gray-700">
                      Monitorea el stock de productos y recibe alertas cuando
                      el inventario esté por debajo del mínimo establecido.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Gestión de Pedidos</h4>
                    <p className="text-gray-700">
                      Visualiza todos los pedidos realizados por los clientes,
                      cambia estados y gestiona el proceso de entrega.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Gestión de Clientes</h4>
                    <p className="text-gray-700">
                      Administra las cuentas de los clientes, visualiza sus
                      pedidos y gestiona reclamos.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Logs del Sistema</h4>
                    <p className="text-gray-700">
                      Revisa los registros de actividad del sistema para
                      monitorear el funcionamiento de la plataforma.
                    </p>
                  </div>
                </div>
              </section>

              {/* Sección 6: Consejos */}
              <section>
                <h3 className="text-xl font-semibold mb-4 text-[#B33A3A]">
                  Consejos de Uso
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Mantén tu contraseña segura y no la compartas con nadie
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Verifica siempre el stock disponible antes de agregar
                      productos al carrito
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Revisa los detalles de tu pedido antes de confirmar la
                      compra
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Mantén actualizada tu información de contacto para
                      recibir notificaciones importantes
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Si tienes problemas, revisa la sección de reclamos o
                      contacta al soporte
                    </span>
                  </li>
                </ul>
              </section>

              {/* Sección 7: Soporte */}
              <section>
                <h3 className="text-xl font-semibold mb-4 text-[#B33A3A]">
                  Soporte
                </h3>
                <p className="text-gray-700">
                  Si tienes preguntas o necesitas ayuda adicional, puedes
                  contactar al equipo de soporte a través de la sección de
                  reclamos o enviando un correo electrónico a{" "}
                  <a
                    href="mailto:soporte@mercadocafetero.com"
                    className="text-[#B33A3A] hover:underline"
                  >
                    soporte@mercadocafetero.com
                  </a>
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 text-center text-sm text-gray-600">
              <p>Manual de Usuario v1.0 - Mercado Cafetero</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

