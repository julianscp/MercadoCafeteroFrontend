"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RequestPasswordReset() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter(); 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    try {
      const res = await api.post<{ message: string }>("/autenticacion/request-password-reset", { email });
      setSuccess(res.data.message);
      router.replace("/auth/reset-password"); 
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al enviar solicitud de recuperación");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light p-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-neutral">
          Recuperar Contraseña
        </h1>

        <h2 className="text-base font-light mb-6 text-neutral">
          Ingresa tu correo electrónico para recibir un codigo de recuperación
        </h2>

        {success && <p className="text-green-600 mb-4">{success}</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <input
          type="email"
          placeholder="Ingresa tu correo"
          className="w-full p-3 mb-4 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          className="primary w-full mb-4 py-3 shadow-md hover:shadow-lg transition-all"
        >
          Enviar enlace
        </button>
      </form>
    </div>
  );
}
