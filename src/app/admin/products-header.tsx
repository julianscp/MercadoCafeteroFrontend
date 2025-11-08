'use client';

import Link from 'next/link';

interface ProductsHeaderProps {
  pathname: string | null;
  logout: () => void;
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

export default function ProductsHeader({ pathname, logout }: ProductsHeaderProps) {

  return (
    <header className="sticky top-0 z-50 w-full bg-amber-100/95 backdrop-blur-sm shadow-lg border-b border-amber-200/30">
      <div className="max-w-7xl mx-auto flex">
        {/* Espacio reservado para la barra lateral (blanco para que coincida) */}
        <div className="w-64 flex-shrink-0 bg-white border-r-2 border-amber-200"></div>
        
        {/* Navegación horizontal */}
        <div className="flex-1 flex items-center justify-between p-4 px-6 bg-amber-100/95">
          <Link href="/" className="font-bold text-amber-800 text-lg hover:text-amber-700 transition-colors">
            ☕ Mercado Cafetero - Administración
          </Link>
          <nav className="flex items-center gap-3 text-sm">
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
        </div>
      </div>
    </header>
  );
}
