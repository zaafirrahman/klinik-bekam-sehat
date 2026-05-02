import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function PortalLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ patient_code: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Normalisasi input
    const code = form.patient_code.trim().toUpperCase()
    const phone = form.phone.trim()

    const { data, error } = await supabase
      .from('patients')
      .select('id, name, patient_code, phone')
      .eq('patient_code', code)
      .single()
    console.log('data:', data)
    console.log('error:', error)

    if (error || !data) {
      setError('Kode pasien tidak ditemukan.')
      setLoading(false)
      return
    }

    // Normalisasi nomor telp untuk perbandingan
    const normalize = (n) => n?.replace(/\D/g, '').replace(/^0/, '62').replace(/^62/, '62')
    const inputPhone = normalize(phone)
    const dbPhone = normalize(data.phone)

    if (inputPhone !== dbPhone) {
      setError('Kode pasien atau nomor telepon tidak sesuai.')
      setLoading(false)
      return
    }

    // Simpan session di localStorage
    localStorage.setItem('patient_session', JSON.stringify({
      patient_id: data.id,
      patient_code: data.patient_code,
      name: data.name,
      logged_in_at: Date.now(),
    }))

    navigate('/portal/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Portal Pasien</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cek riwayat kunjungan Anda
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Masuk</CardTitle>
            <CardDescription>
              Gunakan kode pasien dan nomor telepon yang terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Kode Pasien</Label>
                <Input
                  placeholder="contoh: P0001"
                  value={form.patient_code}
                  onChange={e => setForm({ ...form, patient_code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nomor Telepon</Label>
                <Input
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Memuat...' : 'Masuk'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Kode pasien tertera pada kartu kunjungan Anda
        </p>
      </div>
    </div>
  )
}