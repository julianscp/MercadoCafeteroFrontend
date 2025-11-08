'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminHeader from './admin-header';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <AdminHeader pathname={pathname} logout={logout} />
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <div className="animate-pulse rounded-lg border bg-white p-6 shadow-md">Cargando…</div>
        </main>
      </div>
    );
  }

  // Layout común para todas las páginas de admin
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <AdminHeader pathname={pathname} logout={logout} />
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
