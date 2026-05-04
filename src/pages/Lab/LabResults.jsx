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

export default function LabResults() {
  const navigate = useNavigate()
  const [labs, setLabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  // Patient search
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientPopover, setPatientPopover] = useState(false)

  // Visit search
  const [visits, setVisits] = useState([])
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [visitPopover, setVisitPopover] = useState(false)

  const [form, setForm] = useState({
    lab_date: new Date().toISOString().split('T')[0],
    blood_sugar: '',
    blood_sugar_type: '',
    uric_acid: '',
    uric_acid_gender: '',
    cholesterol: '',
    notes: '',
  })

  const fetchLabs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('lab_results')
      .select(`*, patients(name, patient_code)`)
      .order('lab_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) toast.error('Gagal memuat data lab')
    else setLabs(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchLabs() }, [])

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
    if (!form.blood_sugar && !form.uric_acid && !form.cholesterol) {
      toast.error('Isi minimal satu parameter lab')
      return
    }
    if (form.blood_sugar && !form.blood_sugar_type) {
      toast.error('Pilih kondisi gula darah (puasa/sewaktu)')
      return
    }
    if (form.uric_acid && !form.uric_acid_gender) {
      toast.error('Pilih kondisi asam urat (pria/wanita)')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase.from('lab_results').insert({
      patient_id: selectedPatient.id,
      visit_id: selectedVisit?.id || null,
      lab_date: form.lab_date,
      blood_sugar: form.blood_sugar ? parseFloat(form.blood_sugar) : null,
      blood_sugar_type: form.blood_sugar_type || null,
      uric_acid: form.uric_acid ? parseFloat(form.uric_acid) : null,
      uric_acid_gender: form.uric_acid_gender || null,
      cholesterol: form.cholesterol ? parseFloat(form.cholesterol) : null,
      notes: form.notes || null,
      created_by: user.id,
    }).select().single()

    if (error) toast.error('Gagal menyimpan hasil lab')
    else {
      toast.success('Hasil lab berhasil disimpan!')
      setAddOpen(false)
      setSelectedPatient(null)
      setSelectedVisit(null)
      setForm({
        lab_date: new Date().toISOString().split('T')[0],
        blood_sugar: '', uric_acid: '', cholesterol: '', notes: '',
      })
      fetchLabs()
      navigate(`/lab/${data.id}`)
    }
  }

  const getLabBadges = (lab) => {
    const items = []
    if (lab.blood_sugar) items.push('Gula')
    if (lab.uric_acid) items.push('Asam Urat')
    if (lab.cholesterol) items.push('Kolesterol')
    return items
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cek Lab</h1>
          <p className="text-sm text-muted-foreground">Hasil pemeriksaan laboratorium</p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>+ Input Hasil Lab</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Input Hasil Lab</DialogTitle>
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

              {/* Kunjungan terkait */}
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
                <Label>Tanggal Pemeriksaan *</Label>
                <Input
                  type="date"
                  value={form.lab_date}
                  onChange={e => setForm({ ...form, lab_date: e.target.value })}
                  required
                />
              </div>

              {/* Parameter Lab */}
              <div className="space-y-2">
                <Label>Parameter Pemeriksaan</Label>
                <p className="text-xs text-muted-foreground">Isi parameter yang diperiksa, kosongkan yang tidak</p>
                <div className="space-y-4">

                  {/* Gula Darah */}
                  <div className="border rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium">Gula Darah</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={form.blood_sugar_type === 'puasa' ? 'default' : 'outline'}
                        onClick={() => setForm({ ...form, blood_sugar_type: form.blood_sugar_type === 'puasa' ? '' : 'puasa' })}
                      >
                        Puasa
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={form.blood_sugar_type === 'sewaktu' ? 'default' : 'outline'}
                        onClick={() => setForm({ ...form, blood_sugar_type: form.blood_sugar_type === 'sewaktu' ? '' : 'sewaktu' })}
                      >
                        Sewaktu
                      </Button>
                    </div>
                    {form.blood_sugar_type && (
                      <Input
                        type="number"
                        placeholder={`Gula Darah ${form.blood_sugar_type === 'puasa' ? '(Puasa)' : '(Sewaktu)'} mg/dL`}
                        value={form.blood_sugar}
                        onChange={e => setForm({ ...form, blood_sugar: e.target.value })}
                      />
                    )}
                  </div>

                  {/* Asam Urat */}
                  <div className="border rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium">Asam Urat</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={form.uric_acid_gender === 'pria' ? 'default' : 'outline'}
                        onClick={() => setForm({ ...form, uric_acid_gender: form.uric_acid_gender === 'pria' ? '' : 'pria' })}
                      >
                        Pria
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={form.uric_acid_gender === 'wanita' ? 'default' : 'outline'}
                        onClick={() => setForm({ ...form, uric_acid_gender: form.uric_acid_gender === 'wanita' ? '' : 'wanita' })}
                      >
                        Wanita
                      </Button>
                    </div>
                    {form.uric_acid_gender && (
                      <Input
                        type="number"
                        placeholder={`Asam Urat ${form.uric_acid_gender === 'pria' ? '(Pria)' : '(Wanita)'} mg/dL`}
                        value={form.uric_acid}
                        onChange={e => setForm({ ...form, uric_acid: e.target.value })}
                      />
                    )}
                  </div>

                  {/* Kolesterol */}
                  <div className="border rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium">Kolesterol</p>
                    <Input
                      type="number"
                      placeholder="mg/dL"
                      value={form.cholesterol}
                      onChange={e => setForm({ ...form, cholesterol: e.target.value })}
                    />
                  </div>

                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-2">
                <Label>Catatan <span className="text-muted-foreground">(opsional)</span></Label>
                <Textarea
                  placeholder="Catatan tambahan..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
                <Button type="submit">Simpan & Lihat Detail</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Memuat data...</p>
        ) : labs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada data lab</p>
        ) : labs.map(lab => (
          <div
            key={lab.id}
            className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
            onClick={() => navigate(`/lab/${lab.id}`)}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{lab.patients?.name}</p>
                <p className="text-xs text-muted-foreground">{lab.patients?.patient_code} · {lab.lab_date}</p>
              </div>
              <Badge variant={lab.letter_url ? 'default' : 'secondary'} className="text-xs shrink-0">
                {lab.letter_url ? '📄 PDF' : 'Belum'}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {getLabBadges(lab).map(b => (
                <span key={b} className="text-xs bg-muted px-2 py-0.5 rounded-full">{b}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Pasien</TableHead>
              <TableHead>Parameter</TableHead>
              <TableHead>Surat PDF</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Memuat data...</TableCell>
              </TableRow>
            ) : labs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada data lab</TableCell>
              </TableRow>
            ) : labs.map(lab => (
              <TableRow key={lab.id}>
                <TableCell>{lab.lab_date}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{lab.patients?.name}</p>
                    <p className="text-xs text-muted-foreground">{lab.patients?.patient_code}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getLabBadges(lab).map(b => (
                      <Badge key={b} variant="outline" className="text-xs">{b}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {lab.letter_url
                    ? <Badge variant="default">✓ Ada</Badge>
                    : <Badge variant="secondary">Belum</Badge>
                  }
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/lab/${lab.id}`)}>
                    Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}