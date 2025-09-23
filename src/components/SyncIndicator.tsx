import { Wifi, WifiOff, LoaderCircle } from 'lucide-react'
import { useSyncContext } from '@/contexts/SyncContext'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export const SyncIndicator = () => {
  const { status, queueCount } = useSyncContext()

  const getStatusInfo = () => {
    switch (status) {
      case 'online':
        return {
          icon: <Wifi className="h-5 w-5 text-green-500" />,
          text: 'Conectado e sincronizado',
        }
      case 'offline':
        return {
          icon: <WifiOff className="h-5 w-5 text-muted-foreground" />,
          text: `Offline. ${queueCount} alterações pendentes.`,
        }
      case 'syncing':
        return {
          icon: <LoaderCircle className="h-5 w-5 animate-spin text-blue-500" />,
          text: `Sincronizando ${queueCount} alterações...`,
        }
      default:
        return { icon: null, text: '' }
    }
  }

  const { icon, text } = getStatusInfo()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">{icon}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
