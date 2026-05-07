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

export default function ConsultationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [consult, setConsult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [generatingPdf, setGeneratingPdf] = useState(false)

  // Helper function to calculate age from birth_date (exact)
  const calculateAge = (birthDate) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return `${age} tahun`
  }

  const fetchConsult = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('consultations')
      .select(`
        *,
        patients(name, patient_code, birth_date, address, phone),
        visits(visit_date, blood_pressure, chief_complaint)
      `)
      .eq('id', id)
      .single()

    if (error) { toast.error('Konsultasi tidak ditemukan'); navigate('/consultations') }
    else {
      setConsult(data)
      setEditForm({
        consult_date: data.consult_date,
        complaint: data.complaint || '',
        findings: data.findings || '',
        plan: data.plan || '',
        archive_ref: data.archive_ref || '',
      })
    }
    setLoading(false)
  }

  useEffect(() => { fetchConsult() }, [id])

  const handleEdit = async (e) => {
    e.preventDefault()
    const { error } = await supabase
      .from('consultations')
      .update({
        consult_date: editForm.consult_date,
        complaint: editForm.complaint || null,
        findings: editForm.findings || null,
        plan: editForm.plan || null,
        archive_ref: editForm.archive_ref || null,
      })
      .eq('id', id)

    if (error) toast.error('Gagal mengupdate konsultasi')
    else {
      toast.success('Konsultasi berhasil diupdate!')
      setEditOpen(false)
      fetchConsult()
    }
  }

  const handleDelete = async () => {
    const { error } = await supabase.from('consultations').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus konsultasi')
    else { toast.success('Konsultasi dihapus'); navigate('/consultations') }
  }

  const generatePDF = async () => {
    setGeneratingPdf(true)
    try {
      const { data: clinicInfo } = await supabase
        .from('clinic_settings')
        .select('*')
        .eq('id', 1)
        .single()
      const clinicName = clinicInfo?.name || 'Klinik Bekam Sehat Medan'
      const clinicAddress = clinicInfo?.address || '[Alamat Klinik]'
      const clinicPhone = clinicInfo?.phone || '[No. Telp Klinik]'
      const clinicDoctor = clinicInfo?.doctor || 'Klinik Bekam Sehat'
      const doc = new jsPDF()
      const currentYear = new Date().getFullYear()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20

      // Header Klinik
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(clinicName.toUpperCase(), pageWidth / 2, 20, { align: 'center' })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`${clinicAddress} · Telp: ${clinicPhone}`, pageWidth / 2, 27, { align: 'center' })

      // Garis
      doc.setLineWidth(0.5)
      doc.line(margin, 32, pageWidth - margin, 32)

      // Judul Surat
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('SURAT KETERANGAN KONSULTASI', pageWidth / 2, 42, { align: 'center' })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`No. Registrasi: ${consult.reg_number}`, pageWidth / 2, 49, { align: 'center' })

      // Garis
      doc.line(margin, 54, pageWidth - margin, 54)

      // Data Pasien
      let y = 64
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('DATA PASIEN', margin, y)
      y += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      const patientData = [
        ['Nama', consult.patients?.name || '-'],
        ['Kode Pasien', consult.patients?.patient_code || '-'],
        ['Usia', consult.patients?.birth_date ? calculateAge(consult.patients.birth_date) : '-'],
        ['Alamat', consult.patients?.address || '-'],
        ['No. Telepon', consult.patients?.phone || '-'],
        ['Tanggal Konsultasi', consult.consult_date],
      ]

      patientData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(`${label}`, margin, y)
        doc.setFont('helvetica', 'normal')
        doc.text(`: ${value}`, margin + 45, y)
        y += 7
      })

      y += 4
      doc.line(margin, y, pageWidth - margin, y)
      y += 8

      // Hasil Konsultasi
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('HASIL KONSULTASI', margin, y)
      y += 8

      doc.setFontSize(10)

      const sections = [
        ['Keluhan', consult.complaint],
        ['Temuan / Diagnosis', consult.findings],
        ['Rencana Tindakan', consult.plan],
      ]

      sections.forEach(([label, value]) => {
        if (!value) return
        doc.setFont('helvetica', 'bold')
        doc.text(label, margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        const lines = doc.splitTextToSize(value, pageWidth - margin * 2)
        doc.text(lines, margin, y)
        y += lines.length * 6 + 4
      })

      y += 4
      doc.line(margin, y, pageWidth - margin, y)
      y += 10

      // Tanda Tangan
      const sigY = y + 30
      doc.setFontSize(10)
      doc.text(`Medan, ${new Date(consult.consult_date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      })}`, pageWidth - margin - 60, y)
      doc.text('Dokter / Terapis,', pageWidth - margin - 60, y + 8)
      doc.text('_____________________', pageWidth - margin - 60, sigY)
      doc.text(clinicDoctor, pageWidth - margin - 60, sigY + 7)

      // Nomor arsip
      if (consult.archive_ref) {
        doc.setFontSize(9)
        doc.setTextColor(128)
        doc.text(`No. Arsip: ${consult.archive_ref}`, margin, sigY + 14)
        doc.setTextColor(0)
      }

      // Simpan PDF sebagai blob → upload ke Supabase Storage
      const pdfBlob = doc.output('blob')
      const fileName = `konsul_${consult.reg_number.replace(/\./g, '-')}_${Date.now()}.pdf`
      const filePath = `surat-konsul/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('konsultasi')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf' })

      if (uploadError) {
        // Kalau upload gagal, tetap download lokal
        doc.save(fileName)
        toast.warning('PDF didownload lokal (upload storage gagal)')
      } else {
        // Simpan URL ke DB
        const { data: urlData } = supabase.storage
          .from('konsultasi')
          .getPublicUrl(filePath)

        await supabase
          .from('consultations')
          .update({ letter_url: urlData.publicUrl })
          .eq('id', id)

        // Download juga ke lokal
        doc.save(fileName)
        toast.success('Surat konsul berhasil dibuat dan disimpan!')
        fetchConsult()
      }
    } catch (err) {
      toast.error('Gagal generate PDF')
      console.error(err)
    }
    setGeneratingPdf(false)
  }

  if (loading) return <div className="p-6 text-muted-foreground">Memuat data...</div>
  if (!consult) return null

  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/consultations')}>
          ← Kembali
        </Button>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold">Detail Konsultasi</h1>
              <Badge variant="outline" className="font-mono">
                {consult.reg_number}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{consult.consult_date}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={generatePDF}
              disabled={generatingPdf}
            >
              {generatingPdf ? 'Generating...' : consult.letter_url ? '↻ PDF' : '📄 Generate PDF'}
            </Button>
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
              ['Nama', consult.patients?.name],
              ['Kode', consult.patients?.patient_code],
              ['Usia', consult.patients?.birth_date ? calculateAge(consult.patients.birth_date) : '-'],
              ['Telepon', consult.patients?.phone || '-'],
              ['Alamat', consult.patients?.address || '-'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-right max-w-xs">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Info Konsultasi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Konsultasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ['No. Registrasi', consult.reg_number],
              ['Tanggal', consult.consult_date],
              ['No. Arsip Fisik', consult.archive_ref || '-'],
              ['Surat PDF', consult.letter_url ? '✓ Sudah digenerate' : 'Belum ada'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-right">{value}</span>
              </div>
            ))}
            {consult.letter_url && (
              <a
                href={consult.letter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-xs underline block text-right"
              >
                Lihat PDF →
              </a>
            )}
            {consult.visits && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kunjungan Terkait</span>
                <span className="font-medium">{consult.visits.visit_date}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hasil Konsultasi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hasil Konsultasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {[
            ['Keluhan', consult.complaint],
            ['Temuan / Diagnosis', consult.findings],
            ['Rencana Tindakan', consult.plan],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-muted-foreground font-medium mb-1">{label}</p>
              <p className="whitespace-pre-wrap">{value || '-'}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Konsultasi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={editForm.consult_date}
                onChange={e => setEditForm({ ...editForm, consult_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Keluhan</Label>
              <Textarea
                value={editForm.complaint}
                onChange={e => setEditForm({ ...editForm, complaint: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Temuan / Diagnosis</Label>
              <Textarea
                value={editForm.findings}
                onChange={e => setEditForm({ ...editForm, findings: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Rencana Tindakan</Label>
              <Textarea
                value={editForm.plan}
                onChange={e => setEditForm({ ...editForm, plan: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>No. Arsip Fisik</Label>
              <Input
                value={editForm.archive_ref}
                onChange={e => setEditForm({ ...editForm, archive_ref: e.target.value })}
              />
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
            <AlertDialogTitle>Hapus Konsultasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Konsultasi {consult.reg_number} untuk {consult.patients?.name} akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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