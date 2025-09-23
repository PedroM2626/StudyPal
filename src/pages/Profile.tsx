import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import { Upload } from 'lucide-react'
import { updateProfile, uploadAvatar } from '@/services/profile'

const profileSchema = z.object({
  display_name: z.string().min(1, { message: 'Nome é obrigatório.' }),
  email: z.string().email({ message: 'Email inválido.' }),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user, updateUserProfile } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: user?.display_name || '',
      email: user?.email || '',
    },
  })

  const getInitials = (name?: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!event.target.files || event.target.files.length === 0 || !user) return
    const file = event.target.files[0]
    setLoading(true)
    try {
      const newAvatarUrl = await uploadAvatar(user.id, file)
      await updateProfile(user.id, { avatar_url: newAvatarUrl })
      setAvatarUrl(newAvatarUrl)
      await updateUserProfile({}) // Trigger context update
      toast({ title: 'Sucesso!', description: 'Foto de perfil atualizada.' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível enviar a foto.',
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return
    setLoading(true)
    try {
      await updateProfile(user.id, { display_name: data.display_name })
      await updateUserProfile({}) // Trigger context update
      toast({ title: 'Sucesso!', description: 'Seu perfil foi atualizado.' })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o perfil.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={avatarUrl || ''} alt="Avatar do usuário" />
                <AvatarFallback className="text-4xl">
                  {getInitials(user?.display_name)}
                </AvatarFallback>
              </Avatar>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                className="hidden"
                accept="image/*"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {loading ? 'Enviando...' : 'Alterar Foto'}
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Atualize suas informações aqui.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome de Exibição</Label>
                  <Input id="displayName" {...form.register('display_name')} />
                  {form.formState.errors.display_name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.display_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    disabled
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
