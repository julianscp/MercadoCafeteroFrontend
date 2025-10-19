"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  nombre: string;
  direccion: string;
  telefono: string;
  rol: string;
  verificado: boolean;
}

interface RegisterResponse {
  message: string;
  user: User;
}

export default function Register() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    nombre: "",
    direccion: "",
    telefono: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post<RegisterResponse>(
        "/autenticacion/registro",
        form
      );
      console.log(res.data.message);
      // 👇 Redirige a la página de confirmación
      router.push(`/auth/confirm-email?email=${form.email}`);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error al registrar el usuario"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFEAEA] to-[#FFF5F5] p-8">
      <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-6 text-text">Crear Cuenta</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre completo"
            value={form.nombre}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-[#B33A3A]"
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-[#B33A3A]"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-[#B33A3A]"
          />
          <input
            type="text"
            name="direccion"
            placeholder="Dirección"
            value={form.direccion}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-[#B33A3A]"
          />
          <input
            type="tel"
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-[#B33A3A]"
          />

          <button
            type="submit"
            className="primary py-3 mt-2 shadow-md hover:shadow-lg transition-all"
          >
            Registrarse
          </button>
        </form>
      </div>
    </div>
  );
}
