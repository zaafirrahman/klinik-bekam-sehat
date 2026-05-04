import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Lato:wght@300;400;700&display=swap');

  .pl-root {
    min-height: 100vh;
    background: linear-gradient(155deg, #EBE2CC 0%, #F5EFE0 50%, #E8F0E8 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 1.5rem; font-family: 'Lato', sans-serif; color: #2C3E2D;
    position: relative; overflow: hidden;
  }

  .pl-bg-pattern {
    position: fixed; inset: 0; opacity: 0.04; pointer-events: none; z-index: 0;
  }

  .pl-wrap { width: 100%; max-width: 400px; position: relative; z-index: 1; }

  .pl-brand {
    text-align: center; margin-bottom: 2rem;
  }
  .pl-logo {
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg, #7A9E7E, #2C3E2D);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif; font-size: 1.4rem; color: white;
    margin: 0 auto 0.9rem; box-shadow: 0 4px 16px rgba(44,62,45,0.2);
  }
  .pl-brand-name { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: #1a2b1b; line-height: 1.2; }
  .pl-brand-sub { font-size: 0.7rem; color: #7A9E7E; letter-spacing: 0.06em; margin-top: 0.2rem; }

  .pl-card {
    background: white; border-radius: 20px;
    border: 1.5px solid #EDE4D0;
    box-shadow: 0 8px 40px rgba(44,62,45,0.09), 0 2px 8px rgba(44,62,45,0.04);
    overflow: hidden;
  }
  .pl-card-header {
    background: linear-gradient(145deg, #2C3E2D, #3a5240);
    padding: 1.5rem 1.75rem 1.4rem;
  }
  .pl-card-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; color: #F5EFE0; margin-bottom: 0.25rem; }
  .pl-card-desc { font-size: 0.78rem; color: #a8c4aa; line-height: 1.5; }

  .pl-card-body { padding: 1.75rem; }

  .pl-field { margin-bottom: 1.1rem; }
  .pl-label { display: block; font-size: 0.78rem; font-weight: 700; color: #4a5e4b; margin-bottom: 0.4rem; letter-spacing: 0.03em; }
  .pl-input {
    width: 100%; box-sizing: border-box;
    padding: 0.65rem 0.9rem; font-size: 0.88rem;
    border: 1.5px solid #DDD5C0; border-radius: 9px;
    background: #FDFAF5; color: #2C3E2D;
    font-family: 'Lato', sans-serif;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .pl-input::placeholder { color: #b8c4b0; }
  .pl-input:focus { border-color: #7A9E7E; box-shadow: 0 0 0 3px rgba(122,158,126,0.15); background: white; }

  .pl-error {
    background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
    padding: 0.6rem 0.8rem; font-size: 0.78rem; color: #b91c1c;
    margin-bottom: 1rem;
  }

  .pl-submit {
    width: 100%; background: #2C3E2D; color: #FAF6EE;
    border: none; border-radius: 9px; padding: 0.75rem;
    font-size: 0.9rem; font-weight: 700; cursor: pointer;
    letter-spacing: 0.03em; transition: background 0.2s, transform 0.15s;
    font-family: 'Lato', sans-serif; margin-top: 0.25rem;
  }
  .pl-submit:hover:not(:disabled) { background: #3a5240; transform: translateY(-1px); }
  .pl-submit:disabled { opacity: 0.55; cursor: not-allowed; }

  .pl-hint {
    text-align: center; margin-top: 1rem;
    font-size: 0.72rem; color: #9aaa9b; line-height: 1.55;
    padding: 0 0.25rem;
  }

  .pl-back {
    display: block; text-align: center; margin-top: 1.5rem;
    background: none; border: none; cursor: pointer;
    font-size: 0.82rem; color: #7A9E7E;
    font-family: 'Lato', sans-serif;
    transition: color 0.2s;
  }
  .pl-back:hover { color: #2C3E2D; }

  .pl-divider { display: flex; align-items: center; gap: 0.75rem; margin: 1.25rem 0; }
  .pl-divider-line { flex: 1; height: 1px; background: #EDE4D0; }
  .pl-divider-text { font-size: 0.65rem; color: #C5943A; letter-spacing: 0.06em; }
`

const BgPattern = () => (
  <svg className="pl-bg-pattern" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="plGrid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <polygon points="40,2 78,22 78,58 40,78 2,58 2,22" fill="none" stroke="#2C3E2D" strokeWidth="1"/>
        <polygon points="40,14 66,28 66,52 40,66 14,52 14,28" fill="none" stroke="#C5943A" strokeWidth="0.7"/>
        <circle cx="40" cy="40" r="4" fill="none" stroke="#2C3E2D" strokeWidth="0.7"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#plGrid)"/>
  </svg>
)

export default function PortalLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ patient_code: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const code = form.patient_code.trim().toUpperCase()
    const phone = form.phone.trim()

    const { data, error } = await supabase
      .from('patients')
      .select('id, name, patient_code, phone')
      .eq('patient_code', code)
      .single()

    if (error || !data) {
      setError('Kode pasien tidak ditemukan.')
      setLoading(false)
      return
    }

    const normalize = (n) => n?.replace(/\D/g, '').replace(/^0/, '62').replace(/^62/, '62')
    if (normalize(phone) !== normalize(data.phone)) {
      setError('Kode pasien atau nomor telepon tidak sesuai.')
      setLoading(false)
      return
    }

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
    <>
      <style>{CSS}</style>
      <div className="pl-root">
        <BgPattern />
        <div className="pl-wrap">

          {/* Brand */}
          <div className="pl-brand">
            <img className="pl-logo" src="/images/logo1.png" alt="logo" />
            <div className="pl-brand-name">Klinik Bekam Sehat</div>
            <div className="pl-brand-sub">dr. Abdurrahman · Medan</div>
          </div>

          {/* Card */}
          <div className="pl-card">
            <div className="pl-card-header">
              <div className="pl-card-title">Portal Pasien</div>
              <div className="pl-card-desc">Akses riwayat kunjungan dan catatan kesehatan Anda</div>
            </div>
            <div className="pl-card-body">
              <form onSubmit={handleLogin}>
                <div className="pl-field">
                  <label className="pl-label">KODE PASIEN</label>
                  <input
                    className="pl-input"
                    placeholder="Contoh: P0001"
                    value={form.patient_code}
                    onChange={e => setForm({ ...form, patient_code: e.target.value })}
                    required
                  />
                </div>
                <div className="pl-field">
                  <label className="pl-label">NOMOR TELEPON</label>
                  <input
                    className="pl-input"
                    placeholder="08xxxxxxxxxx"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                {error && <div className="pl-error">⚠ {error}</div>}
                <button type="submit" className="pl-submit" disabled={loading}>
                  {loading ? 'Memuat...' : 'Masuk ke Portal →'}
                </button>
              </form>
              <div className="pl-divider">
                <div className="pl-divider-line"></div>
                <div className="pl-divider-text">✦</div>
                <div className="pl-divider-line"></div>
              </div>
              <p className="pl-hint">
                Kode pasien tertera pada kwitansi kunjungan Anda.<br/>
              </p>
            </div>
          </div>

          <button className="pl-back" onClick={() => navigate('/')}>
            ← Kembali ke Beranda
          </button>
        </div>
      </div>
    </>
  )
}