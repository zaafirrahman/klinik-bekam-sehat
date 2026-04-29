import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

const CLINIC_INFO_KEY = 'clinic_info'

function useProfile() {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    fetch()
  }, [])
  return profile
}

export default function Settings() {
  const profile = useProfile()
  const isOwner = profile?.role === 'owner'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Kelola data master dan konfigurasi klinik</p>
      </div>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Layanan & Produk</TabsTrigger>
          {isOwner && <TabsTrigger value="clinic">Info Klinik</TabsTrigger>}
          {isOwner && <TabsTrigger value="users">Pengguna</TabsTrigger>}
        </TabsList>

        <TabsContent value="services" className="mt-4">
          <ServicesTab />
        </TabsContent>

        {isOwner && (
          <TabsContent value="clinic" className="mt-4">
            <ClinicTab />
          </TabsContent>
        )}

        {isOwner && (
          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function ServiceForm({ f, setF, onSubmit, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label>Nama *</Label>
        <Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Kategori *</Label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            value={f.category}
            onChange={e => setF({ ...f, category: e.target.value })}
          >
            <option value="layanan">Layanan</option>
            <option value="produk">Produk</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Kode</Label>
          <Input
            placeholder="B, A, K, ..."
            value={f.service_code}
            onChange={e => setF({ ...f, service_code: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Harga Default (Rp)</Label>
          <Input
            type="number"
            value={f.base_price}
            onChange={e => setF({ ...f, base_price: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Satuan</Label>
          <Input
            placeholder="per sesi, per botol, ..."
            value={f.unit}
            onChange={e => setF({ ...f, unit: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

// =====================
// TAB: LAYANAN & PRODUK
// =====================
function ServicesTab() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const emptyForm = { name: '', category: 'layanan', service_code: '', base_price: '', unit: '' }
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)

  const fetchServices = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('category')
      .order('name')
    if (error) toast.error('Gagal memuat layanan')
    else setServices(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchServices() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('services').insert({
      name: form.name,
      category: form.category,
      service_code: form.service_code || null,
      base_price: parseFloat(form.base_price) || 0,
      unit: form.unit || null,
      is_active: true,
    })
    if (error) toast.error('Gagal menambah layanan')
    else {
      toast.success('Layanan berhasil ditambahkan!')
      setForm(emptyForm)
      setAddOpen(false)
      fetchServices()
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    const { error } = await supabase
      .from('services')
      .update({
        name: editForm.name,
        category: editForm.category,
        service_code: editForm.service_code || null,
        base_price: parseFloat(editForm.base_price) || 0,
        unit: editForm.unit || null,
      })
      .eq('id', editTarget.id)
    if (error) toast.error('Gagal mengupdate layanan')
    else {
      toast.success('Layanan berhasil diupdate!')
      setEditOpen(false)
      fetchServices()
    }
  }

  const handleToggleActive = async (s) => {
    const { error } = await supabase
      .from('services')
      .update({ is_active: !s.is_active })
      .eq('id', s.id)
    if (error) toast.error('Gagal mengubah status')
    else fetchServices()
  }

  const handleDelete = async () => {
    const { error } = await supabase.from('services').delete().eq('id', deleteTarget.id)
    if (error) toast.error('Gagal menghapus layanan')
    else {
      toast.success('Layanan dihapus')
      setDeleteOpen(false)
      fetchServices()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>+ Tambah Layanan/Produk</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Layanan / Produk</DialogTitle></DialogHeader>
            <ServiceForm f={form} setF={setForm} onSubmit={handleAdd} submitLabel="Tambahkan" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Harga Default</TableHead>
              <TableHead>Satuan</TableHead>
              <TableHead>Aktif</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Memuat...</TableCell>
              </TableRow>
            ) : services.map(s => (
              <TableRow key={s.id} className={!s.is_active ? 'opacity-50' : ''}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{s.category}</Badge>
                </TableCell>
                <TableCell>{s.service_code || '-'}</TableCell>
                <TableCell>Rp {Number(s.base_price).toLocaleString('id-ID')}</TableCell>
                <TableCell>{s.unit || '-'}</TableCell>
                <TableCell>
                  <Switch
                    checked={s.is_active}
                    onCheckedChange={() => handleToggleActive(s)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditTarget(s)
                      setEditForm({
                        name: s.name,
                        category: s.category,
                        service_code: s.service_code || '',
                        base_price: s.base_price,
                        unit: s.unit || '',
                      })
                      setEditOpen(true)
                    }}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => {
                      setDeleteTarget(s)
                      setDeleteOpen(true)
                    }}>Hapus</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Layanan / Produk</DialogTitle></DialogHeader>
          <ServiceForm f={editForm} setF={setEditForm} onSubmit={handleEdit} submitLabel="Simpan" />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Layanan?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// =====================
// TAB: INFO KLINIK
// =====================
function ClinicTab() {
  const [info, setInfo] = useState({
    name: 'Klinik Bekam Sehat Medan',
    address: '',
    phone: '',
    doctor: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(CLINIC_INFO_KEY)
    if (saved) setInfo(JSON.parse(saved))
  }, [])

  const handleSave = (e) => {
    e.preventDefault()
    localStorage.setItem(CLINIC_INFO_KEY, JSON.stringify(info))
    toast.success('Info klinik berhasil disimpan!')
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base">Informasi Klinik</CardTitle>
        <p className="text-sm text-muted-foreground">
          Info ini akan tampil di header surat konsultasi PDF
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Klinik</Label>
            <Input value={info.name} onChange={e => setInfo({ ...info, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Alamat</Label>
            <Input
              placeholder="Jl. Contoh No. 1, Medan"
              value={info.address}
              onChange={e => setInfo({ ...info, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>No. Telepon</Label>
            <Input
              placeholder="061-xxxxxxx"
              value={info.phone}
              onChange={e => setInfo({ ...info, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Nama Dokter / Terapis</Label>
            <Input
              placeholder="dr. Nama Dokter"
              value={info.doctor}
              onChange={e => setInfo({ ...info, doctor: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={loading}>Simpan</Button>
        </form>
      </CardContent>
    </Card>
  )
}

// =====================
// TAB: PENGGUNA
// =====================
function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'admin' })

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').order('created_at')
    if (error) toast.error('Gagal memuat pengguna')
    else setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleAddUser = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name, role: form.role }
      }
    })

    if (error) toast.error(`Gagal: ${error.message}`)
    else {
      toast.success(`User ${form.email} berhasil dibuat!`)
      setForm({ email: '', password: '', full_name: '', role: 'admin' })
      setAddOpen(false)
      setTimeout(fetchUsers, 1000)
    }
  }

  const handleUpdateRole = async (userId, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (error) toast.error('Gagal update role')
    else { toast.success('Role berhasil diupdate!'); fetchUsers() }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>+ Tambah Pengguna</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Pengguna Baru</DialogTitle></DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Nama Lengkap *</Label>
                <Input
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  placeholder="Min. 6 karakter"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Buat Pengguna</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email / ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Bergabung</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Memuat...</TableCell>
              </TableRow>
            ) : users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {u.id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <Badge variant={u.role === 'owner' ? 'default' : 'secondary'}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(u.created_at).toLocaleDateString('id-ID')}
                </TableCell>
                <TableCell className="text-right">
                  <select
                    className="border rounded px-2 py-1 text-sm bg-background"
                    value={u.role}
                    onChange={e => handleUpdateRole(u.id, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}