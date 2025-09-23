import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { getQueue, deleteFromQueue } from '@/services/db'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'

type SyncStatus = 'online' | 'offline' | 'syncing'

interface SyncContextType {
  status: SyncStatus
  queueCount: number
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const isOnline = useOnlineStatus()
  const [status, setStatus] = useState<SyncStatus>(
    isOnline ? 'online' : 'offline',
  )
  const [queueCount, setQueueCount] = useState(0)

  const processQueue = useCallback(async () => {
    const queue = await getQueue()
    if (queue.length === 0) {
      setStatus('online')
      return
    }

    setStatus('syncing')
    toast({
      title: 'Sincronizando...',
      description: `Sincronizando ${queue.length} alterações pendentes.`,
    })

    for (const item of queue) {
      try {
        let query
        switch (item.type) {
          case 'create':
            query = supabase.from(item.entity).insert(item.payload)
            break
          case 'update':
            query = supabase
              .from(item.entity)
              .update(item.payload)
              .eq('id', item.payload.id)
            break
          case 'delete':
            query = supabase.from(item.entity).delete().eq('id', item.payload)
            break
        }
        const { error } = await query
        if (error) throw error
        await deleteFromQueue(item.id!)
      } catch (error) {
        console.error('Sync error:', error)
        toast({
          variant: 'destructive',
          title: 'Erro de Sincronização',
          description: `Não foi possível sincronizar o item: ${item.entity}`,
        })
      }
    }

    const remainingQueue = await getQueue()
    setQueueCount(remainingQueue.length)
    if (remainingQueue.length === 0) {
      setStatus('online')
      toast({ title: 'Sincronização Concluída!' })
    }
  }, [])

  useEffect(() => {
    const updateQueueCount = async () => {
      const queue = await getQueue()
      setQueueCount(queue.length)
    }
    updateQueueCount()
    const interval = setInterval(updateQueueCount, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOnline) {
      processQueue()
    } else {
      setStatus('offline')
    }
  }, [isOnline, processQueue])

  return (
    <SyncContext.Provider value={{ status, queueCount }}>
      {children}
    </SyncContext.Provider>
  )
}

export const useSyncContext = () => {
  const context = useContext(SyncContext)
  if (context === undefined) {
    throw new Error('useSyncContext must be used within a SyncProvider')
  }
  return context
}
