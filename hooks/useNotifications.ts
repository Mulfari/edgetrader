import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string;
  type: string;
  payload: any;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [list, setList] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Obtener la sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error al obtener la sesión:', sessionError)
          throw new Error('Error de autenticación')
        }

        if (!session) {
          console.error('No hay sesión activa')
          throw new Error('Por favor, inicia sesión para ver tus notificaciones')
        }

        console.log('Sesión actual:', {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          aud: session.user.aud,
          app_metadata: session.user.app_metadata
        })

        // Cargar notificaciones
        const { data, error: notificationsError } = await supabase
          .from('notifications')
          .select('id, type, payload, read, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (notificationsError) {
          console.error('Error al cargar notificaciones:', {
            code: notificationsError.code,
            message: notificationsError.message,
            details: notificationsError.details,
            hint: notificationsError.hint
          })
          throw notificationsError
        }

        console.log('Notificaciones recibidas:', data)
        setList(data || [])
      } catch (err) {
        console.error('Error completo:', err)
        setError(err instanceof Error ? err : new Error('Error al cargar notificaciones'))
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    // Suscripción en tiempo real simplificada
    let channel: ReturnType<typeof supabase.channel>;

    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      console.log('Configurando suscripción en tiempo real para el usuario:', session.user.id)

      channel = supabase
        .channel(`notifications_user_${session.user.id}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`
          },
          (payload) => {
            console.log('Nueva notificación recibida:', payload)
            setList(current => [payload.new as Notification, ...current])
          }
        )
        .subscribe((status) => {
          console.log('Estado de la suscripción:', status)
        })
    })()

    return () => {
      if (channel) {
        console.log('Limpiando suscripción en tiempo real')
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No hay sesión activa')
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', session.user.id)

      if (error) throw error

      setList(current =>
        current.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      )
    } catch (err) {
      console.error('Error al marcar como leída:', err)
      setError(err instanceof Error ? err : new Error('Error al marcar como leída'))
    }
  }

  const markAllAsRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No hay sesión activa')
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false)
        .eq('user_id', session.user.id)

      if (error) throw error

      setList(current =>
        current.map(notification => ({ ...notification, read: true }))
      )
    } catch (err) {
      console.error('Error al marcar todo como leído:', err)
      setError(err instanceof Error ? err : new Error('Error al marcar todo como leído'))
    }
  }

  return {
    notifications: list,
    loading,
    error,
    markAsRead,
    markAllAsRead
  }
} 