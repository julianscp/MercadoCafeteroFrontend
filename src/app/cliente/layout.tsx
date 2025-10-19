"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.rol !== 'cliente')) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.rol !== 'cliente') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== BANNER NUEVO DISEÑO - CAMBIO VISIBLE ===== */}
      {/* Banner fijo con colores cálidos - NUEVO DISEÑO */}
      <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-100 to-orange-100 backdrop-blur-sm shadow-xl border-b-2 border-amber-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <Link href="/user" className="font-bold text-amber-900 text-xl hover:text-amber-800 transition-colors flex items-center gap-3">
            <span className="text-3xl animate-pulse">☕</span>
            <span className="bg-gradient-to-r from-amber-800 to-orange-800 bg-clip-text text-transparent">
              Mercado Cafetero
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-3 text-sm">
            <NavItem href="/cliente/perfil" pathname={pathname}>Mi Perfil</NavItem>
            <NavItem href="/cliente/carrito" pathname={pathname}>Carrito</NavItem>
            <NavItem href="/cliente/reclamos" pathname={pathname}>Reclamos</NavItem>
            <NavItem href="/user" pathname={pathname}>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Productos
              </span>
            </NavItem>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-800 font-bold bg-gradient-to-r from-amber-200 to-orange-200 px-3 py-2 rounded-lg border border-amber-300">
              👋 Hola, {user.nombre}
            </span>
            <button
              onClick={logout}
              className="rounded-xl px-5 py-3 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-2 border-red-300"
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-amber-200/30 bg-amber-50/50">
          <div className="px-4 py-3 space-y-2">
            <NavItem href="/cliente/perfil" pathname={pathname}>Mi Perfil</NavItem>
            <NavItem href="/cliente/carrito" pathname={pathname}>Carrito</NavItem>
            <NavItem href="/cliente/reclamos" pathname={pathname}>Reclamos</NavItem>
            <NavItem href="/user" pathname={pathname}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Productos
              </span>
            </NavItem>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}

function NavItem({
  href,
  pathname,
  children,
}: {
  href: string;
  pathname: string | null;
  children: React.ReactNode;
}) {
  const active = pathname?.startsWith(href);
  return (
    <Link
      href={href}
      className={`rounded-xl px-5 py-3 font-semibold transition-all duration-300 transform hover:scale-105 ${
        active 
          ? 'bg-gradient-to-r from-amber-300 to-orange-300 text-amber-900 shadow-lg border-2 border-amber-400' 
          : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 hover:from-amber-200 hover:to-orange-200 hover:text-amber-900 hover:shadow-md border border-amber-200'
      }`}
    >
      {children}
    </Link>
  );
}
