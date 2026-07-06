'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import Image from 'next/image';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { Eye, EyeOff, ShieldAlert, WifiOff } from 'lucide-react';

// Tipografía de marca GV-G — cargada SOLO en esta página (el resto del app usa Lexend).
// Fraunces = voz display de la marca · Inter = UI/body · JetBrains Mono = eyebrows/metadata.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-gvg',
  display: 'swap',
});

// Textura noise de la marca (data-uri exacto de su globals.css).
const NOISE_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.45 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorKind, setErrorKind] = useState<'credenciales' | 'red' | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Dispara la coreografía de entrada (fade-up escalonado) en el primer paint.
  // doble rAF para garantizar que el estado inicial (opacity 0) se pinte antes
  // de transicionar; timeout de respaldo por si el rAF queda throttleado.
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setMounted(true)),
    );
    const t = setTimeout(() => setMounted(true), 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  // Limpiar localStorage corrupto al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('auth_user');
      if (userJson === 'undefined' || userJson === 'null') {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorKind(null);
    setLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        router.push('/dashboard');
        return;
      }

      setErrorKind('credenciales');
      setError('Correo o contraseña incorrectos.');
    } catch (err) {
      // NOTE: no loguear el objeto de error completo — puede incluir config/headers con el token (AUD-17).
      const error = err as AxiosError;

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setErrorKind('red');
        setError('Tiempo de espera agotado. Intentá nuevamente.');
      } else if (error.response?.status === 401) {
        setErrorKind('credenciales');
        setError('Correo o contraseña incorrectos.');
      } else if (!error.response) {
        setErrorKind('red');
        setError('No se pudo conectar con el servidor. Verificá tu conexión.');
      } else {
        setErrorKind('red');
        setError('Error del servidor. Intentá de nuevo en unos minutos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const invalid = errorKind === 'credenciales' || undefined;

  return (
    <div
      className={`gvg ${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}
      style={
        {
          '--canvas': '0 0% 100%',
          '--paper': '210 36% 96%',
          '--paper-cyan': '188 60% 95%',
          '--ink': '213 31% 15%',
          '--ink-deep': '213 38% 9%',
          '--ink-soft': '211 33% 30%',
          '--dim': '211 23% 49%',
          '--rule': '212 35% 89%',
          '--rule-strong': '212 32% 80%',
          '--accent': '189 94% 43%',
          '--accent-bright': '187 92% 49%',
          '--accent-ink': '192 84% 31%',
          '--accent-soft': '188 70% 88%',
          '--accent-wash': '188 65% 94%',
          '--navy': '211 39% 23%',
          '--ease-ed': 'cubic-bezier(0.22, 1, 0.36, 1)',
        } as React.CSSProperties
      }
    >
      <style>{gvgStyles}</style>

      <div className="gvg-root">
        {/* ============================================================
            PANEL DE MARCA — ink-deep. En desktop es la columna izquierda;
            en mobile se comprime a una franja superior.
            ============================================================ */}
        <aside className="gvg-brand">
          <div className="gvg-brand-grid" aria-hidden="true" />
          <div className="gvg-brand-noise" aria-hidden="true" />
          <div className="gvg-brand-glow" aria-hidden="true" />

          <div className="gvg-brand-inner">
            <div
              className="gvg-reveal gvg-brand-logo"
              style={{ '--d': '40ms' } as React.CSSProperties}
              data-in={mounted}
            >
              <Image
                src="/logo-gvg-footer.png"
                alt="GV-G Consulting"
                width={540}
                height={540}
                priority
                className="gvg-logo-img"
              />
            </div>

            <div className="gvg-brand-headline">
              <p
                className="gvg-reveal gvg-eyebrow gvg-eyebrow-cyan"
                style={{ '--d': '160ms' } as React.CSSProperties}
                data-in={mounted}
              >
                Consultoría estratégica de salud · Argentina
              </p>
              <h1
                className="gvg-reveal gvg-display"
                style={{ '--d': '240ms' } as React.CSSProperties}
                data-in={mounted}
              >
                Análisis verificable.
                <br />
                <em>Decisiones defendibles.</em>
              </h1>
              <div
                className="gvg-reveal gvg-accent-line"
                style={{ '--d': '440ms' } as React.CSSProperties}
                data-in={mounted}
                aria-hidden="true"
              />
              <p
                className="gvg-reveal gvg-brand-sub"
                style={{ '--d': '520ms' } as React.CSSProperties}
                data-in={mounted}
              >
                Consultoría para Obras Sociales, Prepagas y Hospitales. Gestión de
                discapacidad, certificados y alertas proactivas en un solo lugar.
              </p>
            </div>

            <p
              className="gvg-reveal gvg-brand-foot"
              style={{ '--d': '600ms' } as React.CSSProperties}
              data-in={mounted}
            >
              <span>Acceso exclusivo para personal autorizado</span>
              <span className="gvg-mono-meta">v2 · 2026</span>
            </p>
          </div>
        </aside>

        {/* ============================================================
            PANEL DE FORMULARIO — canvas blanco con grid sutil.
            ============================================================ */}
        <main className="gvg-form-side">
          <div className="gvg-form-grid" aria-hidden="true" />

          <div className="gvg-form-wrap">
            {/* Logo para fondo claro — solo desktop (en mobile ya está en la franja) */}
            <div
              className="gvg-reveal gvg-form-logo"
              style={{ '--d': '80ms' } as React.CSSProperties}
              data-in={mounted}
            >
              <Image
                src="/logo-gvg.png"
                alt="GV-G Consulting"
                width={540}
                height={540}
                priority
                className="gvg-logo-img"
              />
            </div>

            <div className="gvg-card">
              <div className="gvg-card-rule" aria-hidden="true" />

              <div className="gvg-card-body">
                <p
                  className="gvg-reveal gvg-eyebrow"
                  style={{ '--d': '160ms' } as React.CSSProperties}
                  data-in={mounted}
                >
                  Acceso al sistema
                </p>
                <h2
                  className="gvg-reveal gvg-title"
                  style={{ '--d': '220ms' } as React.CSSProperties}
                  data-in={mounted}
                >
                  Iniciar sesión
                </h2>
                <p
                  className="gvg-reveal gvg-title-sub"
                  style={{ '--d': '280ms' } as React.CSSProperties}
                  data-in={mounted}
                >
                  Ingresá tus credenciales para continuar.
                </p>

                <form onSubmit={handleSubmit} noValidate className="gvg-form">
                  <div
                    className="gvg-reveal gvg-field"
                    style={{ '--d': '340ms' } as React.CSSProperties}
                    data-in={mounted}
                  >
                    <label htmlFor="email" className="gvg-label">
                      Correo electrónico
                    </label>
                    <div className="gvg-input-wrap">
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nombre@organizacion.com"
                        aria-invalid={invalid}
                        required
                        className="gvg-input"
                      />
                      <span className="gvg-input-underline" aria-hidden="true" />
                    </div>
                  </div>

                  <div
                    className="gvg-reveal gvg-field"
                    style={{ '--d': '400ms' } as React.CSSProperties}
                    data-in={mounted}
                  >
                    <label htmlFor="password" className="gvg-label">
                      Contraseña
                    </label>
                    <div className="gvg-input-wrap">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        aria-invalid={invalid}
                        required
                        className="gvg-input gvg-input-pw"
                      />
                      <span className="gvg-input-underline" aria-hidden="true" />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="gvg-pw-toggle"
                      >
                        {showPassword ? <EyeOff className="gvg-icon" /> : <Eye className="gvg-icon" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div role="alert" className="gvg-alert" data-kind={errorKind ?? 'credenciales'}>
                      {errorKind === 'red' ? (
                        <WifiOff className="gvg-alert-icon" aria-hidden="true" />
                      ) : (
                        <ShieldAlert className="gvg-alert-icon" aria-hidden="true" />
                      )}
                      <p className="gvg-alert-text">{error}</p>
                    </div>
                  )}

                  <div
                    className="gvg-reveal gvg-field"
                    style={{ '--d': '460ms' } as React.CSSProperties}
                    data-in={mounted}
                  >
                    <button type="submit" disabled={loading} className="gvg-submit" data-loading={loading}>
                      <span className="gvg-submit-fill" aria-hidden="true" />
                      <span className="gvg-submit-label">
                        {loading ? (
                          <>
                            <span className="gvg-dots" aria-hidden="true">
                              <span />
                              <span />
                              <span />
                            </span>
                            Verificando
                          </>
                        ) : (
                          'Ingresar al sistema'
                        )}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <p
              className="gvg-reveal gvg-form-foot"
              style={{ '--d': '540ms' } as React.CSSProperties}
              data-in={mounted}
            >
              <span className="gvg-mono-meta">GV-G CONSULTING</span>
              <span className="gvg-foot-dot" aria-hidden="true" />
              <span className="gvg-mono-meta">Análisis verificable. Decisiones defendibles.</span>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   Estilos de marca GV-G — scoped a `.gvg`. Radius 0, bordes 1px rule,
   sombra editorial, grid-lines, noise, motion editorial (cubic-bezier
   0.22,1,0.36,1). No toca el design system global (Lexend).
   ============================================================ */
const gvgStyles = `
.gvg {
  font-family: var(--font-inter), system-ui, sans-serif;
  color: hsl(var(--ink));
}
.gvg *,
.gvg *::before,
.gvg *::after { box-sizing: border-box; }

.gvg-root {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  width: 100%;
  background: hsl(var(--canvas));
}

/* ---------- PANEL DE MARCA ---------- */
.gvg-brand {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(120% 90% at 8% 0%, hsl(211 39% 16%) 0%, transparent 55%),
    linear-gradient(155deg, hsl(var(--ink-deep)) 0%, hsl(213 40% 7%) 100%);
  color: hsl(var(--canvas));
  padding: 1.75rem 1.5rem 1.5rem;
}
.gvg-brand-grid,
.gvg-form-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, hsl(var(--canvas) / 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, hsl(var(--canvas) / 0.05) 1px, transparent 1px);
  background-size: 80px 80px;
  mask-image: radial-gradient(120% 100% at 0% 0%, #000 30%, transparent 85%);
}
.gvg-brand-noise {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: ${NOISE_URI};
  opacity: 0.05;
  mix-blend-mode: overlay;
}
/* Glow de acento cyan — radial puro (sin filter:blur, que encarece el paint). */
.gvg-brand-glow {
  position: absolute;
  right: -8%;
  bottom: -18%;
  width: 62%;
  height: 62%;
  pointer-events: none;
  background: radial-gradient(
    closest-side,
    hsl(var(--accent) / 0.16),
    hsl(var(--accent) / 0.05) 45%,
    transparent 72%
  );
}
.gvg-brand-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  height: 100%;
}

/* Los PNG de marca son cuadrados (2048²) con padding transparente interno,
   así que el marco visible se ve ~½ de la caja: se sobredimensiona para que
   el trazo del logo lea, y se recorta el aire con un margen negativo.
   Selector con doble clase (.gvg .gvg-logo-img) para ganarle en especificidad
   a los estilos que next/image inyecta sobre el <img>. */
.gvg .gvg-logo-img {
  height: 4.5rem;
  width: auto;
  max-width: none;
  object-fit: contain;
  margin: -0.9rem 0 -0.9rem -0.65rem;
}
.gvg .gvg-form-logo .gvg-logo-img { height: 4.75rem; }

.gvg-eyebrow {
  font-family: var(--font-mono-gvg), ui-monospace, monospace;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  line-height: 1;
  color: hsl(var(--dim));
}
.gvg-eyebrow-cyan { color: hsl(var(--accent-bright)); }

.gvg-brand-headline { display: flex; flex-direction: column; }
.gvg-eyebrow-cyan { margin-bottom: 1.25rem; }
.gvg-display {
  font-family: var(--font-fraunces), Georgia, serif;
  font-weight: 300;
  font-size: clamp(1.5rem, 4.6vw, 3.15rem);
  line-height: 1.02;
  letter-spacing: -0.02em;
  color: hsl(var(--canvas));
  margin: 0;
}
.gvg-display em {
  font-style: italic;
  font-weight: 400;
  color: hsl(var(--accent-bright));
}

.gvg-accent-line {
  height: 2px;
  width: 88px;
  margin: 1.75rem 0 1.5rem;
  background: linear-gradient(90deg, hsl(var(--accent-bright)), hsl(var(--accent)));
  transform-origin: left center;
}
.gvg-brand-sub {
  max-width: 36ch;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: hsl(210 20% 74%);
  margin: 0;
}
.gvg-brand-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.75rem;
  color: hsl(var(--dim));
  margin: 0;
}
.gvg-mono-meta {
  font-family: var(--font-mono-gvg), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  color: hsl(var(--dim));
}

/* ---------- PANEL DE FORMULARIO ---------- */
.gvg-form-side {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem 2.5rem;
  background: hsl(var(--canvas));
}
.gvg-form-grid {
  background-image:
    linear-gradient(to right, hsl(var(--rule) / 0.5) 1px, transparent 1px),
    linear-gradient(to bottom, hsl(var(--rule) / 0.5) 1px, transparent 1px);
  mask-image: radial-gradient(120% 90% at 100% 0%, #000 15%, transparent 70%);
}
.gvg-form-wrap {
  position: relative;
  width: 100%;
  max-width: 25rem;
}
.gvg-form-logo { display: none; margin-bottom: 1.5rem; }

.gvg-card {
  position: relative;
  background: hsl(var(--canvas));
  border: 1px solid hsl(var(--rule));
  box-shadow: 0 24px 60px -30px hsl(var(--ink) / 0.18);
}
.gvg-card-rule {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, hsl(var(--accent)), hsl(var(--accent-bright)) 60%, hsl(var(--accent-ink)));
}
.gvg-card-body { padding: 2rem 1.75rem 1.875rem; }

.gvg-title {
  font-family: var(--font-fraunces), Georgia, serif;
  font-weight: 400;
  font-size: 1.875rem;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: hsl(var(--ink));
  margin: 0.625rem 0 0;
}
.gvg-title-sub {
  font-size: 0.875rem;
  line-height: 1.5;
  color: hsl(var(--ink-soft));
  margin: 0.5rem 0 0;
}

.gvg-form {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
  margin-top: 1.75rem;
}
.gvg-field { display: flex; flex-direction: column; }
.gvg-label {
  font-family: var(--font-mono-gvg), ui-monospace, monospace;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: hsl(var(--ink-soft));
  margin-bottom: 0.5rem;
  transition: color 250ms var(--ease-ed);
}
.gvg-field:focus-within .gvg-label { color: hsl(var(--accent-ink)); }

.gvg-input-wrap { position: relative; }
.gvg-input {
  width: 100%;
  height: 2.875rem;
  padding: 0 0.875rem;
  border: 1px solid hsl(var(--rule-strong));
  border-radius: 0;
  background: hsl(var(--canvas));
  color: hsl(var(--ink));
  font-family: var(--font-inter), system-ui, sans-serif;
  font-size: 0.9375rem;
  line-height: 1.2;
  outline: none;
  transition: border-color 250ms var(--ease-ed), background-color 250ms var(--ease-ed);
}
.gvg-input-pw { padding-right: 2.75rem; }
.gvg-input::placeholder { color: hsl(var(--dim) / 0.7); }
.gvg-input:hover { border-color: hsl(var(--ink-soft) / 0.55); }
.gvg-input:focus { border-color: hsl(var(--accent)); }
.gvg-input[aria-invalid='true'] {
  border-color: hsl(0 72% 51%);
  background: hsl(0 80% 98%);
}

/* Underline-grow cyan bajo el input al enfocar (patrón de la web) */
.gvg-input-underline {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 2px;
  background: hsl(var(--accent));
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 300ms var(--ease-ed);
  pointer-events: none;
}
.gvg-input:focus ~ .gvg-input-underline { transform: scaleX(1); }

.gvg-pw-toggle {
  position: absolute;
  top: 0; right: 0;
  height: 2.875rem;
  width: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  color: hsl(var(--dim));
  cursor: pointer;
  transition: color 200ms var(--ease-ed);
}
.gvg-pw-toggle:hover { color: hsl(var(--ink)); }
.gvg-pw-toggle:focus-visible {
  color: hsl(var(--accent-ink));
  outline: 2px solid hsl(var(--accent));
  outline-offset: -2px;
}
.gvg-icon { width: 1.05rem; height: 1.05rem; }

/* ---------- ALERTA DE ERROR ---------- */
.gvg-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem 0.875rem;
  border: 1px solid hsl(0 65% 88%);
  border-left: 3px solid hsl(0 72% 51%);
  background: hsl(0 80% 98%);
  animation: gvg-shake 0.4s var(--ease-ed);
}
.gvg-alert-icon {
  width: 1.05rem;
  height: 1.05rem;
  flex-shrink: 0;
  margin-top: 0.05rem;
  color: hsl(0 70% 42%);
}
.gvg-alert-text {
  font-size: 0.8125rem;
  line-height: 1.45;
  color: hsl(0 60% 32%);
  margin: 0;
}

/* ---------- BOTÓN PRIMARIO ink-deep → revela cyan al hover ---------- */
.gvg-submit {
  position: relative;
  width: 100%;
  height: 3rem;
  border: 0;
  border-radius: 0;
  background: hsl(var(--ink-deep));
  color: hsl(var(--canvas));
  font-family: var(--font-inter), system-ui, sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  cursor: pointer;
  overflow: hidden;
  isolation: isolate;
}
.gvg-submit-fill {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(90deg, hsl(var(--accent-ink)), hsl(var(--accent)));
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 350ms var(--ease-ed);
}
.gvg-submit-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
@media (hover: hover) and (pointer: fine) {
  .gvg-submit:hover:not(:disabled) .gvg-submit-fill { transform: scaleX(1); }
}
.gvg-submit:active:not(:disabled) { transform: translateY(1px); }
.gvg-submit:focus-visible {
  outline: 2px solid hsl(var(--accent));
  outline-offset: 2px;
}
.gvg-submit:disabled { cursor: default; opacity: 0.9; }
.gvg-submit[data-loading='true'] .gvg-submit-fill {
  transform: scaleX(1);
  opacity: 0.55;
}

/* Tres puntos mono del estado loading */
.gvg-dots { display: inline-flex; gap: 3px; align-items: center; }
.gvg-dots span {
  width: 4px; height: 4px;
  background: currentColor;
  border-radius: 50%;
  opacity: 0.4;
  animation: gvg-dot 1s var(--ease-ed) infinite;
}
.gvg-dots span:nth-child(2) { animation-delay: 0.15s; }
.gvg-dots span:nth-child(3) { animation-delay: 0.3s; }

/* ---------- PIE ---------- */
.gvg-form-foot {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  justify-content: center;
  margin: 1.375rem 0 0;
  flex-wrap: wrap;
}
.gvg-foot-dot {
  width: 3px; height: 3px;
  background: hsl(var(--rule-strong));
  border-radius: 50%;
}

/* ============================================================
   MOTION — coreografía de entrada (fade-up escalonado) + keyframes.
   ============================================================ */
.gvg-reveal {
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 600ms var(--ease-ed),
    transform 600ms var(--ease-ed);
  transition-delay: var(--d, 0ms);
}
.gvg-reveal[data-in='true'] {
  opacity: 1;
  transform: translateY(0);
}
/* La línea de acento crece (scaleX) además de aparecer */
.gvg-accent-line {
  transform: translateY(12px) scaleX(0.001);
}
.gvg-accent-line[data-in='true'] {
  transform: translateY(0) scaleX(1);
}

@keyframes gvg-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}
@keyframes gvg-dot {
  0%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
}

/* ============================================================
   RESPONSIVE — desktop split (>=1024px).
   ============================================================ */
@media (min-width: 1024px) {
  .gvg-root { flex-direction: row; height: 100dvh; }
  .gvg-brand {
    width: 56%;
    padding: 3rem 3.25rem;
  }
  .gvg-brand-inner { justify-content: space-between; gap: 2rem; }
  .gvg-logo-img { height: 2.75rem; }
  .gvg-brand-sub { font-size: 0.9375rem; }
  .gvg-form-side { width: 44%; padding: 3rem; }
  .gvg-form-logo { display: block; }
}
@media (min-width: 1280px) {
  .gvg-brand { padding: 4rem 4.5rem; }
  .gvg-form-side { padding: 4rem; }
}

/* Mobile: franja de marca compacta, sin headline gigante ni pie. */
@media (max-width: 1023px) {
  .gvg-brand { padding: 1.5rem 1.5rem 1.75rem; }
  .gvg-brand-inner { gap: 1rem; }
  .gvg-display { font-size: 1.5rem; }
  .gvg-brand-sub { display: none; }
  .gvg-accent-line { width: 64px; }
}
@media (max-width: 640px) {
  .gvg-card-body { padding: 1.75rem 1.375rem 1.625rem; }
  .gvg-brand-foot .gvg-mono-meta { display: none; }
}

/* ============================================================
   REDUCED MOTION.
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  .gvg-reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
  .gvg-accent-line { transform: none !important; }
  .gvg-input-underline,
  .gvg-submit-fill { transition: none !important; }
  .gvg-alert,
  .gvg-dots span { animation: none !important; }
}
`;
