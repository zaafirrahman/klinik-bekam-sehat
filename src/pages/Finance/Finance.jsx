import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'

export default function Finance() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [income, setIncome] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  // Expense form
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    description: '', quantity: 1, amount: ''
  })

  // Product income form
  const [productOpen, setProductOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productPopover, setProductPopover] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productForm, setProductForm] = useState({ quantity: 1, amount: '' })

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('category', 'produk')
      .eq('is_active', true)
    setProducts(data || [])
  }

  const fetchFinance = async () => {
    setLoading(true)
    const [incomeRes, expenseRes] = await Promise.all([
      supabase
        .from('daily_income')
        .select('*')
        .eq('entry_date', selectedDate)
        .order('created_at', { ascending: true }),
      supabase
        .from('daily_expenses')
        .select('*')
        .eq('entry_date', selectedDate)
        .order('created_at', { ascending: true }),
    ])

    if (incomeRes.error) toast.error('Gagal memuat pemasukan')
    else setIncome(incomeRes.data || [])

    if (expenseRes.error) toast.error('Gagal memuat pengeluaran')
    else setExpenses(expenseRes.data || [])

    setLoading(false)
  }

  useEffect(() => { fetchFinance(); fetchProducts() }, [selectedDate])

  // ADD EXPENSE
  const handleAddExpense = async (e) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('daily_expenses').insert({
      entry_date: selectedDate,
      description: expenseForm.description,
      quantity: parseInt(expenseForm.quantity),
      amount: parseFloat(expenseForm.amount),
      created_by: user.id,
    })
    if (error) toast.error('Gagal menambah pengeluaran')
    else {
      toast.success('Pengeluaran berhasil dicatat!')
      setExpenseForm({ description: '', quantity: 1, amount: '' })
      setExpenseOpen(false)
      fetchFinance()
    }
  }

  const handleDeleteExpense = async (id) => {
    const { error } = await supabase.from('daily_expenses').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus pengeluaran')
    else { toast.success('Pengeluaran dihapus'); fetchFinance() }
  }

  // ADD PRODUCT INCOME
  const handleAddProductIncome = async (e) => {
    e.preventDefault()
    if (!selectedProduct) { toast.error('Pilih produk terlebih dahulu'); return }
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('daily_income').insert({
      entry_date: selectedDate,
      source_type: 'product',
      visit_service_id: null,
      description: selectedProduct.name,
      quantity: parseInt(productForm.quantity),
      amount: parseFloat(productForm.amount) * parseInt(productForm.quantity),
      created_by: user.id,
    })

    if (error) toast.error('Gagal mencatat pemasukan produk')
    else {
      toast.success('Pemasukan produk berhasil dicatat!')
      setSelectedProduct(null)
      setProductForm({ quantity: 1, amount: '' })
      setProductOpen(false)
      fetchFinance()
    }
  }

  const handleDeleteIncome = async (id) => {
    const { error } = await supabase.from('daily_income').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus pemasukan')
    else { toast.success('Pemasukan dihapus'); fetchFinance() }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0)
  const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) * Number(e.quantity)), 0)
  const saldo = totalIncome - totalExpense

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Keuangan Harian</h1>
          <p className="text-sm text-muted-foreground">Rekap pemasukan & pengeluaran</p>
        </div>
        <Input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pemasukan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              Rp {totalIncome.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              Rp {totalExpense.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Bersih</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              Rp {saldo.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pemasukan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Pemasukan</CardTitle>
            <Dialog open={productOpen} onOpenChange={setProductOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">+ Pemasukan Produk</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Catat Pemasukan Produk</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddProductIncome} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Produk *</Label>
                    <Popover open={productPopover} onOpenChange={setProductPopover}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start font-normal">
                          {selectedProduct ? selectedProduct.name : 'Pilih produk...'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Cari produk..."
                            onValueChange={setProductSearch}
                          />
                          <CommandList>
                            <CommandEmpty>Produk tidak ditemukan</CommandEmpty>
                            <CommandGroup>
                              {filteredProducts.map(p => (
                                <CommandItem
                                  key={p.id}
                                  onSelect={() => {
                                    setSelectedProduct(p)
                                    setProductForm({ quantity: 1, amount: p.base_price })
                                    setProductPopover(false)
                                  }}
                                >
                                  <span>{p.name}</span>
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    Rp {p.base_price.toLocaleString('id-ID')}
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
                        value={productForm.quantity}
                        onChange={e => setProductForm({ ...productForm, quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Harga per unit (Rp)</Label>
                      <Input
                        type="number"
                        value={productForm.amount}
                        onChange={e => setProductForm({ ...productForm, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  {selectedProduct && (
                    <p className="text-sm text-muted-foreground">
                      Total: Rp {(parseFloat(productForm.amount || 0) * parseInt(productForm.quantity || 1)).toLocaleString('id-ID')}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setProductOpen(false)}>Batal</Button>
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
          ) : income.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada pemasukan</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {income.map(i => (
                  <TableRow key={i.id}>
                    <TableCell>{i.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {i.source_type === 'service' ? 'Layanan' : 'Produk'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{i.quantity}x</TableCell>
                    <TableCell className="text-right font-medium">
                      Rp {Number(i.amount).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      {i.source_type === 'product' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteIncome(i.id)}
                        >
                          Hapus
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell colSpan={3}>Total Pemasukan</TableCell>
                  <TableCell className="text-right text-green-600">
                    Rp {totalIncome.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pengeluaran */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Pengeluaran</CardTitle>
            <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">+ Tambah Pengeluaran</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Pengeluaran</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddExpense} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Deskripsi *</Label>
                    <Input
                      placeholder="contoh: Beli sabun, Listrik, dll"
                      value={expenseForm.description}
                      onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Jumlah</Label>
                      <Input
                        type="number"
                        min="1"
                        value={expenseForm.quantity}
                        onChange={e => setExpenseForm({ ...expenseForm, quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nominal (Rp) *</Label>
                      <Input
                        type="number"
                        placeholder="50000"
                        value={expenseForm.amount}
                        onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setExpenseOpen(false)}>Batal</Button>
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
          ) : expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada pengeluaran</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{e.description}</TableCell>
                    <TableCell className="text-right">{e.quantity}x</TableCell>
                    <TableCell className="text-right">
                      Rp {Number(e.amount).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      Rp {(Number(e.amount) * Number(e.quantity)).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDeleteExpense(e.id)}
                      >
                        Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell colSpan={3}>Total Pengeluaran</TableCell>
                  <TableCell className="text-right text-red-500">
                    Rp {totalExpense.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Saldo Akhir */}
      <Card className={saldo >= 0 ? 'border-green-200' : 'border-red-200'}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">Saldo Akhir Hari Ini</p>
              <p className="text-sm text-muted-foreground">Cocokkan dengan cash di laci</p>
            </div>
            <p className={`text-3xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              Rp {saldo.toLocaleString('id-ID')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}