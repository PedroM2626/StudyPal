import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthContext } from '@/contexts/AuthContext'
import { toast } from '@/components/ui/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function OnboardingPage() {
  const { user, loading, updateUserProfile } = useAuthContext()
  const navigate = useNavigate()
  const [formLoading, setFormLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth', { replace: true })
      } else if (user.profile_complete) {
        navigate('/', { replace: true })
      } else {
        setDisplayName(user.display_name || '')
      }
    }
  }, [user, loading, navigate])

  const handleFinishOnboarding = async () => {
    if (!displayName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nome de exibição é obrigatório.',
      })
      return
    }
    setFormLoading(true)
    try {
      await updateUserProfile({
        display_name: displayName,
        profile_complete: true,
      })
      toast({
        title: 'Configuração concluída!',
        description: 'Bem-vindo(a) ao seu dashboard.',
      })
      navigate('/')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar perfil',
        description:
          error.message || 'Não foi possível concluir a configuração.',
      })
    } finally {
      setFormLoading(false)
    }
  }

  if (loading || !user || user.profile_complete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Skeleton className="h-10 w-48" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Bem-vindo(a) ao StudyPal!</CardTitle>
          <CardDescription>
            Para começar, por favor, nos diga como podemos te chamar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de Exibição</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome ou apelido"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleFinishOnboarding} disabled={formLoading}>
            {formLoading ? 'Salvando...' : 'Concluir e ir para o Dashboard'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
