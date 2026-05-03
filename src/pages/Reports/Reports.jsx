import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'

const formatRp = (val) => `Rp ${Number(val).toLocaleString('id-ID')}`

export default function Reports() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('week') // 'week' | 'month'
  const [dailyData, setDailyData] = useState([])
  const [topServices, setTopServices] = useState([])
  const [summary, setSummary] = useState({
    totalIncome: 0, totalExpense: 0, totalVisits: 0, totalPatients: 0
  })

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

  useEffect(() => {
    if (profile?.role === 'owner') fetchReports()
  }, [profile, period])

  const fetchReports = async () => {
    setLoading(true)

    const today = new Date()
    const startDate = new Date()
    if (period === 'week') startDate.setDate(today.getDate() - 6)
    else startDate.setDate(1)

    const startStr = startDate.toISOString().split('T')[0]
    const endStr = today.toISOString().split('T')[0]

    // Daily income & expense
    const [incomeRes, expenseRes, visitsRes, patientsRes, servicesRes, monthlyExpenseRes] = await Promise.all([
      supabase
        .from('daily_income')
        .select('entry_date, amount')
        .gte('entry_date', startStr)
        .lte('entry_date', endStr),
      supabase
        .from('daily_expenses')
        .select('entry_date, amount, quantity')
        .gte('entry_date', startStr)
        .lte('entry_date', endStr),
      supabase
        .from('visits')
        .select('id', { count: 'exact' })
        .gte('visit_date', startStr)
        .lte('visit_date', endStr),
      supabase
        .from('patients')
        .select('id', { count: 'exact' }),
      supabase
        .from('visit_services')
        .select('final_price, quantity, services(name, category)')
        .eq('status', 'done'),
      supabase
        .from('monthly_expenses')
        .select('amount')
        .gte('month', startStr)
        .lte('month', endStr),
    ])

    // Build daily chart data
    const dateMap = {}
    const cursor = new Date(startDate)
    while (cursor <= today) {
      const key = cursor.toISOString().split('T')[0]
      const label = cursor.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      dateMap[key] = { date: label, pemasukan: 0, pengeluaran: 0 }
      cursor.setDate(cursor.getDate() + 1)
    }

    incomeRes.data?.forEach(i => {
      if (dateMap[i.entry_date]) dateMap[i.entry_date].pemasukan += Number(i.amount)
    })
    expenseRes.data?.forEach(e => {
      if (dateMap[e.entry_date]) dateMap[e.entry_date].pengeluaran += Number(e.amount) * Number(e.quantity)
    })

    setDailyData(Object.values(dateMap))

    // Summary
    const totalIncome = incomeRes.data?.reduce((s, i) => s + Number(i.amount), 0) || 0
    const totalExpense = expenseRes.data?.reduce((s, e) => s + Number(e.amount) * Number(e.quantity), 0) || 0
    const totalMonthlyExpense = monthlyExpenseRes.data?.reduce((s, e) => s + Number(e.amount), 0) || 0

    setSummary({
      totalIncome,
      totalExpense,
      totalMonthlyExpense,
      netProfit: totalIncome - totalExpense - totalMonthlyExpense,
      totalVisits: visitsRes.count || 0,
      totalPatients: patientsRes.count || 0,
    })

    // Top services
    const serviceMap = {}
    servicesRes.data?.forEach(vs => {
      const name = vs.services?.name || 'Unknown'
      if (!serviceMap[name]) serviceMap[name] = { name, total: 0, count: 0 }
      serviceMap[name].total += Number(vs.final_price) * Number(vs.quantity)
      serviceMap[name].count += Number(vs.quantity)
    })
    const sorted = Object.values(serviceMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
    setTopServices(sorted)

    setLoading(false)
  }

  if (profile && profile.role !== 'owner') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="font-medium">Akses Terbatas</p>
          <p className="text-sm text-muted-foreground">
            Halaman laporan hanya bisa diakses oleh owner.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold">Laporan</h1>
          <p className="text-sm text-muted-foreground">Ringkasan performa klinik</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => setPeriod('week')}
          >
            7 Hari
          </Button>
          <Button
            size="sm"
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => setPeriod('month')}
          >
            Bulan Ini
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pemasukan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-bold text-green-600">
              Rp {summary.totalIncome.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-bold text-red-500">
              Rp {summary.totalExpense.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Kunjungan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-bold">{summary.totalVisits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pasien</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-bold">{summary.totalPatients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pengeluaran Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-bold text-red-400">
              Rp {summary.totalMonthlyExpense?.toLocaleString('id-ID') || 0}
            </p>
          </CardContent>
        </Card>
        <Card className={summary.netProfit >= 0 ? 'border-green-200' : 'border-red-200'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-base font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              Rp {summary.netProfit?.toLocaleString('id-ID') || 0}
            </p>
          </CardContent>
        </Card>
      </div>
  
      {/* Grafik Harian */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pemasukan vs Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Memuat grafik...</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={35} />
                <Tooltip formatter={(val) => formatRp(val)} />
                <Bar dataKey="pemasukan" name="Pemasukan" fill="#22c55e" radius={[4,4,0,0]} />
                <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Saldo Bersih trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saldo Bersih per Hari</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Memuat grafik...</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart
                data={dailyData.map(d => ({ ...d, saldo: d.pemasukan - d.pengeluaran }))}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={35} />
                <Tooltip formatter={(val) => formatRp(val)} />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Layanan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 5 Layanan (All Time)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Memuat...</p>
          ) : topServices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {topServices.map((s, idx) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm w-5">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">{s.count}x · Rp {s.total.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(s.total / topServices[0].total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}