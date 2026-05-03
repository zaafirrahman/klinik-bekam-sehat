import { useNavigate } from 'react-router-dom'
import { toHijri } from 'hijri-converter'

const services = [
  { icon: '🩸', name: 'Bekam', desc: 'Hijamah / Cupping Therapy untuk melancarkan peredaran darah dan membuang racun tubuh.', featured: true },
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
  const hijri = toHijri(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const sunnahDays = [17, 19, 21]
  const isSunnah = sunnahDays.includes(hijri.hd)
  const monthNames = [
    'Muharram', 'Safar', "Rabi'ul Awal", "Rabi'ul Akhir",
    'Jumadil Awal', 'Jumadil Akhir', 'Rajab', "Sya'ban",
    'Ramadhan', 'Syawal', "Dzulqa'dah", 'Dzulhijjah',
  ]
  const hijriDateStr = `${hijri.hd} ${monthNames[hijri.hm - 1]} ${hijri.hy} H`
  let nextSunnahHijri = null, nextSunnahMasehi = null
  for (const day of sunnahDays) {
    if (day > hijri.hd) {
      nextSunnahHijri = `${day} ${monthNames[hijri.hm - 1]} ${hijri.hy} H`
      const diff = day - hijri.hd
      const nextDate = new Date(today)
      nextDate.setDate(today.getDate() + diff)
      nextSunnahMasehi = nextDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      break
    }
  }
  if (!nextSunnahHijri) {
    const nextMonth = hijri.hm === 12 ? 1 : hijri.hm + 1
    const nextYear = hijri.hm === 12 ? hijri.hy + 1 : hijri.hy
    nextSunnahHijri = `17 ${monthNames[nextMonth - 1]} ${nextYear} H`
    const nextDate = new Date(today)
    nextDate.setDate(today.getDate() + (30 - hijri.hd + 17))
    nextSunnahMasehi = nextDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  const todayMasehi = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  return { isSunnah, hijriDateStr, hijriDay: hijri.hd, monthName: monthNames[hijri.hm - 1], nextSunnahHijri, nextSunnahMasehi, todayMasehi }
}

const IslamicPattern = () => (
  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0, opacity: 0.045, pointerEvents: 'none' }}>
    <defs>
      <pattern id="islamicGrid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <polygon points="40,2 78,22 78,58 40,78 2,58 2,22" fill="none" stroke="#2C3E2D" strokeWidth="1.2"/>
        <polygon points="40,14 66,28 66,52 40,66 14,52 14,28" fill="none" stroke="#C5943A" strokeWidth="0.8"/>
        <circle cx="40" cy="40" r="5" fill="none" stroke="#2C3E2D" strokeWidth="0.8"/>
        <line x1="40" y1="2" x2="40" y2="14" stroke="#2C3E2D" strokeWidth="0.6"/>
        <line x1="40" y1="66" x2="40" y2="78" stroke="#2C3E2D" strokeWidth="0.6"/>
        <line x1="2" y1="40" x2="14" y2="40" stroke="#2C3E2D" strokeWidth="0.6"/>
        <line x1="66" y1="40" x2="78" y2="40" stroke="#2C3E2D" strokeWidth="0.6"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#islamicGrid)"/>
  </svg>
)

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Lato:wght@300;400;700&display=swap');

  .cr { font-family: 'Lato', sans-serif; background-color: #FAF6EE; color: #2C3E2D; min-height: 100vh; }

  .cn {
    position: sticky; top: 0; z-index: 50;
    background: rgba(250,246,238,0.96); backdrop-filter: blur(12px);
    border-bottom: 1px solid #E8DCC8;
    padding: 0 1.5rem; height: 64px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .cnb { display: flex; align-items: center; gap: 0.75rem; }
  .cnl {
    width: 38px; height: 38px; border-radius: 50%;
    background: linear-gradient(135deg, #7A9E7E, #2C3E2D);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; color: white; font-weight: bold; flex-shrink: 0;
    font-family: 'Playfair Display', serif;
  }
  .cnt { font-family: 'Playfair Display', serif; font-size: 0.95rem; font-weight: 700; line-height: 1.2; }
  .cns { font-size: 0.68rem; color: #7A9E7E; letter-spacing: 0.05em; }
  .cna { display: flex; gap: 0.5rem; }

  .bp { background: #2C3E2D; color: #FAF6EE; border: none; border-radius: 8px; padding: 0.5rem 1.1rem; font-size: 0.83rem; font-weight: 700; cursor: pointer; letter-spacing: 0.02em; transition: background 0.2s, transform 0.15s; font-family: 'Lato', sans-serif; }
  .bp:hover { background: #3d5640; transform: translateY(-1px); }
  .bo { background: transparent; color: #2C3E2D; border: 1.5px solid #2C3E2D; border-radius: 8px; padding: 0.5rem 1.1rem; font-size: 0.83rem; font-weight: 700; cursor: pointer; letter-spacing: 0.02em; transition: all 0.2s; font-family: 'Lato', sans-serif; }
  .bo:hover { background: #2C3E2D; color: #FAF6EE; transform: translateY(-1px); }
  .bg { background: linear-gradient(135deg, #C5943A, #e0b455); color: white; border: none; border-radius: 9px; padding: 0.65rem 1.5rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; letter-spacing: 0.03em; transition: all 0.2s; box-shadow: 0 2px 14px rgba(197,148,58,0.35); font-family: 'Lato', sans-serif; }
  .bg:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(197,148,58,0.45); }

  .ch {
    position: relative; overflow: hidden;
    background: linear-gradient(155deg, #EBE2CC 0%, #F5EFE0 45%, #E8F0E8 100%);
    padding: 5.5rem 1.5rem 4.5rem; text-align: center;
  }
  .chc { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
  .chbadge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: rgba(197,148,58,0.13); border: 1px solid rgba(197,148,58,0.4);
    color: #9A6F20; border-radius: 999px;
    padding: 0.3rem 0.95rem; font-size: 0.7rem; font-weight: 700;
    letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 1.3rem;
  }
  .chtitle { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 5vw, 3rem); font-weight: 700; line-height: 1.2; color: #1a2b1b; margin-bottom: 0.5rem; }
  .chtitle em { font-style: italic; color: #7A9E7E; }
  .chsub { font-size: 0.85rem; color: #6B7B6C; line-height: 1.75; max-width: 460px; margin: 0 auto 2.2rem; font-weight: 300; }
  .chcta { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }

  .ss { padding: 2.5rem 1.5rem 0; max-width: 680px; margin: 0 auto; }
  .sc { border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; align-items: flex-start; gap: 1rem; border: 1.5px solid; }
  .sc.act { background: linear-gradient(135deg, #f0faf0, #e6f4e6); border-color: #7A9E7E; }
  .sc.inact { background: linear-gradient(135deg, #FAF6EE, #F5EFE0); border-color: #E8DCC8; }
  .si { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
  .si.act { background: #d8efd8; }
  .si.inact { background: #EBE2CC; }
  .sl { font-weight: 700; font-size: 0.88rem; margin-bottom: 0.15rem; }
  .sd { font-size: 0.7rem; color: #9aaa9b; margin-bottom: 0.5rem; }
  .st { font-size: 0.8rem; line-height: 1.65; color: #5a7a5c; }
  .sn { font-size: 0.8rem; color: #8a9a8b; line-height: 1.6; }
  .sn strong { color: #2C3E2D; font-weight: 700; }

  .od { display: flex; align-items: center; gap: 1rem; max-width: 400px; margin: 3rem auto 2rem; padding: 0 1.5rem; }
  .od::before, .od::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #C5943A55, transparent); }
  .od span { color: #C5943A; font-size: 0.9rem; }

  .svs { padding: 0 1.5rem 4rem; max-width: 980px; margin: 0 auto; }
  .sh { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 700; text-align: center; color: #1a2b1b; margin-bottom: 0.4rem; }
  .ssub { text-align: center; font-size: 0.7rem; color: #9aaa9b; margin-bottom: 2rem; letter-spacing: 0.07em; }
  .sg { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
  .svc { background: white; border-radius: 14px; padding: 1.4rem 1.1rem; text-align: center; border: 1.5px solid #EDE4D0; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; cursor: default; }
  .svc:hover { transform: translateY(-4px); box-shadow: 0 8px 28px rgba(44,62,45,0.1); border-color: #7A9E7E; }
  .svc.ft { background: linear-gradient(145deg, #2C3E2D, #3a5240); border-color: transparent; color: white; box-shadow: 0 6px 24px rgba(44,62,45,0.25); }
  .svc.ft:hover { transform: translateY(-5px); box-shadow: 0 12px 36px rgba(44,62,45,0.35); }
  .svc.ft .svn { color: #F5EFE0; }
  .svc.ft .svd { color: #a8c4aa; }
  .svbadge { display: inline-block; background: #C5943A; color: white; font-size: 0.58rem; font-weight: 700; letter-spacing: 0.09em; padding: 0.15rem 0.55rem; border-radius: 999px; text-transform: uppercase; margin-bottom: 0.5rem; }
  .svi { font-size: 1.8rem; margin-bottom: 0.6rem; line-height: 1; }
  .svn { font-weight: 700; font-size: 0.88rem; margin-bottom: 0.4rem; color: #2C3E2D; }
  .svd { font-size: 0.7rem; line-height: 1.55; color: #8a9a8b; }

  .ds { padding: 0 1.5rem 4rem; max-width: 640px; margin: 0 auto; }
  .dc { background: white; border-radius: 20px; border: 1.5px solid #EDE4D0; padding: 1.75rem 2rem; display: flex; gap: 1.5rem; align-items: flex-start; }
  .dav { width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #7A9E7E, #2C3E2D); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; box-shadow: 0 4px 16px rgba(122,158,126,0.3); }
  .dn { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; margin-bottom: 0.15rem; }
  .dt { font-size: 0.7rem; color: #7A9E7E; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.75rem; }
  .db { font-size: 0.8rem; color: #6B7B6C; line-height: 1.7; }
  .dsince { display: inline-flex; align-items: center; gap: 0.35rem; background: #EBE2CC; border-radius: 999px; padding: 0.25rem 0.75rem; font-size: 0.7rem; font-weight: 700; color: #9A6F20; margin-top: 0.8rem; }

  .cs { padding: 0 1.5rem 4rem; max-width: 640px; margin: 0 auto; }
  .cc { background: linear-gradient(145deg, #2C3E2D, #3a5240); border-radius: 20px; padding: 2rem; color: white; }
  .cr2 { display: flex; gap: 0.9rem; align-items: flex-start; margin-bottom: 0.9rem; }
  .ciw { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; }
  .ct { font-size: 0.82rem; color: #c8d8c9; line-height: 1.55; padding-top: 0.3rem; }
  .bwa { display: block; width: 100%; background: #25D366; color: white; border: none; border-radius: 10px; padding: 0.8rem; font-size: 0.88rem; font-weight: 700; cursor: pointer; letter-spacing: 0.03em; margin-top: 1.3rem; transition: all 0.2s; font-family: 'Lato', sans-serif; }
  .bwa:hover { opacity: 0.9; transform: translateY(-1px); }

  .cf { border-top: 1px solid #E8DCC8; padding: 1.75rem 1.5rem; text-align: center; font-size: 0.72rem; color: #b0b8a0; background: #F5EFE0; }
  .cfl { display: inline-block; margin-top: 0.5rem; font-size: 0.68rem; color: #b8c0a8; background: none; border: none; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; transition: color 0.2s; font-family: 'Lato', sans-serif; }
  .cfl:hover { color: #7A9E7E; }

  @media (max-width: 540px) {
    .dc { flex-direction: column; align-items: center; text-align: center; }
    .sg { grid-template-columns: 1fr 1fr; }
    .cn { padding: 0 1rem; }
    .cnt { font-size: 0.85rem; }
  }
`

export default function Landing() {
  const navigate = useNavigate()
  const { isSunnah, hijriDateStr, hijriDay, monthName, nextSunnahHijri, nextSunnahMasehi, todayMasehi } = getSunnahBekamInfo()

  return (
    <>
      <style>{CSS}</style>
      <div className="cr">

        {/* Navbar */}
        <nav className="cn">
          <div className="cnb">
            <div className="cnl">ب</div>
            <div>
              <div className="cnt">Klinik Bekam Sehat</div>
              <div className="cns">dr. Abdurrahman · Medan</div>
            </div>
          </div>
          <div className="cna">
            <button className="bo" onClick={() => navigate('/portal')}>Cek Kunjungan</button>
            <button className="bp" onClick={() => window.open('https://api.whatsapp.com/send?phone=6281377093000', '_blank')}>Hubungi Kami</button>
          </div>
        </nav>

        {/* Hero */}
        <section className="ch">
          <IslamicPattern />
          <div className="chc">
            <div className="chbadge">✦ Thibbunnabawi · Sejak 2009</div>
            <h1 className="chtitle">
              Sehat dengan Sunnah,<br /><em>Sembuh dengan Alam</em>
            </h1>
            <p className="chsub">
              Klinik Bekam Sehat dr. Abdurrahman — melayani bekam, akupuntur, ruqyah, khitan, dan pengobatan islami alami untuk kesehatan Anda dan keluarga di Medan.
            </p>
            <div className="chcta">
              <button className="bg" onClick={() => window.open('https://api.whatsapp.com/send?phone=6281377093000', '_blank')}>
                🌿 Buat Janji Sekarang
              </button>
              <button className="bo" onClick={() => navigate('/portal')}>
                Cek Riwayat Kunjungan
              </button>
            </div>
          </div>
        </section>

        {/* Sunnah Bekam */}
        <section className="ss">
          <div className={`sc ${isSunnah ? 'act' : 'inact'}`}>
            <div className={`si ${isSunnah ? 'act' : 'inact'}`}>{isSunnah ? '🟢' : '📅'}</div>
            <div style={{ flex: 1 }}>
              <div className="sl">{isSunnah ? 'Hari ini adalah hari sunnah bekam!' : 'Jadwal Sunnah Bekam'}</div>
              <div className="sd">{todayMasehi} · {hijriDateStr}</div>
              {isSunnah
                ? <p className="st">Tanggal {hijriDay} {monthName} adalah hari yang dianjurkan Rasulullah ﷺ untuk berbekam. Manfaatkan hari penuh berkah ini untuk hijamah.</p>
                : <p className="sn">Hari sunnah berikutnya: <strong>{nextSunnahMasehi}</strong> &nbsp;·&nbsp; {nextSunnahHijri}</p>
              }
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="svs">
          <div className="od"><span>✦</span></div>
          <h2 className="sh">Layanan Kami</h2>
          <p className="ssub">PENGOBATAN ISLAMI DAN ALAMI TERPADU</p>
          <div className="sg">
            {services.map(s => (
              <div key={s.name} className={`svc ${s.featured ? 'ft' : ''}`}>
                {s.featured && <div className="svbadge">Unggulan</div>}
                <div className="svi">{s.icon}</div>
                <div className="svn">{s.name}</div>
                <div className="svd">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Doctor */}
        <section className="ds">
          <div className="od"><span>✦</span></div>
          <h2 className="sh">Dokter Kami</h2>
          <p className="ssub" style={{ marginBottom: '1.5rem' }}>BERPENGALAMAN & BERSERTIFIKAT</p>
          <div className="dc">
            <div className="dav">👨‍⚕️</div>
            <div>
              <div className="dn">dr. Abdurrahman Umar</div>
              <div className="dt">Pendiri & Dokter Utama</div>
              <p className="db">Lulusan Fakultas Kedokteran Universitas Hasanuddin. Anggota Perkumpulan Bekam Indonesia (PBI) dan aktif dalam dakwah kesehatan islami di berbagai daerah Sumatera Utara.</p>
              <div className="dsince">⭐ Berpraktek sejak 2009</div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="cs">
          <div className="od"><span>✦</span></div>
          <div className="cc">
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, color: '#F5EFE0', marginBottom: '1.25rem' }}>Temukan Kami</div>
            <div className="cr2">
              <div className="ciw">📍</div>
              <div className="ct">Jl. Pasar 1 No. 274 B, Kel. Tanjung Sari, Kec. Medan Selayang, Kota Medan, Sumatera Utara 20154</div>
            </div>
            <div className="cr2">
              <div className="ciw">📞</div>
              <div className="ct">+62 813 7709 3000</div>
            </div>
            <div className="cr2" style={{ marginBottom: 0 }}>
              <div className="ciw">✉️</div>
              <div className="ct">hallo.kliniksehat12@gmail.com</div>
            </div>
            <button className="bwa" onClick={() => window.open('https://api.whatsapp.com/send?phone=6281377093000', '_blank')}>
              💬 Hubungi via WhatsApp
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="cf">
          <p>© 2026 Klinik Bekam Sehat dr. Abdurrahman · Medan</p>
          <button className="cfl" onClick={() => navigate('/login')}>Login Staff</button>
        </footer>

      </div>
    </>
  )
}