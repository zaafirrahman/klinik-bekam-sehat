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

function getBloodSugarRange(type) {
  if (type === 'puasa') return { min: 70, max: 100 }
  return { min: 70, max: 140 } // sewaktu
}

function getUricAcidRange(gender) {
  if (gender === 'pria') return { min: 3.4, max: 7.0 }
  return { min: 2.4, max: 6.0 } // wanita
}

function getLabLabel(key, lab) {
  if (key === 'blood_sugar') return `Gula Darah (${lab.blood_sugar_type === 'puasa' ? 'Puasa' : 'Sewaktu'})`
  if (key === 'uric_acid') return `Asam Urat (${lab.uric_acid_gender === 'pria' ? 'Pria' : 'Wanita'})`
  return 'Kolesterol'
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
      blood_sugar_type: labRes.data.blood_sugar_type || '',
      uric_acid: labRes.data.uric_acid || '',
      uric_acid_gender: labRes.data.uric_acid_gender || '',
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
        blood_sugar_type: editForm.blood_sugar_type || null,
        uric_acid_gender: editForm.uric_acid_gender || null,
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

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

  const compressImage = (base64, quality = 0.75) => new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
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

  const fetchLabAssets = async () => {
    const results = {}
    const urls = {
      layout_url: clinicInfo?.layout_url,
      signature_url: clinicInfo?.signature_url,
    }
    await Promise.all(Object.entries(urls).map(async ([key, url]) => {
      if (!url) return
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const raw = await blobToBase64(blob)
        results[key] = await compressImage(raw, 0.75)
      } catch (e) {
        console.warn('Gagal fetch ' + key + ':', e)
      }
    }))
    return results
  }

  const generatePDF = async () => {
    setGeneratingPdf(true)
    try {
      const assets = await fetchLabAssets()

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20

      // Kop surat full page (layer paling bawah)
      if (assets.layout_url) {
        doc.addImage(assets.layout_url, 'JPEG', 0, 0, pageWidth, pageHeight)
      }

      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('HASIL PEMERIKSAAN LABORATORIUM', pageWidth / 2, 55, { align: 'center' })

      doc.setLineWidth(0.3)
      doc.line(margin, 60, pageWidth - margin, 60)

      // Data Pasien
      let y = 70
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
      doc.text('Hasil', margin + 55, y)
      doc.text('Satuan', margin + 80, y)
      doc.text('Nilai Normal', margin + 110, y)
      doc.text('Status', margin + 150, y)
      y += 5
      doc.line(margin, y, pageWidth - margin, y)
      y += 6

      doc.setFont('helvetica', 'normal')

      if (lab.blood_sugar) {
        const range = getBloodSugarRange(lab.blood_sugar_type)
        const status = getStatus(lab.blood_sugar, range.min, range.max)
        const label = `Gula Darah (${lab.blood_sugar_type === 'puasa' ? 'Puasa' : 'Sewaktu'})`
        const normalStr = lab.blood_sugar_type === 'puasa' ? '70 - 100' : '70 - 140'
        doc.text(label, margin, y)
        doc.text(`${lab.blood_sugar}`, margin + 55, y)
        doc.text('mg/dL', margin + 80, y)
        doc.text(normalStr, margin + 110, y)
        doc.setFont('helvetica', 'bold')
        doc.text(status === 'normal' ? 'Normal' : status === 'high' ? 'Tinggi' : 'Rendah', margin + 150, y)
        doc.setFont('helvetica', 'normal')
        y += 8
      }

      if (lab.uric_acid) {
        const range = getUricAcidRange(lab.uric_acid_gender)
        const status = getStatus(lab.uric_acid, range.min, range.max)
        const label = `Asam Urat (${lab.uric_acid_gender === 'pria' ? 'Pria' : 'Wanita'})`
        const normalStr = lab.uric_acid_gender === 'pria' ? '3.4 - 7.0' : '2.4 - 6.0'
        doc.text(label, margin, y)
        doc.text(`${lab.uric_acid}`, margin + 55, y)
        doc.text('mg/dL', margin + 80, y)
        doc.text(normalStr, margin + 110, y)
        doc.setFont('helvetica', 'bold')
        doc.text(status === 'normal' ? 'Normal' : status === 'high' ? 'Tinggi' : 'Rendah', margin + 150, y)
        doc.setFont('helvetica', 'normal')
        y += 8
      }

      if (lab.cholesterol) {
        const status = getStatus(lab.cholesterol, 0, 200)
        doc.text('Kolesterol', margin, y)
        doc.text(`${lab.cholesterol}`, margin + 55, y)
        doc.text('mg/dL', margin + 80, y)
        doc.text('< 200', margin + 110, y)
        doc.setFont('helvetica', 'bold')
        doc.text(status === 'normal' ? 'Normal' : status === 'high' ? 'Tinggi' : 'Rendah', margin + 150, y)
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

      // Tanggal & nama dokter
      const sigX = pageWidth - margin - 60
      const sigY = pageHeight - 60

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Medan, ${new Date(lab.lab_date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      })}`, sigX, sigY - 35)
      doc.text('Dokter / Terapis,', sigX, sigY - 28)

      // TTD & Stempel — fixed di bawah halaman
      if (assets.signature_url) {
        const sigX = pageWidth - margin - 60
        const sigY = pageHeight - 60
        doc.addImage(assets.signature_url, 'JPEG', sigX - 10, sigY - 25, 66, 40)
      }

      // Garis + nama dokter
      doc.line(sigX, sigY + 17, sigX + 55, sigY + 17)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(clinicInfo?.doctor || 'Dokter / Terapis', sigX, sigY + 23)
      doc.setFontSize(8)
      doc.text(`SIP: ${clinicInfo?.sip_number || '-'}`, sigX, sigY + 27)

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
    if (lab.blood_sugar) results.push(`Gula Darah (${lab.blood_sugar_type === 'puasa' ? 'Puasa' : 'Sewaktu'}): ${lab.blood_sugar} mg/dL`)
    if (lab.uric_acid) results.push(`Asam Urat (${lab.uric_acid_gender === 'pria' ? 'Pria' : 'Wanita'}): ${lab.uric_acid} mg/dL`)
    if (lab.cholesterol) results.push(`Kolesterol: ${lab.cholesterol} mg/dL`)

    const pesan =
`*${clinicInfo?.name || 'Klinik Bekam Sehat'}*

_Bismillah_
Berikut hasil pemeriksaan lab Anda:

${results.join('\n')}

Cek riwayat pemeriksaan di: 
https://klinikbekamsehat.pages.dev/portal

_Wassalam,_
Semoga sehat selalu!`

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
                  <p className="font-medium text-sm">
                    Gula Darah ({lab.blood_sugar_type === 'puasa' ? 'Puasa' : 'Sewaktu'})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Normal: {lab.blood_sugar_type === 'puasa' ? '70 - 100' : '70 - 140'} mg/dL
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-bold">{lab.blood_sugar} <span className="text-sm font-normal text-muted-foreground">mg/dL</span></p>
                  <StatusBadge status={getStatus(lab.blood_sugar, ...Object.values(getBloodSugarRange(lab.blood_sugar_type)))} />
                </div>
              </div>
            )}
            {lab.uric_acid && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">
                    Asam Urat ({lab.uric_acid_gender === 'pria' ? 'Pria' : 'Wanita'})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Normal: {lab.uric_acid_gender === 'pria' ? '3.4 - 7.0' : '2.4 - 6.0'} mg/dL
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-bold">{lab.uric_acid} <span className="text-sm font-normal text-muted-foreground">mg/dL</span></p>
                  <StatusBadge status={getStatus(lab.uric_acid, ...Object.values(getUricAcidRange(lab.uric_acid_gender)))} />
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
              <div className="space-y-4">
                {/* Gula Darah */}
                <div className="border rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium">Gula Darah</p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm"
                      variant={editForm.blood_sugar_type === 'puasa' ? 'default' : 'outline'}
                      onClick={() => setEditForm({ ...editForm, blood_sugar_type: editForm.blood_sugar_type === 'puasa' ? '' : 'puasa' })}>
                      Puasa
                    </Button>
                    <Button type="button" size="sm"
                      variant={editForm.blood_sugar_type === 'sewaktu' ? 'default' : 'outline'}
                      onClick={() => setEditForm({ ...editForm, blood_sugar_type: editForm.blood_sugar_type === 'sewaktu' ? '' : 'sewaktu' })}>
                      Sewaktu
                    </Button>
                  </div>
                  {editForm.blood_sugar_type && (
                    <Input type="number" placeholder="mg/dL" value={editForm.blood_sugar}
                      onChange={e => setEditForm({ ...editForm, blood_sugar: e.target.value })} />
                  )}
                </div>

                {/* Asam Urat */}
                <div className="border rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium">Asam Urat</p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm"
                      variant={editForm.uric_acid_gender === 'pria' ? 'default' : 'outline'}
                      onClick={() => setEditForm({ ...editForm, uric_acid_gender: editForm.uric_acid_gender === 'pria' ? '' : 'pria' })}>
                      Pria
                    </Button>
                    <Button type="button" size="sm"
                      variant={editForm.uric_acid_gender === 'wanita' ? 'default' : 'outline'}
                      onClick={() => setEditForm({ ...editForm, uric_acid_gender: editForm.uric_acid_gender === 'wanita' ? '' : 'wanita' })}>
                      Wanita
                    </Button>
                  </div>
                  {editForm.uric_acid_gender && (
                    <Input type="number" placeholder="mg/dL" value={editForm.uric_acid}
                      onChange={e => setEditForm({ ...editForm, uric_acid: e.target.value })} />
                  )}
                </div>

                {/* Kolesterol */}
                <div className="border rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium">Kolesterol</p>
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