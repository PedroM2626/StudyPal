import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useNotificationsContext } from '@/contexts/NotificationsContext'
import { toast } from '@/components/ui/use-toast'

export default function SettingsPage() {
  const { settings, permission, updateSettings, requestPermission } =
    useNotificationsContext()

  const handlePermissionRequest = async () => {
    const result = await requestPermission()
    if (result === 'granted') {
      toast({
        title: 'Permissão concedida!',
        description: 'Você agora receberá notificações.',
      })
      if (!settings.enabled) {
        updateSettings({ enabled: true })
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Permissão negada.',
        description:
          'Para receber notificações, habilite-as nas configurações do seu navegador.',
      })
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            Gerencie suas preferências de notificação para sessões de estudo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {permission !== 'granted' && (
            <div className="flex items-center justify-between rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="space-y-1">
                <p className="font-semibold">Permissão necessária</p>
                <p className="text-sm text-muted-foreground">
                  Você precisa permitir notificações no seu navegador para
                  receber lembretes.
                </p>
              </div>
              <Button onClick={handlePermissionRequest}>
                Habilitar Notificações
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label
              htmlFor="notifications-enabled"
              className="flex flex-col gap-1"
            >
              <span>Habilitar Notificações</span>
              <span className="text-sm font-normal text-muted-foreground">
                Receba lembretes antes de suas sessões de estudo.
              </span>
            </Label>
            <Switch
              id="notifications-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                updateSettings({ enabled: checked })
              }
              disabled={permission !== 'granted'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-time">Lembrar-me antes de</Label>
            <Select
              value={String(settings.reminderMinutes)}
              onValueChange={(value) =>
                updateSettings({ reminderMinutes: Number(value) })
              }
              disabled={!settings.enabled || permission !== 'granted'}
            >
              <SelectTrigger id="reminder-time" className="w-[180px]">
                <SelectValue placeholder="Selecione o tempo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutos</SelectItem>
                <SelectItem value="10">10 minutos</SelectItem>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
