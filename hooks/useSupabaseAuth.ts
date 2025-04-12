import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getSession } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Efecto inmediato para verificar token en localStorage
  useEffect(() => {
    // Al montar el componente, iniciar con el valor que está en localStorage
    // Esto evita redirecciones en el primer render mientras carga la sesión real
    const tokenInLocalStorage = localStorage.getItem('token');
    if (tokenInLocalStorage) {
      console.log('Token encontrado en localStorage, no redireccionar aún');
      setLoading(true); // Mantener cargando hasta verificar con Supabase
    }
  }, []);

  useEffect(() => {
    // Función para obtener la sesión actual del usuario
    const fetchSession = async () => {
      try {
        const currentSession = await getSession();
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        // Si hay una sesión, guardar el token en localStorage para compatibilidad
        if (currentSession?.access_token) {
          localStorage.setItem('token', currentSession.access_token);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error al obtener la sesión:', error);
        setSession(null);
        setUser(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    // Ejecutar al cargar el componente
    fetchSession();

    // Configurar listener para cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        
        // Actualizar el token en localStorage según el evento
        if (newSession?.access_token) {
          localStorage.setItem('token', newSession.access_token);
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('token');
        }
        
        setLoading(false);
      }
    );

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Función para proteger rutas
  const requireAuth = (callback?: () => void) => {
    // Si aún está cargando, no redirigir todavía
    if (loading) {
      return true; // Asumir autenticado mientras carga
    }

    // Si hay sesión, está autenticado
    if (session) {
      return true; 
    }

    // Verificar token en localStorage como última opción
    const tokenInLocalStorage = localStorage.getItem('token');
    if (tokenInLocalStorage) {
      console.log('Token encontrado en localStorage, permitiendo acceso mientras se verifica');
      return true;
    }

    // Si llegamos aquí, no hay autenticación válida
    console.log('No hay sesión ni token en localStorage, redirigiendo a login');
    if (callback) {
      callback();
    } else {
      router.push('/login');
    }
    
    return false;
  };

  return {
    user,
    session,
    loading,
    isAuthenticated: !!session,
    requireAuth
  };
}; 