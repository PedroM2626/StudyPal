/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import Index from './pages/Index'
import AuthPage from './pages/Auth'
import OnboardingPage from './pages/Onboarding'
import SubjectsPage from './pages/Subjects'
import AvailabilityPage from './pages/Availability'
import PlansPage from './pages/Plans'
import NewPlanPage from './pages/NewPlan'
import PlanDetailPage from './pages/PlanDetail'
import EditPlanPage from './pages/EditPlan'
import SettingsPage from './pages/Settings'
import ProfilePage from './pages/Profile'
import ReportsPage from './pages/Reports'
import SharedPlanViewer from './pages/SharedPlanViewer'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/shared/:token" element={<SharedPlanViewer />} />
        <Route element={<Layout />}>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Index />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/availability" element={<AvailabilityPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/plan/new" element={<NewPlanPage />} />
            <Route path="/plan/:id" element={<PlanDetailPage />} />
            <Route path="/plan/:id/edit" element={<EditPlanPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
