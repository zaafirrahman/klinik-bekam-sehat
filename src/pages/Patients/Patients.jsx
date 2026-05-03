import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useNavigate } from 'react-router-dom'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const emptyForm = { name: '', birth_year: '', address: '', phone: '' }
const currentYear = new Date().getFullYear()

function PatientForm({ form, setForm, onSubmit, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label>Nama Lengkap *</Label>
        <Input
          placeholder="Nama pasien"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Tahun Lahir</Label>
        <Input
          type="number"
          placeholder="contoh: 1985"
          min="1900"
          max={currentYear}
          value={form.birth_year}
          onChange={e => setForm({ ...form, birth_year: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Alamat</Label>
        <Input
          placeholder="Alamat pasien"
          value={form.address}
          onChange={e => setForm({ ...form, address: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>No. Telepon</Label>
        <Input
          placeholder="08xxxxxxxxxx"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Add
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm)

  // Edit
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editTarget, setEditTarget] = useState(null)

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const navigate = useNavigate()

  const fetchPatients = async () => {
    setLoading(true)
    let query = supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) toast.error('Gagal memuat data pasien')
    else setPatients(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPatients() }, [search])

  // ADD
  const handleAdd = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('patients').insert({
      name: addForm.name,
      birth_year: addForm.birth_year ? parseInt(addForm.birth_year) : null,
      address: addForm.address || null,
      phone: addForm.phone || null,
    })
    if (error) toast.error('Gagal mendaftarkan pasien')
    else {
      toast.success('Pasien berhasil didaftarkan!')
      setAddForm(emptyForm)
      setAddOpen(false)
      fetchPatients()
    }
  }

  // EDIT
  const openEdit = (p) => {
    setEditTarget(p)
    setEditForm({
      name: p.name,
      birth_year: p.birth_year || '',
      address: p.address || '',
      phone: p.phone || '',
    })
    setEditOpen(true)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    const { error } = await supabase
      .from('patients')
      .update({
        name: editForm.name,
        birth_year: editForm.birth_year ? parseInt(editForm.birth_year) : null,
        address: editForm.address || null,
        phone: editForm.phone || null,
      })
      .eq('id', editTarget.id)

    if (error) toast.error('Gagal mengupdate data pasien')
    else {
      toast.success('Data pasien berhasil diupdate!')
      setEditOpen(false)
      setEditTarget(null)
      fetchPatients()
    }
  }

  // DELETE
  const openDelete = (p) => {
    setDeleteTarget(p)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', deleteTarget.id)

    if (error) toast.error('Gagal menghapus pasien')
    else {
      toast.success('Pasien berhasil dihapus')
      setDeleteOpen(false)
      setDeleteTarget(null)
      fetchPatients()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Data Pasien</h1>
          <p className="text-sm text-muted-foreground">{patients.length} pasien terdaftar</p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>+ Daftarkan Pasien</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Daftarkan Pasien Baru</DialogTitle>
            </DialogHeader>
            <PatientForm
              form={addForm}
              setForm={setAddForm}
              onSubmit={handleAdd}
              submitLabel="Daftarkan"
            />
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Cari nama atau nomor telepon..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Mobile: Card List */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Memuat data...</p>
        ) : patients.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {search ? 'Pasien tidak ditemukan' : 'Belum ada pasien terdaftar'}
          </p>
        ) : (
          patients.map(p => (
            <div
              key={p.id}
              className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
              onClick={() => navigate(`/patients/${p.id}`)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="font-mono text-xs shrink-0">{p.patient_code}</Badge>
                  <p className="font-medium text-sm truncate">{p.name}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {p.birth_year ? `~ ${currentYear - p.birth_year} th` : '-'}
                </p>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{p.phone || 'No telp -'}</span>
                {p.address && <span className="line-clamp-1 break-all">· {p.address}</span>}
              </div>
              <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="outline" className="h-7 text-xs flex-1"
                  onClick={() => openEdit(p)}>Edit</Button>
                <Button size="sm" variant="destructive" className="h-7 text-xs flex-1"
                  onClick={() => openDelete(p)}>Hapus</Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Usia</TableHead>
              <TableHead>No. Telp</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {search ? 'Pasien tidak ditemukan' : 'Belum ada pasien terdaftar'}
                </TableCell>
              </TableRow>
            ) : (
              patients.map(p => (
                <TableRow 
                    key={p.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/patients/${p.id}`)}
                  >
                  <TableCell>
                    <Badge variant="outline">{p.patient_code}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    {p.birth_year ? `${currentYear - p.birth_year} th` : '-'}
                  </TableCell>
                  <TableCell>{p.phone || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{p.address || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => openDelete(p)}>
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Pasien</DialogTitle>
          </DialogHeader>
          <PatientForm
            form={editForm}
            setForm={setEditForm}
            onSubmit={handleEdit}
            submitLabel="Simpan Perubahan"
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pasien?</AlertDialogTitle>
            <AlertDialogDescription>
              Data <strong>{deleteTarget?.name}</strong> ({deleteTarget?.patient_code}) akan dihapus permanen.
              Semua riwayat kunjungan terkait tidak bisa dihapus jika masih ada data.
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