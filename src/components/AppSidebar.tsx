import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  Book,
  Clock,
  Calendar,
  Plus,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/subjects', icon: Book, label: 'Matérias' },
  { to: '/availability', icon: Clock, label: 'Disponibilidade' },
  { to: '/plans', icon: Calendar, label: 'Meus Planos' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
  { to: '/plan/new', icon: Plus, label: 'Criar Novo Plano' },
]

export const AppSidebar = () => {
  const { pathname } = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-card transition-width duration-200',
        isCollapsed ? 'w-20' : 'w-60',
      )}
    >
      <div className="flex-1 overflow-y-auto">
        <nav className="flex flex-col items-start gap-2 px-4 py-4">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent',
                        (isActive || (pathname === '/' && item.to === '/')) &&
                          'bg-accent text-primary',
                        isCollapsed && 'justify-center',
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">{item.label}</TooltipContent>
                )}
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <Button
          variant="ghost"
          size="icon"
          className="w-full"
          onClick={toggleSidebar}
        >
          {isCollapsed ? (
            <ChevronsRight className="h-5 w-5" />
          ) : (
            <ChevronsLeft className="h-5 w-5" />
          )}
          <span className="sr-only">
            {isCollapsed ? 'Expandir' : 'Recolher'}
          </span>
        </Button>
      </div>
    </aside>
  )
}
