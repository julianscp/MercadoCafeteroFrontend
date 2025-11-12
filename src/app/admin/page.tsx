'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a /admin/dashboard cuando alguien entre a /admin
    router.replace('/admin/dashboard');
  }, [router]);

  return null;
}
