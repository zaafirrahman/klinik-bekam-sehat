import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import HijriConverter from 'hijri-converter'

const services = [
  { icon: '🩸', name: 'Bekam', desc: 'Hijamah / Cupping Therapy untuk melancarkan peredaran darah dan membuang racun tubuh.' },
  { icon: '📍', name: 'Akupuntur', desc: 'Stimulasi titik akupuntur untuk memulihkan kesehatan dan mengurangi nyeri.' },
  { icon: '✂️', name: 'Khitan', desc: 'Sunat profesional untuk bayi, anak-anak, hingga dewasa.' },
  { icon: '📖', name: 'Ruqyah', desc: 'Ruqyah syariah untuk penyembuhan gangguan fisik dan non-fisik.' },
  { icon: '🏥', name: 'Pengobatan Umum', desc: 'Penanganan berbagai penyakit ringan hingga berat secara profesional.' },
  { icon: '🔬', name: 'Cek Lab', desc: 'Cek tekanan darah, gula darah, asam urat, dan kolesterol.' },
  { icon: '🌿', name: 'Apotek Herbal', desc: 'Madu, habatussauda, minyak zaitun, dan berbagai produk herbal terpercaya.' },
  { icon: '📚', name: 'Pelatihan', desc: 'Pelatihan bekam dan akupuntur untuk tenaga medis maupun umum.' },
]

function getSunnahBekamInfo() {
  const today = new Date()
  const hijri = HijriConverter.toHijri(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
    )

  const sunnahDays = [17, 19, 21]
  const isSunnah = sunnahDays.includes(hijri.hd)

  const monthNames = [
    'Muharram', 'Safar', 'Rabi\'ul Awal', 'Rabi\'ul Akhir',
    'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
    'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah'
  ]

  const hijriDateStr = `${hijri.hd} ${monthNames[hijri.hm - 1]} ${hijri.hy} H`

  // Cari tanggal sunnah berikutnya
  let nextSunnah = null
  for (const day of sunnahDays) {
    if (day > hijri.hd) {
      nextSunnah = day
      break
    }
  }

  return { isSunnah, hijriDateStr, hijriDay: hijri.hd, nextSunnah, monthName: monthNames[hijri.hm - 1] }
}

export default function Landing() {
  const navigate = useNavigate()
  const { isSunnah, hijriDateStr, hijriDay, nextSunnah, monthName } = getSunnahBekamInfo()

  return (
    <div className="min-h-screen bg-background">

      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div>
          <p className="font-bold text-sm">Klinik Bekam Sehat</p>
          <p className="text-xs text-muted-foreground">dr. Abdurrahman</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/portal')}>
            Cek Kunjungan
          </Button>
          <Button
            size="sm"
            onClick={() => window.open('https://api.whatsapp.com/send?phone=6281377093000', '_blank')}
          >
            Hubungi Kami
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-16 text-center max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground mb-2">Solusi Kesehatan Islami dan Alami</p>
        <h1 className="text-3xl font-bold mb-4">
          Klinik Bekam Sehat<br />dr. Abdurrahman
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Melayani pengobatan Thibbunnabawi sejak 2009 di Medan.
          Bekam, akupuntur, dan berbagai pengobatan islami dan alami
          untuk kesehatan Anda dan keluarga.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => window.open('https://api.whatsapp.com/send?phone=6281377093000', '_blank')}>
            Buat Janji
          </Button>
          <Button variant="outline" onClick={() => navigate('/portal')}>
            Cek Riwayat Kunjungan
          </Button>
        </div>
      </section>

      {/* Tanggal Sunnah Bekam */}
      <section className="px-6 pb-12 max-w-2xl mx-auto">
        <Card className={isSunnah ? 'border-green-300 bg-green-50 dark:bg-green-950/20' : 'border-muted'}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-4">
              <div className="text-3xl">{isSunnah ? '✅' : '📅'}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-0.5">
                  {isSunnah ? 'Hari ini adalah tanggal sunnah bekam!' : 'Hari ini bukan tanggal sunnah bekam'}
                </p>
                <p className="text-xs text-muted-foreground mb-2">{hijriDateStr}</p>
                {isSunnah ? (
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Tanggal {hijriDay} {monthName} adalah salah satu hari yang dianjurkan Rasulullah ﷺ untuk berbekam (17, 19, 21 setiap bulan Hijriah).
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {nextSunnah
                      ? `Tanggal sunnah bekam berikutnya: ${nextSunnah} ${monthName} H`
                      : `Tanggal sunnah bekam berikutnya: 17 bulan Hijriah berikutnya`
                    }
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Layanan */}
      <section className="px-6 pb-16 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-8">Layanan Kami</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {services.map(s => (
            <Card key={s.name} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-5 text-center">
                <p className="text-3xl mb-2">{s.icon}</p>
                <p className="font-semibold text-sm mb-1">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tentang Dokter */}
      <section className="px-6 pb-16 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">Dokter Kami</h2>
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center text-2xl">
                👨‍⚕️
              </div>
              <p className="font-bold">dr. Abdurrahman Umar</p>
              <p className="text-xs text-muted-foreground">Pendiri & Dokter Utama</p>
            </div>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Lulusan Fakultas Kedokteran Universitas Hasanuddin, berpengalaman sejak 2009.
              Anggota Perkumpulan Bekam Indonesia (PBI) dan aktif dalam dakwah kesehatan islami
              di berbagai daerah Sumatera Utara.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Kontak */}
      <section className="px-6 pb-16 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">Temukan Kami</h2>
        <Card>
          <CardContent className="pt-6 pb-6 space-y-3 text-sm">
            <div className="flex gap-3">
              <span>📍</span>
              <p className="text-muted-foreground">
                Jl. Pasar 1 No. 274 B, Kel. Tanjung Sari, Kec. Medan Selayang, Kota Medan, Sumatera Utara 20154
              </p>
            </div>
            <div className="flex gap-3">
              <span>📞</span>
              <p className="text-muted-foreground">+62 813 7709 3000</p>
            </div>
            <div className="flex gap-3">
              <span>✉️</span>
              <p className="text-muted-foreground">hallo.kliniksehat12@gmail.com</p>
            </div>
            <div className="pt-2">
              <Button
                className="w-full"
                onClick={() => window.open('https://api.whatsapp.com/send?phone=6281377093000', '_blank')}
              >
                Hubungi via WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        <p>© 2026 Klinik Bekam Sehat dr. Abdurrahman · Medan</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Login Staff
        </button>
      </footer>
    </div>
  )
}