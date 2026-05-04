import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function smoothScrollTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  const navH = (document.querySelector('.pd-nav')?.offsetHeight || 0) +
               (document.querySelector('.pd-subnav')?.offsetHeight || 0)
  const top = el.getBoundingClientRect().top + window.scrollY - navH - 12
  window.scrollTo({ top, behavior: 'smooth' })
}

function fmtDate(str) {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtRp(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

// ─── SVG PATTERN ──────────────────────────────────────────────────────────────

const IslamicPattern = ({ opacity = 0.035, id = 'pdip' }) => (
  <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity }} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id={id} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <polygon points="40,2 78,22 78,58 40,78 2,58 2,22" fill="none" stroke="#2C3E2D" strokeWidth="1"/>
        <polygon points="40,14 66,28 66,52 40,66 14,52 14,28" fill="none" stroke="#C5943A" strokeWidth="0.6"/>
        <circle cx="40" cy="40" r="4" fill="none" stroke="#2C3E2D" strokeWidth="0.6"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`}/>
  </svg>
)

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Lato:wght@300;400;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.pd-root { font-family: 'Lato', sans-serif; background: #FAF6EE; color: #2C3E2D; min-height: 100vh; }

/* ── TOP NAVBAR ── */
.pd-nav {
  position: sticky; top: 0; z-index: 50;
  background: rgba(250,246,238,0.97); backdrop-filter: blur(14px);
  border-bottom: 1px solid #E8DCC8;
  padding: 0 1.5rem; height: 62px;
  display: flex; align-items: center; justify-content: space-between;
}
.pd-nav-brand { display: flex; align-items: center; gap: 0.7rem; }
.pd-nav-logo { width: 34px; height: 34px; flex-shrink: 0; }
.pd-nav-logo img { width: 100%; height: 100%; object-fit: contain; }
.pd-nav-title { font-family: 'Playfair Display', serif; font-size: 0.9rem; font-weight: 700; color: #1a2b1b; line-height: 1.2; }
.pd-nav-sub { font-size: 0.63rem; color: #7A9E7E; letter-spacing: 0.05em; }
.pd-nav-right { display: flex; align-items: center; gap: 0.75rem; }
.pd-nav-patient { font-size: 0.75rem; color: #4a5e4b; font-weight: 700; }
.pd-nav-code { font-size: 0.65rem; color: #9aaa9b; font-family: monospace; background: #EDE4D0; padding: 0.15rem 0.5rem; border-radius: 4px; margin-left: 0.35rem; }
.pd-logout {
  background: transparent; color: #6B7B6C; border: 1.5px solid #DDD5C0;
  border-radius: 7px; padding: 0.38rem 0.85rem; font-size: 0.75rem; font-weight: 700;
  cursor: pointer; font-family: 'Lato', sans-serif; letter-spacing: 0.02em;
  transition: all 0.2s;
}
.pd-logout:hover { border-color: #2C3E2D; color: #2C3E2D; }

/* ── SUB-NAV (section tabs) ── */
.pd-subnav {
  position: sticky; top: 62px; z-index: 49;
  background: #2C3E2D;
  display: flex; gap: 0; overflow-x: auto;
  scrollbar-width: none;
}
.pd-subnav::-webkit-scrollbar { display: none; }
.pd-subnav-btn {
  flex-shrink: 0; background: none; border: none; border-bottom: 2.5px solid transparent;
  color: rgba(245,239,224,0.55); font-size: 0.78rem; font-weight: 700;
  padding: 0.75rem 1.4rem; cursor: pointer; font-family: 'Lato', sans-serif;
  letter-spacing: 0.04em; white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
}
.pd-subnav-btn:hover { color: rgba(245,239,224,0.85); }
.pd-subnav-btn.active { color: #F5EFE0; border-bottom-color: #C5943A; }

/* ── HERO GREETING ── */
.pd-hero {
  position: relative; overflow: hidden;
  background: linear-gradient(155deg, #2C3E2D 0%, #3a5240 60%, #2C3E2D 100%);
  padding: 2.5rem 1.5rem 2rem;
}
.pd-hero-content { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
.pd-hero-tag {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: rgba(197,148,58,0.2); border: 1px solid rgba(197,148,58,0.45);
  color: #e8c06a; border-radius: 999px;
  padding: 0.25rem 0.85rem; font-size: 0.65rem; font-weight: 700;
  letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 0.9rem;
}
.pd-hero-name { font-family: 'Playfair Display', serif; font-size: clamp(1.4rem, 4vw, 1.9rem); font-weight: 700; color: #F5EFE0; margin-bottom: 0.2rem; line-height: 1.25; }
.pd-hero-greet { font-size: 0.82rem; color: #a8c4aa; margin-bottom: 1.5rem; line-height: 1.5; }

/* Stats row */
.pd-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
.pd-stat {
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px; padding: 0.85rem 1rem;
}
.pd-stat-num { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700; color: #C5943A; line-height: 1; margin-bottom: 0.2rem; }
.pd-stat-label { font-size: 0.65rem; color: #7fa882; letter-spacing: 0.03em; line-height: 1.35; }

/* ── MAIN CONTENT ── */
.pd-body { max-width: 640px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }

/* Section heading */
.pd-sec-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
.pd-sec-icon { width: 32px; height: 32px; border-radius: 8px; background: #2C3E2D; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
.pd-sec-title { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700; color: #1a2b1b; }
.pd-sec-count { font-size: 0.68rem; color: #9aaa9b; background: #EDE4D0; padding: 0.15rem 0.55rem; border-radius: 999px; font-weight: 700; }

/* Section divider */
.pd-section { margin-bottom: 3rem; scroll-margin-top: 130px; }

/* ── VISIT CARDS ── */
.pd-visit {
  background: white; border-radius: 14px; border: 1.5px solid #EDE4D0;
  margin-bottom: 0.85rem; overflow: hidden;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.pd-visit:hover { box-shadow: 0 4px 18px rgba(44,62,45,0.08); border-color: #C5943A55; }
.pd-visit-header { padding: 1rem 1.2rem 0.9rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.pd-visit-date { font-size: 0.88rem; font-weight: 700; color: #2C3E2D; margin-bottom: 0.2rem; }
.pd-visit-complaint { font-size: 0.75rem; color: #8a9a8b; line-height: 1.45; }
.pd-visit-badge {
  flex-shrink: 0; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; padding: 0.22rem 0.65rem; border-radius: 999px;
}
.pd-visit-badge.done { background: #e8f5e8; color: #3a7a3a; }
.pd-visit-badge.pending { background: #FFF8E8; color: #9A6F20; }
.pd-visit-body { border-top: 1px solid #F0E8D8; padding: 0.85rem 1.2rem; }
.pd-visit-service-row { display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 0; }
.pd-visit-service-row:not(:last-child) { border-bottom: 1px solid #F5F0E8; }
.pd-visit-service-name { font-size: 0.76rem; color: #6B7B6C; }
.pd-visit-service-price { font-size: 0.76rem; color: #2C3E2D; font-weight: 700; }
.pd-visit-total { display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0 0; margin-top: 0.4rem; border-top: 1.5px solid #EDE4D0; }
.pd-visit-total-label { font-size: 0.78rem; font-weight: 700; color: #4a5e4b; }
.pd-visit-total-val { font-size: 0.88rem; font-weight: 700; color: #2C3E2D; }

/* BP pill */
.pd-bp { display: inline-flex; align-items: center; gap: 0.3rem; background: #EBE2CC; border-radius: 999px; padding: 0.18rem 0.6rem; font-size: 0.67rem; color: #7A6030; font-weight: 700; margin-top: 0.5rem; }

/* Empty state */
.pd-empty {
  background: white; border-radius: 14px; border: 1.5px solid #EDE4D0;
  padding: 3rem 1.5rem; text-align: center;
}
.pd-empty-icon { font-size: 2.2rem; margin-bottom: 0.75rem; }
.pd-empty-title { font-family: 'Playfair Display', serif; font-size: 1rem; color: #2C3E2D; margin-bottom: 0.4rem; }
.pd-empty-sub { font-size: 0.78rem; color: #9aaa9b; line-height: 1.55; }

/* ── LAB CARDS ── */
.pd-lab {
  background: white; border-radius: 14px; border: 1.5px solid #EDE4D0;
  margin-bottom: 0.85rem; overflow: hidden;
  transition: box-shadow 0.2s;
}
.pd-lab:hover { box-shadow: 0 4px 18px rgba(44,62,45,0.08); }
.pd-lab-header { padding: 1rem 1.2rem 0.9rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
.pd-lab-date { font-size: 0.88rem; font-weight: 700; color: #2C3E2D; }
.pd-lab-pdf {
  display: inline-flex; align-items: center; gap: 0.3rem;
  background: #EBE2CC; color: #7A6030; border-radius: 999px;
  padding: 0.22rem 0.7rem; font-size: 0.67rem; font-weight: 700;
  text-decoration: none; transition: background 0.2s;
}
.pd-lab-pdf:hover { background: #DDD5C0; }
.pd-lab-body { border-top: 1px solid #F0E8D8; padding: 0.85rem 1.2rem; }
.pd-lab-row { display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 0; }
.pd-lab-row:not(:last-child) { border-bottom: 1px solid #F5F0E8; }
.pd-lab-param { font-size: 0.76rem; color: #6B7B6C; }
.pd-lab-val { font-size: 0.78rem; font-weight: 700; color: #2C3E2D; }

/* Lab placeholder (belum ada data) */
.pd-lab-placeholder {
  background: linear-gradient(135deg, #F5EFE0, #EBE2CC);
  border-radius: 14px; border: 1.5px dashed #C5943A55;
  padding: 2.5rem 1.5rem; text-align: center; position: relative; overflow: hidden;
}
.pd-lab-ph-icon { font-size: 2rem; margin-bottom: 0.75rem; }
.pd-lab-ph-title { font-family: 'Playfair Display', serif; font-size: 1rem; color: #2C3E2D; margin-bottom: 0.4rem; }
.pd-lab-ph-sub { font-size: 0.76rem; color: #9aaa9b; line-height: 1.6; max-width: 280px; margin: 0 auto; }
.pd-lab-ph-badge {
  display: inline-block; margin-top: 1rem;
  background: rgba(197,148,58,0.15); border: 1px solid rgba(197,148,58,0.3);
  color: #9A6F20; border-radius: 999px;
  padding: 0.25rem 0.9rem; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.07em;
}

/* ── FOOTER ── */
.pd-footer {
  text-align: center; padding: 1.5rem 1.25rem 3rem;
  border-top: 1px solid #E8DCC8; margin-top: 1rem;
  max-width: 640px; margin-left: auto; margin-right: auto;
}
.pd-footer-back {
  background: none; border: none; cursor: pointer; font-family: 'Lato', sans-serif;
  font-size: 0.8rem; color: #7A9E7E; transition: color 0.2s; margin-bottom: 0.75rem; display: inline-block;
}
.pd-footer-back:hover { color: #2C3E2D; }
.pd-footer-info { font-size: 0.68rem; color: #b0b8a0; line-height: 1.6; }

/* ── LOADING ── */
.pd-loading {
  min-height: 100vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 1rem;
  background: linear-gradient(155deg, #EBE2CC, #F5EFE0);
}
.pd-loading-logo { width: 48px; height: 48px; animation: pdPulse 1.8s ease-in-out infinite; }
@keyframes pdPulse { 0%,100%{opacity:0.5;transform:scale(0.95)} 50%{opacity:1;transform:scale(1)} }
.pd-loading-text { font-size: 0.8rem; color: #7A9E7E; letter-spacing: 0.05em; }

@media (max-width: 480px) {
  .pd-nav { padding: 0 1rem; height: 56px; }
  .pd-subnav { top: 56px; }
  .pd-nav-logo { width: 30px; height: 30px; }
  .pd-nav-title { font-size: 0.82rem; }
  .pd-nav-patient { display: none; }
  .pd-hero { padding: 2rem 1.1rem 1.75rem; }
  .pd-stats { grid-template-columns: repeat(3,1fr); gap: 0.5rem; }
  .pd-stat { padding: 0.7rem 0.6rem; }
  .pd-stat-num { font-size: 1.1rem; }
  .pd-subnav-btn { padding: 0.7rem 1rem; font-size: 0.72rem; }
  .pd-body { padding: 1.5rem 1rem 3.5rem; }
}
`

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function PortalDashboard() {
  const navigate = useNavigate()
  const [patient, setPatient]   = useState(null)
  const [visits, setVisits]     = useState([])
  const [labs, setLabs]         = useState([])
  const [clinicInfo, setClinicInfo] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('kunjungan')

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const session = localStorage.getItem('patient_session')
    if (!session) { navigate('/portal'); return }
    const { patient_id, logged_in_at } = JSON.parse(session)
    if (Date.now() - logged_in_at > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('patient_session')
      navigate('/portal')
      return
    }
    fetchData(patient_id)
  }, [])

  const fetchData = async (patientId) => {
    setLoading(true)
    const [patientRes, visitsRes, clinicRes, labRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', patientId).single(),
      supabase
        .from('visits')
        .select(`id, visit_date, chief_complaint, blood_pressure, notes,
          visit_services(id, status, final_price, quantity,
            services(name, category, service_code))`)
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('clinic_settings').select('name, address, phone').eq('id', 1).single(),
      supabase
        .from('lab_results')
        .select('*')
        .eq('patient_id', patientId)
        .order('lab_date', { ascending: false }),
    ])
    if (patientRes.data) setPatient(patientRes.data)
    if (visitsRes.data) setVisits(visitsRes.data)
    if (clinicRes.data) setClinicInfo(clinicRes.data)
    if (labRes.data) setLabs(labRes.data)
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('patient_session')
    navigate('/portal')
  }

  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab)
    setTimeout(() => smoothScrollTo(tab), 50)
  }, [])

  // ── Derived stats ──
  const totalVisits = visits.length
  const totalSpent = visits.reduce((sum, v) =>
    sum + (v.visit_services || [])
      .filter(s => s.status === 'done')
      .reduce((s2, vs) => s2 + Number(vs.final_price) * Number(vs.quantity), 0)
  , 0)
  const lastVisit = visits[0]?.visit_date

  // ── Loading screen ──
  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="pd-loading">
        <img className="pd-loading-logo" src="/images/logo2.png" alt="Logo"/>
        <div className="pd-loading-text">Memuat data pasien...</div>
      </div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>
      <div className="pd-root">

        {/* ── TOP NAVBAR ── */}
        <nav className="pd-nav">
          <div className="pd-nav-brand">
            <div className="pd-nav-logo"><img src="/images/logo2.png" alt="Logo"/></div>
            <div>
              <div className="pd-nav-title">Portal Pasien</div>
              <div className="pd-nav-sub">Klinik Bekam Sehat · dr. Abdurrahman</div>
            </div>
          </div>
          <div className="pd-nav-right">
            {patient && (
              <div className="pd-nav-patient">
                {patient.name}
                <span className="pd-nav-code">{patient.patient_code}</span>
              </div>
            )}
            <button className="pd-logout" onClick={handleLogout}>Keluar</button>
          </div>
        </nav>

        {/* ── SUB-NAV tabs ── */}
        <div className="pd-subnav">
          {[
            { id: 'kunjungan', label: '🏥 Riwayat Kunjungan' },
            { id: 'lab',       label: '🔬 Riwayat Hasil Lab' },
          ].map(t => (
            <button
              key={t.id}
              className={`pd-subnav-btn${activeTab === t.id ? ' active' : ''}`}
              onClick={() => handleTabClick(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── HERO / GREETING ── */}
        <div className="pd-hero">
          <IslamicPattern opacity={0.06} id="pdip-hero"/>
          <div className="pd-hero-content">
            <div className="pd-hero-tag">✦ Portal Pasien</div>
            <div className="pd-hero-name">
              Assalamu'alaikum,<br/>{patient?.name || ''}
            </div>
            <div className="pd-hero-greet">
              {lastVisit
                ? `Kunjungan terakhir: ${fmtDate(lastVisit)}`
                : 'Selamat datang di portal pasien Klinik Bekam Sehat.'}
            </div>
            <div className="pd-stats">
              <div className="pd-stat">
                <div className="pd-stat-num">{totalVisits}</div>
                <div className="pd-stat-label">Total Kunjungan</div>
              </div>
              <div className="pd-stat">
                <div className="pd-stat-num">{labs.length}</div>
                <div className="pd-stat-label">Cek Lab</div>
              </div>
              <div className="pd-stat">
                <div className="pd-stat-num" style={{ fontSize: totalSpent > 9999999 ? '0.95rem' : undefined }}>
                  {totalSpent > 0 ? fmtRp(totalSpent).replace('Rp ', '') : '—'}
                </div>
                <div className="pd-stat-label">Total Biaya</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="pd-body">

          {/* ── RIWAYAT KUNJUNGAN ── */}
          <div id="kunjungan" className="pd-section">
            <div className="pd-sec-head">
              <div className="pd-sec-icon">🏥</div>
              <div className="pd-sec-title">Riwayat Kunjungan</div>
              {totalVisits > 0 && <div className="pd-sec-count">{totalVisits} kunjungan</div>}
            </div>

            {visits.length === 0 ? (
              <div className="pd-empty">
                <div className="pd-empty-icon">📋</div>
                <div className="pd-empty-title">Belum ada riwayat kunjungan</div>
                <div className="pd-empty-sub">Data kunjungan Anda akan muncul di sini setelah melakukan pemeriksaan di klinik.</div>
              </div>
            ) : (
              visits.map(v => {
                const doneServices = (v.visit_services || []).filter(s => s.status === 'done')
                const total = doneServices.reduce((sum, s) => sum + Number(s.final_price) * Number(s.quantity), 0)
                const allDone = v.visit_services?.length > 0 && v.visit_services.every(s => s.status === 'done')

                return (
                  <div key={v.id} className="pd-visit">
                    <div className="pd-visit-header">
                      <div>
                        <div className="pd-visit-date">{fmtDate(v.visit_date)}</div>
                        {v.chief_complaint && (
                          <div className="pd-visit-complaint">{v.chief_complaint}</div>
                        )}
                        {v.blood_pressure && (
                          <div className="pd-bp">🫀 {v.blood_pressure}</div>
                        )}
                      </div>
                      <div className={`pd-visit-badge ${allDone ? 'done' : 'pending'}`}>
                        {allDone ? '✓ Selesai' : '⏳ Pending'}
                      </div>
                    </div>

                    {doneServices.length > 0 && (
                      <div className="pd-visit-body">
                        {doneServices.map(s => (
                          <div key={s.id} className="pd-visit-service-row">
                            <div className="pd-visit-service-name">
                              {s.services?.name} {s.quantity > 1 && <span style={{ color:'#9aaa9b' }}>×{s.quantity}</span>}
                            </div>
                            <div className="pd-visit-service-price">
                              {fmtRp(Number(s.final_price) * Number(s.quantity))}
                            </div>
                          </div>
                        ))}
                        <div className="pd-visit-total">
                          <div className="pd-visit-total-label">Total</div>
                          <div className="pd-visit-total-val">{fmtRp(total)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* ── HASIL LAB ── */}
          <div id="lab" className="pd-section">
            <div className="pd-sec-head">
              <div className="pd-sec-icon">🔬</div>
              <div className="pd-sec-title">Hasil Pemeriksaan Lab</div>
              {labs.length > 0 && <div className="pd-sec-count">{labs.length} hasil</div>}
            </div>

            {labs.length === 0 ? (
              <div className="pd-lab-placeholder">
                <IslamicPattern opacity={0.04} id="pdip-lab"/>
                <div style={{ position:'relative', zIndex:1 }}>
                  <div className="pd-lab-ph-icon">🔬</div>
                  <div className="pd-lab-ph-title">Hasil Lab Belum Tersedia</div>
                  <div className="pd-lab-ph-sub">
                    Hasil pemeriksaan laboratorium Anda akan ditampilkan di sini setelah dokter memasukkan data. Hubungi klinik untuk informasi lebih lanjut.
                  </div>
                  <div className="pd-lab-ph-badge">Segera Hadir</div>
                </div>
              </div>
            ) : (
              labs.map(lab => {
                const params = []
                if (lab.blood_sugar) params.push({
                  label: `Gula Darah (${lab.blood_sugar_type === 'puasa' ? 'Puasa' : 'Sewaktu'})`,
                  val: `${lab.blood_sugar} mg/dL`
                })
                if (lab.uric_acid) params.push({
                  label: `Asam Urat (${lab.uric_acid_gender === 'pria' ? 'Pria' : 'Wanita'})`,
                  val: `${lab.uric_acid} mg/dL`
                })
                if (lab.cholesterol) params.push({
                  label: 'Kolesterol',
                  val: `${lab.cholesterol} mg/dL`
                })

                return (
                  <div key={lab.id} className="pd-lab">
                    <div className="pd-lab-header">
                      <div className="pd-lab-date">{fmtDate(lab.lab_date)}</div>
                      {lab.letter_url && (
                        <a href={lab.letter_url} target="_blank" rel="noopener noreferrer" className="pd-lab-pdf">
                          📄 Lihat PDF
                        </a>
                      )}
                    </div>
                    {params.length > 0 && (
                      <div className="pd-lab-body">
                        {params.map(p => (
                          <div key={p.label} className="pd-lab-row">
                            <div className="pd-lab-param">{p.label}</div>
                            <div className="pd-lab-val">{p.val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="pd-footer">
            <button className="pd-footer-back" onClick={() => navigate('/')}>← Kembali ke Beranda</button>
            <div className="pd-footer-info">
              {clinicInfo?.name || 'Klinik Bekam Sehat dr. Abdurrahman'}
              {clinicInfo?.address && <><br/>{clinicInfo.address}</>}
              {clinicInfo?.phone && <><br/>{clinicInfo.phone}</>}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}