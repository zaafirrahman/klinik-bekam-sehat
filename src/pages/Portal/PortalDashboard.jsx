import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PortalDashboard() {
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [clinicInfo, setClinicInfo] = useState(null)

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    // Cek session
    const session = localStorage.getItem('patient_session')
    if (!session) { navigate('/portal'); return }

    const { patient_id, logged_in_at } = JSON.parse(session)

    // Session expire 24 jam
    if (Date.now() - logged_in_at > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('patient_session')
      navigate('/portal')
      return
    }

    fetchData(patient_id)
  }, [])

  const fetchData = async (patientId) => {
    setLoading(true)

    const [patientRes, visitsRes, clinicRes] = await Promise.all([
      supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single(),
      supabase
        .from('visits')
        .select(`
          id, visit_date, chief_complaint, blood_pressure, notes,
          visit_services(
            id, status, final_price, quantity,
            services(name, category, service_code)
          )
        `)
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('clinic_settings')
        .select('name, address, phone')
        .eq('id', 1)
        .single(),
    ])

    if (patientRes.data) setPatient(patientRes.data)
    if (visitsRes.data) setVisits(visitsRes.data)
    if (clinicRes.data) setClinicInfo(clinicRes.data)
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('patient_session')
    navigate('/portal')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Memuat data...</p>
    </div>
  )

  const totalVisits = visits.length
  const totalSpent = visits.reduce((sum, v) =>
    sum + (v.visit_services || [])
      .filter(s => s.status === 'done')
      .reduce((s2, vs) => s2 + Number(vs.final_price) * Number(vs.quantity), 0)
  , 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{clinicInfo?.name || 'Klinik Bekam Sehat'}</p>
          <p className="text-xs text-muted-foreground">Portal Pasien</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>Keluar</Button>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Info Pasien */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-lg">{patient?.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {patient?.patient_code}
                  </Badge>
                  {patient?.birth_year && (
                    <span className="text-sm text-muted-foreground">
                      {currentYear - patient.birth_year} tahun
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total Kunjungan</p>
                <p className="font-semibold">{totalVisits}x</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total Pengeluaran</p>
                <p className="font-semibold text-green-600">
                  Rp {totalSpent.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Riwayat Kunjungan */}
        <div>
          <h2 className="font-semibold mb-3">Riwayat Kunjungan</h2>
          {visits.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Belum ada riwayat kunjungan
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {visits.map(v => {
                const doneServices = v.visit_services?.filter(s => s.status === 'done') || []
                const total = doneServices.reduce((sum, s) =>
                  sum + Number(s.final_price) * Number(s.quantity), 0)
                const allDone = v.visit_services?.length > 0 &&
                  v.visit_services.every(s => s.status === 'done')

                return (
                  <Card key={v.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(v.visit_date).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            })}
                          </p>
                          {v.chief_complaint && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {v.chief_complaint}
                            </p>
                          )}
                        </div>
                        <Badge variant={allDone ? 'default' : 'secondary'} className="text-xs shrink-0">
                          {allDone ? 'Selesai' : 'Pending'}
                        </Badge>
                      </div>

                      {doneServices.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-1">
                          {doneServices.map(s => (
                            <div key={s.id} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {s.services?.name} x{s.quantity}
                              </span>
                              <span>Rp {(Number(s.final_price) * Number(s.quantity)).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                            <span>Total</span>
                            <span className="text-green-600">
                              Rp {total.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          {clinicInfo?.address && `${clinicInfo.address}`}
          {clinicInfo?.phone && ` · ${clinicInfo.phone}`}
        </p>
      </div>
    </div>
  )
}