'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/shell/Topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  // Preferencia de colapso restaurada en el initializer (evita setState-in-effect).
  // El shell solo se renderiza tras `mounted`, así que no hay mismatch de hidratación.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('sidebar:collapsed') === '1';
  });

  useEffect(() => {
    // defer state update to avoid synchronous setState inside effect (and avoid hydration warnings)
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('sidebar:collapsed', next ? '1' : '0');
      } catch {
        /* localStorage no disponible: ignorar */
      }
      return next;
    });
  };

  useEffect(() => {
    if (mounted && !user) {
      router.push('/login');
    }
  }, [user, router, mounted]);

  // Durante SSR y primera carga, mostrar loading
  if (!mounted) {
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-sunken)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-[var(--primary-600)] mx-auto mb-4"></div>
          <p className="text-[var(--fg-muted)]">Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg)]">
      <Sidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
