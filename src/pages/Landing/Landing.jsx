import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toHijri } from 'hijri-converter'

// ─── DATA ─────────────────────────────────────────────────────────────────────

const services = [
  { key: 'bekam',           img: '/images/bekam.png',           name: 'Bekam',           arabic: 'الحجامة',          featured: true,  short: 'Hijamah / Cupping Therapy',   desc: 'Pengobatan sunnah Rasulullah ﷺ yang terbukti secara medis melancarkan peredaran darah, membuang racun, dan memperkuat imun tubuh.' },
  { key: 'akupuntur',       img: '/images/akupuntur.png',       name: 'Akupuntur',       arabic: 'الوخز بالإبر',     featured: false, short: 'Stimulasi Titik Meridian',    desc: 'Metode pengobatan dengan jarum halus untuk memulihkan kesehatan, melancarkan sirkulasi darah, dan mengurangi nyeri secara alami.' },
  { key: 'khitan',          img: '/images/khitan.png',          name: 'Khitan',          arabic: 'الختان',           featured: false, short: 'Sunat Profesional',           desc: 'Sunat profesional untuk bayi, anak-anak, hingga dewasa. Ditangani langsung oleh dokter berpengalaman dengan peralatan steril.' },
  { key: 'ruqyah',          img: '/images/ruqyah.png',          name: 'Ruqyah',          arabic: 'الرقية الشرعية',   featured: false, short: 'Ruqyah Syariah',              desc: "Ruqyah syariah menggunakan ayat-ayat Al-Qur'an untuk penyembuhan gangguan fisik, psikis, dan non-fisik sesuai tuntunan Rasulullah ﷺ." },
  { key: 'pengobatan-umum', img: '/images/pengobatan-umum.png', name: 'Pengobatan Umum', arabic: 'الطب العام',       featured: false, short: 'Praktek Umum Dokter',         desc: 'Penanganan berbagai penyakit ringan hingga berat: diabetes, stroke, cardiovaskular, gastritis, dan lainnya secara profesional.' },
  { key: 'cek-lab',         img: '/images/cek-lab.png',         name: 'Cek Lab',         arabic: 'الفحص المخبري',    featured: false, short: 'Pemeriksaan Laboratorium',    desc: 'Cek tekanan darah, gula darah, asam urat, dan kolesterol menggunakan alat steril dan akurat.' },
  { key: 'pelatihan',       img: '/images/pelatihan.png',       name: 'Pelatihan',       arabic: 'التدريب',          featured: false, short: 'Pelatihan Bekam & Akupuntur', desc: 'Pelatihan bekam dan akupuntur untuk tenaga medis maupun umum. Alumni sudah tersebar di seluruh Indonesia hingga mancanegara.' },
  { key: 'apotek-herbal',   img: '/images/apotek-herbal.png',   name: 'Apotek Herbal',   arabic: 'الصيدلية العشبية', featured: false, short: 'Produk Herbal Terpercaya',    desc: 'Madu sehat, habatussauda, minyak zaitun, dan berbagai produk herbal teruji klinis tanpa campuran bahan kimia.' },
]

const gallery = [
  { src: '/images/klinik.jpeg', caption: 'Klinik Bekam Sehat dr. Abdurrahman' },
  { src: '/images/poto2.jpeg',  caption: 'Tim Paramedis Profesional' },
  { src: '/images/poto3.jpeg',  caption: 'Sesi Pelatihan Bekam' },
  { src: '/images/poto4.jpeg',  caption: 'Bersama Pasien & Tamu Klinik' },
]

const certs = Array.from({ length: 12 }, (_, i) => ({
  src:   `/images/${i + 1}-01.jpg`,
  label: `Sertifikat ${i + 1}`,
}))

const trustStats = [
  { num: '2009', label: 'Berdiri sejak' },
  { num: '12+',  label: 'Sertifikasi resmi' },
  { num: '15+',  label: 'Tahun pengalaman' },
  { num: 'PBI',  label: 'Anggota Majelis Syuro' },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getSunnahInfo() {
  const today = new Date()
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const hijri = toHijri(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate())
  const sunnahDays = [17, 19, 21]
  const isSunnah = sunnahDays.includes(hijri.hd)
  const mn = ['Muharram','Safar',"Rabi'ul Awal","Rabi'ul Akhir",'Jumadil Awal','Jumadil Akhir','Rajab',"Sya'ban",'Ramadhan','Syawal',"Dzulqa'dah",'Dzulhijjah']
  const hijriStr = `${hijri.hd} ${mn[hijri.hm - 1]} ${hijri.hy} H`
  let nextHijri = null, nextMasehi = null
  for (const day of sunnahDays) {
    if (day > hijri.hd) {
      nextHijri = `${day} ${mn[hijri.hm - 1]} ${hijri.hy} H`
      const d = new Date(today); d.setDate(today.getDate() + day - hijri.hd)
      nextMasehi = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      break
    }
  }
  if (!nextHijri) {
    const nm = hijri.hm === 12 ? 1 : hijri.hm + 1, ny = hijri.hm === 12 ? hijri.hy + 1 : hijri.hy
    nextHijri = `17 ${mn[nm - 1]} ${ny} H`
    const d = new Date(today); d.setDate(today.getDate() + 30 - hijri.hd + 17)
    nextMasehi = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return {
    isSunnah, hijriStr, hijriDay: hijri.hd,
    monthName: mn[hijri.hm - 1], nextHijri, nextMasehi,
    todayMasehi: today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

function smoothScrollTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  const navH = document.querySelector('.ln')?.offsetHeight || 68
  const top = el.getBoundingClientRect().top + window.scrollY - navH - 8
  window.scrollTo({ top, behavior: 'smooth' })
}

// ─── SVG PATTERN ──────────────────────────────────────────────────────────────

const IslamicPattern = ({ opacity = 0.04, id = 'ip' }) => (
  <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity }} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id={id} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <polygon points="40,2 78,22 78,58 40,78 2,58 2,22" fill="none" stroke="#2C3E2D" strokeWidth="1.1"/>
        <polygon points="40,14 66,28 66,52 40,66 14,52 14,28" fill="none" stroke="#C5943A" strokeWidth="0.7"/>
        <circle cx="40" cy="40" r="4.5" fill="none" stroke="#2C3E2D" strokeWidth="0.7"/>
        <line x1="40" y1="2"  x2="40" y2="14" stroke="#2C3E2D" strokeWidth="0.5"/>
        <line x1="40" y1="66" x2="40" y2="78" stroke="#2C3E2D" strokeWidth="0.5"/>
        <line x1="2"  y1="40" x2="14" y2="40" stroke="#2C3E2D" strokeWidth="0.5"/>
        <line x1="66" y1="40" x2="78" y2="40" stroke="#2C3E2D" strokeWidth="0.5"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`}/>
  </svg>
)

// ─── HAMBURGER ICON ───────────────────────────────────────────────────────────

const HamburgerIcon = ({ open }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>{`
      .hb-l { transition: transform 0.28s cubic-bezier(.4,0,.2,1), opacity 0.2s; transform-origin: center; }
    `}</style>
    {open ? (
      <>
        <line className="hb-l" x1="4" y1="4" x2="18" y2="18" stroke="#2C3E2D" strokeWidth="2.2" strokeLinecap="round"/>
        <line className="hb-l" x1="18" y1="4" x2="4"  y2="18" stroke="#2C3E2D" strokeWidth="2.2" strokeLinecap="round"/>
      </>
    ) : (
      <>
        <line className="hb-l" x1="3" y1="6"  x2="19" y2="6"  stroke="#2C3E2D" strokeWidth="2" strokeLinecap="round"/>
        <line className="hb-l" x1="3" y1="11" x2="19" y2="11" stroke="#2C3E2D" strokeWidth="2" strokeLinecap="round"/>
        <line className="hb-l" x1="3" y1="16" x2="19" y2="16" stroke="#2C3E2D" strokeWidth="2" strokeLinecap="round"/>
      </>
    )}
  </svg>
)

// ─── SERVICE CARD ─────────────────────────────────────────────────────────────

function ServiceCard({ s }) {
  const [imgErr, setImgErr] = useState(false)
  const icons = { bekam:'🩸', akupuntur:'📍', khitan:'✂️', ruqyah:'📖', 'pengobatan-umum':'🏥', 'cek-lab':'🔬', pelatihan:'📚', 'apotek-herbal':'🌿' }
  return (
    <div className={`l-svc${s.featured ? ' ft' : ''}`}>
      {imgErr
        ? <div className="l-svc-img-ph">{icons[s.key]}</div>
        : <img className="l-svc-img" src={s.img} alt={s.name} onError={() => setImgErr(true)} loading="lazy"/>
      }
      <div className="l-svc-body">
        {s.featured && <div className="l-svc-badge">Layanan Unggulan</div>}
        <div className="l-svc-arabic">{s.arabic}</div>
        <div className="l-svc-name">{s.name}</div>
        <div className="l-svc-short">{s.short}</div>
        <div className="l-svc-desc">{s.desc}</div>
      </div>
    </div>
  )
}

// ─── CERT LIGHTBOX ────────────────────────────────────────────────────────────

function CertLightbox({ cert, onClose, onPrev, onNext }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  if (!cert) return null
  return (
    <div className="lb-overlay" onClick={onClose}>
      <div className="lb-box" onClick={e => e.stopPropagation()}>
        <button className="lb-close" onClick={onClose}>✕</button>
        <button className="lb-prev" onClick={onPrev}>‹</button>
        <div className="lb-img-wrap">
          <img src={cert.src} alt={cert.label}/>
        </div>
        <button className="lb-next" onClick={onNext}>›</button>
        <div className="lb-label">{cert.label}</div>
      </div>
    </div>
  )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Lato:wght@300;400;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

.lr { font-family: 'Lato', sans-serif; background: #FAF6EE; color: #2C3E2D; min-height: 100vh; }

/* ── NAVBAR ── */
.ln {
  position: sticky; top: 0; z-index: 100;
  background: rgba(250,246,238,0.97); backdrop-filter: blur(14px);
  border-bottom: 1px solid #E8DCC8;
  padding: 0 2rem; height: 68px;
  display: flex; align-items: center; justify-content: space-between;
}
.ln-brand { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
.ln-logo { width: 40px; height: 40px; flex-shrink: 0; }
.ln-logo img { width: 100%; height: 100%; object-fit: contain; }
.ln-title { font-family: 'Playfair Display', serif; font-size: 0.95rem; font-weight: 700; color: #1a2b1b; line-height: 1.2; }
.ln-sub { font-size: 0.67rem; color: #7A9E7E; letter-spacing: 0.05em; }
.ln-links { display: flex; align-items: center; gap: 1.75rem; }
.ln-link { font-size: 0.82rem; color: #4a5e4b; text-decoration: none; font-weight: 700; letter-spacing: 0.02em; transition: color 0.2s; cursor: pointer; background: none; border: none; font-family: 'Lato', sans-serif; padding: 0; }
.ln-link:hover { color: #2C3E2D; }
.ln-cta { display: flex; gap: 0.5rem; }
.ln-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 0.4rem; border-radius: 8px; transition: background 0.2s; }
.ln-hamburger:hover { background: rgba(44,62,45,0.08); }

/* Mobile menu drawer */
.ln-drawer {
  position: fixed; top: 68px; left: 0; right: 0; z-index: 99;
  background: rgba(250,246,238,0.98); backdrop-filter: blur(16px);
  border-bottom: 1px solid #E8DCC8;
  padding: 1.25rem 1.5rem 1.5rem;
  display: flex; flex-direction: column; gap: 0;
  transform: translateY(-110%); opacity: 0;
  transition: transform 0.3s cubic-bezier(.4,0,.2,1), opacity 0.25s;
  pointer-events: none;
}
.ln-drawer.open { transform: translateY(0); opacity: 1; pointer-events: all; }
.ln-drawer-link {
  font-size: 1rem; color: #2C3E2D; text-decoration: none; font-weight: 700;
  padding: 0.85rem 0; border-bottom: 1px solid #EDE4D0;
  background: none; border-top: none; border-left: none; border-right: none;
  cursor: pointer; font-family: 'Lato', sans-serif; text-align: left;
  letter-spacing: 0.02em; transition: color 0.15s, padding-left 0.15s;
  display: flex; align-items: center; gap: 0.6rem;
}
.ln-drawer-link:last-of-type { border-bottom: none; }
.ln-drawer-link:hover { color: #7A9E7E; padding-left: 0.35rem; }
.ln-drawer-cta { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 1.1rem; }

/* ── BUTTONS ── */
.bp { background: #2C3E2D; color: #FAF6EE; border: none; border-radius: 8px; padding: 0.5rem 1.1rem; font-size: 0.83rem; font-weight: 700; cursor: pointer; letter-spacing: 0.02em; transition: background 0.2s, transform 0.15s; font-family: 'Lato', sans-serif; white-space: nowrap; }
.bp:hover { background: #3a5240; transform: translateY(-1px); }
.bo { background: transparent; color: #2C3E2D; border: 1.5px solid #2C3E2D; border-radius: 8px; padding: 0.5rem 1.1rem; font-size: 0.83rem; font-weight: 700; cursor: pointer; letter-spacing: 0.02em; transition: all 0.2s; font-family: 'Lato', sans-serif; white-space: nowrap; }
.bo:hover { background: #2C3E2D; color: #FAF6EE; transform: translateY(-1px); }
.bg { background: linear-gradient(135deg, #C5943A, #dba83f); color: white; border: none; border-radius: 9px; padding: 0.72rem 1.6rem; font-size: 0.92rem; font-weight: 700; cursor: pointer; letter-spacing: 0.03em; transition: all 0.2s; box-shadow: 0 2px 16px rgba(197,148,58,0.38); font-family: 'Lato', sans-serif; }
.bg:hover { opacity: 0.92; transform: translateY(-2px); box-shadow: 0 4px 22px rgba(197,148,58,0.48); }
.bwa { display: block; width: 100%; background: #25D366; color: white; border: none; border-radius: 10px; padding: 0.8rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; letter-spacing: 0.02em; transition: all 0.2s; font-family: 'Lato', sans-serif; margin-top: 1.5rem; }
.bwa:hover { opacity: 0.92; transform: translateY(-1px); }
.bp-full { width: 100%; text-align: center; justify-content: center; }
.bo-full { width: 100%; text-align: center; }

/* ── HERO ── */
.lh { position: relative; overflow: hidden; min-height: 90vh; display: flex; align-items: center; }
.lh-bg { position: absolute; inset: 0; background: url('/images/klinik.jpeg') center/cover no-repeat; filter: brightness(0.32) saturate(0.55); }
.lh-ov { position: absolute; inset: 0; background: linear-gradient(160deg, rgba(26,43,27,0.88) 0%, rgba(44,62,45,0.72) 50%, rgba(26,43,27,0.82) 100%); }
.lh-content { position: relative; z-index: 2; max-width: 680px; padding: 5rem 2.5rem; margin-left: max(2rem, calc(50vw - 580px)); }
.lh-badge { display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(197,148,58,0.18); border: 1px solid rgba(197,148,58,0.5); color: #e8c06a; border-radius: 999px; padding: 0.32rem 1rem; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 1.4rem; }
.lh-title { font-family: 'Playfair Display', serif; font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 700; line-height: 1.18; color: #F5EFE0; margin-bottom: 0.65rem; }
.lh-title em { font-style: italic; color: #a8c4aa; }
.lh-sub { font-size: 0.9rem; color: rgba(245,239,224,0.75); line-height: 1.8; max-width: 500px; margin-bottom: 2.2rem; font-weight: 300; }
.lh-cta { display: flex; gap: 0.85rem; flex-wrap: wrap; }
.lh-scroll { position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; z-index: 2; }
.lh-scroll-line { width: 1px; height: 44px; background: linear-gradient(180deg, rgba(245,239,224,0.45), transparent); animation: sl 2s ease-in-out infinite; }
@keyframes sl { 0%,100%{opacity:.45}50%{opacity:1} }

/* ── TRUST BAR ── */
.lt { background: #2C3E2D; padding: 1.1rem 2rem; display: flex; justify-content: center; flex-wrap: wrap; }
.lt-item { display: flex; align-items: center; gap: 0.65rem; padding: 0.4rem 2.25rem; border-right: 1px solid rgba(255,255,255,0.1); }
.lt-item:last-child { border-right: none; }
.lt-num { font-family: 'Playfair Display', serif; font-size: 1.35rem; font-weight: 700; color: #C5943A; line-height: 1; }
.lt-label { font-size: 0.7rem; color: #a8c4aa; line-height: 1.3; }

/* ── SECTION STRUCTURE ── */
.ls { padding: 5rem 2rem; }
.ls-in { max-width: 1100px; margin: 0 auto; }
.ls-in-sm { max-width: 740px; margin: 0 auto; }
.l-sh { font-family: 'Playfair Display', serif; font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 700; color: #1a2b1b; text-align: center; margin-bottom: 0.5rem; }
.l-ssub { font-size: 0.7rem; color: #C5943A; letter-spacing: 0.1em; text-transform: uppercase; text-align: center; margin-bottom: 3rem; font-weight: 700; }
.l-div { display: flex; align-items: center; gap: 1rem; max-width: 300px; margin: 0 auto 1rem; }
.l-div::before, .l-div::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #C5943A55); }
.l-div span { color: #C5943A; font-size: 0.85rem; }

/* ── SUNNAH ── */
.ls-sunnah { background: linear-gradient(155deg, #EBE2CC 0%, #F5EFE0 60%, #E8F0E8 100%); position: relative; overflow: hidden; }
.l-sunnah-card { border-radius: 18px; padding: 1.6rem 1.75rem; display: flex; align-items: flex-start; gap: 1.25rem; border: 1.5px solid; max-width: 740px; margin: 0 auto; }
.l-sunnah-card.act { background: linear-gradient(135deg,#edf7ed,#e2f2e2); border-color: #7A9E7E; box-shadow: 0 4px 20px rgba(122,158,126,0.15); }
.l-sunnah-card.inact { background: white; border-color: #E8DCC8; box-shadow: 0 4px 20px rgba(44,62,45,0.06); }
.l-sunnah-icon { width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
.l-sunnah-icon.act { background: #ceeace; }
.l-sunnah-icon.inact { background: #EBE2CC; }
.l-sunnah-lbl { font-weight: 700; font-size: 0.92rem; margin-bottom: 0.2rem; }
.l-sunnah-dt { font-size: 0.72rem; color: #9aaa9b; margin-bottom: 0.5rem; }
.l-sunnah-txt { font-size: 0.82rem; line-height: 1.65; color: #4a6a4b; }
.l-sunnah-nxt { font-size: 0.82rem; color: #8a9a8b; line-height: 1.65; }
.l-sunnah-nxt strong { color: #2C3E2D; font-weight: 700; }

/* ── SERVICES ── */
.ls-svc { background: #FAF6EE; }
.l-svc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem; }
.l-svc { background: white; border-radius: 16px; border: 1.5px solid #EDE4D0; overflow: hidden; transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s; }
.l-svc:hover { transform: translateY(-5px); box-shadow: 0 10px 32px rgba(44,62,45,0.11); border-color: #7A9E7E; }
.l-svc.ft { background: linear-gradient(160deg,#2C3E2D,#3a5240); border-color: transparent; box-shadow: 0 6px 28px rgba(44,62,45,0.28); }
.l-svc.ft:hover { transform: translateY(-6px); box-shadow: 0 14px 40px rgba(44,62,45,0.38); }
.l-svc-img { width: 100%; height: 170px; object-fit: cover; display: block; background: #f5f0e8; }
.l-svc.ft .l-svc-img { filter: brightness(0.9) saturate(0.85); }
.l-svc-img-ph { width: 100%; height: 170px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; background: linear-gradient(135deg,#f0ebe0,#e8f0e8); }
.l-svc-body { padding: 1rem 1.1rem 1.3rem; }
.l-svc-badge { display: inline-block; background: #C5943A; color: white; font-size: 0.58rem; font-weight: 700; letter-spacing: 0.09em; padding: 0.18rem 0.6rem; border-radius: 999px; text-transform: uppercase; margin-bottom: 0.55rem; }
.l-svc-arabic { font-size: 0.75rem; color: #7A9E7E; margin-bottom: 0.25rem; font-weight: 700; }
.l-svc.ft .l-svc-arabic { color: #7fa882; }
.l-svc-name { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; color: #1a2b1b; margin-bottom: 0.18rem; }
.l-svc.ft .l-svc-name { color: #F5EFE0; }
.l-svc-short { font-size: 0.65rem; color: #C5943A; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.5rem; text-transform: uppercase; }
.l-svc.ft .l-svc-short { color: #dba83f; }
.l-svc-desc { font-size: 0.75rem; line-height: 1.58; color: #6B7B6C; }
.l-svc.ft .l-svc-desc { color: #9ab89c; }

/* ── DOCTOR ── */
.ls-doc { background: linear-gradient(155deg,#EBE2CC 0%,#F5EFE0 100%); position: relative; overflow: hidden; }
.l-doc-grid { display: grid; grid-template-columns: 1fr 1.65fr; gap: 4rem; align-items: start; }
.l-doc-photo-wrap { position: relative; }
.l-doc-photo { width: 100%; aspect-ratio: 3/4; object-fit: cover; object-position: top center; border-radius: 20px; box-shadow: 0 12px 48px rgba(44,62,45,0.2); display: block; }
.l-doc-badge { position: absolute; bottom: -1rem; right: -1rem; background: #2C3E2D; color: #F5EFE0; border-radius: 14px; padding: 0.9rem 1.1rem; box-shadow: 0 6px 24px rgba(44,62,45,0.3); text-align: center; min-width: 80px; }
.l-doc-badge-num { font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 700; color: #C5943A; line-height: 1; }
.l-doc-badge-lbl { font-size: 0.62rem; color: #a8c4aa; letter-spacing: 0.04em; line-height: 1.4; }
.l-doc-tag { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(197,148,58,0.15); border: 1px solid rgba(197,148,58,0.4); color: #9A6F20; border-radius: 999px; padding: 0.28rem 0.85rem; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 1rem; }
.l-doc-name { font-family: 'Playfair Display', serif; font-size: 1.9rem; font-weight: 700; color: #1a2b1b; line-height: 1.2; margin-bottom: 0.3rem; }
.l-doc-title { font-size: 0.78rem; color: #7A9E7E; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 1.5rem; }
.l-doc-bio { font-size: 0.85rem; color: #4a5e4b; line-height: 1.82; margin-bottom: 1.25rem; }
.l-doc-creds { display: flex; flex-wrap: wrap; gap: 0.55rem; margin-bottom: 1.5rem; }
.l-cred { background: white; border: 1px solid #E8DCC8; border-radius: 8px; padding: 0.38rem 0.8rem; font-size: 0.73rem; color: #4a5e4b; font-weight: 700; }
.l-doc-timeline { border-left: 2px solid #C5943A; padding-left: 1.25rem; }
.l-tl-item { margin-bottom: 0.9rem; position: relative; }
.l-tl-item::before { content: ''; position: absolute; left: -1.44rem; top: 0.35rem; width: 8px; height: 8px; border-radius: 50%; background: #C5943A; }
.l-tl-item:last-child { margin-bottom: 0; }
.l-tl-role { font-size: 0.82rem; font-weight: 700; color: #2C3E2D; }
.l-tl-place { font-size: 0.73rem; color: #7A9E7E; margin-top: 0.1rem; }

/* ── GALLERY ── */
.ls-gal { background: #1a2b1b; position: relative; overflow: hidden; }
.ls-gal .l-sh { color: #F5EFE0; }
.ls-gal .l-ssub { color: #5a7a5c; }
.ls-gal .l-div::before, .ls-gal .l-div::after { background: linear-gradient(90deg,transparent,#5a7a5c55); }
.ls-gal .l-div span { color: #7A9E7E; }
.l-gal-grid { display: grid; grid-template-columns: 1.8fr 1fr 1fr; grid-template-rows: 240px 240px; gap: 1rem; }
.l-gal-item { position: relative; overflow: hidden; border-radius: 14px; }
.l-gal-item:first-child { grid-row: 1 / 3; }
.l-gal-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; display: block; }
.l-gal-item:hover img { transform: scale(1.06); }
.l-gal-cap { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent,rgba(26,43,27,0.88)); padding: 2rem 1rem 0.9rem; font-size: 0.74rem; color: rgba(245,239,224,0.92); font-weight: 700; letter-spacing: 0.03em; transform: translateY(100%); transition: transform 0.3s; }
.l-gal-item:hover .l-gal-cap { transform: translateY(0); }

/* ── CERTIFICATES ── */
.ls-cert { background: linear-gradient(155deg,#EBE2CC,#F5EFE0); position: relative; overflow: hidden; }
.l-cert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 1rem; }
.l-cert-item {
  border-radius: 10px; overflow: hidden; border: 1.5px solid #E8DCC8;
  background: white; transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer; position: relative;
}
.l-cert-item:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(44,62,45,0.12); }
.l-cert-item:hover .l-cert-zoom { opacity: 1; }
.l-cert-item img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
.l-cert-zoom {
  position: absolute; inset: 0; background: rgba(44,62,45,0.45);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s;
  font-size: 1.5rem;
}

/* ── LIGHTBOX ── */
.lb-overlay {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(10,18,10,0.88); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 1.5rem; animation: lbFade 0.2s ease;
}
@keyframes lbFade { from{opacity:0} to{opacity:1} }
.lb-box {
  position: relative; display: flex; align-items: center; gap: 1rem;
  max-width: 800px; width: 100%; animation: lbScale 0.22s cubic-bezier(.34,1.56,.64,1);
}
@keyframes lbScale { from{transform:scale(0.92);opacity:0} to{transform:scale(1);opacity:1} }
.lb-img-wrap {
  flex: 1; border-radius: 14px; overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,0.5);
  background: white;
}
.lb-img-wrap img { width: 100%; display: block; max-height: 80vh; object-fit: contain; }
.lb-close {
  position: absolute; top: -2.5rem; right: 0;
  background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
  color: white; border-radius: 50%; width: 36px; height: 36px;
  cursor: pointer; font-size: 0.85rem; font-family: 'Lato', sans-serif;
  transition: background 0.2s; display: flex; align-items: center; justify-content: center;
}
.lb-close:hover { background: rgba(255,255,255,0.22); }
.lb-prev, .lb-next {
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18);
  color: white; border-radius: 50%; width: 44px; height: 44px; flex-shrink: 0;
  cursor: pointer; font-size: 1.4rem; font-family: 'Lato', sans-serif;
  transition: background 0.2s; display: flex; align-items: center; justify-content: center;
}
.lb-prev:hover, .lb-next:hover { background: rgba(255,255,255,0.2); }
.lb-label {
  position: absolute; bottom: -2.2rem; left: 0; right: 0; text-align: center;
  font-size: 0.78rem; color: rgba(245,239,224,0.65); letter-spacing: 0.04em;
}

/* ── CONTACT ── */
.ls-contact { background: #FAF6EE; }
.l-contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; align-items: start; }
.l-contact-card { background: linear-gradient(160deg,#2C3E2D,#3a5240); border-radius: 22px; padding: 2.25rem; color: white; }
.l-contact-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #F5EFE0; margin-bottom: 1.6rem; }
.l-contact-row { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
.l-contact-row:last-of-type { margin-bottom: 0; }
.l-contact-icon { width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 0.88rem; margin-top: 0.15rem; }
.l-contact-text { font-size: 0.83rem; color: #c8d8c9; line-height: 1.6; }
.l-contact-text strong { color: #F5EFE0; display: block; font-size: 0.68rem; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.2rem; }
.l-map-wrap { border-radius: 18px; overflow: hidden; border: 1.5px solid #E8DCC8; min-height: 360px; }
.l-map-wrap iframe { width: 100%; height: 100%; min-height: 360px; border: none; display: block; }

/* ── FOOTER ── */
.l-footer { background: #1a2b1b; padding: 2rem; }
.l-footer-in { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.l-footer-brand { display: flex; align-items: center; gap: 0.7rem; }
.l-footer-logo img { width: 30px; height: 30px; object-fit: contain; border-radius: 5px; }
.l-footer-name { font-family: 'Playfair Display', serif; font-size: 0.88rem; color: #c8d8c9; }
.l-footer-copy { font-size: 0.7rem; color: #3a5240; }
.l-footer-login { background: none; border: none; font-size: 0.68rem; color: #3a5240; cursor: pointer; font-family: 'Lato', sans-serif; text-decoration: underline; text-underline-offset: 3px; transition: color 0.2s; }
.l-footer-login:hover { color: #7A9E7E; }

/* ── RESPONSIVE: TABLET ── */
@media (max-width: 900px) {
  .l-doc-grid { grid-template-columns: 1fr; }
  .l-doc-photo { aspect-ratio: 4/3; }
  .l-doc-badge { bottom: 1rem; right: 1rem; }
  .l-contact-grid { grid-template-columns: 1fr; }
  .l-gal-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
  .l-gal-item:first-child { grid-row: auto; grid-column: 1 / 3; height: 260px; }
  .ln-links { display: none; }
  .ln-cta { display: none; }
  .ln-hamburger { display: flex; align-items: center; justify-content: center; }
}

/* ── RESPONSIVE: MOBILE ── */
@media (max-width: 600px) {
  .ln { padding: 0 1rem; height: 60px; }
  .ln-drawer { top: 60px; }
  .ln-logo { width: 36px; height: 36px; }
  .ln-title { font-size: 0.85rem; }
  .ln-sub { font-size: 0.62rem; }

  .lh { min-height: 85vh; }
  .lh-content { padding: 3.5rem 1.25rem 4rem; margin-left: 0; }
  .lh-sub { font-size: 0.84rem; }
  .lh-cta { flex-direction: column; gap: 0.65rem; }
  .lh-cta button { width: 100%; text-align: center; justify-content: center; }

  .lt { padding: 0; }
  .lt-item { padding: 0.65rem 0; width: 50%; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); justify-content: center; text-align: center; flex-direction: column; gap: 0.25rem; }
  .lt-item:nth-child(odd)  { border-right: 1px solid rgba(255,255,255,0.08); }
  .lt-item:nth-last-child(-n+2) { border-bottom: none; }

  .ls { padding: 3rem 1.1rem; }
  .l-ssub { margin-bottom: 2rem; }

  /* Service cards: 2-col mobile, compact */
  .l-svc-grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .l-svc { border-radius: 12px; }
  .l-svc-img, .l-svc-img-ph { height: 110px; }
  .l-svc.ft .l-svc-img { height: 110px; }
  .l-svc-body { padding: 0.75rem 0.8rem 1rem; }
  .l-svc-arabic { display: none; }
  .l-svc-name { font-size: 0.88rem; margin-bottom: 0.15rem; }
  .l-svc-short { font-size: 0.6rem; margin-bottom: 0.35rem; }
  .l-svc-desc { font-size: 0.7rem; line-height: 1.5; }
  .l-svc-badge { font-size: 0.54rem; padding: 0.14rem 0.5rem; }

  .l-doc-grid { gap: 2rem; }
  .l-doc-name { font-size: 1.5rem; }
  .l-doc-creds { gap: 0.4rem; }
  .l-cred { font-size: 0.7rem; padding: 0.3rem 0.65rem; }

  .l-gal-grid { grid-template-columns: 1fr; grid-template-rows: auto; }
  .l-gal-item:first-child { grid-column: auto; }
  .l-gal-item { height: 200px; }
  .l-gal-cap { transform: translateY(0); background: linear-gradient(transparent,rgba(26,43,27,0.75)); }

  .l-cert-grid { grid-template-columns: repeat(3, 1fr); gap: 0.65rem; }

  .l-map-wrap { min-height: 220px; }
  .l-map-wrap iframe { min-height: 220px; }

  .l-footer-in { flex-direction: column; align-items: flex-start; gap: 0.75rem; }

  /* Lightbox mobile */
  .lb-box { flex-direction: column; gap: 0.75rem; }
  .lb-prev, .lb-next { display: none; }
  .lb-img-wrap img { max-height: 70vh; }
}
`

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [lightbox, setLightbox] = useState(null) // index into certs[]

  const { isSunnah, hijriStr, hijriDay, monthName, nextHijri, nextMasehi, todayMasehi } = getSunnahInfo()

  // close menu on resize back to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 900) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleNavClick = useCallback((id) => {
    setMenuOpen(false)
    setTimeout(() => smoothScrollTo(id), menuOpen ? 320 : 0)
  }, [menuOpen])

  const openLightbox  = (i) => setLightbox(i)
  const closeLightbox = useCallback(() => setLightbox(null), [])
  const prevCert      = useCallback(() => setLightbox(i => (i - 1 + certs.length) % certs.length), [])
  const nextCert      = useCallback(() => setLightbox(i => (i + 1) % certs.length), [])

  return (
    <>
      <style>{CSS}</style>
      <div className="lr">

        {/* ── NAVBAR ── */}
        <nav className="ln">
          <div className="ln-brand">
            <div className="ln-logo"><img src="/images/logo2.png" alt="Logo Klinik Bekam Sehat"/></div>
            <div>
              <div className="ln-title">Klinik Bekam Sehat</div>
              <div className="ln-sub">dr. Abdurrahman · Medan</div>
            </div>
          </div>

          {/* Desktop links */}
          <div className="ln-links">
            {['layanan','dokter','galeri','kontak'].map(id => (
              <button key={id} className="ln-link" onClick={() => handleNavClick(id)}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
          <div className="ln-cta">
            <button className="bo" onClick={() => navigate('/portal')}>Cek Kunjungan</button>
            <button className="bp" onClick={() => window.open('https://api.whatsapp.com/send?phone=6281377093000','_blank')}>Hubungi Kami</button>
          </div>

          {/* Hamburger */}
          <button className="ln-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <HamburgerIcon open={menuOpen}/>
          </button>
        </nav>

        {/* Mobile drawer */}
        <div className={`ln-drawer${menuOpen ? ' open' : ''}`}>
          {['layanan','dokter','galeri','kontak'].map(id => (
            <button key={id} className="ln-drawer-link" onClick={() => handleNavClick(id)}>
              {id === 'layanan' && '🌿'}{id === 'dokter' && '👨‍⚕️'}{id === 'galeri' && '📸'}{id === 'kontak' && '📍'}
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
          <div className="ln-drawer-cta">
            <button className="bo bo-full" onClick={() => { setMenuOpen(false); navigate('/portal') }}>Cek Kunjungan</button>
            <button className="bp bp-full" onClick={() => { setMenuOpen(false); window.open('https://api.whatsapp.com/send?phone=6281377093000','_blank') }}>💬 Hubungi Kami</button>
          </div>
        </div>

        {/* ── HERO ── */}
        <section className="lh">
          <div className="lh-bg"/>
          <div className="lh-ov"/>
          <IslamicPattern opacity={0.07} id="ip-hero"/>
          <div className="lh-content">
            <div className="lh-badge">✦ Thibbunnabawi · Berdiri Sejak 2009</div>
            <h1 className="lh-title">Sehat dengan Sunnah,<br/><em>Sembuh dengan Alam</em></h1>
            <p className="lh-sub">
              Klinik Bekam Sehat dr. Abdurrahman melayani bekam, akupuntur, ruqyah, khitan, dan pengobatan islami alami untuk kesehatan Anda dan keluarga di Medan sejak 2009.
            </p>
            <div className="lh-cta">
              <button className="bg" onClick={() => window.open('https://api.whatsapp.com/send?phone=6281377093000','_blank')}>🌿 Buat Janji Sekarang</button>
              <button className="bo" style={{ color:'#F5EFE0', borderColor:'rgba(245,239,224,0.45)' }} onClick={() => navigate('/portal')}>Cek Riwayat Kunjungan</button>
            </div>
          </div>
          <div className="lh-scroll"><div className="lh-scroll-line"/></div>
        </section>

        {/* ── TRUST BAR ── */}
        <div className="lt">
          {trustStats.map(t => (
            <div key={t.label} className="lt-item">
              <div className="lt-num">{t.num}</div>
              <div className="lt-label">{t.label}</div>
            </div>
          ))}
        </div>

        {/* ── SUNNAH BEKAM ── */}
        <section className="ls ls-sunnah">
          <IslamicPattern opacity={0.035} id="ip-sunnah"/>
          <div className="ls-in-sm" style={{ position:'relative', zIndex:1 }}>
            <div className="l-div"><span>✦</span></div>
            <h2 className="l-sh">Jadwal Sunnah Bekam</h2>
            <p className="l-ssub">BERDASARKAN KALENDER HIJRIAH</p>
            <div className={`l-sunnah-card ${isSunnah ? 'act' : 'inact'}`}>
              <div className={`l-sunnah-icon ${isSunnah ? 'act' : 'inact'}`}>{isSunnah ? '🟢' : '📅'}</div>
              <div style={{ flex:1 }}>
                <div className="l-sunnah-lbl">{isSunnah ? 'Hari ini adalah hari sunnah bekam!' : 'Hari Sunnah Bekam Berikutnya'}</div>
                <div className="l-sunnah-dt">Hari ini : {todayMasehi} · {hijriStr}</div>
                {isSunnah
                  ? <p className="l-sunnah-txt">Tanggal {hijriDay} {monthName} adalah hari yang dianjurkan Rasulullah ﷺ untuk berbekam (17, 19, dan 21 Hijriah). Manfaatkan hari penuh berkah ini untuk hijamah.</p>
                  : <p className="l-sunnah-nxt">Hari sunnah bekam: <strong>{nextMasehi}</strong> &nbsp;·&nbsp; {nextHijri}</p>
                }
              </div>
            </div>
          </div>
        </section>

        {/* ── LAYANAN ── */}
        <section id="layanan" className="ls ls-svc">
          <div className="ls-in">
            <div className="l-div"><span>✦</span></div>
            <h2 className="l-sh">Layanan Kami</h2>
            <p className="l-ssub">PENGOBATAN ISLAMI DAN ALAMI TERPADU</p>
            <div className="l-svc-grid">
              {services.map(s => <ServiceCard key={s.key} s={s}/>)}
            </div>
          </div>
        </section>

        {/* ── DOKTER ── */}
        <section id="dokter" className="ls ls-doc">
          <IslamicPattern opacity={0.03} id="ip-doc"/>
          <div className="ls-in" style={{ position:'relative', zIndex:1 }}>
            <div className="l-div"><span>✦</span></div>
            <h2 className="l-sh">Dokter Kami</h2>
            <p className="l-ssub">BERPENGALAMAN & BERSERTIFIKAT RESMI</p>
            <div className="l-doc-grid">
              <div className="l-doc-photo-wrap">
                <img className="l-doc-photo" src="/images/drr.jpg" alt="dr. Abdurrahman Umar"/>
                <div className="l-doc-badge">
                  <div className="l-doc-badge-num">15+</div>
                  <div className="l-doc-badge-lbl">Tahun<br/>Praktek</div>
                </div>
              </div>
              <div>
                <div className="l-doc-tag">✦ Pendiri & Dokter Utama</div>
                <h3 className="l-doc-name">dr. Abdurrahman Umar</h3>
                <div className="l-doc-title">Anggota Majelis Syuro · Perkumpulan Bekam Indonesia (PBI) Pusat</div>
                <p className="l-doc-bio">Lulusan Fakultas Kedokteran Universitas Hasanuddin Makassar yang merintis Klinik Bekam Sehat sejak 2009. Mengenal bekam dari pelatihan langsung di Malaysia dan memperdalam akupuntur dari spesialis RS Cipto Mangunkusumo Jakarta. Aktif berdakwah melalui seminar kesehatan dan kajian masjid di seluruh Sumatera Utara.</p>
                <p className="l-doc-bio">Dalam lebih dari 15 tahun praktek, beliau telah menangani pasien dengan beragam kondisi — dari penyakit ringan hingga berat seperti diabetes, stroke, cardiovaskular, dan gastritis. Kliniknya juga menjadi pusat pelatihan bekam dan akupuntur yang alumninya telah tersebar ke seluruh Indonesia bahkan mancanegara.</p>
                <div className="l-doc-creds">
                  <div className="l-cred">🎓 FK Universitas Hasanuddin</div>
                  <div className="l-cred">📜 Sertifikasi Bekam Malaysia</div>
                  <div className="l-cred">📜 Akupuntur RS Cipto Mangunkusumo</div>
                  <div className="l-cred">🏛 Anggota PBI Pusat Jakarta</div>
                </div>
                <div className="l-doc-timeline">
                  <div className="l-tl-item"><div className="l-tl-role">Dokter Klinik — PT Listrindo Jababeka, Cikarang</div></div>
                  <div className="l-tl-item"><div className="l-tl-role">Dokter — RSU Sigli, Aceh</div></div>
                  <div className="l-tl-item">
                    <div className="l-tl-role">Dokter — ExxonMobil Lhoksukon</div>
                    <div className="l-tl-place">1996 – 2011</div>
                  </div>
                  <div className="l-tl-item">
                    <div className="l-tl-role">Pendiri & Dokter Utama — Klinik Bekam Sehat</div>
                    <div className="l-tl-place">2009 – sekarang</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── GALERI ── */}
        <section id="galeri" className="ls ls-gal">
          <IslamicPattern opacity={0.055} id="ip-gal"/>
          <div className="ls-in" style={{ position:'relative', zIndex:1 }}>
            <div className="l-div"><span>✦</span></div>
            <h2 className="l-sh">Galeri</h2>
            <p className="l-ssub">KLINIK, TIM, DAN KEGIATAN</p>
            <div className="l-gal-grid">
              {gallery.map((g,i) => (
                <div key={i} className="l-gal-item">
                  <img src={g.src} alt={g.caption} loading="lazy"/>
                  <div className="l-gal-cap">{g.caption}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SERTIFIKAT ── */}
        <section className="ls ls-cert">
          <IslamicPattern opacity={0.04} id="ip-cert"/>
          <div className="ls-in" style={{ position:'relative', zIndex:1 }}>
            <div className="l-div"><span>✦</span></div>
            <h2 className="l-sh">Sertifikasi Resmi</h2>
            <p className="l-ssub">12 SERTIFIKAT KOMPETENSI & KELEMBAGAAN</p>
            <div className="l-cert-grid">
              {certs.map((c,i) => (
                <div key={i} className="l-cert-item" onClick={() => openLightbox(i)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && openLightbox(i)}>
                  <img src={c.src} alt={c.label} loading="lazy"/>
                  <div className="l-cert-zoom">🔍</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── KONTAK ── */}
        <section id="kontak" className="ls ls-contact">
          <div className="ls-in">
            <div className="l-div"><span>✦</span></div>
            <h2 className="l-sh">Temukan Kami</h2>
            <p className="l-ssub">LOKASI & KONTAK</p>
            <div className="l-contact-grid">
              <div className="l-contact-card">
                <div className="l-contact-title">Hubungi Klinik</div>
                <div className="l-contact-row">
                  <div className="l-contact-icon">📍</div>
                  <div className="l-contact-text"><strong>Alamat</strong>Jl. Pasar 1 No. 274 B, Kel. Tanjung Sari, Kec. Medan Selayang, Kota Medan, Sumatera Utara 20154</div>
                </div>
                <div className="l-contact-row">
                  <div className="l-contact-icon">🕐</div>
                  <div className="l-contact-text"><strong>Jam Buka</strong>Setiap hari · 08.00 – 20.00 WIB</div>
                </div>
                <div className="l-contact-row">
                  <div className="l-contact-icon">📞</div>
                  <div className="l-contact-text"><strong>Telepon / WhatsApp</strong>+62 813 7709 3000</div>
                </div>
                <div className="l-contact-row">
                  <div className="l-contact-icon">✉️</div>
                  <div className="l-contact-text"><strong>Email</strong>hallo.kliniksehat12@gmail.com</div>
                </div>
                <button className="bwa" onClick={() => window.open('https://api.whatsapp.com/send?phone=6281377093000','_blank')}>💬 Hubungi via WhatsApp</button>
              </div>
              <div className="l-map-wrap">
                <iframe
                  title="Lokasi Klinik Bekam Sehat"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3982.125516881946!2d98.62431747473225!3d3.5585509964156454!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30312f9174458313%3A0xbdca6882fd31629f!2sKlinik%20Sehat%20dr.%20Abdurrahman!5e0!3m2!1sen!2sid!4v1777852002833!5m2!1sen!2sid"
                  allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="l-footer">
          <div className="l-footer-in">
            <div className="l-footer-brand">
              <div className="l-footer-logo"><img src="/images/logo2.png" alt="Logo"/></div>
              <div className="l-footer-name">Klinik Bekam Sehat dr. Abdurrahman</div>
            </div>
            <div className="l-footer-copy">© 2026 · Medan, Sumatera Utara</div>
            <button className="l-footer-login" onClick={() => navigate('/login')}>Login Staff</button>
          </div>
        </footer>

        {/* ── CERT LIGHTBOX ── */}
        {lightbox !== null && (
          <CertLightbox
            cert={certs[lightbox]}
            onClose={closeLightbox}
            onPrev={prevCert}
            onNext={nextCert}
          />
        )}

      </div>
    </>
  )
}