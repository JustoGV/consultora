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
    <div
      className="min-h-dvh flex items-center justify-center"
      style={{ background: 'hsl(213 38% 9%)' }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner recto en la línea de marca GV-G (cyan sobre ink-deep) */}
        <div
          className="h-9 w-9 animate-spin"
          style={{
            border: '2px solid hsl(211 23% 49% / 0.25)',
            borderTopColor: 'hsl(189 94% 43%)',
          }}
        />
        <p
          className="text-xs uppercase"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            letterSpacing: '0.18em',
            color: 'hsl(211 23% 49%)',
          }}
        >
          Cargando
        </p>
      </div>
    </div>
  );
}
