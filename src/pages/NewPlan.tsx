import { Calendar as CalendarIcon, PlusCircle } from 'lucide-react'
import { addDays, format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { createPlan } from '@/services/plans'
import { MultiSelect, Option } from '@/components/ui/multi-select'
import { SubjectForm } from '@/components/SubjectForm'
import { useAuthContext } from '@/contexts/AuthContext'

export default function NewPlanPage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 27),
  })
  const [sessionDuration, setSessionDuration] = useState('50')
  const [breakDuration, setBreakDuration] = useState('10')
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [subjectsLoading, setSubjectsLoading] = useState(true)

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user) return
      setSubjectsLoading(true)
      try {
        const data = await getSubjects(user.id)
        setAllSubjects(data)
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível carregar as matérias.',
        })
      } finally {
        setSubjectsLoading(false)
      }
    }
    fetchSubjects()
  }, [user])

  const handleAddSubject = (newSubject: Subject) => {
    setAllSubjects((prev) => [...prev, newSubject])
    setSelectedSubjects((prev) => [...prev, String(newSubject.id)])
  }

  const handleGeneratePlan = async () => {
    if (!user) return
    if (!title || !date?.from || !date?.to || selectedSubjects.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
      })
      return
    }
    setLoading(true)
    try {
      const newPlan = await createPlan(user.id, {
        title,
        startDate: date.from,
        endDate: date.to,
        subjects: selectedSubjects.map(Number),
        sessionDuration: Number(sessionDuration),
        breakDuration: Number(breakDuration),
      })
      toast({
        title: 'Plano gerado com sucesso!',
        description: 'Redirecionando para os detalhes do plano.',
      })
      navigate(`/plan/${newPlan.id}`)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar plano',
      })
    } finally {
      setLoading(false)
    }
  }

  const subjectOptions: Option[] = allSubjects.map((s) => ({
    value: String(s.id),
    label: s.name,
  }))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold">Criar Novo Plano de Estudo</h1>
      <Card>
        <CardHeader>
          <CardTitle>Parâmetros do Plano</CardTitle>
          <CardDescription>
            Defina as configurações para gerar seu novo plano de estudos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="plan-title">Título do Plano</Label>
            <Input
              id="plan-title"
              placeholder="Ex: Preparação ENEM 2025"
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
                  <SelectValue placeholder="Selecione a duração" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="50">50 minutos</SelectItem>
                  <SelectItem value="60">60 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="break-duration">Pausa Entre Sessões (min)</Label>
              <Select value={breakDuration} onValueChange={setBreakDuration}>
                <SelectTrigger id="break-duration">
                  <SelectValue placeholder="Selecione a pausa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutos</SelectItem>
                  <SelectItem value="10">10 minutos</SelectItem>
                  <SelectItem value="15">15 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subjects">Matérias para Incluir</Label>
            <div className="flex items-start gap-2">
              <MultiSelect
                options={subjectOptions}
                selected={selectedSubjects}
                onChange={setSelectedSubjects}
                placeholder={
                  subjectsLoading ? 'Carregando...' : 'Selecione as matérias'
                }
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
            onClick={handleGeneratePlan}
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? 'Gerando Plano...' : 'Gerar Plano'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
