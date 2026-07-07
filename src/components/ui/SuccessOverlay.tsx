'use client';

import { useEffect, useRef } from 'react';

/**
 * SuccessOverlay (UX-14) — confirmación de éxito centrada y animada.
 * Aparece en el centro de la pantalla con un check que se dibuja, se mantiene
 * un momento perceptible (~1.4s) y llama onDone (típicamente para navegar).
 * CSS keyframes puras (no hay framer-motion en el repo). Respeta reduced-motion.
 */
export function SuccessOverlay({
  show,
  title,
  subtitle,
  onDone,
}: {
  show: boolean;
  title: string;
  subtitle?: string;
  onDone?: () => void;
}) {
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    if (!show) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const total = reduce ? 950 : 1500;
    const t = setTimeout(() => doneRef.current?.(), total);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[120] flex items-center justify-center"
    >
      <div className="so-backdrop absolute inset-0 bg-[color-mix(in_srgb,var(--neutral-900)_42%,transparent)] backdrop-blur-[2px]" />

      <div className="so-card relative flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-10 py-9 shadow-[var(--shadow-2xl)]">
        <span className="so-ring flex size-20 items-center justify-center rounded-full bg-[var(--primary-50)]">
          <svg viewBox="0 0 52 52" className="size-14" fill="none" aria-hidden="true">
            <circle
              className="so-circle"
              cx="26"
              cy="26"
              r="23"
              stroke="var(--primary-600)"
              strokeWidth="2.5"
              pathLength={1}
            />
            <path
              className="so-check"
              d="M15 27 l7.5 7.5 L38 19"
              stroke="var(--primary-600)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
            />
          </svg>
        </span>

        <div className="so-text flex flex-col items-center gap-1 text-center">
          <p className="text-xl font-semibold text-[var(--fg)]">{title}</p>
          {subtitle ? (
            <p className="max-w-[18rem] text-sm text-[var(--fg-muted)]">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes so-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes so-pop {
          0%   { opacity: 0; transform: scale(0.9) }
          60%  { opacity: 1; transform: scale(1.02) }
          100% { opacity: 1; transform: scale(1) }
        }
        @keyframes so-draw { to { stroke-dashoffset: 0 } }
        .so-backdrop { animation: so-fade 200ms ease both; }
        .so-card { animation: so-pop 340ms cubic-bezier(0.22,1,0.36,1) both; }
        .so-circle {
          stroke-dasharray: 1; stroke-dashoffset: 1;
          animation: so-draw 480ms ease 0.12s both;
        }
        .so-check {
          stroke-dasharray: 1; stroke-dashoffset: 1;
          animation: so-draw 320ms ease 0.52s both;
        }
        .so-text { animation: so-fade 320ms ease 0.42s both; }
        @media (prefers-reduced-motion: reduce) {
          .so-backdrop, .so-card, .so-text { animation: so-fade 160ms ease both; }
          .so-circle, .so-check { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
