import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from 'react'
import { useAuthContext } from './AuthContext'
import { useNotifications } from '@/hooks/use-notifications'
import {
  getSessionsForPlan,
  updateSessionStatus,
  StudySession,
} from '@/services/sessions'
import { getPlans } from '@/services/plans'
import { toast } from '@/components/ui/use-toast'

export type NotificationSettings = {
  enabled: boolean
  reminderMinutes: number
}

interface NotificationsContextType {
  settings: NotificationSettings
  permission: NotificationPermission
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>
  requestPermission: () => Promise<NotificationPermission>
  scheduleAllNotifications: () => Promise<void>
  cancelNotification: (sessionId: number) => void
  updateSessionAndNotification: (
    sessionId: number,
    status: 'done' | 'skipped',
  ) => Promise<void>
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined)

export const NotificationsProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const { user, updateUserProfile } = useAuthContext()
  const {
    permission,
    requestPermission,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
  } = useNotifications()

  const settings: NotificationSettings =
    (user?.notification_settings as NotificationSettings) || {
      enabled: false,
      reminderMinutes: 10,
    }

  const scheduleAllNotifications = useCallback(async () => {
    if (!user) return
    cancelAllNotifications()
    if (!settings.enabled || permission !== 'granted') {
      return
    }
    const plans = await getPlans(user.id)
    for (const plan of plans) {
      const sessions = await getSessionsForPlan(plan.id)
      sessions.forEach((session) => {
        // Schedule study session reminder
        // scheduleNotification(session, settings.reminderMinutes)
      })
    }
  }, [
    user,
    settings.enabled,
    settings.reminderMinutes,
    permission,
    cancelAllNotifications,
    scheduleNotification,
  ])

  useEffect(() => {
    if (user) {
      scheduleAllNotifications()
    }
  }, [user, scheduleAllNotifications])

  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      const updatedSettings = { ...settings, ...newSettings }
      await updateUserProfile({ notification_settings: updatedSettings })
      toast({
        title: 'Configurações salvas!',
        description: 'Suas preferências de notificação foram atualizadas.',
      })
    },
    [settings, updateUserProfile],
  )

  const updateSessionAndNotification = useCallback(
    async (sessionId: number, status: 'done' | 'skipped') => {
      await updateSessionStatus(sessionId, status)
      cancelNotification(sessionId)
      toast({
        title: 'Sessão atualizada!',
        description: `A notificação para esta sessão foi cancelada.`,
      })
    },
    [cancelNotification],
  )

  const value = {
    settings,
    permission,
    updateSettings,
    requestPermission,
    scheduleAllNotifications,
    cancelNotification,
    updateSessionAndNotification,
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error(
      'useNotificationsContext must be used within a NotificationsProvider',
    )
  }
  return context
}
