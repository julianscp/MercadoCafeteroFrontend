'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndex() {
  const router = useRouter();

  useEffect(() => {
    // apenas alguien entre a /admin lo mandamos a /admin/products
    router.replace('/admin/products');
  }, [router]);

  return null;
}
