import { Outlet, useLocation } from 'react-router-dom'
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { SyncProvider } from '@/contexts/SyncContext'
import { Header } from '@/components/Header'
import { AppSidebar } from '@/components/AppSidebar'
import { Footer } from '@/components/Footer'

const AppLayout = () => {
  const { user, loading } = useAuthContext()
  const location = useLocation()
  const publicRoutes = ['/auth', '/onboarding', '/shared']

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Carregando...
      </div>
    )
  }

  if (
    !user ||
    publicRoutes.some((route) => location.pathname.startsWith(route))
  ) {
    return <Outlet />
  }

  return (
    <NotificationsProvider>
      <SyncProvider>
        <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
          <AppSidebar />
          <div className="flex flex-col">
            <Header />
            <main className="flex flex-1 flex-col bg-background">
              <Outlet />
            </main>
            <Footer />
          </div>
        </div>
      </SyncProvider>
    </NotificationsProvider>
  )
}

export default function Layout() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  )
}
