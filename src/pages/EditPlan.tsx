import { Calendar as CalendarIcon, PlusCircle } from 'lucide-react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { getSubjects, Subject } from '@/services/subjects'
import { getPlanById } from '@/services/plans'
import { MultiSelect, Option } from '@/components/ui/multi-select'
import { SubjectForm } from '@/components/SubjectForm'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'

export default function EditPlanPage() {
  const { id } = useParams()
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState<DateRange | undefined>()
  const [sessionDuration, setSessionDuration] = useState('50')
  const [breakDuration, setBreakDuration] = useState('10')
  const [customSessionDuration, setCustomSessionDuration] = useState('')
  const [customBreakDuration, setCustomBreakDuration] = useState('')
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return
      setPageLoading(true)
      const planId = Number(id)
      if (isNaN(planId)) {
        navigate('/plans')
        return
      }
      try {
        const [planData, subjectsData, planSubjectsData] = await Promise.all([
          getPlanById(planId),
          getSubjects(user.id),
          supabase
            .from('study_plan_subjects')
            .select('subject_id')
            .eq('plan_id', planId),
        ])

        if (!planData) {
          toast({ variant: 'destructive', title: 'Plano não encontrado' })
          navigate('/plans')
          return
        }

        setTitle(planData.title)
        setDate({
          from: new Date(planData.start_date),
          to: new Date(planData.end_date),
        })
        setSessionDuration(String(planData.session_duration))
        setBreakDuration(String(planData.break_duration))
        setSelectedSubjects(
          planSubjectsData.data?.map((s) => String(s.subject_id)) || [],
        )
        setAllSubjects(subjectsData)
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao carregar dados.' })
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [id, user, navigate])

  const handleAddSubject = (newSubject: Subject) => {
    setAllSubjects((prev) => [...prev, newSubject])
    setSelectedSubjects((prev) => [...prev, String(newSubject.id)])
  }

  const handleUpdatePlan = async () => {
    setLoading(true)
    try {
      const resolvedSessionDuration =
        sessionDuration === 'custom' && customSessionDuration
          ? Number(customSessionDuration)
          : Number(sessionDuration)
      const resolvedBreakDuration =
        breakDuration === 'custom' && customBreakDuration
          ? Number(customBreakDuration)
          : Number(breakDuration)

      // Here we'd call an API to persist the changes. For now we update the plan row directly
      await supabase
        .from('study_plans')
        .update({
          title,
          start_date: date?.from?.toISOString(),
          end_date: date?.to?.toISOString(),
          session_duration: resolvedSessionDuration,
          break_duration: resolvedBreakDuration,
        })
        .eq('id', Number(id))

      toast({ title: 'Plano atualizado com sucesso!' })
      navigate(`/plan/${id}`)
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao salvar plano.' })
    } finally {
      setLoading(false)
    }
  }

  const subjectOptions: Option[] = allSubjects.map((s) => ({
    value: String(s.id),
    label: s.name,
  }))

  if (pageLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-8 w-1/2" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold">Editar Plano de Estudo</h1>
      <Card>
        <CardHeader>
          <CardTitle>Parâmetros do Plano</CardTitle>
          <CardDescription>
            Modifique as configurações do seu plano de estudos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="plan-title">Título do Plano</Label>
            <Input
              id="plan-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Período do Plano</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'dd/MM/yyyy')} -{' '}
                        {format(date.to, 'dd/MM/yyyy')}
                      </>
                    ) : (
                      format(date.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    <span>Escolha um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-duration">Duração da Sessão (min)</Label>
              <Select
                value={sessionDuration}
                onValueChange={setSessionDuration}
              >
                <SelectTrigger id="session-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="50">50 minutos</SelectItem>
                  <SelectItem value="60">60 minutos</SelectItem>
                  <SelectItem value="custom">Personalizado...</SelectItem>
                </SelectContent>
              </Select>
              {sessionDuration === 'custom' && (
                <Input
                  placeholder="Minutos (ex: 40)"
                  value={customSessionDuration}
                  onChange={(e) => setCustomSessionDuration(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="break-duration">Pausa Entre Sessões (min)</Label>
              <Select value={breakDuration} onValueChange={setBreakDuration}>
                <SelectTrigger id="break-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutos</SelectItem>
                  <SelectItem value="10">10 minutos</SelectItem>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="custom">Personalizado...</SelectItem>
                </SelectContent>
              </Select>
              {breakDuration === 'custom' && (
                <Input
                  placeholder="Minutos (ex: 7)"
                  value={customBreakDuration}
                  onChange={(e) => setCustomBreakDuration(e.target.value)}
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subjects">Matérias Incluídas</Label>
            <div className="flex items-start gap-2">
              <MultiSelect
                options={subjectOptions}
                selected={selectedSubjects}
                onChange={setSelectedSubjects}
                className="flex-1"
              />
              <SubjectForm onSuccess={handleAddSubject}>
                <Button variant="outline" size="icon">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </SubjectForm>
            </div>
          </div>
          <Button
            onClick={handleUpdatePlan}
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
