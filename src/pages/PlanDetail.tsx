import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Download,
  Share2,
  Trash2,
  Pencil,
  CheckCircle2,
  CircleSlash2,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getSessionsForPlan,
  updateSessionStatus,
  StudySession,
  createSession,
  updateSession,
  deleteSession,
} from '@/services/sessions'
import { getPlanById } from '@/services/plans'
import { useNotificationsContext } from '@/contexts/NotificationsContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'
import { generateICS } from '@/lib/ics'
import { toast } from '@/components/ui/use-toast'
import { SharePlanDialog } from '@/components/SharePlanDialog'
import { getSubjects } from '@/services/subjects'
import { endOfDay, isWithinInterval, startOfDay } from 'date-fns'

const timeSlots = Array.from(
  { length: 16 },
  (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`,
)

export default function PlanDetailPage() {
  const { id } = useParams()
  const { updateSessionAndNotification } = useNotificationsContext()
  const { user } = useAuthContext()
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [planTitle, setPlanTitle] = useState('')
  const [sessionDuration, setSessionDuration] = useState<number>(60)
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([])
  const [editingSession, setEditingSession] = useState<StudySession | null>(
    null,
  )
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createDate, setCreateDate] = useState<Date | null>(null)
  const [createSubjectId, setCreateSubjectId] = useState<string>('')
  const [createStart, setCreateStart] = useState<string>('07:00')
  const [createEnd, setCreateEnd] = useState<string>('08:00')
  const [createNotes, setCreateNotes] = useState<string>('')
  const planId = Number(id)
  const dayColumnRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return
      setLoading(true)
      try {
        const [planData, sessionsData, subs] = await Promise.all([
          getPlanById(planId),
          getSessionsForPlan(planId),
          getSubjects(user.id),
        ])
        setPlanTitle(planData?.title || 'Plano de Estudo')
        if (planData?.session_duration)
          setSessionDuration(planData.session_duration)
        setSessions(sessionsData)
        setSubjects(subs.map((s: any) => ({ id: s.id, name: s.name })))
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível carregar dados do plano/calendário.',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, planId, user])

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
    status: 'planned' | 'done' | 'skipped',
  ) => {
    await updateSessionStatus(sessionId, status)
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status } : s)),
    )
  }

  const openCreateAtPosition = (
    day: Date,
    y: number,
    container: HTMLDivElement,
  ) => {
    const rect = container.getBoundingClientRect()
    const ratio = Math.min(Math.max((y - rect.top) / rect.height, 0), 1)
    const totalMinutes = 16 * 60
    const minutesFromStart = Math.round((ratio * totalMinutes) / 15) * 15
    const startHour = 7 + Math.floor(minutesFromStart / 60)
    const startMinute = minutesFromStart % 60
    const start = new Date(day)
    start.setHours(startHour, startMinute, 0, 0)
    const end = new Date(start.getTime() + sessionDuration * 60000)

    setCreateDate(day)
    setCreateStart(
      `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
    )
    setCreateEnd(
      `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
    )
    setCreateSubjectId(subjects[0]?.id ? String(subjects[0].id) : '')
    setCreateNotes('')
    setIsCreateOpen(true)
  }

  const handleCreateSession = async () => {
    if (!user || !createDate || !createSubjectId) return
    const [sh, sm] = createStart.split(':').map(Number)
    const [eh, em] = createEnd.split(':').map(Number)
    const start = new Date(createDate)
    start.setHours(sh, sm, 0, 0)
    const end = new Date(createDate)
    end.setHours(eh, em, 0, 0)

    try {
      await createSession({
        user_id: user.id,
        plan_id: planId,
        subject_id: Number(createSubjectId),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'planned',
        notes: createNotes || null,
      })
      setSessions(await getSessionsForPlan(planId))
      setIsCreateOpen(false)
      toast({ title: 'Sessão criada com sucesso' })
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao criar sessão' })
    }
  }

  const handleUpdateSession = async (updates: {
    subject_id?: number
    start_time?: string
    end_time?: string
    notes?: string | null
  }) => {
    if (!editingSession) return
    try {
      await updateSession(editingSession.id, updates)
      setSessions(await getSessionsForPlan(planId))
      setIsEditOpen(false)
      toast({ title: 'Sessão atualizada' })
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar sessão' })
    }
  }

  const handleDeleteSession = async () => {
    if (!editingSession) return
    try {
      await deleteSession(editingSession.id)
      setSessions((prev) => prev.filter((s) => s.id !== editingSession.id))
      setIsEditOpen(false)
      toast({ title: 'Sessão excluída' })
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao excluir sessão' })
    }
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
          {weekDays.map((day, idx) => (
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
              <div
                className="relative flex-1"
                ref={(el) => (dayColumnRefs.current[idx] = el)}
                onDoubleClick={(e) => {
                  const container = dayColumnRefs.current[idx]
                  if (container) openCreateAtPosition(day, e.clientY, container)
                }}
                title="Clique duplo para adicionar sessão"
              >
                {timeSlots.map((time) => (
                  <div key={time} className="h-16 border-t"></div>
                ))}
                {sessions
                  .filter((s) => {
                    const sd = startOfDay(day)
                    const ed = endOfDay(day)
                    const st = new Date(s.start_time)
                    return isWithinInterval(st, { start: sd, end: ed })
                  })
                  .map((session) => (
                    <Dialog
                      key={session.id}
                      open={isEditOpen && editingSession?.id === session.id}
                      onOpenChange={(o) => {
                        setIsEditOpen(o)
                        if (o) setEditingSession(session)
                      }}
                    >
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
                          <DialogTitle>Editar Sessão</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Matéria</Label>
                              <Select
                                defaultValue={String(session.subject_id)}
                                onValueChange={(v) =>
                                  setEditingSession({
                                    ...session,
                                    subject_id: Number(v),
                                  } as any)
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Selecione a matéria" />
                                </SelectTrigger>
                                <SelectContent>
                                  {subjects.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                      {s.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Notas</Label>
                              <Textarea
                                defaultValue={(session as any).notes || ''}
                                className="mt-1"
                                onChange={(e) =>
                                  setEditingSession({
                                    ...session,
                                    notes: e.target.value,
                                  } as any)
                                }
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Início</Label>
                              <Input
                                type="time"
                                className="mt-1"
                                defaultValue={new Date(
                                  session.start_time,
                                ).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })}
                                onChange={(e) => {
                                  const [hh, mm] = e.target.value
                                    .split(':')
                                    .map(Number)
                                  const d = new Date(session.start_time)
                                  d.setHours(hh, mm, 0, 0)
                                  setEditingSession({
                                    ...session,
                                    start_time: d.toISOString(),
                                  } as any)
                                }}
                              />
                            </div>
                            <div>
                              <Label>Fim</Label>
                              <Input
                                type="time"
                                className="mt-1"
                                defaultValue={new Date(
                                  session.end_time,
                                ).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })}
                                onChange={(e) => {
                                  const [hh, mm] = e.target.value
                                    .split(':')
                                    .map(Number)
                                  const d = new Date(session.end_time)
                                  d.setHours(hh, mm, 0, 0)
                                  setEditingSession({
                                    ...session,
                                    end_time: d.toISOString(),
                                  } as any)
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                              onClick={() =>
                                handleStatusUpdate(session.id, 'done')
                              }
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />{' '}
                              Concluída
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleStatusUpdate(session.id, 'skipped')
                              }
                            >
                              <CircleSlash2 className="mr-2 h-4 w-4" /> Pulada
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() =>
                                handleStatusUpdate(session.id, 'planned')
                              }
                            >
                              Desmarcar
                            </Button>
                            <div className="ml-auto flex gap-2">
                              <Button
                                variant="default"
                                onClick={() =>
                                  handleUpdateSession({
                                    subject_id:
                                      (editingSession as any)?.subject_id ??
                                      session.subject_id,
                                    start_time:
                                      (editingSession as any)?.start_time ??
                                      session.start_time,
                                    end_time:
                                      (editingSession as any)?.end_time ??
                                      session.end_time,
                                    notes:
                                      (editingSession as any)?.notes ??
                                      (session as any).notes ??
                                      null,
                                  })
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Salvar
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleDeleteSession}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Criar sessão */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Sessão</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Matéria</Label>
                <Select
                  value={createSubjectId}
                  onValueChange={setCreateSubjectId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione a matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Início</Label>
                  <Input
                    type="time"
                    className="mt-1"
                    value={createStart}
                    onChange={(e) => setCreateStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Fim</Label>
                  <Input
                    type="time"
                    className="mt-1"
                    value={createEnd}
                    onChange={(e) => setCreateEnd(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  className="mt-1"
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={handleCreateSession}>Criar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
