'use client';

import Link from 'next/link';
import { useState } from 'react';

interface AdminHeaderProps {
  pathname: string | null;
  logout: () => void;
}

function NavItem({
  href,
  pathname,
  children,
  onClick,
}: {
  href: string;
  pathname: string | null;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const active = pathname?.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg px-4 py-2 font-medium transition-all duration-200 ${
        active 
          ? 'bg-amber-200/60 text-amber-900 shadow-md' 
          : 'bg-amber-50/60 text-amber-800 hover:bg-amber-200/40 hover:text-amber-900 hover:shadow-sm'
      }`}
    >
      {children}
    </Link>
  );
}

export default function AdminHeader({ pathname, logout }: AdminHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-amber-100/95 backdrop-blur-sm shadow-lg border-b border-amber-200/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4 px-6">
        {/* Logo - siempre visible */}
        <Link href="/" className="font-bold text-amber-800 text-lg hover:text-amber-700 transition-colors">
          ☕ Mercado Cafetero - Administración
        </Link>

        {/* Desktop: Navegación horizontal en una sola línea */}
        <nav className="hidden lg:flex items-center gap-3 text-sm">
          <NavItem href="/admin/products" pathname={pathname}>Productos</NavItem>
          <NavItem href="/admin/orders" pathname={pathname}>Pedidos</NavItem>
          <NavItem href="/admin/ventas" pathname={pathname}>Ventas</NavItem>
          <NavItem href="/admin/reclamos" pathname={pathname}>Reclamos</NavItem>
          <NavItem href="/admin/logs" pathname={pathname}>Logs</NavItem>
          <button
            onClick={logout}
            className="rounded-lg px-4 py-2 bg-rose-300/80 hover:bg-rose-400 text-rose-800 font-medium transition-all duration-200 hover:shadow-md"
          >
            Cerrar sesión
          </button>
        </nav>

        {/* Mobile: Botón hamburguesa */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-amber-200/60 text-amber-900 hover:bg-amber-300/60 transition-colors min-w-[44px] min-h-[44px]"
          aria-label="Menú de navegación"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile: Menú desplegable */}
      {menuOpen && (
        <nav className="lg:hidden flex flex-col gap-2 px-4 pb-4">
          <NavItem href="/admin/products" pathname={pathname} onClick={() => setMenuOpen(false)}>Productos</NavItem>
          <NavItem href="/admin/orders" pathname={pathname} onClick={() => setMenuOpen(false)}>Pedidos</NavItem>
          <NavItem href="/admin/ventas" pathname={pathname} onClick={() => setMenuOpen(false)}>Ventas</NavItem>
          <NavItem href="/admin/reclamos" pathname={pathname} onClick={() => setMenuOpen(false)}>Reclamos</NavItem>
          <NavItem href="/admin/logs" pathname={pathname} onClick={() => setMenuOpen(false)}>Logs</NavItem>
          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            className="rounded-lg px-4 py-2 bg-rose-300/80 hover:bg-rose-400 text-rose-800 font-medium transition-all duration-200 hover:shadow-md text-sm min-h-[44px] w-full"
          >
            Cerrar sesión
          </button>
        </nav>
      )}
    </header>
  );
}

