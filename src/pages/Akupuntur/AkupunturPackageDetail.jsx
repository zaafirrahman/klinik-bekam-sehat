import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

export default function AkupunturPackageDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [packageData, setPackageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [visits, setVisits] = useState([])

  // Add visit dialog
  const [addVisitOpen, setAddVisitOpen] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [visitPopover, setVisitPopover] = useState(false)

  const fetchPackageData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('akupuntur_packages')
      .select(`
        *,
        patients (id, name, patient_code, phone, birth_year, address)
      `)
      .eq('id', id)
      .single()

    if (error) {
      toast.error('Paket tidak ditemukan')
      navigate('/akupuntur')
    } else {
      setPackageData(data)
      // Fetch all visits for this patient (untuk dropdown)
      const { data: patientVisits } = await supabase
        .from('visits')
        .select('id, visit_date, chief_complaint')
        .eq('patient_id', data.patient_id)
        .order('visit_date', { ascending: true })
      setVisits(patientVisits || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchPackageData() }, [id])

  // Get visits that are already recorded in this package
  // packageData.visited_ids is an array of visit IDs
  const getPackageVisits = () => {
    if (!packageData || !packageData.visited_ids) return []

    // Filter from all visits to get only those in the package
    return visits.filter(v => packageData.visited_ids.includes(v.id))
  }

  const addVisitToPackage = async () => {
    if (!selectedVisit) {
      toast.error('Pilih kunjungan terlebih dahulu')
      return
    }

    // Check if visit is already in package
    const existingVisits = getPackageVisits()
    if (existingVisits.some(v => v.id === selectedVisit.id)) {
      toast.error('Kunjungan ini sudah ada di paket')
      return
    }

    // Add visit ID to visited_ids array
    const newVisitedIds = [...packageData.visited_ids || [], selectedVisit.id]

    const { error } = await supabase
      .from('akupuntur_packages')
      .update({
        visited_ids: newVisitedIds,
        // Progress otomatis dari length visited_ids
        progress: newVisitedIds.length,
      })
      .eq('id', id)

    if (error) {
      toast.error('Gagal menambah kunjungan ke paket')
    } else {
      toast.success('Kunjungan berhasil ditambahkan ke paket!')
      setAddVisitOpen(false)
      setSelectedVisit(null)
      fetchPackageData()
    }
  }

  const handleRemoveVisit = async (visitId) => {
    const newVisitedIds = (packageData.visited_ids || []).filter(id => id !== visitId)

    const { error } = await supabase
      .from('akupuntur_packages')
      .update({
        visited_ids: newVisitedIds,
        progress: newVisitedIds.length,
      })
      .eq('id', id)

    if (error) {
      toast.error('Gagal menghapus kunjungan dari paket')
    } else {
      toast.success('Kunjungan dihapus dari paket')
      fetchPackageData()
    }
  }

  const renderProgress = (progress, total) => {
    const currentProgress = Math.min(progress, total)
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const isFilled = i < currentProgress
          return (
            <div
              key={i}
              className={`w-8 h-8 flex items-center justify-center rounded-full border text-xs font-medium transition-colors
                ${isFilled
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-500'}`}
              title={isFilled ? `Sesi ${i + 1} - Selesai` : `Sesi ${i + 1} - Menunggu`}
            >
              {isFilled ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) return <div className="p-6 text-muted-foreground">Memuat data...</div>
  if (!packageData) return null

  const currentYear = new Date().getFullYear()
  const packageVisits = getPackageVisits()
  const remainingSessions = packageData.total_sessions - packageData.progress

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/akupuntur')}>
          ← Kembali
        </Button>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Detail Paket Akupuntur</h1>
            <p className="text-sm text-muted-foreground">
              {packageData.created_at?.split('T')[0]} · {packageData.patients?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Info Kartu Paket */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Pasien */}
        <Card>
          <h2 className="text-lg font-semibold mb-3">Informasi Pasien</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama</span>
              <span className="font-medium">{packageData.patients?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kode</span>
              <Badge variant="outline">{packageData.patients?.patient_code}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usia</span>
              <span>{packageData.patients?.birth_year ? `~ ${currentYear - packageData.patients.birth_year} tahun` : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telepon</span>
              <span>{packageData.patients?.phone || '-'}</span>
            </div>
          </div>
        </Card>

        {/* Info Paket */}
        <Card>
          <h2 className="text-lg font-semibold mb-3">Informasi Paket</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nominal Paket</span>
              <span className="font-medium text-green-600">Rp {packageData.package_amount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Sesi</span>
              <span className="font-medium">{packageData.total_sessions} sesi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sesi Selesai</span>
              <span className="font-medium text-green-600">{packageData.progress} sesi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sisa Sesi</span>
              <span className="font-medium">{remainingSessions} sesi</span>
            </div>
            {packageData.notes && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Catatan</span>
                <span className="text-right max-w-xs">{packageData.notes}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Progres Paket</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sesi {packageData.progress} dari {packageData.total_sessions}:</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {renderProgress(packageData.progress, packageData.total_sessions)}
        </div>
      </Card>

      {/* Riwayat Kunjungan */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Riwayat Kunjungan</h2>
          <Button size="sm" onClick={() => setAddVisitOpen(true)}>
            + Tambah Kunjungan
          </Button>
        </div>

        {packageVisits.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Belum ada kunjungan tercatat dalam paket ini
          </p>
        ) : (
          <div className="space-y-2">
            {packageVisits.map((visit, idx) => (
              <div key={visit.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="outline" className="font-mono text-xs shrink-0">
                    {idx + 1}. {visit.visit_date}
                  </Badge>
                  <p className="text-sm text-muted-foreground truncate">
                    {visit.chief_complaint || 'Tanpa keluhan'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-600 h-8 text-xs"
                    onClick={() => navigate(`/visits/${visit.id}`)}
                  >
                    Detail
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive h-8 text-xs"
                    onClick={() => handleRemoveVisit(visit.id)}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tambah Kunjungan Dialog */}
      <Dialog open={addVisitOpen} onOpenChange={setAddVisitOpen}>
        <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Tambah Kunjungan ke Paket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Pilih kunjungan yang sudah dilakukan pasien untuk menambahkannya ke paket akupuntur.
            </p>

            {/* Cari Kunjungan */}
            <div className="space-y-2">
              <Label>Kunjungan *</Label>
              <Popover open={visitPopover} onOpenChange={setVisitPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    {selectedVisit
                      ? `${selectedVisit.visit_date} — ${selectedVisit.chief_complaint || 'Tanpa keluhan'}`
                      : 'Cari kunjungan...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari kunjungan..." />
                    <CommandList>
                      <CommandEmpty>Kunjungan tidak ditemukan</CommandEmpty>
                      <CommandGroup>
                        {visits.map(v => {
                          const alreadyInPackage = packageVisits.some(pkgV => pkgV.id === v.id)
                          return (
                            <CommandItem
                              key={v.id}
                              onSelect={() => {
                                if (!alreadyInPackage) {
                                  setSelectedVisit(v)
                                  setVisitPopover(false)
                                }
                              }}
                              disabled={alreadyInPackage}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{v.visit_date}</span>
                                <span className="text-muted-foreground">— {v.chief_complaint || 'Tanpa keluhan'}</span>
                              </div>
                              {alreadyInPackage && (
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  Sudah ada
                                </Badge>
                              )}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddVisitOpen(false)}>Batal</Button>
              <Button onClick={addVisitToPackage} disabled={!selectedVisit}>
                Tambahkan ke Paket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper Card component
function Card({ children, className = '' }) {
  return (
    <div className={`border rounded-lg overflow-hidden bg-card ${className}`}>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}