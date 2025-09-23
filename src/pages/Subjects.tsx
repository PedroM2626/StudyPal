import { useState, useEffect, useMemo } from 'react'
import { PlusCircle, Edit, Trash2, Star, ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { getSubjects, deleteSubject, Subject } from '@/services/subjects'
import { getCategories, Category } from '@/services/categories'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/use-toast'
import { SubjectForm } from '@/components/SubjectForm'
import { CategoryManager } from '@/components/CategoryManager'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthContext } from '@/contexts/AuthContext'

export default function SubjectsPage() {
  const { user } = useAuthContext()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<number | 'all'>('all')

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [subjectsData, categoriesData] = await Promise.all([
        getSubjects(user.id),
        getCategories(user.id),
      ])
      setSubjects(subjectsData)
      setCategories(categoriesData)
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar dados.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const categoryMap = useMemo(() => {
    return categories.reduce(
      (acc, cat) => {
        acc[cat.id] = cat
        return acc
      },
      {} as Record<number, Category>,
    )
  }, [categories])

  const filteredSubjects = useMemo(() => {
    if (filter === 'all') return subjects
    return subjects.filter((s) => s.category_ids?.includes(filter))
  }, [subjects, filter])

  const handleAddSubject = (newSubject: Subject) => {
    setSubjects((prev) => [...prev, newSubject])
  }

  const handleDeleteSubject = async (subjectId: number) => {
    try {
      await deleteSubject(subjectId)
      setSubjects((prev) => prev.filter((s) => s.id !== subjectId))
      toast({ title: 'Matéria excluída com sucesso!' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir matéria.' })
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Minhas Matérias</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <ListFilter className="h-4 w-4" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por Categoria</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filter === 'all'}
                onCheckedChange={() => setFilter('all')}
              >
                Todas
              </DropdownMenuCheckboxItem>
              {categories.map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat.id}
                  checked={filter === cat.id}
                  onCheckedChange={() => setFilter(cat.id)}
                >
                  {cat.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <CategoryManager onCategoriesUpdate={fetchData}>
            <Button variant="outline" size="sm">
              Gerenciar Categorias
            </Button>
          </CategoryManager>
          <SubjectForm onSuccess={handleAddSubject}>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Nova Matéria
            </Button>
          </SubjectForm>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                </CardFooter>
              </Card>
            ))
          : filteredSubjects.map((subject) => (
              <Card key={subject.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{subject.name}</CardTitle>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-4 w-4',
                            i < subject.difficulty
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-muted-foreground',
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'w-full h-1 rounded-full mt-2',
                      subject.color,
                    )}
                  />
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {subject.category_ids?.map((id) => (
                      <Badge key={id} variant="secondary">
                        {categoryMap[id]?.name}
                      </Badge>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Meta: {subject.goal_hours} horas
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Restantes: {subject.remaining_hours?.toFixed(1)} horas
                    </p>
                  </div>
                  <div>
                    <Progress
                      value={
                        ((subject.goal_hours - (subject.remaining_hours || 0)) /
                          subject.goal_hours) *
                        100
                      }
                      className="h-2"
                    />
                    <p className="text-xs text-right mt-1 text-muted-foreground">
                      {(
                        ((subject.goal_hours - (subject.remaining_hours || 0)) /
                          subject.goal_hours) *
                        100
                      ).toFixed(0)}
                      % concluído
                    </p>
                  </div>
                  {subject.deadline && (
                    <p className="text-sm text-muted-foreground">
                      Prazo:{' '}
                      {new Date(subject.deadline).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="icon" disabled>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Tem certeza que deseja excluir?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação não pode ser desfeita. Isso excluirá
                          permanentemente a matéria.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteSubject(subject.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
      </div>
    </div>
  )
}
