"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex">
      {/* Izquierda 70% */}
      <div className="w-7/12 p-16 flex flex-col justify-center bg-[#cf6f6f]">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-6xl font-extrabold mb-6 text-text">
            Bienvenido a Mercado Cafetero
          </h1>
          <p className="text-lg mb-4 leading-relaxed text-text">
            Tu supermercado en línea de confianza, con productos frescos y de calidad.
          </p>
          <p className="text-lg mb-2 font-semibold text-text">Horario de atención:</p>
          <ul className="list-disc list-inside mb-4 text-text">
            <li>Lunes a Viernes: 7:00 - 20:00</li>
            <li>Sábados: 8:00 - 18:00</li>
            <li>Domingos: 9:00 - 14:00</li>
          </ul>
          <p className="text-lg text-text">
            Compra fácil, rápido y seguro desde casa.
          </p>
        </div>
      </div>

      {/* Derecha 30% */}
      <div className="w-5/12 p-16 flex flex-col justify-center items-center border-l border-neutral/30 bg-gradient-to-r from-[#cf6f6f] to-[#f3dfdf] ">
        <h2 className="text-3xl font-semibold mb-4 text-text">Tu cuenta</h2>
        <p className="text-center text-sm mb-4 text-black">
          Ingresa y explora nuestros productos, descubre novedades y aprovecha descuentos especiales.
        </p>
        <button
          onClick={() => router.push("/auth/login")}
          className="primary w-100 mb-4 py-3 shadow-md hover:shadow-lg transition-all"
        >
          Iniciar Sesión
        </button>
        <p className="text-center text-sm mb-4 text-black">
          Únete a nuestra plataforma y disfruta de los mejores productos y ofertas exclusivas.
        </p>  
        <button
          onClick={() => router.push("/auth/registro")}
          className="secondary w-100 py-3 shadow-md hover:shadow-lg transition-all"
        >
          Registrarse
        </button>
      </div>

    </div>
  );
}
