'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = login(email, password);
    
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
    }
  };

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Consultora Salud</h1>
          <p className="text-gray-600">Sistema de Gestión de Discapacidad</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">Acceso rápido:</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@consultora.com')}
              className="w-full text-left px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Administrador General</p>
                  <p className="text-xs text-gray-600">admin@consultora.com</p>
                </div>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Admin</span>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => handleQuickLogin('juan@saludintegral.com')}
              className="w-full text-left px-4 py-2 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Salud Integral SA - Usuario</p>
                  <p className="text-xs text-gray-600">juan@saludintegral.com</p>
                </div>
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Usuario</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('maria@medicinatotal.com')}
              className="w-full text-left px-4 py-2 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Medicina Total SRL - Usuario</p>
                  <p className="text-xs text-gray-600">maria@medicinatotal.com</p>
                </div>
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Usuario</span>
              </div>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Contraseña para todos: <span className="font-mono font-semibold">password123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
