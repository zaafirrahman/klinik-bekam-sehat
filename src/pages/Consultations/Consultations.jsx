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
import { Textarea } from '@/components/ui/textarea'
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'

export default function Consultations() {
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  // Patient search
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientPopover, setPatientPopover] = useState(false)

  // Visit search (opsional)
  const [visits, setVisits] = useState([])
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [visitPopover, setVisitPopover] = useState(false)

  const [form, setForm] = useState({
    consult_date: new Date().toISOString().split('T')[0],
    complaint: '',
    findings: '',
    plan: '',
    archive_ref: '',
  })

  const fetchConsultations = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('consultations')
      .select(`*, patients(name, patient_code)`)
      .order('consult_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) toast.error('Gagal memuat data konsultasi')
    else setConsultations(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchConsultations() }, [])

  const searchPatients = async (q) => {
    if (!q.trim()) { setPatientResults([]); return }
    const { data } = await supabase
      .from('patients')
      .select('id, name, patient_code, phone')
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(8)
    setPatientResults(data || [])
  }

  const fetchPatientVisits = async (patientId) => {
    const { data } = await supabase
      .from('visits')
      .select('id, visit_date, chief_complaint')
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false })
      .limit(10)
    setVisits(data || [])
  }

  const handleSelectPatient = (p) => {
    setSelectedPatient(p)
    setPatientPopover(false)
    setSelectedVisit(null)
    fetchPatientVisits(p.id)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPatient) { toast.error('Pilih pasien terlebih dahulu'); return }

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase.from('consultations').insert({
      patient_id: selectedPatient.id,
      visit_id: selectedVisit?.id || null,
      consult_date: form.consult_date,
      reg_number: null, // trigger akan generate otomatis
      complaint: form.complaint || null,
      findings: form.findings || null,
      plan: form.plan || null,
      archive_ref: form.archive_ref || null,
      created_by: user.id,
    }).select().single()

    if (error) toast.error('Gagal membuat konsultasi')
    else {
      toast.success(`Konsultasi dibuat! No. Reg: ${data.reg_number}`)
      setAddOpen(false)
      setSelectedPatient(null)
      setSelectedVisit(null)
      setForm({
        consult_date: new Date().toISOString().split('T')[0],
        complaint: '', findings: '', plan: '', archive_ref: '',
      })
      fetchConsultations()
      // Langsung ke detail untuk generate PDF
      navigate(`/consultations/${data.id}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Konsultasi</h1>
          <p className="text-sm text-muted-foreground">Buku konsultasi digital</p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>+ Konsultasi Baru</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Input Konsultasi Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">

              {/* Pasien */}
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
                            <CommandItem key={p.id} onSelect={() => handleSelectPatient(p)}>
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

              {/* Link ke Visit (opsional) */}
              {selectedPatient && visits.length > 0 && (
                <div className="space-y-2">
                  <Label>Kunjungan Terkait <span className="text-muted-foreground">(opsional)</span></Label>
                  <Popover open={visitPopover} onOpenChange={setVisitPopover}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start font-normal">
                        {selectedVisit
                          ? `${selectedVisit.visit_date} — ${selectedVisit.chief_complaint || 'Tanpa keluhan'}`
                          : 'Pilih kunjungan...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            {visits.map(v => (
                              <CommandItem
                                key={v.id}
                                onSelect={() => { setSelectedVisit(v); setVisitPopover(false) }}
                              >
                                {v.visit_date} — {v.chief_complaint || 'Tanpa keluhan'}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Tanggal */}
              <div className="space-y-2">
                <Label>Tanggal Konsultasi *</Label>
                <Input
                  type="date"
                  value={form.consult_date}
                  onChange={e => setForm({ ...form, consult_date: e.target.value })}
                  required
                />
              </div>

              {/* Keluhan */}
              <div className="space-y-2">
                <Label>Keluhan</Label>
                <Textarea
                  placeholder="Keluhan pasien..."
                  value={form.complaint}
                  onChange={e => setForm({ ...form, complaint: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Temuan */}
              <div className="space-y-2">
                <Label>Temuan / Diagnosis</Label>
                <Textarea
                  placeholder="Temuan pemeriksaan..."
                  value={form.findings}
                  onChange={e => setForm({ ...form, findings: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Rencana */}
              <div className="space-y-2">
                <Label>Rencana Tindakan</Label>
                <Textarea
                  placeholder="Rencana pengobatan / tindak lanjut..."
                  value={form.plan}
                  onChange={e => setForm({ ...form, plan: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Nomor Arsip */}
              <div className="space-y-2">
                <Label>Nomor Arsip Fisik <span className="text-muted-foreground">(opsional)</span></Label>
                <Input
                  placeholder="Nomor arsip surat konsul fisik"
                  value={form.archive_ref}
                  onChange={e => setForm({ ...form, archive_ref: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
                <Button type="submit">Buat & Lihat Detail</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile: Card List */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Memuat data...</p>
        ) : consultations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada data konsultasi</p>
        ) : (
          consultations.map(c => (
            <div
              key={c.id}
              className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
              onClick={() => navigate(`/consultations/${c.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{c.patients?.name}</p>
                  <p className="text-xs text-muted-foreground">{c.patients?.patient_code} · {c.consult_date}</p>
                </div>
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {c.reg_number}
                </Badge>
              </div>
              {c.complaint && (
                <p className="text-xs text-muted-foreground mt-1.5 truncate">
                  {c.complaint}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {c.letter_url ? '📄 PDF tersedia' : 'Belum ada PDF'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Reg</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Pasien</TableHead>
              <TableHead>Keluhan</TableHead>
              <TableHead>Surat PDF</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : consultations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Belum ada data konsultasi
                </TableCell>
              </TableRow>
            ) : (
              consultations.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{c.reg_number}</Badge>
                  </TableCell>
                  <TableCell>{c.consult_date}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{c.patients?.name}</p>
                      <p className="text-xs text-muted-foreground">{c.patients?.patient_code}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{c.complaint || '-'}</TableCell>
                  <TableCell>
                    {c.letter_url
                      ? <Badge variant="default">✓ Ada</Badge>
                      : <Badge variant="secondary">Belum</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/consultations/${c.id}`)}>
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}