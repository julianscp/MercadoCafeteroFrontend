"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Login() {
  const { login, user, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirección centralizada según rol, cuando ya tenemos user
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    if (user.rol === "admin") {
      router.replace("/admin");          // admin -> panel
    } else {
      router.replace("/user");               // cliente -> home
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setSubmitting(true);
      await login(email, password);      // guarda user/token en contexto
      // NO navegues aquí; lo hace el useEffect cuando user cambie
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFEAEA] to-[#FFF5F5] p-8">
      <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-6 text-text">Iniciar Sesión</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-[#B33A3A]"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-[#B33A3A]"
            required
          />

          {/* Importante: type='button' para no enviar el form */}
          <div className="mt-2 text-center text-sm text-neutral">
            ¿Olvidaste tu contraseña?{" "}
            <button
              type="button"
              onClick={() => router.push("/auth/request-password-reset")}
              className="text-secondary hover:text-secondary-light font-semibold"
            >
              Recuperar contraseña
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="primary py-3 mt-2 shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        {/* Importante: type='button' fuera del form igual es seguro, pero lo dejamos claro */}
        <div className="mt-6 text-center text-sm text-neutral">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            onClick={() => router.push("/auth/registro")}
            className="text-secondary hover:text-secondary-light font-semibold"
          >
            Regístrate
          </button>
        </div>
      </div>
    </div>
  );
}
