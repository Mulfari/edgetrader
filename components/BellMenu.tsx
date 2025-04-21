import { useState } from 'react'
import { Bell, Wallet, LineChart } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export function BellMenu({ userId }: { userId: string }) {
  const { notifications, loading, error, markAsRead, markAllAsRead } = useNotifications(userId)
  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'balance_change':
        return <Wallet className="h-4 w-4 text-white" />
      case 'trade_closed':
        return <LineChart className="h-4 w-4 text-white" />
      default:
        return <Bell className="h-4 w-4 text-white" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'balance_change':
        return 'from-blue-500 to-violet-500'
      case 'trade_closed':
        return 'from-green-500 to-emerald-500'
      default:
        return 'from-violet-500 to-indigo-500'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group relative p-2.5 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-gradient-to-br hover:from-violet-500/5 hover:to-indigo-500/5 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-gradient-to-br dark:hover:from-violet-500/10 dark:hover:to-indigo-500/10 focus:outline-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-lg hover:shadow-violet-200/50 dark:hover:shadow-violet-900/50"
        >
          <span className="sr-only">Ver notificaciones</span>
          <div className="relative">
            <div className="transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform scale-100">
              <Bell className="transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform group-hover:scale-110 h-5 w-5" />
            </div>
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 h-3 w-3 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform scale-100">
                <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75"></div>
                <div className="relative rounded-full h-3 w-3 bg-rose-500 ring-2 ring-white dark:ring-zinc-900"></div>
              </div>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500">
                Notificaciones
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Últimas actualizaciones del sistema
              </p>
            </div>
            {unreadCount > 0 && (
              <Badge variant="outline" className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20">
                {unreadCount} nuevas
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
              Cargando notificaciones...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-rose-500">
              Error: {error.message}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
              Sin notificaciones
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`group p-3 rounded-xl bg-gradient-to-r ${getNotificationColor(notification.type)}/5 hover:${getNotificationColor(notification.type)}/10 dark:${getNotificationColor(notification.type)}/10 dark:hover:${getNotificationColor(notification.type)}/20 border border-${getNotificationColor(notification.type)}/20 dark:border-${getNotificationColor(notification.type)}/20 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${getNotificationColor(notification.type)} flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate capitalize">
                          {notification.type.replace(/_/g, ' ')}
                        </p>
                        {!notification.read && (
                          <Badge variant="outline" className={`bg-gradient-to-r ${getNotificationColor(notification.type)}/10 text-${getNotificationColor(notification.type)}-700 dark:text-${getNotificationColor(notification.type)}-400 border-${getNotificationColor(notification.type)}/20 ml-2 shrink-0`}>
                            Nuevo
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {typeof notification.payload === 'object' 
                          ? JSON.stringify(notification.payload) 
                          : notification.payload}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <button 
              onClick={markAllAsRead}
              className="w-full py-2 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
            >
              Marcar todo como leído
            </button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 