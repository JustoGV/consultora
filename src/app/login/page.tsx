'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import {
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Conectando...');
  const { login } = useAuth();
  const router = useRouter();

  // Limpiar localStorage al montar
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
    setLoading(true);
    setLoadingMessage('Autenticando...');

    try {
      const success = await login(email, password);

      if (success) {
        setLoadingMessage('¡Acceso concedido!');
        router.push('/dashboard');
      } else {
        setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
      }
    } catch (err) {
      // NOTE: do not log the full error object — it may include request config/headers with the auth token (AUD-17).
      const error = err as AxiosError;

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setError('Tiempo de espera agotado. Por favor, intenta nuevamente.');
      } else if (error.response?.status === 401) {
        setError('Email o contraseña incorrectos. Verifica tus credenciales.');
      } else if (error.response?.status === 404) {
        setError('El endpoint de login no existe. Verifica la configuración del backend.');
      } else if (!error.response) {
        setError('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      } else {
        setError(`Error del servidor (${error.response?.status}). Intenta de nuevo.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setError('');
    setLoading(true);
    setLoadingMessage('Autenticando...');

    try {
      const success = await login(userEmail, userPassword);
      if (success) {
        setLoadingMessage('¡Acceso concedido!');
        router.push('/dashboard');
      }
    } catch {
      setError('Error de conexión. Por favor, verifica tus credenciales e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#4A5EB5] flex items-center justify-center p-8">
      {/* Main Card */}
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-2xl overflow-hidden grid md:grid-cols-2">
        
        {/* Left side - Illustration */}
        <div className="bg-[#A4D0ED] p-12 flex items-center justify-center">
          <div className="relative w-full max-w-md h-80">
            <Image 
              src="https://st4.depositphotos.com/6940196/29282/v/450/depositphotos_292822068-stock-illustration-the-working-environment-on-the.jpg"
              alt="Working Environment"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="p-12 flex flex-col justify-center bg-white">
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Login to Dashboard</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                Username/Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-md focus:border-blue-600 focus:outline-none transition-colors text-gray-800"
                placeholder=""
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-md focus:border-blue-600 focus:outline-none transition-colors text-gray-800"
                placeholder=""
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-gray-600">
                <input type="checkbox" className="mr-2 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                Remember me
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 animate-shake">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#002B7A] hover:bg-[#001F5C] text-white font-bold py-3 px-4 rounded-full transition-colors disabled:opacity-50 uppercase text-sm tracking-wider flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{loadingMessage}</span>
                </>
              ) : (
                'Login'
              )}
            </button>

            <div className="text-center mt-4">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                Don&apos;t have an account? Sign up
              </a>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">🚀 Demo Access</p>
            
            {/* Superadmin */}
            <button
              type="button"
              onClick={() => handleQuickLogin('consultora@admin.com', 'consultora123')}
              disabled={loading}
              className="group w-full p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-all text-left mb-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">🛡️ Superadmin</p>
                  <p className="text-xs text-gray-600">consultora@admin.com</p>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Admin */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@jerarquicos.com', 'password123')}
              disabled={loading}
              className="group w-full p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">👑 Admin</p>
                  <p className="text-xs text-gray-600">admin@jerarquicos.com</p>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
