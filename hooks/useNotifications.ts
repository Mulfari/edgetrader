import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string;
  type: string;
  payload: any;
  read: boolean;
  created_at: string;
}

export function useNotifications(userId: string) {
  const [list, setList] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // 1) Carga inicial
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setList(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar notificaciones'))
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    // 2) Suscripción en tiempo real
    const channel = supabase
      .channel(`public:notifications_user_${userId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${userId}` 
        },
        (payload) => {
          setList(current => [payload.new as Notification, ...current])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Función para marcar una notificación como leída
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error

      setList(current =>
        current.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al marcar como leída'))
    }
  }

  // Función para marcar todas las notificaciones como leídas
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error

      setList(current =>
        current.map(notification => ({ ...notification, read: true }))
      )
    } catch (err) {
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