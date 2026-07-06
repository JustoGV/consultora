'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente al login
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--border-strong)] border-t-[var(--primary-600)] mx-auto mb-4"></div>
        <p className="text-sm text-[var(--fg-muted)]">Cargando…</p>
      </div>
    </div>
  );
}
