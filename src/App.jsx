import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

// Pages
import Login from './pages/Auth/Login'
import Patients from './pages/Patients/Patients'
import Visits from './pages/Visits/Visits'
import Finance from './pages/Finance/Finance'
import Consultations from './pages/Consultations/Consultations'
import Reports from './pages/Reports/Reports'
import Settings from './pages/Settings/Settings'
import AppLayout from './components/AppLayout'
import VisitDetail from './pages/Visits/VisitDetail'
import ConsultationDetail from './pages/Consultations/ConsultationDetail'
import FinanceMonthly from './pages/Finance/FinanceMonthly'
import PatientDetail from './pages/Patients/PatientDetail'
import PortalLogin from './pages/Portal/PortalLogin'
import PortalDashboard from './pages/Portal/PortalDashboard'
import Landing from './pages/Landing/Landing'

function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Masih loading session
  if (session === undefined) return <div>Loading...</div>

  // Belum login → redirect ke /login
  if (!session) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/portal" element={<PortalLogin />} />
        <Route path="/portal/dashboard" element={<PortalDashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }
  
  // Sudah login
  return (
    <Routes>
      {/* Public routes - tanpa AppLayout */}
      <Route path="/" element={<Landing />} />
      <Route path="/portal" element={<PortalLogin />} />
      <Route path="/portal/dashboard" element={<PortalDashboard />} />

      {/* Admin routes - dengan AppLayout */}
      <Route path="/*" element={
        <AppLayout>
          <Routes>
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/visits" element={<Visits />} />
            <Route path="/visits/:id" element={<VisitDetail />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/finance/monthly" element={<FinanceMonthly />} />
            <Route path="/consultations" element={<Consultations />} />
            <Route path="/consultations/:id" element={<ConsultationDetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/patients" replace />} />
          </Routes>
        </AppLayout>
      } />
    </Routes>
  )
}

export default App