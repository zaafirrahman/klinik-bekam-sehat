import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Lato:wght@300;400;700&display=swap');

  .al-root {
    min-height: 100vh;
    background: #1a2b1b;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 1.5rem; font-family: 'Lato', sans-serif; color: #F5EFE0;
    position: relative; overflow: hidden;
  }

  .al-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 60% 50% at 20% 20%, rgba(122,158,126,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 80% 80%, rgba(197,148,58,0.06) 0%, transparent 60%);
  }

  .al-wrap { width: 100%; max-width: 360px; position: relative; z-index: 1; }

  .al-brand { text-align: center; margin-bottom: 2rem; }
  .al-logo {
    width: 44px; height: 44px; border-radius: 50%;
    border: 1.5px solid rgba(197,148,58,0.4);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #C5943A;
    margin: 0 auto 0.8rem;
  }
  .al-brand-name { font-family: 'Playfair Display', serif; font-size: 0.95rem; font-weight: 700; color: #c8d8c9; }
  .al-brand-sub { font-size: 0.65rem; color: #5a7a5c; letter-spacing: 0.07em; margin-top: 0.2rem; text-transform: uppercase; }

  .al-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 1.75rem;
    backdrop-filter: blur(8px);
  }
  .al-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: #F5EFE0; margin-bottom: 0.2rem; }
  .al-desc { font-size: 0.75rem; color: #5a7a5c; margin-bottom: 1.5rem; }

  .al-field { margin-bottom: 1rem; }
  .al-label { display: block; font-size: 0.72rem; font-weight: 700; color: #7A9E7E; margin-bottom: 0.4rem; letter-spacing: 0.05em; }
  .al-input {
    width: 100%; box-sizing: border-box;
    padding: 0.65rem 0.9rem; font-size: 0.86rem;
    border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;
    background: rgba(255,255,255,0.06); color: #F5EFE0;
    font-family: 'Lato', sans-serif;
    transition: border-color 0.2s, background 0.2s;
    outline: none;
  }
  .al-input::placeholder { color: rgba(255,255,255,0.2); }
  .al-input:focus { border-color: rgba(122,158,126,0.6); background: rgba(255,255,255,0.09); }

  .al-error {
    background: rgba(185,28,28,0.15); border: 1px solid rgba(185,28,28,0.35);
    border-radius: 7px; padding: 0.55rem 0.75rem;
    font-size: 0.76rem; color: #fca5a5; margin-bottom: 1rem;
  }

  .al-submit {
    width: 100%; background: rgba(122,158,126,0.2); color: #a8c4aa;
    border: 1px solid rgba(122,158,126,0.35); border-radius: 8px; padding: 0.7rem;
    font-size: 0.86rem; font-weight: 700; cursor: pointer;
    letter-spacing: 0.03em; transition: all 0.2s;
    font-family: 'Lato', sans-serif; margin-top: 0.25rem;
  }
  .al-submit:hover:not(:disabled) { background: rgba(122,158,126,0.3); color: #F5EFE0; border-color: rgba(122,158,126,0.6); }
  .al-submit:disabled { opacity: 0.4; cursor: not-allowed; }

  .al-back {
    display: block; text-align: center; margin-top: 1.5rem;
    background: none; border: none; cursor: pointer;
    font-size: 0.78rem; color: #4a6a4b;
    font-family: 'Lato', sans-serif; transition: color 0.2s;
  }
  .al-back:hover { color: #7A9E7E; }

  .al-staff-badge {
    display: inline-flex; align-items: center; gap: 0.35rem;
    background: rgba(197,148,58,0.1); border: 1px solid rgba(197,148,58,0.25);
    color: #C5943A; border-radius: 999px;
    padding: 0.2rem 0.65rem; font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    margin-bottom: 0.75rem;
  }
`

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email atau password salah.')
    setLoading(false)
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="al-root">
        <div className="al-bg" />
        <div className="al-wrap">

          <div className="al-brand">
            <img className="al-logo" src="/images/logo1.png" alt="logo" />
            <div className="al-brand-name">Klinik Bekam Sehat</div>
            <div className="al-brand-sub">Sistem Manajemen Klinik</div>
          </div>

          <div className="al-card">
            <div className="al-staff-badge">🔐 Staff Access</div>
            <div className="al-title">Masuk</div>
            <div className="al-desc">Khusus untuk staf dan admin klinik</div>

            <form onSubmit={handleLogin}>
              <div className="al-field">
                <label className="al-label">EMAIL</label>
                <input
                  className="al-input"
                  type="email"
                  placeholder="admin@klinik.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="al-field">
                <label className="al-label">PASSWORD</label>
                <input
                  className="al-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <div className="al-error">⚠ {error}</div>}
              <button type="submit" className="al-submit" disabled={loading}>
                {loading ? 'Memuat...' : 'Masuk →'}
              </button>
            </form>
          </div>

          <button className="al-back" onClick={() => navigate('/')}>
            ← Kembali ke Beranda
          </button>
        </div>
      </div>
    </>
  )
}