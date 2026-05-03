import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { jsPDF } from 'jspdf'

// Nilai normal referensi
const NORMAL_RANGES = {
  blood_sugar: { min: 70, max: 100, unit: 'mg/dL', label: 'Gula Darah (Puasa)' },
  uric_acid_male: { min: 3.4, max: 7.0, unit: 'mg/dL', label: 'Asam Urat (Pria)' },
  uric_acid_female: { min: 2.4, max: 6.0, unit: 'mg/dL', label: 'Asam Urat (Wanita)' },
  cholesterol: { min: 0, max: 200, unit: 'mg/dL', label: 'Kolesterol Total' },
}

function getStatus(value, min, max) {
  if (!value) return null
  if (value < min) return 'low'
  if (value > max) return 'high'
  return 'normal'
}

function StatusBadge({ status }) {
  if (!status) return null
  if (status === 'normal') return <Badge variant="default" className="text-xs bg-green-500">Normal</Badge>
  if (status === 'high') return <Badge variant="destructive" className="text-xs">Tinggi</Badge>
  return <Badge variant="secondary" className="text-xs">Rendah</Badge>
}

export default function LabDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [lab, setLab] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [clinicInfo, setClinicInfo] = useState(null)

  const currentYear = new Date().getFullYear()

  const fetchLab = async () => {
    setLoading(true)
    const [labRes, clinicRes] = await Promise.all([
      supabase
        .from('lab_results')
        .select(`
          *,
          patients(name, patient_code, birth_year, address, phone),
          visits(visit_date, chief_complaint)
        `)
        .eq('id', id)
        .single(),
      supabase.from('clinic_settings').select('*').eq('id', 1).single(),
    ])

    if (labRes.error) { toast.error('Data tidak ditemukan'); navigate('/lab'); return }
    setLab(labRes.data)
    setClinicInfo(clinicRes.data)
    setEditForm({
      lab_date: labRes.data.lab_date,
      blood_sugar: labRes.data.blood_sugar || '',
      uric_acid: labRes.data.uric_acid || '',
      cholesterol: labRes.data.cholesterol || '',
      notes: labRes.data.notes || '',
    })
    setLoading(false)
  }

  useEffect(() => { fetchLab() }, [id])

  const handleEdit = async (e) => {
    e.preventDefault()
    const { error } = await supabase
      .from('lab_results')
      .update({
        lab_date: editForm.lab_date,
        blood_sugar: editForm.blood_sugar ? parseFloat(editForm.blood_sugar) : null,
        uric_acid: editForm.uric_acid ? parseFloat(editForm.uric_acid) : null,
        cholesterol: editForm.cholesterol ? parseFloat(editForm.cholesterol) : null,
        notes: editForm.notes || null,
      })
      .eq('id', id)

    if (error) toast.error('Gagal mengupdate data lab')
    else { toast.success('Data lab berhasil diupdate!'); setEditOpen(false); fetchLab() }
  }

  const handleDelete = async () => {
    const { error } = await supabase.from('lab_results').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus data lab')
    else { toast.success('Data lab dihapus'); navigate('/lab') }
  }

  const generatePDF = async () => {
    setGeneratingPdf(true)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20

      // Header
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text((clinicInfo?.name || 'KLINIK BEKAM SEHAT').toUpperCase(), pageWidth / 2, 20, { align: 'center' })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      if (clinicInfo?.address) {
        doc.text(`${clinicInfo.address} · Telp: ${clinicInfo.phone || '-'}`, pageWidth / 2, 27, { align: 'center' })
      }

      doc.setLineWidth(0.5)
      doc.line(margin, 32, pageWidth - margin, 32)

      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('HASIL PEMERIKSAAN LABORATORIUM', pageWidth / 2, 42, { align: 'center' })

      doc.setLineWidth(0.3)
      doc.line(margin, 47, pageWidth - margin, 47)

      // Data Pasien
      let y = 57
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('DATA PASIEN', margin, y)
      y += 8

      doc.setFontSize(10)
      const patientData = [
        ['Nama', lab.patients?.name || '-'],
        ['Kode Pasien', lab.patients?.patient_code || '-'],
        ['Usia', lab.patients?.birth_year ? `~${currentYear - lab.patients.birth_year} tahun` : '-'],
        ['Alamat', lab.patients?.address || '-'],
        ['No. Telepon', lab.patients?.phone || '-'],
        ['Tanggal Pemeriksaan', lab.lab_date],
      ]

      patientData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(label, margin, y)
        doc.setFont('helvetica', 'normal')
        doc.text(`: ${value}`, margin + 50, y)
        y += 7
      })

      y += 4
      doc.line(margin, y, pageWidth - margin, y)
      y += 8

      // Hasil Lab
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('HASIL PEMERIKSAAN', margin, y)
      y += 8

      doc.setFontSize(10)

      // Header tabel
      doc.setFont('helvetica', 'bold')
      doc.text('Parameter', margin, y)
      doc.text('Hasil', margin + 70, y)
      doc.text('Satuan', margin + 100, y)
      doc.text('Nilai Normal', margin + 130, y)
      doc.text('Status', margin + 165, y)
      y += 5
      doc.line(margin, y, pageWidth - margin, y)
      y += 6

      doc.setFont('helvetica', 'normal')

      if (lab.blood_sugar) {
        const status = getStatus(lab.blood_sugar, 70, 100)
        doc.text('Gula Darah', margin, y)
        doc.text(`${lab.blood_sugar}`, margin + 70, y)
        doc.text('mg/dL', margin + 100, y)
        doc.text('70 - 100', margin + 130, y)
        doc.setFont('helvetica', 'bold')
        doc.text(status === 'normal' ? 'Normal' : status === 'high' ? 'Tinggi' : 'Rendah', margin + 165, y)
        doc.setFont('helvetica', 'normal')
        y += 8
      }

      if (lab.uric_acid) {
        const status = getStatus(lab.uric_acid, 2.4, 7.0)
        doc.text('Asam Urat', margin, y)
        doc.text(`${lab.uric_acid}`, margin + 70, y)
        doc.text('mg/dL', margin + 100, y)
        doc.text('2.4 - 7.0', margin + 130, y)
        doc.setFont('helvetica', 'bold')
        doc.text(status === 'normal' ? 'Normal' : status === 'high' ? 'Tinggi' : 'Rendah', margin + 165, y)
        doc.setFont('helvetica', 'normal')
        y += 8
      }

      if (lab.cholesterol) {
        const status = getStatus(lab.cholesterol, 0, 200)
        doc.text('Kolesterol', margin, y)
        doc.text(`${lab.cholesterol}`, margin + 70, y)
        doc.text('mg/dL', margin + 100, y)
        doc.text('< 200', margin + 130, y)
        doc.setFont('helvetica', 'bold')
        doc.text(status === 'normal' ? 'Normal' : status === 'high' ? 'Tinggi' : 'Rendah', margin + 165, y)
        doc.setFont('helvetica', 'normal')
        y += 8
      }

      y += 2
      doc.line(margin, y, pageWidth - margin, y)
      y += 8

      // Catatan
      if (lab.notes) {
        doc.setFont('helvetica', 'bold')
        doc.text('Catatan:', margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        const noteLines = doc.splitTextToSize(lab.notes, pageWidth - margin * 2)
        doc.text(noteLines, margin, y)
        y += noteLines.length * 6 + 4
      }

      // Tanda tangan
      const sigY = y + 20
      doc.text(`Medan, ${new Date(lab.lab_date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      })}`, pageWidth - margin - 60, y)
      doc.text('Dokter / Terapis,', pageWidth - margin - 60, y + 8)
      doc.line(pageWidth - margin - 60, sigY, pageWidth - margin, sigY)
      doc.text(clinicInfo?.doctor || 'Klinik Bekam Sehat', pageWidth - margin - 60, sigY + 7)

      // Upload ke storage
      const pdfBlob = doc.output('blob')
      const fileName = `lab_${lab.patients?.patient_code}_${lab.lab_date}_${Date.now()}.pdf`
      const filePath = `hasil-lab/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('konsultasi')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf' })

      if (uploadError) {
        doc.save(fileName)
        toast.warning('PDF didownload lokal (upload storage gagal)')
      } else {
        const { data: urlData } = supabase.storage.from('konsultasi').getPublicUrl(filePath)
        await supabase.from('lab_results').update({ letter_url: urlData.publicUrl }).eq('id', id)
        doc.save(fileName)
        toast.success('Surat lab berhasil dibuat dan disimpan!')
        fetchLab()
      }
    } catch (err) {
      toast.error('Gagal generate PDF')
      console.error(err)
    }
    setGeneratingPdf(false)
  }

  const handleSendWhatsApp = () => {
    if (!lab.patients?.phone) { toast.error('Nomor telepon pasien tidak ada!'); return }

    let phone = lab.patients.phone.replace(/\D/g, '')
    if (phone.startsWith('0')) phone = '62' + phone.slice(1)
    if (!phone.startsWith('62')) phone = '62' + phone

    const results = []
    if (lab.blood_sugar) results.push(`Gula Darah: ${lab.blood_sugar} mg/dL`)
    if (lab.uric_acid) results.push(`Asam Urat: ${lab.uric_acid} mg/dL`)
    if (lab.cholesterol) results.push(`Kolesterol: ${lab.cholesterol} mg/dL`)

    const pesan =
`*${clinicInfo?.name || 'Klinik Bekam Sehat'}*

Halo kak, berikut hasil pemeriksaan lab Anda:

${results.join('\n')}

Hasil lengkap terlampir.
Cek riwayat di: https://klinikbekamsehat.netlify.app/portal

Semoga lekas sehat!`

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`
    window.open(url, '_blank')
  }

  if (loading) return <div className="p-6 text-muted-foreground">Memuat data...</div>
  if (!lab) return null

  const bloodSugarStatus = getStatus(lab.blood_sugar, 70, 100)
  const uricAcidStatus = getStatus(lab.uric_acid, 2.4, 7.0)
  const cholesterolStatus = getStatus(lab.cholesterol, 0, 200)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/lab')}>
          ← Kembali
        </Button>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Hasil Lab</h1>
            <p className="text-sm text-muted-foreground">{lab.lab_date}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={generatePDF} disabled={generatingPdf}>
                {generatingPdf ? 'Generating...' : lab.letter_url ? '↻ PDF' : '📄 Generate PDF'}
              </Button>
              {lab.patients?.phone && (
                <Button variant="outline" size="sm" onClick={handleSendWhatsApp}>
                  📱 WA
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>Hapus</Button>
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
            {[
              ['Nama', lab.patients?.name],
              ['Kode', lab.patients?.patient_code],
              ['Usia', lab.patients?.birth_year ? `~${currentYear - lab.patients.birth_year} tahun` : '-'],
              ['Telepon', lab.patients?.phone || '-'],
              ['Alamat', lab.patients?.address || '-'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-right max-w-xs">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Info Lab */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Pemeriksaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ['Tanggal', lab.lab_date],
              ['Surat PDF', lab.letter_url ? '✓ Sudah digenerate' : 'Belum ada'],
              ['Kunjungan Terkait', lab.visits?.visit_date || '-'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
            {lab.letter_url && (
              <a href={lab.letter_url} target="_blank" rel="noopener noreferrer"
                className="text-primary text-xs underline block text-right">
                Lihat PDF →
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hasil Pemeriksaan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hasil Pemeriksaan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lab.blood_sugar && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Gula Darah</p>
                  <p className="text-xs text-muted-foreground">Normal: 70 - 100 mg/dL</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-bold">{lab.blood_sugar} <span className="text-sm font-normal text-muted-foreground">mg/dL</span></p>
                  <StatusBadge status={bloodSugarStatus} />
                </div>
              </div>
            )}
            {lab.uric_acid && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Asam Urat</p>
                  <p className="text-xs text-muted-foreground">Normal: 2.4 - 7.0 mg/dL</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-bold">{lab.uric_acid} <span className="text-sm font-normal text-muted-foreground">mg/dL</span></p>
                  <StatusBadge status={uricAcidStatus} />
                </div>
              </div>
            )}
            {lab.cholesterol && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Kolesterol</p>
                  <p className="text-xs text-muted-foreground">Normal: &lt; 200 mg/dL</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-bold">{lab.cholesterol} <span className="text-sm font-normal text-muted-foreground">mg/dL</span></p>
                  <StatusBadge status={cholesterolStatus} />
                </div>
              </div>
            )}
            {lab.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">Catatan</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lab.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Hasil Lab</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={editForm.lab_date}
                onChange={e => setEditForm({ ...editForm, lab_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Parameter Pemeriksaan</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="w-28 text-sm shrink-0">Gula Darah</Label>
                  <Input type="number" placeholder="mg/dL" value={editForm.blood_sugar}
                    onChange={e => setEditForm({ ...editForm, blood_sugar: e.target.value })} />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-28 text-sm shrink-0">Asam Urat</Label>
                  <Input type="number" placeholder="mg/dL" value={editForm.uric_acid}
                    onChange={e => setEditForm({ ...editForm, uric_acid: e.target.value })} />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-28 text-sm shrink-0">Kolesterol</Label>
                  <Input type="number" placeholder="mg/dL" value={editForm.cholesterol}
                    onChange={e => setEditForm({ ...editForm, cholesterol: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea value={editForm.notes}
                onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Lab?</AlertDialogTitle>
            <AlertDialogDescription>
              Data lab {lab.lab_date} untuk {lab.patients?.name} akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}