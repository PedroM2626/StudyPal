import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthContext } from '@/contexts/AuthContext'
import { toast } from '@/components/ui/use-toast'
import { BookOpen } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido.' }),
  password: z.string().min(1, { message: 'Senha é obrigatória.' }),
})

const signupSchema = z
  .object({
    email: z.string().email({ message: 'Email inválido.' }),
    password: z
      .string()
      .min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

type LoginFormValues = z.infer<typeof loginSchema>
type SignupFormValues = z.infer<typeof signupSchema>

export default function AuthPage() {
  const [loading, setLoading] = React.useState(false)
  const navigate = useNavigate()
  const { login, signup } = useAuthContext()

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  const onLoginSubmit = async (data: LoginFormValues) => {
    setLoading(true)
    try {
      const { error } = await login(data.email, data.password)
      if (error) throw error
      toast({ title: 'Login bem-sucedido!', description: 'Redirecionando...' })
      navigate('/')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no login',
        description: error.message || 'Credenciais inválidas.',
      })
    } finally {
      setLoading(false)
    }
  }

  const onSignupSubmit = async (data: SignupFormValues) => {
    setLoading(true)
    try {
      const { error } = await signup(data.email, data.password)
      if (error) throw error
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Verifique seu e-mail para confirmar a conta.',
      })
      // User will be redirected by the AuthProvider after confirming email
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: error.message || 'Email já cadastrado.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">StudyPal</h1>
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Bem-vindo de volta!</CardTitle>
                <CardDescription>
                  Entre na sua conta para continuar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      {...loginForm.register('email')}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      {...loginForm.register('password')}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Crie sua conta</CardTitle>
                <CardDescription>
                  Comece a organizar seus estudos hoje mesmo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      {...signupForm.register('email')}
                    />
                    {signupForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {signupForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      {...signupForm.register('password')}
                    />
                    {signupForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {signupForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...signupForm.register('confirmPassword')}
                    />
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {signupForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Criando...' : 'Criar Conta'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
