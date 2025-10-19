"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ResetPassword() {
  const [tokenInput, setTokenInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      const message = await resetPassword(tokenInput, newPassword);
      setMsg(message);
      setNewPassword("");
      setTokenInput("");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Error al restablecer contraseña");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light p-8">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-neutral">Restablecer Contraseña</h1>

        {msg && <p className="text-green-600 mb-4">{msg}</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <input
          type="text"
          placeholder="Token recibido en tu correo"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          className="w-full p-3 mb-4 border rounded"
        />

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-3 mb-4 border rounded"
        />

        <button type="submit" className="w-full bg-primary hover:bg-primary-light text-text py-3 rounded font-semibold">
          Cambiar Contraseña
        </button>
      </form>
    </div>
  );
}
