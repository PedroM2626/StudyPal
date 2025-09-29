import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  getSessionsForPlan,
  updateSessionStatus,
  StudySession,
} from '@/services/sessions'
import { getPlanById } from '@/services/plans'
import { useNotificationsContext } from '@/contexts/NotificationsContext'
import { Skeleton } from '@/components/ui/skeleton'
import { generateICS } from '@/lib/ics'
import { toast } from '@/components/ui/use-toast'
import { SharePlanDialog } from '@/components/SharePlanDialog'

const timeSlots = Array.from(
  { length: 16 },
  (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`,
)

export default function PlanDetailPage() {
  const { id } = useParams()
  const { updateSessionAndNotification } = useNotificationsContext()
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [planTitle, setPlanTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const planId = Number(id)

  useEffect(() => {
    const fetchSessions = async () => {
      if (!id) return
      setLoading(true)
      try {
        const [planData, sessionsData] = await Promise.all([
          getPlanById(planId),
          getSessionsForPlan(planId),
        ])
        setPlanTitle(planData?.title || 'Plano de Estudo')
        setSessions(sessionsData)
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível carregar as sessões do plano.',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [id, planId])

  const getWeekDays = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(start.setDate(diff))
    return Array.from(
      { length: 7 },
      (_, i) =>
        new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i),
    )
  }

  const weekDays = getWeekDays(currentWeek)

  const handleStatusUpdate = async (
    sessionId: number,
    status: 'done' | 'skipped',
  ) => {
    await updateSessionStatus(sessionId, status)
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status } : s)),
    )
  }

  const handleExportICS = () => {
    const icsContent = generateICS(sessions, planTitle)
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `plano-estudo-${id}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{planTitle}</h1>
        <div className="flex items-center gap-2">
          <SharePlanDialog planId={planId}>
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" /> Compartilhar
            </Button>
          </SharePlanDialog>
          <Button variant="outline" onClick={handleExportICS}>
            <Download className="mr-2 h-4 w-4" /> Exportar ICS
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentWeek((d) => new Date(d.setDate(d.getDate() - 7)))
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentWeek((d) => new Date(d.setDate(d.getDate() + 7)))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>
            <CalendarIcon className="mr-2 h-4 w-4" /> Hoje
          </Button>
        </div>
        <span className="font-semibold">
          {weekDays[0].toLocaleDateString('pt-BR')} -{' '}
          {weekDays[6].toLocaleDateString('pt-BR')}
        </span>
      </div>
      <div className="grid grid-cols-[auto_1fr] border rounded-lg">
        <div className="flex flex-col border-r">
          <div className="h-12"></div>
          {timeSlots.map((time) => (
            <div
              key={time}
              className="h-16 flex items-center justify-center text-xs text-muted-foreground border-t"
            >
              {time}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="flex flex-col border-r last:border-r-0"
            >
              <div className="h-12 flex items-center justify-center font-semibold text-sm border-b">
                {day.toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: '2-digit',
                })}
              </div>
              <div className="relative flex-1">
                {timeSlots.map((time) => (
                  <div key={time} className="h-16 border-t"></div>
                ))}
                {sessions
                  .filter(
                    (s) =>
                      new Date(s.start_time).toDateString() ===
                      day.toDateString(),
                  )
                  .map((session) => (
                    <Dialog key={session.id}>
                      <DialogTrigger asChild>
                        <div
                          className="absolute w-[95%] left-1/2 -translate-x-1/2 p-2 rounded-md cursor-pointer text-foreground"
                          style={{
                            backgroundColor:
                              session.subject_color ||
                              (session.subjects && session.subjects.color) ||
                              '#666',
                            top: `${(new Date(session.start_time).getHours() - 7) * 4}rem`,
                            height: `${(new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60 * 15)}rem`,
                          }}
                        >
                          <p className="font-bold text-xs">
                            {session.subject_name ||
                              (session.subjects && session.subjects.name) ||
                              'Matéria'}
                          </p>
                          <p className="text-xs opacity-80">
                            {new Date(session.start_time).toLocaleTimeString(
                              'pt-BR',
                              { hour: '2-digit', minute: '2-digit' },
                            )}{' '}
                            -{' '}
                            {new Date(session.end_time).toLocaleTimeString(
                              'pt-BR',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </p>
                          <Badge
                            variant={
                              session.status === 'done'
                                ? 'default'
                                : 'secondary'
                            }
                            className={`absolute bottom-1 right-1 text-xs ${session.status === 'done' ? 'bg-green-600' : session.status === 'skipped' ? 'bg-red-500' : ''}`}
                          >
                            {session.status}
                          </Badge>
                        </div>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes da Sessão</DialogTitle>
                        </DialogHeader>
                        <p>
                          <strong>Matéria:</strong> {session.subject_name}
                        </p>
                        <p>
                          <strong>Horário:</strong>{' '}
                          {new Date(session.start_time).toLocaleTimeString(
                            'pt-BR',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}{' '}
                          -{' '}
                          {new Date(session.end_time).toLocaleTimeString(
                            'pt-BR',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() =>
                              handleStatusUpdate(session.id, 'done')
                            }
                          >
                            Marcar como Concluída
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              handleStatusUpdate(session.id, 'skipped')
                            }
                          >
                            Marcar como Pulada
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Adicionar notas..."
                          className="mt-4"
                        />
                      </DialogContent>
                    </Dialog>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
