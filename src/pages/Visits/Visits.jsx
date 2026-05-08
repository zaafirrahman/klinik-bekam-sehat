import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'

export default function Visits() {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const navigate = useNavigate()

  // Form state
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientPopover, setPatientPopover] = useState(false)
  const [form, setForm] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    blood_pressure: '',
    chief_complaint: '',
    notes: '',
  })

  const fetchVisits = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('visits')
      .select(`
        *,
        patients (name, patient_code),
        visit_services (id, status, final_price, quantity)
      `)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) toast.error('Gagal memuat data kunjungan')
    else setVisits(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchVisits() }, [])

  const searchPatients = async (q) => {
    if (!q.trim()) { setPatientResults([]); return }
    const { data } = await supabase
      .from('patients')
      .select('id, name, patient_code, phone')
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(8)
    setPatientResults(data || [])
  }

//   useEffect(() => { searchPatients(patientSearch) }, [patientSearch])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPatient) { toast.error('Pilih pasien terlebih dahulu'); return }

    const { data: { user } } = await supabase.auth.getUser()
    const clientId = crypto.randomUUID()

    const { error } = await supabase.from('visits').insert({
      patient_id: selectedPatient.id,
      visit_date: form.visit_date,
      blood_pressure: form.blood_pressure || null,
      chief_complaint: form.chief_complaint || null,
      notes: form.notes || null,
      client_generated_id: clientId,
      created_by: user.id,
    })

    if (error) toast.error('Gagal membuat kunjungan')
    else {
      toast.success('Kunjungan berhasil dibuat!')
      setAddOpen(false)
      setSelectedPatient(null)
      setPatientSearch('')
      setForm({
        visit_date: new Date().toISOString().split('T')[0],
        blood_pressure: '',
        chief_complaint: '',
        notes: '',
      })
      fetchVisits()
    }
  }

  const getVisitStatus = (visit) => {
    if (!visit.visit_services || visit.visit_services.length === 0)
      return { label: 'Belum ada layanan', variant: 'outline' }
    const allDone = visit.visit_services.every(s => s.status === 'done')
    const anyDone = visit.visit_services.some(s => s.status === 'done')
    if (allDone) return { label: 'Selesai', variant: 'default' }
    if (anyDone) return { label: 'Sebagian', variant: 'secondary' }
    return { label: 'Pending', variant: 'secondary' }
  }

  const totalBill = (visit) => {
    if (!visit.visit_services) return 0
    return visit.visit_services.reduce((sum, s) => sum + (s.final_price * s.quantity), 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kunjungan</h1>
          <p className="text-sm text-muted-foreground">50 kunjungan terakhir</p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>+ Kunjungan Baru</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Buat Kunjungan Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">

              {/* Cari Pasien */}
              <div className="space-y-2">
                <Label>Pasien *</Label>
                <Popover open={patientPopover} onOpenChange={setPatientPopover}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      {selectedPatient
                        ? `${selectedPatient.name} (${selectedPatient.patient_code})`
                        : 'Cari nama atau no. telp...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Ketik nama atau telepon..."
                        onValueChange={(val) => {
                            setPatientSearch(val)
                            searchPatients(val)
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>Pasien tidak ditemukan</CommandEmpty>
                        <CommandGroup>
                          {patientResults.map(p => (
                            <CommandItem
                              key={p.id}
                              onSelect={() => {
                                setSelectedPatient(p)
                                setPatientPopover(false)
                              }}
                            >
                              <span className="font-medium">{p.name}</span>
                              <span className="ml-2 text-muted-foreground text-sm">
                                {p.patient_code} {p.phone ? `· ${p.phone}` : ''}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tanggal */}
              <div className="space-y-2">
                <Label>Tanggal Kunjungan *</Label>
                <Input
                  type="date"
                  value={form.visit_date}
                  onChange={e => setForm({ ...form, visit_date: e.target.value })}
                  required
                />
              </div>

              {/* Tekanan Darah */}
              <div className="space-y-2">
                <Label>Tekanan Darah</Label>
                <Input
                  placeholder="contoh: 120/80"
                  value={form.blood_pressure}
                  onChange={e => setForm({ ...form, blood_pressure: e.target.value })}
                />
              </div>

              {/* Keluhan */}
              <div className="space-y-2">
                <Label>Tindakan</Label>
                <Input
                  placeholder="Tindakan pasien"
                  value={form.chief_complaint}
                  onChange={e => setForm({ ...form, chief_complaint: e.target.value })}
                />
              </div>

              {/* Catatan */}
              <div className="space-y-2">
                <Label>Catatan Tambahan</Label>
                <Input
                  placeholder="Opsional"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">Buat Kunjungan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile: Card List */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Memuat data...</p>
        ) : visits.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada kunjungan</p>
        ) : (
          visits.map(v => {
            const status = getVisitStatus(v)
            return (
              <div
                key={v.id}
                className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                onClick={() => navigate(`/visits/${v.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{v.patients?.name}</p>
                    <p className="text-xs text-muted-foreground">{v.patients?.patient_code} · {v.visit_date}</p>
                  </div>
                  <Badge variant={status.variant} className="text-xs shrink-0">
                    {status.label}
                  </Badge>
                </div>
                {v.chief_complaint && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 break-all">
                    {v.chief_complaint}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    TD: {v.blood_pressure || '-'}
                  </p>
                  {totalBill(v) > 0 && (
                    <p className="text-sm font-medium text-green-600">
                      Rp {totalBill(v).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Pasien</TableHead>
              <TableHead>Tindakan</TableHead>
              <TableHead>TD</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : visits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Belum ada kunjungan
                </TableCell>
              </TableRow>
            ) : (
              visits.map(v => {
                const status = getVisitStatus(v)
                return (
                  <TableRow key={v.id}>
                    <TableCell>{v.visit_date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{v.patients?.name}</p>
                        <p className="text-xs text-muted-foreground">{v.patients?.patient_code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {v.chief_complaint || '-'}
                    </TableCell>
                    <TableCell>{v.blood_pressure || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {totalBill(v) > 0
                        ? `Rp ${totalBill(v).toLocaleString('id-ID')}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/visits/${v.id}`)}>
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}