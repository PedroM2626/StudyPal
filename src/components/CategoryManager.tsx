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
import {
  getCategories,
  addCategory,
  deleteCategory,
  Category,
} from '@/services/categories'
import { toast } from '@/components/ui/use-toast'
import { Trash2 } from 'lucide-react'
import { Skeleton } from './ui/skeleton'
import { useAuthContext } from '@/contexts/AuthContext'

interface CategoryManagerProps {
  onCategoriesUpdate: () => void
  children: React.ReactNode
}

export const CategoryManager = ({
  onCategoriesUpdate,
  children,
}: CategoryManagerProps) => {
  const { user } = useAuthContext()
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && user) {
      const fetchCategories = async () => {
        setLoading(true)
        try {
          const data = await getCategories(user.id)
          setCategories(data)
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar categorias.',
          })
        } finally {
          setLoading(false)
        }
      }
      fetchCategories()
    }
  }, [open, user])

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !user) return
    try {
      const newCategory = await addCategory(user.id, { name: newCategoryName })
      setCategories((prev) => [...prev, newCategory])
      setNewCategoryName('')
      onCategoriesUpdate()
      toast({ title: 'Categoria adicionada!' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao adicionar categoria.' })
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await deleteCategory(categoryId)
      setCategories((prev) => prev.filter((c) => c.id !== categoryId))
      onCategoriesUpdate()
      toast({ title: 'Categoria excluída!' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir categoria.' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
          <DialogDescription>
            Adicione, edite ou remova suas categorias de matérias.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Categorias existentes</Label>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <span
                      className={`w-3 h-3 rounded-full mr-2 ${cat.color}`}
                    ></span>
                    <span className="flex-1">{cat.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(cat.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-category">Nova Categoria</Label>
            <div className="flex gap-2">
              <Input
                id="new-category"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Ciências Exatas"
              />
              <Button onClick={handleAddCategory}>Adicionar</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
