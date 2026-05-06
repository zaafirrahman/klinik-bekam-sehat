import { jsPDF } from 'jspdf'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'

export default function VisitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [visit, setVisit] = useState(null)
  const [loading, setLoading] = useState(true)

  // Edit visit
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})

  // Delete visit
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Add service
  const [serviceOpen, setServiceOpen] = useState(false)
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [servicePopover, setServicePopover] = useState(false)
  const [serviceSearch, setServiceSearch] = useState('')
  const [serviceForm, setServiceForm] = useState({ quantity: 1, final_price: '', note: '' })

  // Checkout
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutItems, setCheckoutItems] = useState([])

  // Delete service
  const [deleteServiceOpen, setDeleteServiceOpen] = useState(false)
  const [deleteServiceTarget, setDeleteServiceTarget] = useState(null)

  const [clinicInfo, setClinicInfo] = useState(null)
  

  const fetchVisit = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('visits')
      .select(`
        *,
        patients (id, name, patient_code, phone, birth_year, address),
        visit_services (
          id, quantity, final_price, note, status,
          services (id, name, category, service_code, unit)
        )
      `)
      .eq('id', id)
      .single()

    if (error) { toast.error('Kunjungan tidak ditemukan'); navigate('/visits') }
    else {
      setVisit(data)
      setEditForm({
        visit_date: data.visit_date,
        blood_pressure: data.blood_pressure || '',
        chief_complaint: data.chief_complaint || '',
        notes: data.notes || '',
      })
    }
    setLoading(false)
  }

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('category')
    setServices(data || [])
  }

  useEffect(() => {
    fetchVisit()
    fetchServices()
    // Fetch clinic info
    supabase
      .from('clinic_settings')
      .select('name, address, phone, doctor, layout_url, stamp_url, signature_url')
      .eq('id', 1)
      .single()
      .then(({ data }) => setClinicInfo(data))
  }, [id])

  // EDIT VISIT
  const handleEditVisit = async (e) => {
    e.preventDefault()
    const { error } = await supabase
      .from('visits')
      .update({
        visit_date: editForm.visit_date,
        blood_pressure: editForm.blood_pressure || null,
        chief_complaint: editForm.chief_complaint || null,
        notes: editForm.notes || null,
      })
      .eq('id', id)

    if (error) toast.error('Gagal mengupdate kunjungan')
    else {
      toast.success('Kunjungan berhasil diupdate!')
      setEditOpen(false)
      fetchVisit()
    }
  }

  // DELETE VISIT
  const handleDeleteVisit = async () => {
    const { error } = await supabase.from('visits').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus kunjungan')
    else {
      toast.success('Kunjungan dihapus')
      navigate('/visits')
    }
  }

  // ADD SERVICE
  const handleSelectService = (s) => {
    setSelectedService(s)
    setServiceForm({ quantity: 1, final_price: s.base_price, note: '' })
    setServicePopover(false)
  }

  const handleAddService = async (e) => {
    e.preventDefault()
    if (!selectedService) { toast.error('Pilih layanan terlebih dahulu'); return }

    const { error } = await supabase.from('visit_services').insert({
      visit_id: id,
      service_id: selectedService.id,
      quantity: parseInt(serviceForm.quantity),
      final_price: parseFloat(serviceForm.final_price),
      note: serviceForm.note || null,
      status: 'pending',
    })

    if (error) toast.error('Gagal menambah layanan')
    else {
      toast.success('Layanan berhasil ditambahkan!')
      setServiceOpen(false)
      setSelectedService(null)
      setServiceForm({ quantity: 1, final_price: '', note: '' })
      fetchVisit()
    }
  }

  // DELETE SERVICE
  const handleDeleteService = async () => {
    const { error } = await supabase
      .from('visit_services')
      .delete()
      .eq('id', deleteServiceTarget.id)

    if (error) toast.error('Gagal menghapus layanan')
    else {
      toast.success('Layanan dihapus')
      setDeleteServiceOpen(false)
      fetchVisit()
    }
  }

  // CHECKOUT
  const openCheckout = () => {
    const pending = visit.visit_services.filter(s => s.status === 'pending')
    if (pending.length === 0) { toast.error('Tidak ada layanan pending'); return }
    setCheckoutItems(pending.map(s => ({
      ...s,
      final_price: s.final_price,
      note: s.note || '',
    })))
    setCheckoutOpen(true)
  }

  const handleCheckout = async () => {
    const updates = checkoutItems.map(item =>
      supabase
        .from('visit_services')
        .update({
          status: 'done',
          final_price: parseFloat(item.final_price),
          note: item.note || null,
        })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const hasError = results.some(r => r.error)

    if (hasError) toast.error('Gagal melakukan checkout')
    else {
      toast.success('Checkout berhasil! Pemasukan tercatat.')
      setCheckoutOpen(false)
      fetchVisit()
      setTimeout(() => generateNota(checkoutItems), 500) // generateNota is now async
    }
  }

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

  const compressImage = (base64, quality = 0.7) => new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // Scale down ke max 800px width
      const maxW = 800
      const scale = img.width > maxW ? maxW / img.width : 1
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = base64
  })

  const fetchAssets = async () => {
    const keys = ['layout_url', 'stamp_url']
    const results = {}
    await Promise.all(keys.map(async (key) => {
      const url = clinicInfo?.[key]
      if (!url) return
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        if (key === 'stamp_url') {
          // Stamp LUNAS tetap PNG
          results[key] = await blobToBase64(blob)
        } else {
          // Layout compress ke JPEG
          const raw = await blobToBase64(blob)
          results[key] = await compressImage(raw, 0.75)
        }
      } catch (e) {
        console.warn(`Gagal fetch ${key}:`, e)
      }
    }))
    return results
  }

  const generateNota = async (items) => {
    const assets = await fetchAssets()

    const doc = new jsPDF({ format: 'a5' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15

    // Kop surat full page (layer paling bawah)
    if (assets.layout_url) {
      doc.addImage(assets.layout_url, 'JPEG', 0, 0, pageWidth, pageHeight)
    }

    // Judul
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTA PEMBAYARAN', pageWidth / 2, 36, { align: 'center' })
    let y = 48
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    const tanggal = new Date(visit.visit_date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

    const infoRows = [
      ['Tanggal', tanggal],
      ['Pasien', `${visit.patients?.name} (${visit.patients?.patient_code})`],
      ['Telepon', visit.patients?.phone || '-'],
    ]

    infoRows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(label, margin, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`: ${value}`, margin + 25, y)
      y += 7
    })

    y += 3
    doc.line(margin, y, pageWidth - margin, y)
    y += 7

    // Tabel layanan
    doc.setFont('helvetica', 'bold')
    doc.text('Layanan / Produk', margin, y)
    doc.text('Qty', pageWidth - margin - 40, y)
    doc.text('Total', pageWidth - margin, y, { align: 'right' })
    y += 5
    doc.line(margin, y, pageWidth - margin, y)
    y += 6

    doc.setFont('helvetica', 'normal')
    items.forEach(s => {
      const subtotal = parseFloat(s.final_price) * parseInt(s.quantity)
      const nameLine = doc.splitTextToSize(s.services?.name || '-', pageWidth - margin * 2 - 50)
      doc.text(nameLine, margin, y)
      doc.text(`${s.quantity}x`, pageWidth - margin - 40, y)
      doc.text(`Rp ${subtotal.toLocaleString('id-ID')}`, pageWidth - margin, y, { align: 'right' })
      y += nameLine.length * 5 + 3

      if (s.note) {
        doc.setFontSize(8)
        doc.setTextColor(128)
        doc.text(`  (${s.note})`, margin, y)
        doc.setTextColor(0)
        doc.setFontSize(9)
        y += 5
      }
    })

    y += 2
    doc.line(margin, y, pageWidth - margin, y)
    y += 7

    // Total
    const total = items.reduce((sum, s) => sum + parseFloat(s.final_price) * parseInt(s.quantity), 0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL', margin, y)
    doc.text(`Rp ${total.toLocaleString('id-ID')}`, pageWidth - margin, y, { align: 'right' })

    // Stempel LUNAS — fixed di bawah halaman
    if (assets.stamp_url) {
      const sigY = pageHeight - 55
      const sigX = pageWidth - margin - 55
      doc.addImage(assets.stamp_url, 'PNG', sigX + 10, sigY + 5, 45, 23)
    }

    // Download
    const fileName = `nota_${visit.patients?.patient_code}_${visit.visit_date}.pdf`
    doc.save(fileName)
  }

  const handleSendWhatsApp = () => {
    if (!visit.patients?.phone) {
      toast.error('Nomor telepon pasien tidak ada!')
      return
    }

    const doneItems = visit.visit_services?.filter(s => s.status === 'done') || []
    if (doneItems.length === 0) {
      toast.error('Belum ada layanan yang selesai!')
      return
    }

    // Format nomor WA (hapus 0 di depan, ganti dengan 62)
    let phone = visit.patients.phone.replace(/\D/g, '')
    if (phone.startsWith('0')) phone = '62' + phone.slice(1)
    if (!phone.startsWith('62')) phone = '62' + phone

    // Format pesan nota
    const tanggal = new Date(visit.visit_date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

    const itemLines = doneItems
      .map(s => `• ${s.services?.name} x${s.quantity} — Rp ${(s.final_price * s.quantity).toLocaleString('id-ID')}`)
      .join('\n')

    const total = doneItems.reduce((sum, s) => sum + s.final_price * s.quantity, 0)

    const pesan = 
`*${clinicInfo?.name || 'Klinik Bekam Sehat'}*

_Assalamu'alaikum_
Terima kasih sudah berkunjung hari ini!

Nota pembayaran terlampir.
Total: *Rp ${total.toLocaleString('id-ID')}*

Cek riwayat kunjungan Anda di:
https://klinikbekamsehat.pages.dev/portal

_Wassalam,_
Semoga sehat selalu!`

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`
    window.open(url, '_blank')
  }

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  )

  if (loading) return <div className="p-6 text-muted-foreground">Memuat data...</div>
  if (!visit) return null

  const currentYear = new Date().getFullYear()
  const pendingItems = visit.visit_services?.filter(s => s.status === 'pending') || []
  const doneItems = visit.visit_services?.filter(s => s.status === 'done') || []
  const totalPending = pendingItems.reduce((sum, s) => sum + (s.final_price * s.quantity), 0)
  const totalDone = doneItems.reduce((sum, s) => sum + (s.final_price * s.quantity), 0)
  const hasDoneItems = doneItems.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/visits')}>
          ← Kembali
        </Button>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Detail Kunjungan</h1>
            <p className="text-sm text-muted-foreground">{visit.visit_date}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex gap-2">
              {doneItems.length > 0 && visit.patients?.phone && (
                <Button variant="outline" size="sm" onClick={handleSendWhatsApp}>
                  📱 WA
                </Button>
              )}
              {doneItems.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => generateNota(doneItems)}>
                  📄 Nota
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                disabled={hasDoneItems}
                title={hasDoneItems ? 'Tidak bisa dihapus, ada layanan yang sudah checkout' : ''}
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Pasien */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Pasien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama</span>
              <span className="font-medium">{visit.patients?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kode</span>
              <Badge variant="outline">{visit.patients?.patient_code}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usia</span>
              <span>{visit.patients?.birth_year ? `~ ${currentYear - visit.patients.birth_year} tahun` : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telepon</span>
              <span>{visit.patients?.phone || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alamat</span>
              <span className="text-right max-w-xs">{visit.patients?.address || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Info Kunjungan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Kunjungan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tanggal</span>
              <span>{visit.visit_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tekanan Darah</span>
              <span>{visit.blood_pressure || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Keluhan</span>
              <span className="text-right max-w-xs">{visit.chief_complaint || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Catatan</span>
              <span className="text-right max-w-xs">{visit.notes || '-'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layanan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Layanan & Produk</CardTitle>
            <div className="flex gap-2">
              <Dialog open={serviceOpen} onOpenChange={setServiceOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">+ Tambah Layanan</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Layanan / Produk</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddService} className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label>Layanan / Produk *</Label>
                      <Popover open={servicePopover} onOpenChange={setServicePopover}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start font-normal">
                            {selectedService ? selectedService.name : 'Pilih layanan...'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Cari layanan..."
                              onValueChange={setServiceSearch}
                            />
                            <CommandList>
                              <CommandEmpty>Tidak ditemukan</CommandEmpty>
                              <CommandGroup>
                                {filteredServices.map(s => (
                                  <CommandItem key={s.id} onSelect={() => handleSelectService(s)}>
                                    <span>{s.name}</span>
                                    <span className="ml-auto text-muted-foreground text-xs">
                                      Rp {s.base_price.toLocaleString('id-ID')}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Jumlah</Label>
                        <Input
                          type="number"
                          min="1"
                          value={serviceForm.quantity}
                          onChange={e => setServiceForm({ ...serviceForm, quantity: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Harga (Rp)</Label>
                        <Input
                          type="number"
                          value={serviceForm.final_price}
                          onChange={e => setServiceForm({ ...serviceForm, final_price: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Catatan</Label>
                      <Input
                        placeholder="diskon, gratis, keterangan tambahan..."
                        value={serviceForm.note}
                        onChange={e => setServiceForm({ ...serviceForm, note: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setServiceOpen(false)}>Batal</Button>
                      <Button type="submit">Tambahkan</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {pendingItems.length > 0 && (
                <Button size="sm" onClick={openCheckout}>
                  Checkout ({pendingItems.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {visit.visit_services?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada layanan ditambahkan
            </p>
          ) : (
            <>
              {/* Mobile: Card list */}
              <div className="md:hidden space-y-2">
                {visit.visit_services?.map(s => (
                  <div key={s.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{s.services?.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.quantity}x · Rp {s.final_price.toLocaleString('id-ID')}
                        </p>
                        {s.note && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{s.note}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant={s.status === 'done' ? 'default' : 'secondary'} className="text-xs">
                          {s.status === 'done' ? 'Selesai' : 'Pending'}
                        </Badge>
                        <p className="text-sm font-medium">
                          Rp {(s.final_price * s.quantity).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    {s.status === 'pending' && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-7 text-xs"
                          onClick={() => { setDeleteServiceTarget(s); setDeleteServiceOpen(true) }}
                        >
                          Hapus
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Layanan</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visit.visit_services.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.services?.name}</TableCell>
                        <TableCell>{s.quantity}</TableCell>
                        <TableCell>Rp {s.final_price.toLocaleString('id-ID')}</TableCell>
                        <TableCell>Rp {(s.final_price * s.quantity).toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-muted-foreground">{s.note || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === 'done' ? 'default' : 'secondary'}>
                            {s.status === 'done' ? 'Selesai' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {s.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => { setDeleteServiceTarget(s); setDeleteServiceOpen(true) }}
                            >
                              Hapus
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Summary */}
          {visit.visit_services?.length > 0 && (
            <div className="mt-4 pt-4 border-t space-y-1 text-sm">
              {doneItems.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sudah dibayar</span>
                  <span className="font-medium text-green-600">
                    Rp {totalDone.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              {pendingItems.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium">Rp {totalPending.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total</span>
                <span>Rp {(totalDone + totalPending).toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Visit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kunjungan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditVisit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Tanggal Kunjungan</Label>
              <Input
                type="date"
                value={editForm.visit_date}
                onChange={e => setEditForm({ ...editForm, visit_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tekanan Darah</Label>
              <Input
                placeholder="120/80"
                value={editForm.blood_pressure}
                onChange={e => setEditForm({ ...editForm, blood_pressure: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Keluhan Utama</Label>
              <Input
                value={editForm.chief_complaint}
                onChange={e => setEditForm({ ...editForm, chief_complaint: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input
                value={editForm.notes}
                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-1">
            <div className="space-y-3 mt-2">
              <p className="text-sm text-muted-foreground">
                Review dan konfirmasi harga sebelum checkout. Harga bisa diedit.
              </p>
              {checkoutItems.map((item, idx) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{item.services?.name}</span>
                    <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Harga (Rp)</Label>
                      <Input
                        type="number"
                        value={checkoutItems[idx].final_price}
                        onChange={e => {
                          const updated = [...checkoutItems]
                          updated[idx].final_price = e.target.value
                          setCheckoutItems(updated)
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Catatan</Label>
                      <Input
                        placeholder="diskon, gratis..."
                        value={checkoutItems[idx].note}
                        onChange={e => {
                          const updated = [...checkoutItems]
                          updated[idx].note = e.target.value
                          setCheckoutItems(updated)
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium">
                    Subtotal: Rp {(checkoutItems[idx].final_price * item.quantity).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span>
                  Rp {checkoutItems.reduce((sum, i) => sum + (parseFloat(i.final_price) * i.quantity), 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Batal</Button>
            <Button onClick={handleCheckout}>Konfirmasi Checkout</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Visit */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kunjungan?</AlertDialogTitle>
            <AlertDialogDescription>
              Kunjungan {visit.visit_date} untuk {visit.patients?.name} akan dihapus permanen beserta semua layanannya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVisit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Service */}
      <AlertDialog open={deleteServiceOpen} onOpenChange={setDeleteServiceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Layanan?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteServiceTarget?.services?.name} akan dihapus dari kunjungan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}