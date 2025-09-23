import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createShareLink } from '@/services/sharing'
import { useAuthContext } from '@/contexts/AuthContext'
import { toast } from '@/components/ui/use-toast'

interface SharePlanDialogProps {
  planId: number
  children: React.ReactNode
}

export const SharePlanDialog = ({ planId, children }: SharePlanDialogProps) => {
  const { user } = useAuthContext()
  const [open, setOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerateLink = async () => {
    if (!user) return
    setLoading(true)
    try {
      const url = await createShareLink(planId, user.id)
      setShareUrl(url)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível gerar o link de compartilhamento.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar Plano de Estudo</DialogTitle>
          <DialogDescription>
            Gere um link para compartilhar seu plano com outras pessoas.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {shareUrl ? (
            <div className="space-y-2">
              <Label htmlFor="share-link">Link de Compartilhamento</Label>
              <div className="flex items-center gap-2">
                <Input id="share-link" value={shareUrl} readOnly />
                <Button size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleGenerateLink}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Gerando...' : 'Gerar Link'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
