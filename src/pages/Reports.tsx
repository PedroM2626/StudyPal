import { useState } from 'react'
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer } from 'recharts'
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
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { DateRange } from 'react-day-picker'
import { addDays, format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const chartConfig = {
  hours: {
    label: 'Horas',
  },
  done: {
    label: 'Concluídas',
    color: 'hsl(var(--chart-2))',
  },
  planned: {
    label: 'Planejadas',
    color: 'hsl(var(--chart-3))',
  },
  skipped: {
    label: 'Puladas',
    color: 'hsl(var(--chart-5))',
  },
}

export default function ReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -29),
    to: new Date(),
  })

  const mockData = {
    totalHours: 42.5,
    hoursBySubject: [
      { name: 'Cálculo I', hours: 15, fill: 'hsl(var(--chart-1))' },
      { name: 'Física II', hours: 12.5, fill: 'hsl(var(--chart-2))' },
      { name: 'Algoritmos', hours: 10, fill: 'hsl(var(--chart-3))' },
      { name: 'Inglês', hours: 5, fill: 'hsl(var(--chart-4))' },
    ],
    completion: [
      { status: 'done', count: 85, fill: 'hsl(var(--chart-2))' },
      { status: 'planned', count: 20, fill: 'hsl(var(--chart-3))' },
      { status: 'skipped', count: 15, fill: 'hsl(var(--chart-5))' },
    ],
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatórios de Progresso</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-[300px] justify-start text-left font-normal',
                !date && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'LLL dd, y')} -{' '}
                    {format(date.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(date.from, 'LLL dd, y')
                )
              ) : (
                <span>Escolha um período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total de Horas Estudadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{mockData.totalHours}h</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Status das Sessões</CardTitle>
            <CardDescription>
              Distribuição de sessões concluídas, planejadas e puladas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[200px]">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="status" hideLabel />}
                />
                <Pie
                  data={mockData.completion}
                  dataKey="count"
                  nameKey="status"
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="status" />}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Horas por Matéria</CardTitle>
          <CardDescription>
            Distribuição do seu tempo de estudo entre as matérias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[300px]">
            <BarChart data={mockData.hoursBySubject} layout="vertical">
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="hours" radius={5} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
