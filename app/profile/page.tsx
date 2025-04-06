"use client"

import { useState } from 'react';
import { useAuth } from '@/contexts/FirebaseAuthContext';

export default function ProfilePage() {
  const { user, linkGoogleAccount } = useAuth();
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState('');

  const handleLinkGoogle = async () => {
    setLinking(true);
    setMessage('');
    try {
      const success = await linkGoogleAccount();
      if (success) {
        setMessage('¡Cuenta de Google vinculada exitosamente!');
      }
    } catch (error) {
      console.error('Error al vincular cuenta:', error);
    } finally {
      setLinking(false);
    }
  };

  // Verificar si el usuario ya tiene Google vinculado
  const hasGoogleProvider = user?.providerData.some(
    provider => provider.providerId === 'google.com'
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Perfil de Usuario
          </h1>

          <div className="space-y-6">
            {/* Información básica */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Información básica
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nombre
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {user?.displayName || 'No especificado'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Correo electrónico
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Métodos de inicio de sesión vinculados */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Métodos de inicio de sesión
              </h2>
              <div className="mt-4">
                {!hasGoogleProvider && (
                  <button
                    onClick={handleLinkGoogle}
                    disabled={linking}
                    className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {linking ? (
                      <span>Vinculando...</span>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                        </svg>
                        Vincular cuenta de Google
                      </>
                    )}
                  </button>
                )}
                {hasGoogleProvider && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Cuenta de Google vinculada</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mensajes de estado */}
            {message && (
              <div className="mt-4 p-4 rounded-md bg-green-50 dark:bg-green-900">
                <p className="text-sm text-green-700 dark:text-green-200">
                  {message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 