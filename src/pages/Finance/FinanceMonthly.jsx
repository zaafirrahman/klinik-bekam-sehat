import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function FinanceMonthly() {
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  )

  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [monthlyDailyExpense, setMonthlyDailyExpense] = useState(0)
  const [monthlyExpenses, setMonthlyExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  // Form
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '' })

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [serviceBreakdown, setServiceBreakdown] = useState([])
  const [productBreakdown, setProductBreakdown] = useState([])

  const [profile, setProfile] = useState(null)

    useEffect(() => {
    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        setProfile(data)
    }
    fetchProfile()
    }, [])

  const fetchMonthly = async () => {
    setLoading(true)

    const [year, month] = selectedMonth.split('-')
    const startDate = `${year}-${month}-01`
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    const endDate = `${year}-${month}-${lastDay}`
    const monthDate = startDate

    const [incomeRes, dailyExpenseRes, monthlyExpenseRes, visitServicesRes, manualProductRes] = await Promise.all([
      supabase
        .from('daily_income')
        .select('amount')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate),
      supabase
        .from('daily_expenses')
        .select('amount, quantity')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate),
      supabase
        .from('monthly_expenses')
        .select('*')
        .eq('month', monthDate)
        .order('created_at', { ascending: true }),
      supabase
        .from('visit_services')
        .select(`quantity, services(name, category, service_code)`)
        .eq('status', 'done')
        .in('visit_id',
          (await supabase
            .from('visits')
            .select('id')
            .gte('visit_date', startDate)
            .lte('visit_date', endDate)
          ).data?.map(v => v.id) || []
        ),
      supabase
        .from('daily_income')
        .select('description, quantity')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .eq('source_type', 'product')
        .is('visit_service_id', null),
    ])

    if (incomeRes.error) toast.error('Gagal memuat pemasukan')
    else setMonthlyIncome(
      incomeRes.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
    )

    if (dailyExpenseRes.error) toast.error('Gagal memuat pengeluaran harian')
    else setMonthlyDailyExpense(
      dailyExpenseRes.data?.reduce((sum, e) => sum + Number(e.amount) * Number(e.quantity), 0) || 0
    )

    if (monthlyExpenseRes.error) toast.error('Gagal memuat pengeluaran bulanan')
    else setMonthlyExpenses(monthlyExpenseRes.data || [])

    // Service breakdown
    const serviceMap = {}
    visitServicesRes.data?.forEach(vs => {
      if (vs.services?.category !== 'layanan') return
      const code = vs.services?.service_code || 'Lainnya'
      const name = vs.services?.name || 'Lainnya'
      if (!serviceMap[code]) serviceMap[code] = { code, name, qty: 0 }
      serviceMap[code].qty += Number(vs.quantity)
    })
    setServiceBreakdown(Object.values(serviceMap))

    // Product breakdown
    const productMap = {}
    visitServicesRes.data?.forEach(vs => {
      if (vs.services?.category !== 'produk') return
      const name = vs.services?.name
      if (!productMap[name]) productMap[name] = { name, qty: 0 }
      productMap[name].qty += Number(vs.quantity)
    })
    manualProductRes.data?.forEach(p => {
      const name = p.description
      if (!productMap[name]) productMap[name] = { name, qty: 0 }
      productMap[name].qty += Number(p.quantity)
    })
    setProductBreakdown(Object.values(productMap))

    setLoading(false)
  }

  useEffect(() => { fetchMonthly() }, [selectedMonth])

  const handleAdd = async (e) => {
    e.preventDefault()
    const [year, month] = selectedMonth.split('-')
    const monthDate = `${year}-${month}-01`
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('monthly_expenses').insert({
      month: monthDate,
      description: form.description,
      amount: parseFloat(form.amount),
      created_by: user.id,
    })

    if (error) toast.error('Gagal menambah pengeluaran')
    else {
      toast.success('Pengeluaran bulanan berhasil dicatat!')
      setForm({ description: '', amount: '' })
      setAddOpen(false)
      fetchMonthly()
    }
  }

  const handleDelete = async () => {
    const { error } = await supabase
      .from('monthly_expenses')
      .delete()
      .eq('id', deleteTarget.id)
    if (error) toast.error('Gagal menghapus pengeluaran')
    else {
      toast.success('Pengeluaran dihapus')
      setDeleteOpen(false)
      fetchMonthly()
    }
  }

  const totalMonthlyExpense = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const netProfit = monthlyIncome - monthlyDailyExpense - totalMonthlyExpense

  const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('id-ID', {
    month: 'long', year: 'numeric'
  })

  if (profile && profile.role !== 'owner') {
    return (
        <div className="flex items-center justify-center h-64">
        <div className="text-center">
            <p className="text-2xl mb-2">🔒</p>
            <p className="font-medium">Akses Terbatas</p>
            <p className="text-sm text-muted-foreground">
            Halaman ini hanya bisa diakses oleh owner.
            </p>
        </div>
        </div>
    )
    }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Keuangan Bulanan</h1>
          <p className="text-sm text-muted-foreground">Rekap & pengeluaran besar per bulan</p>
        </div>
        <Input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Pemasukan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">
              Rp {monthlyIncome.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pengeluaran Harian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-400">
              Rp {monthlyDailyExpense.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pengeluaran Bulanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-500">
              Rp {totalMonthlyExpense.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        <Card className={netProfit >= 0 ? 'border-green-200' : 'border-red-200'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              Rp {netProfit.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ringkasan {monthLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Total Pemasukan</span>
              <span className="font-medium text-green-600">
                + Rp {monthlyIncome.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Pengeluaran Operasional Harian</span>
              <span className="font-medium text-red-400">
                - Rp {monthlyDailyExpense.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Pengeluaran Bulanan (gaji, dll)</span>
              <span className="font-medium text-red-500">
                - Rp {totalMonthlyExpense.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between py-2 font-semibold text-base">
              <span>Net Profit</span>
              <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-500'}>
                Rp {netProfit.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rincian Pemasukan Bulanan */}
      {(serviceBreakdown.length > 0 || productBreakdown.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rincian Pemasukan {monthLabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviceBreakdown.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Layanan</p>
                <Table>
                  <TableBody>
                    {serviceBreakdown.map(s => (
                      <TableRow key={s.code}>
                        <TableCell>
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                            {s.code}
                          </span>
                          {s.name}
                        </TableCell>
                        <TableCell className="text-right font-medium">{s.qty}x</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>Total Layanan</TableCell>
                      <TableCell className="text-right">
                        {serviceBreakdown.reduce((sum, s) => sum + s.qty, 0)}x
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            {productBreakdown.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Produk</p>
                <Table>
                  <TableBody>
                    {productBreakdown.map(p => (
                      <TableRow key={p.name}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell className="text-right font-medium">{p.qty}x</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>Total Produk</TableCell>
                      <TableCell className="text-right">
                        {productBreakdown.reduce((sum, p) => sum + p.qty, 0)}x
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pengeluaran Bulanan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Pengeluaran Bulanan</CardTitle>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">+ Tambah</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Pengeluaran Bulanan</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Deskripsi *</Label>
                    <Input
                      placeholder="contoh: Gaji Budi, Sewa Tempat, dll"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nominal (Rp) *</Label>
                    <Input
                      type="number"
                      placeholder="2000000"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit">Simpan</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Memuat...</p>
          ) : monthlyExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada pengeluaran bulanan
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyExpenses.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{e.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      Rp {Number(e.amount).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => { setDeleteTarget(e); setDeleteOpen(true) }}
                      >
                        Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell>Total Pengeluaran Bulanan</TableCell>
                  <TableCell className="text-right text-red-500">
                    Rp {totalMonthlyExpense.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengeluaran?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.description} akan dihapus permanen.
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