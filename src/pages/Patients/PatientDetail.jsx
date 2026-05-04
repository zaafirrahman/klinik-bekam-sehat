import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function LabCard({ lab, navigate }) {
  const params = []
  if (lab.blood_sugar) params.push(
    `Gula (${lab.blood_sugar_type === 'puasa' ? 'Puasa' : 'Sewaktu'}): ${lab.blood_sugar}`
  )
  if (lab.uric_acid) params.push(
    `Asam Urat (${lab.uric_acid_gender === 'pria' ? 'Pria' : 'Wanita'}): ${lab.uric_acid}`
  )
  if (lab.cholesterol) params.push(`Kolesterol: ${lab.cholesterol}`)

  return (
    <div
      className="border rounded-lg p-4 cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={() => navigate(`/lab/${lab.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔬</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">Cek Lab</p>
              {lab.letter_url && (
                <Badge variant="secondary" className="text-xs">PDF ✓</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{lab.lab_date}</p>
          </div>
        </div>
      </div>
      {params.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {params.map(p => (
            <span key={p} className="text-xs bg-muted px-2 py-0.5 rounded-full">
              {p} mg/dL
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [visits, setVisits] = useState([])
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [labs, setLabs] = useState([])

  const currentYear = new Date().getFullYear()

  const fetchAll = async () => {
    setLoading(true)

    const [patientRes, visitsRes, consultRes, labRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', id).single(),
      supabase
        .from('visits')
        .select(`*, visit_services(id, status, final_price, quantity, services(name, service_code))`)
        .eq('patient_id', id)
        .order('visit_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', id)
        .order('consult_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('lab_results')
        .select('*')
        .eq('patient_id', id)
        .order('lab_date', { ascending: false })
        .order('created_at', { ascending: false }),
    ])

    if (patientRes.error) {
      toast.error('Pasien tidak ditemukan')
      navigate('/patients')
      return
    }

    setPatient(patientRes.data)
    setVisits(visitsRes.data || [])
    setConsultations(consultRes.data || [])
    setLabs(labRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [id])

  if (loading) return <div className="p-6 text-muted-foreground">Memuat data...</div>
  if (!patient) return null

  // Gabungkan visits dan consultations jadi satu timeline
  const timeline = [
    ...visits.map(v => ({ ...v, _type: 'visit' })),
    ...consultations.map(c => ({ ...c, _type: 'consultation' })),
    ...labs.map(l => ({ ...l, _type: 'lab' })),
  ].sort((a, b) => {
    const dateA = a._type === 'visit' ? a.visit_date : a._type === 'consultation' ? a.consult_date : a.lab_date
    const dateB = b._type === 'visit' ? b.visit_date : b._type === 'consultation' ? b.consult_date : b.lab_date
    return new Date(dateB) - new Date(dateA)
  })

  const totalSpent = visits.reduce((sum, v) => {
    return sum + (v.visit_services || [])
      .filter(s => s.status === 'done')
      .reduce((s2, vs) => s2 + Number(vs.final_price) * Number(vs.quantity), 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/patients')}>
          ← Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{patient.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="font-mono">{patient.patient_code}</Badge>
            {patient.birth_year && (
              <span className="text-sm text-muted-foreground">
                ~ {currentYear - patient.birth_year} tahun
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Info Pasien */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informasi Pasien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ['No. Telepon', patient.phone || '-'],
              ['Alamat', patient.address || '-'],
              ['Tahun Lahir', patient.birth_year || '-'],
              ['Terdaftar sejak', new Date(patient.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric'
              })],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-right max-w-xs">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Kunjungan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{visits.length}x</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Konsultasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{consultations.length}x</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Cek Lab
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{labs.length}x</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Pengeluaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-green-600">
                Rp {totalSpent.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Terpadu</CardTitle>
          <p className="text-sm text-muted-foreground">
            {visits.length} kunjungan · {consultations.length} konsultasi · {labs.length} cek lab
          </p>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada riwayat
            </p>
          ) : (
            <div className="space-y-3">
              {timeline.map(item => (
                item._type === 'visit'
                  ? <VisitCard key={`v-${item.id}`} visit={item} navigate={navigate} />
                  : item._type === 'consultation'
                  ? <ConsultCard key={`c-${item.id}`} consult={item} navigate={navigate} />
                  : <LabCard key={`l-${item.id}`} lab={item} navigate={navigate} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function VisitCard({ visit, navigate }) {
  const doneServices = visit.visit_services?.filter(s => s.status === 'done') || []
  const pendingServices = visit.visit_services?.filter(s => s.status === 'pending') || []
  const total = doneServices.reduce((sum, s) => sum + Number(s.final_price) * Number(s.quantity), 0)
  const allDone = visit.visit_services?.length > 0 && pendingServices.length === 0
  const hasServices = visit.visit_services?.length > 0

  return (
    <div
      className="border rounded-lg p-4 cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={() => navigate(`/visits/${visit.id}`)}
    >
      {/* Baris atas: icon+label di kiri, status di kanan */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏥</span>
          <div>
            <p className="font-medium text-sm">Kunjungan</p>
            <p className="text-xs text-muted-foreground">{visit.visit_date}</p>
          </div>
        </div>
        <Badge
          variant={allDone ? 'default' : hasServices ? 'secondary' : 'outline'}
          className="text-xs shrink-0"
        >
          {allDone ? 'Selesai' : hasServices ? 'Pending' : 'Belum ada layanan'}
        </Badge>
      </div>

      {/* Keluhan & TD */}
      {visit.chief_complaint && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
          Keluhan: {visit.chief_complaint}
        </p>
      )}
      {visit.blood_pressure && (
        <p className="text-xs text-muted-foreground">
          TD: {visit.blood_pressure}
        </p>
      )}

      {/* Chips layanan */}
      {visit.visit_services?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {visit.visit_services.map(s => (
            <span key={s.id} className="text-xs bg-muted px-2 py-0.5 rounded-full">
              {s.services?.name || '?'} · {s.quantity}x
            </span>
          ))}
        </div>
      )}

      {/* Total di pojok kanan bawah */}
      {total > 0 && (
        <div className="flex justify-end mt-2">
          <span className="text-sm font-medium text-green-600">
            Rp {total.toLocaleString('id-ID')}
          </span>
        </div>
      )}
    </div>
  )
}

function ConsultCard({ consult, navigate }) {
  return (
    <div
      className="border rounded-lg p-4 cursor-pointer hover:bg-muted/30 transition-colors border-blue-100"
      onClick={() => navigate(`/consultations/${consult.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">Konsultasi</p>
              <Badge variant="outline" className="text-xs font-mono">
                {consult.reg_number}
              </Badge>
              {consult.letter_url && (
                <Badge variant="secondary" className="text-xs">PDF ✓</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{consult.consult_date}</p>
          </div>
        </div>
      </div>

      {consult.complaint && (
        <p className="text-sm text-muted-foreground mt-2">
          Keluhan: {consult.complaint}
        </p>
      )}

      {consult.plan && (
        <p className="text-sm text-muted-foreground">
          Rencana: {consult.plan}
        </p>
      )}
    </div>
  )
}