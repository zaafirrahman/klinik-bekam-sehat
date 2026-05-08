import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
// Checkbox component (not used but imported for future use)
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

export default function AkupunturPackages() {
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  // Form state
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientPopover, setPatientPopover] = useState(false)
  const [form, setForm] = useState({
    package_amount: '',
    total_sessions: 12,
    notes: '',
  })

  const fetchPackages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('akupuntur_packages')
      .select(`
        *,
        patients (name, patient_code),
        visits (id, visit_date)
      `)
      .order('created_at', { ascending: false })

    if (error) toast.error('Gagal memuat data paket')
    else setPackages(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPackages() }, [])

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
      .limit(20)
    return data || []
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPatient) { toast.error('Pilih pasien terlebih dahulu'); return }
    if (!form.package_amount) { toast.error('Masukkan nominal paket'); return }

    const { data: { user } } = await supabase.auth.getUser()

    // Cari kunjungan terakhir pasien untuk link
    const visits = await fetchPatientVisits(selectedPatient.id)
    const lastVisitId = visits.length > 0 ? visits[0].id : null

    const { error } = await supabase.from('akupuntur_packages').insert({
      patient_id: selectedPatient.id,
      visit_id: lastVisitId,
      package_amount: parseInt(form.package_amount),
      total_sessions: parseInt(form.total_sessions),
      progress: 0,
      notes: form.notes || null,
      created_by: user.id,
    })

    if (error) {
      console.error('Insert error:', error) 
      toast.error('Gagal membuat paket akupuntur')
    }
    else {
      toast.success('Paket akupuntur berhasil dibuat!')
      setAddOpen(false)
      setSelectedPatient(null)
      setPatientSearch('')
      setForm({ package_amount: '', total_sessions: 12, notes: '' })
      fetchPackages()
    }
  }

  const renderProgress = (progress, total) => {
    const currentProgress = Math.min(progress, total)
    return (
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => {
          const isFilled = i < currentProgress
          return (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border ${isFilled ? 'bg-green-600 border-green-600' : 'bg-gray-100 border-gray-300'}`}
              title={isFilled ? 'Kunjungan terlaksana' : 'Menunggu'}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Paket Akupuntur</h1>
          <p className="text-sm text-muted-foreground">Manajemen paket akupuntur pasien</p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>+ Daftarkan Paket Baru</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Daftarkan Paket Akupuntur Baru</DialogTitle>
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
                            <CommandItem key={p.id} onSelect={() => {
                              setSelectedPatient(p)
                              setPatientPopover(false)
                            }}>
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

              {/* Nominal Paket */}
              <div className="space-y-2">
                <Label>Nominal Paket *</Label>
                <Input
                  type="number"
                  placeholder="Contoh: 2500000"
                  value={form.package_amount}
                  onChange={e => setForm({ ...form, package_amount: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Total biaya untuk paket
                </p>
              </div>

              {/* Jumlah Sesi */}
              <div className="space-y-2">
                <Label>Jumlah Sesi *</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.total_sessions}
                  onChange={e => setForm({ ...form, total_sessions: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Jumlah kunjungan akupuntur dalam paket
                </p>
              </div>

              {/* Catatan */}
              <div className="space-y-2">
                <Label>Catatan <span className="text-muted-foreground">(opsional)</span></Label>
                <Input
                  placeholder="catatan tambahan..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
                <Button type="submit">Daftarkan Paket</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile: Card List */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Memuat data...</p>
        ) : packages.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada paket akupuntur</p>
        ) : (
          packages.map(pkg => (
            <div
              key={pkg.id}
              className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
              onClick={() => navigate(`/akupuntur/packages/${pkg.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{pkg.patients?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pkg.patients?.patient_code} · {pkg.created_at?.split('T')[0]}</p>
                  <p className="text-xs text-muted-foreground mt-1">Nominal: Rp {pkg.package_amount.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="text-right text-sm font-medium text-green-600">
                    {pkg.progress}/{pkg.total_sessions} sesi
                  </div>
                  {renderProgress(pkg.progress, pkg.total_sessions)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Pasien</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Progres</TableHead>
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
            ) : packages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Belum ada paket akupuntur
                </TableCell>
              </TableRow>
            ) : (
              packages.map(pkg => (
                <TableRow key={pkg.id}>
                  <TableCell>{pkg.created_at?.split('T')[0]}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{pkg.patients?.name}</p>
                      <p className="text-xs text-muted-foreground">{pkg.patients?.patient_code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{pkg.package_code || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>Rp {pkg.package_amount.toLocaleString('id-ID')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{pkg.progress}/{pkg.total_sessions}</span>
                      <div className="flex gap-1">
                        {Array.from({ length: pkg.total_sessions }).map((_, i) => {
                          const isFilled = i < pkg.progress
                          return (
                            <div
                              key={i}
                              className={`w-2.5 h-2.5 rounded-full ${isFilled ? 'bg-green-600' : 'bg-gray-300'}`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/akupuntur/packages/${pkg.id}`)}>
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
