import { useState, useEffect } from 'react'
import { PlusCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { useAuthContext } from '@/contexts/AuthContext'
import {
  getAvailability,
  updateAvailability,
  AvailabilityRecord,
} from '@/services/availability'
import { Skeleton } from '@/components/ui/skeleton'

const weekdays = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

const initialAvailability: AvailabilityRecord = weekdays.reduce(
  (acc, day) => ({ ...acc, [day]: [] }),
  {},
)

export default function AvailabilityPage() {
  const { user } = useAuthContext()
  const [availability, setAvailability] =
    useState<AvailabilityRecord>(initialAvailability)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!user) return
      setLoading(true)
      try {
        const data = await getAvailability(user.id)
        setAvailability(data)
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível carregar sua disponibilidade.',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchAvailability()
  }, [user])

  const addInterval = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: '', end: '' }],
    }))
  }

  const removeInterval = (day: string, index: number) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }))
  }

  const handleTimeChange = (
    day: string,
    index: number,
    field: 'start' | 'end',
    value: string,
  ) => {
    const newAvailability = { ...availability }
    newAvailability[day][index][field] = value
    setAvailability(newAvailability)
  }

  const handleSaveChanges = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateAvailability(user.id, availability)
      toast({
        title: 'Sucesso!',
        description: 'Sua disponibilidade foi salva.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar sua disponibilidade.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Minha Disponibilidade Semanal</h1>
        <Button onClick={handleSaveChanges} disabled={saving || loading}>
          {saving ? 'Salvando...' : 'Salvar Disponibilidade'}
        </Button>
      </div>
      <div className="grid gap-6">
        {loading
          ? weekdays.map((day) => (
              <Card key={day}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))
          : weekdays.map((day) => (
              <Card key={day}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{day}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addInterval(day)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Intervalo
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availability[day]?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum intervalo definido.
                    </p>
                  ) : (
                    availability[day]?.map((interval, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <Input
                          type="time"
                          value={interval.start}
                          onChange={(e) =>
                            handleTimeChange(
                              day,
                              index,
                              'start',
                              e.target.value,
                            )
                          }
                        />
                        <span>-</span>
                        <Input
                          type="time"
                          value={interval.end}
                          onChange={(e) =>
                            handleTimeChange(day, index, 'end', e.target.value)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInterval(day, index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  )
}
