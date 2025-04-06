'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validaciones básicas
    if (!email || !password || !confirmPassword) {
      setError('Por favor, completa todos los campos');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      // Crear usuario en Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Usuario registrado:', userCredential.user);
      
      // Redirigir al login
      router.push('/login');
    } catch (error: any) {
      // Manejar errores específicos de Firebase
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Este correo electrónico ya está registrado');
          break;
        case 'auth/invalid-email':
          setError('Correo electrónico inválido');
          break;
        case 'auth/operation-not-allowed':
          setError('El registro con correo y contraseña no está habilitado');
          break;
        case 'auth/weak-password':
          setError('La contraseña es demasiado débil');
          break;
        default:
          setError('Error al registrar usuario');
          console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50/50 via-white/50 to-zinc-100/50 dark:from-[#0A0A0F] dark:via-[#12121A] dark:to-[#0A0A0F] p-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900/50 p-6 rounded-2xl shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500">
            Crear cuenta
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300">
              Inicia sesión
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Contraseña
              </label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-zinc-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Confirmar contraseña
              </label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-rose-600 dark:text-rose-500 text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Registrando...' : 'Registrarse'}
          </Button>
        </form>
      </div>
    </div>
  );
} 