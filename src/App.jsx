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
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Sudah login
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/patients" replace />} />
      <Route path="/patients" element={<Patients />} />
      <Route path="/visits" element={<Visits />} />
      <Route path="/finance" element={<Finance />} />
      <Route path="/consultations" element={<Consultations />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/patients" replace />} />
    </Routes>
  )
}

export default App