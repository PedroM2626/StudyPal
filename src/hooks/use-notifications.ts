import { useState, useEffect, useCallback } from 'react'
import { StudySession } from '@/services/sessions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type ScheduledNotification = {
  sessionId: number
  timeoutId: number
}

export const useNotifications = () => {
  const [permission, setPermission] =
    useState<NotificationPermission>('default')
  const [scheduledNotifications, setScheduledNotifications] = useState<
    ScheduledNotification[]
  >([])

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.error('Este browser não suporta notificações desktop.')
      return 'denied'
    }
    const status = await Notification.requestPermission()
    setPermission(status)
    return status
  }, [])

  const scheduleNotification = useCallback(
    (session: StudySession, reminderMinutes: number) => {
      const sessionTime = new Date(session.start).getTime()
      const reminderTime = sessionTime - reminderMinutes * 60 * 1000
      const now = Date.now()

      if (reminderTime <= now) return

      const timeoutId = window.setTimeout(() => {
        const formattedTime = format(new Date(session.start), 'HH:mm', {
          locale: ptBR,
        })
        new Notification(`Sessão de Estudo Começando!`, {
          body: `${session.subject} às ${formattedTime}\nPlano: ${session.planTitle}`,
        })
        setScheduledNotifications((prev) =>
          prev.filter((n) => n.sessionId !== session.id),
        )
      }, reminderTime - now)

      setScheduledNotifications((prev) => [
        ...prev,
        { sessionId: session.id, timeoutId },
      ])
    },
    [],
  )

  const cancelNotification = useCallback((sessionId: number) => {
    setScheduledNotifications((prev) => {
      const notification = prev.find((n) => n.sessionId === sessionId)
      if (notification) {
        clearTimeout(notification.timeoutId)
        return prev.filter((n) => n.sessionId !== sessionId)
      }
      return prev
    })
  }, [])

  const cancelAllNotifications = useCallback(() => {
    setScheduledNotifications((prev) => {
      prev.forEach((n) => clearTimeout(n.timeoutId))
      return []
    })
  }, [])

  return {
    permission,
    requestPermission,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    scheduledCount: scheduledNotifications.length,
  }
}
