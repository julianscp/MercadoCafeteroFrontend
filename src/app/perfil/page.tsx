"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Perfil() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (!user) return null; // redirección en progreso

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light p-8">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-neutral">Perfil de Usuario</h1>
        <p className="mb-2"><strong>Nombre:</strong> {user.nombre}</p>
        <p className="mb-2"><strong>Email:</strong> {user.email}</p>
        <p className="mb-2"><strong>Rol:</strong> {user.rol}</p>
        <p className="mb-4"><strong>Verificado:</strong> {user.verificado ? "Sí" : "No"}</p>

        <div className="flex gap-3">
          <button
            onClick={logout}
            className="bg-secondary hover:bg-secondary-light text-text py-2 px-4 rounded"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
