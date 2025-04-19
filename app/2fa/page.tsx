'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, rpcVerifyTOTP } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function TwoFAPage() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay una sesión pendiente al cargar
    const pending = localStorage.getItem('pendingSession')
    if (!pending) {
      router.push('/login')
      toast.error('Sesión expirada, vuelve a iniciar sesión')
    }
  }, [router])

  useEffect(() => {
    // Contador regresivo para reenvío de código
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Recuperamos la sesión pendiente
      const pending = localStorage.getItem('pendingSession')
      if (!pending) {
        throw new Error('Sesión expirada, vuelve a iniciar sesión')
      }
      const session = JSON.parse(pending)
      const userId = session.user.id

      // 1) Verificamos el código
      const { success, error: rpcError } = await rpcVerifyTOTP(userId, token)
      if (!success) {
        throw new Error(rpcError || 'Código inválido')
      }

      // 2) Si es válido, restauramos la sesión en Supabase
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      })

      // 3) Limpiamos y redirigimos al dashboard
      localStorage.removeItem('pendingSession')
      toast.success('Verificación exitosa')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
    setToken(value)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-10"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mx-auto mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <h2 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">
            Verificación 2FA
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            Introduce el código de verificación de tu aplicación de autenticación
          </p>

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <div className="relative">
                <input
                  type="text"
                  value={token}
                  onChange={handleTokenChange}
                  className="block w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-500 text-center"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || token.length !== 6}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-sm text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
