'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { Eye, EyeOff, Loader2, ShieldCheck, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorKind, setErrorKind] = useState<'credenciales' | 'red' | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

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

  return (
    <div className="min-h-screen w-full flex bg-[var(--bg)]">
      {/* Panel de marca — oculto en mobile, presencia sobria en desktop */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-2/5 relative flex-col justify-between bg-[var(--primary-900)] px-12 py-12 overflow-hidden">
        {/* Textura sutil: veladura radial, sin ilustraciones de stock */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(60% 50% at 15% 10%, var(--primary-800) 0%, transparent 60%), radial-gradient(50% 40% at 90% 90%, var(--primary-950) 0%, transparent 60%)',
          }}
        />

        <div className="relative">
          <span className="text-lg font-semibold tracking-tight text-white">
            Consultora Salud
          </span>
        </div>

        <div className="relative max-w-sm">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.011em] text-white">
            Gestión de discapacidad para financiadores de salud
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[var(--primary-200)]">
            Certificados, orientaciones prestacionales y alertas proactivas de
            vencimiento en un solo lugar.
          </p>
        </div>

        <div className="relative text-xs text-[var(--primary-300)]">
          Acceso exclusivo para personal autorizado.
        </div>
      </div>

      {/* Formulario */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Wordmark visible en mobile (sin panel de marca) */}
          <div className="mb-8 lg:hidden">
            <span className="text-lg font-semibold tracking-tight text-[var(--primary-900)]">
              Consultora Salud
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-[-0.011em] text-[var(--fg)]">
              Iniciar sesión
            </h2>
            <p className="mt-1.5 text-sm text-[var(--fg-muted)]">
              Ingresá tus credenciales para acceder al sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold text-[var(--fg-muted)]"
              >
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@organizacion.com"
                aria-invalid={errorKind === 'credenciales' || undefined}
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-[var(--fg-muted)]">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  aria-invalid={errorKind === 'credenciales' || undefined}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-[var(--fg-subtle)] outline-none transition-colors hover:text-[var(--fg-muted)] focus-visible:text-[var(--primary-600)]"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border-l-4 border-[var(--sev-critica)] bg-[var(--sev-critica-bg)] p-3 animate-shake"
              >
                {errorKind === 'red' ? (
                  <WifiOff className="mt-0.5 size-4 shrink-0 text-[var(--sev-critica-fg)]" />
                ) : (
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--sev-critica-fg)]" />
                )}
                <p className="text-sm text-[var(--sev-critica-fg)]">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Ingresando…</span>
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
