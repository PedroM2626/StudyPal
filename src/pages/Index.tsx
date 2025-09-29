import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { getSubjects, Subject } from '@/services/subjects'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthContext } from '@/contexts/AuthContext'
import { toast } from '@/components/ui/use-toast'

const chartConfig = {
  planned: { label: 'Planejado', color: 'hsl(var(--chart-1))' },
  remaining: { label: 'Restante', color: 'hsl(var(--chart-2))' },
}

export default function Dashboard() {
  const { user } = useAuthContext()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user) return
      setLoading(true)
      try {
        const data = await getSubjects(user.id)
        setSubjects(data)
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível carregar os dados do dashboard.',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchSubjects()
  }, [user])

  const chartData = subjects.map((s) => ({
    subject: s.name,
    planned: s.goal_hours,
    remaining: s.remaining_hours,
  }))

  const deadlines = subjects
    .filter((s) => s.deadline)
    .map((s) => ({
      subject: s.name,
      date: new Date(s.deadline!).toLocaleDateString('pt-BR'),
      progress:
        ((s.goal_hours - (s.remaining_hours || 0)) / s.goal_hours) * 100,
    }))

  const [nextSession, setNextSession] = useState<any>(null)

  useEffect(() => {
    const fetchNext = async () => {
      if (!user) return
      try {
        const { getNextSession } = await import('@/services/sessions')
        const ns = await getNextSession(user.id)
        setNextSession(ns)
      } catch (e) {
        // ignore
      }
    }
    fetchNext()
  }, [user, subjects])

  const summaryCards = [
    {
      title: 'Horas Planejadas',
      value: `${subjects.reduce((acc, s) => acc + s.goal_hours, 0)}h`,
      description: 'Total em matérias ativas',
    },
    {
      title: 'Horas Concluídas',
      value: `${subjects.reduce((acc, s) => acc + (s.goal_hours - (s.remaining_hours || 0)), 0).toFixed(1)}h`,
      description: 'Progresso total',
    },
    {
      title: 'Matérias Ativas',
      value: subjects.length,
      description: 'Atualmente em estudo',
    },
    {
      title: 'Próxima Sessão',
      value: nextSession ? nextSession.subjects?.name || nextSession.subject_name || '—' : '—',
      description: nextSession
        ? new Date(nextSession.start_time).toLocaleString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Sem sessões agendadas',
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Resumo de Horas por Matéria</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ChartContainer
                config={chartConfig}
                className="min-h-[250px] w-full"
              >
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="subject"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="planned"
                    fill="var(--color-planned)"
                    radius={4}
                  />
                  <Bar
                    dataKey="remaining"
                    fill="var(--color-remaining)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Prazos Próximos</CardTitle>
            <CardDescription>Matérias com prazos definidos.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matéria</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead className="text-right">Prazo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deadlines.map((item) => (
                    <TableRow key={item.subject}>
                      <TableCell className="font-medium">
                        {item.subject}
                      </TableCell>
                      <TableCell>
                        <Progress value={item.progress} className="h-2" />
                      </TableCell>
                      <TableCell className="text-right">{item.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link to="/plan/new">Criar Novo Plano</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/plans">Ver Meus Planos</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/subjects">Gerenciar Matérias</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
