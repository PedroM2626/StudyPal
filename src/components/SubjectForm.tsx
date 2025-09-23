import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { addSubject, Subject } from '@/services/subjects'
import { getCategories, Category } from '@/services/categories'
import { toast } from '@/components/ui/use-toast'
import { MultiSelect, Option } from './ui/multi-select'
import { useAuthContext } from '@/contexts/AuthContext'

interface SubjectFormProps {
  subject?: Subject | null
  onSuccess: (newSubject: Subject) => void
  children: React.ReactNode
}

export const SubjectForm = ({
  subject,
  onSuccess,
  children,
}: SubjectFormProps) => {
  const { user } = useAuthContext()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(subject?.name || '')
  const [goal_hours, setGoalHours] = useState(subject?.goal_hours || 40)
  const [difficulty, setDifficulty] = useState(subject?.difficulty || 3)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    subject?.category_ids?.map(String) || [],
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && user) {
      const fetchCats = async () => {
        const data = await getCategories(user.id)
        setCategories(data)
      }
      fetchCats()
    }
  }, [open, user])

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    try {
      const newSubject = await addSubject(user.id, {
        name,
        goal_hours,
        difficulty,
        deadline: null,
        category_ids: selectedCategories.map(Number),
      })
      toast({ title: 'Matéria salva com sucesso!' })
      onSuccess(newSubject)
      setOpen(false)
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar matéria.' })
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions: Option[] = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {subject ? 'Editar Matéria' : 'Adicionar Nova Matéria'}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes da sua matéria.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="goalHours" className="text-right">
              Meta (horas)
            </Label>
            <Input
              id="goalHours"
              type="number"
              value={goal_hours}
              onChange={(e) => setGoalHours(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="difficulty" className="text-right">
              Dificuldade
            </Label>
            <Slider
              id="difficulty"
              value={[difficulty]}
              onValueChange={(value) => setDifficulty(value[0])}
              min={1}
              max={5}
              step={1}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="categories" className="text-right">
              Categorias
            </Label>
            <MultiSelect
              options={categoryOptions}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
