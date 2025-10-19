'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();  // 👈 ahora también logout
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;                 
    if (!user) {
      router.replace('/auth/login');     
      return;
    }
    if (user.rol !== 'admin') {
      router.replace('/');               
    }
  }, [user, loading, router]);

  if (loading || !user || user.rol !== 'admin') {
    return (
      <div className="min-h-screen bg-background-light text-neutral">
        <header className="sticky top-0 z-50 w-full bg-amber-100/95 backdrop-blur-sm shadow-lg border-b border-amber-200/30">
          <div className="mx-auto max-w-6xl p-4">
            <span className="font-bold text-amber-800 text-lg">☕ Mercado Cafetero - Administración</span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-6">
          <div className="animate-pulse rounded-lg border bg-white p-6 shadow-md">Cargando…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light text-neutral">
      <header className="sticky top-0 z-50 w-full bg-amber-100/95 backdrop-blur-sm shadow-lg border-b border-amber-200/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Link href="/" className="font-bold text-amber-800 text-lg hover:text-amber-700 transition-colors">
            ☕ Mercado Cafetero - Administración
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <NavItem href="/admin/products" pathname={pathname}>Productos</NavItem>
            <NavItem href="/admin/logs" pathname={pathname}>Logs</NavItem>
            <button
              onClick={logout}
              className="rounded-lg px-4 py-2 bg-rose-300/80 hover:bg-rose-400 text-rose-800 font-medium transition-all duration-200 hover:shadow-md"
            >
              Cerrar sesión
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-6">
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
