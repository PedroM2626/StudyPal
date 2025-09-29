import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getPlanByToken } from '@/services/sharing'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function SharedPlanViewer() {
  const { token } = useParams<{ token: string }>()
  const [planData, setPlanData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlan = async () => {
      if (!token) {
        setError('Token de compartilhamento inválido.')
        setLoading(false)
        return
      }
      try {
        const data = await getPlanByToken(token)
        if (!data) {
          throw new Error('Plano não encontrado ou o acesso foi revogado.')
        }
        setPlanData(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPlan()
  }, [token])

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold text-destructive mb-4">
          Ocorreu um erro
        </h1>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg">StudyPal</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Plano compartilhado por{' '}
            <strong>{planData.study_plans.profiles.display_name}</strong>
          </p>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-2">
          {planData.study_plans.title}
        </h1>
        <p className="text-muted-foreground mb-6">
          Este é um plano de estudo compartilhado. Você só pode visualizá-lo.
        </p>
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Sessões de Estudo</h2>
          <div className="space-y-3">
            {planData.study_plans.study_sessions
              .sort(
                (a: any, b: any) =>
                  new Date(a.start_time).getTime() -
                  new Date(b.start_time).getTime(),
              )
              .map((session: any) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-md border"
                >
                  <div>
                    <p className="font-semibold">{session.subjects.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.start_time).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Badge
                    className="text-white"
                    style={{ backgroundColor: session.subjects.color }}
                  >
                    {session.subjects.name}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  )
}
