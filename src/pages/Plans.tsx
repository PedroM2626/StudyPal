import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, MoreVertical, Edit, Trash2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { getPlans, deletePlan, StudyPlanWithSummary } from '@/services/plans'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/use-toast'
import { useAuthContext } from '@/contexts/AuthContext'
import { SharePlanDialog } from '@/components/SharePlanDialog'

export default function PlansPage() {
  const { user } = useAuthContext()
  const [plans, setPlans] = useState<StudyPlanWithSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
      if (!user) return
      setLoading(true)
      try {
        const data = await getPlans(user.id)
        setPlans(data)
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao carregar planos.' })
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [user])

  const handleDeletePlan = async (planId: number) => {
    try {
      await deletePlan(planId)
      setPlans((prev) => prev.filter((p) => p.id !== planId))
      toast({ title: 'Plano excluído com sucesso!' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir plano.' })
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Planos de Estudo</h1>
        <Button asChild size="sm" className="gap-1">
          <Link to="/plan/new">
            <PlusCircle className="h-4 w-4" />
            Criar Novo Plano
          </Link>
        </Button>
      </div>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plans.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{plan.title}</CardTitle>
                  <CardDescription>{plan.dateRange}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <SharePlanDialog planId={plan.id}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartilhar
                      </DropdownMenuItem>
                    </SharePlanDialog>
                    <DropdownMenuItem asChild>
                      <Link to={`/plan/${plan.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Tem certeza que deseja excluir?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá
                            permanentemente o plano e todas as suas sessões.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePlan(plan.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{plan.summary}</p>
                <p className="text-xs text-muted-foreground">
                  Criado em{' '}
                  {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                </p>
                <Button asChild className="mt-4 w-full">
                  <Link to={`/plan/${plan.id}`}>Ver Plano</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              Você ainda não criou nenhum plano.
            </h3>
            <p className="text-sm text-muted-foreground">
              Que tal criar um agora?
            </p>
            <Button asChild className="mt-4">
              <Link to="/plan/new">Criar Novo Plano</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
