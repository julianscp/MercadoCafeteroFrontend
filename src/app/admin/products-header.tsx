'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ProductsHeaderProps {
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
      className={`rounded-lg px-3 sm:px-4 py-2 font-medium transition-all duration-200 text-xs sm:text-sm min-h-[44px] flex items-center justify-center ${
        active 
          ? 'bg-amber-200/60 text-amber-900 shadow-md' 
          : 'bg-amber-50/60 text-amber-800 hover:bg-amber-200/40 hover:text-amber-900 hover:shadow-sm'
      }`}
    >
      {children}
    </Link>
  );
}

export default function ProductsHeader({ pathname, logout }: ProductsHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-amber-100/95 backdrop-blur-sm shadow-lg border-b border-amber-200/30">
      <div className="mx-auto max-w-7xl">
        {/* Barra superior con logo y botón menú móvil */}
        <div className="flex items-center justify-between p-3 sm:p-4 px-4 sm:px-6">
          <Link href="/" className="font-bold text-amber-800 text-base sm:text-lg hover:text-amber-700 transition-colors truncate flex-1 min-w-0">
            <span className="hidden sm:inline">☕ Mercado Cafetero - Administración</span>
            <span className="sm:hidden">☕ Mercado Cafetero</span>
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden ml-2 w-10 h-10 flex items-center justify-center rounded-lg bg-amber-200/60 text-amber-900 hover:bg-amber-300/60 transition-colors min-w-[44px] min-h-[44px]"
            aria-label="Menú de navegación"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Menú de navegación - Desktop: siempre visible, Mobile: desplegable */}
        <nav className={`lg:flex items-center gap-2 sm:gap-3 text-sm px-4 sm:px-6 pb-3 sm:pb-4 lg:pb-0 ${
          menuOpen ? 'flex flex-col' : 'hidden lg:flex'
        }`}>
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
            className="rounded-lg px-3 sm:px-4 py-2 bg-rose-300/80 hover:bg-rose-400 text-rose-800 font-medium transition-all duration-200 hover:shadow-md text-xs sm:text-sm min-h-[44px] w-full lg:w-auto"
          >
            Cerrar sesión
          </button>
        </nav>
      </div>
    </header>
  );
}
