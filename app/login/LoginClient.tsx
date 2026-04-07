'use client';

import { useState } from 'react';

type Step = 'phone' | 'code';

const API = process.env.NEXT_PUBLIC_API_URL || '';

// ─── Форматирование телефона ──────────────────────────────────────────────────

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  let result = '+7';
  if (digits.length > 1) result += ' (' + digits.slice(1, 4);
  if (digits.length > 4) result += ') ' + digits.slice(4, 7);
  if (digits.length > 7) result += '-' + digits.slice(7, 9);
  if (digits.length > 9) result += '-' + digits.slice(9, 11);
  return result;
}

function rawPhone(formatted: string): string {
  const digits = formatted.replace(/\D/g, '');
  return '+7' + digits.slice(1);
}

// ─── Спиннер ─────────────────────────────────────────────────────────────────

function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin .7s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" strokeOpacity=".25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

// ─── Иконки ───────────────────────────────────────────────────────────────────

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}

// ─── Основной компонент ───────────────────────────────────────────────────────

export default function LoginClient() {
  const [step,    setStep]    = useState<Step>('phone');
  const [phone,   setPhone]   = useState('');
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const normalized = rawPhone(phone);
    if (normalized.length < 12) { setError('Введите полный номер телефона'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка отправки');
      setStep('code');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (code.length !== 4) { setError('Введите 4-значный код'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone(phone), code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Неверный код');
      document.cookie = `auth-token=${encodeURIComponent(data.token)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      window.location.href = '/feed';
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{globalStyles}</style>

      <main style={s.page}>
        <div style={s.gridBg} />

        <div style={s.card}>
          {/* Логотип */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-label="HealthBite">
              <rect width="36" height="36" rx="10" fill="url(#lg1)" />
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#00a2ff"/>
                  <stop offset="100%" stopColor="#00e5ff"/>
                </linearGradient>
              </defs>
              <path d="M18 8C13 8 9 12 9 17c0 6 9 11 9 11s9-5 9-11c0-5-4-9-9-9z" fill="#03111d" opacity=".9"/>
              <path d="M14 17h8M18 13v8" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={s.logoText}>HealthBite</span>
          </div>

          {step === 'phone' ? (
            <>
              <h1 style={s.title}>Вход</h1>
              <p style={s.subtitle}>Введите номер телефона — пришлём код</p>

              <form onSubmit={handleSendCode} noValidate>
                <div style={s.field}>
                  <label htmlFor="phone" style={s.label}>Номер телефона</label>
                  <div style={{ position: 'relative' }}>
                    <span style={s.inputIcon}><PhoneIcon /></span>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="+7 (999) 000-00-00"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      autoComplete="tel"
                      autoFocus
                      disabled={loading}
                      style={s.input}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(0,162,255,.5)')}
                      onBlur={(e)  => (e.target.style.borderColor = 'rgba(0,162,255,.18)')}
                    />
                  </div>
                </div>

                {error && <ErrorBox text={error} />}

                <button type="submit" disabled={loading} style={primaryBtn(loading)}>
                  {loading ? <Spinner /> : 'Получить код'}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                style={s.backBtn}
              >
                <ArrowLeftIcon /> Изменить номер
              </button>

              <h1 style={s.title}>Введите код</h1>
              <p style={s.subtitle}>
                Код отправлен на <strong style={{ color: '#dceaff' }}>{phone}</strong>
              </p>

              <form onSubmit={handleVerify} noValidate>
                <div style={s.field}>
                  <label htmlFor="code" style={s.label}>Код из SMS</label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="· · · ·"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    autoComplete="one-time-code"
                    autoFocus
                    disabled={loading}
                    style={{ ...s.input, textAlign: 'center', fontSize: 26, fontWeight: 700, letterSpacing: '0.5rem', height: 60, paddingLeft: 14 }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(0,162,255,.5)')}
                    onBlur={(e)  => (e.target.style.borderColor = 'rgba(0,162,255,.18)')}
                  />
                </div>

                <p style={{ fontSize: '.75rem', color: '#3a4f6a', marginBottom: 16, textAlign: 'center' }}>
                  Тестовый код: <strong style={{ color: '#8aa3bf' }}>1234</strong>
                </p>

                {error && <ErrorBox text={error} />}

                <button type="submit" disabled={loading || code.length !== 4} style={primaryBtn(loading || code.length !== 4)}>
                  {loading ? <Spinner /> : 'Войти'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </>
  );
}

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function ErrorBox({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: '.875rem',
      color: '#ff8e8e',
      background: 'rgba(239,68,68,.1)',
      border: '1px solid rgba(239,68,68,.2)',
      borderRadius: 10,
      padding: '10px 14px',
      marginBottom: 14,
      lineHeight: 1.4,
    }}>
      {text}
    </div>
  );
}

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    height: 48,
    background: disabled
      ? 'rgba(0,162,255,.1)'
      : 'linear-gradient(180deg, rgba(0,162,255,.28), rgba(0,162,255,.14))',
    color: disabled ? '#3a5a7a' : '#fff',
    fontSize: '.9375rem',
    fontWeight: 700,
    border: '1px solid rgba(0,162,255,.35)',
    borderRadius: 999,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all .18s ease',
    fontFamily: '"Exo 2", sans-serif',
    boxShadow: disabled ? 'none' : '0 0 16px rgba(0,162,255,.2)',
  };
}

// ─── Глобальные стили ─────────────────────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800&family=Exo+2:wght@400;500;600;700&display=swap');
  @keyframes spin { to { transform: rotate(360deg) } }
  * { box-sizing: border-box; }
  body { background: #0d1623; margin: 0; }
`;

// ─── Стили ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at 30% 20%, rgba(0,162,255,.12) 0, transparent 40%), radial-gradient(circle at 75% 75%, rgba(0,229,255,.07) 0, transparent 35%), linear-gradient(180deg, #0a1220 0%, #0d1623 50%, #09111a 100%)',
    padding: '16px',
    fontFamily: '"Exo 2", system-ui, sans-serif',
    position: 'relative',
  },
  gridBg: {
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
    backgroundImage: 'linear-gradient(rgba(0,162,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,162,255,.035) 1px, transparent 1px)',
    backgroundSize: '56px 56px',
    maskImage: 'linear-gradient(180deg, transparent, black 15%, black 85%, transparent)',
  },
  card: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 400,
    background: 'linear-gradient(180deg, rgba(16,33,59,.97), rgba(13,24,43,.99))',
    border: '1px solid rgba(0,162,255,.15)',
    borderRadius: 20,
    padding: '40px 32px 36px',
    boxShadow: '0 8px 40px rgba(0,0,0,.5), 0 0 0 1px rgba(0,162,255,.05) inset',
  },
  logoText: {
    fontFamily: 'Orbitron, sans-serif',
    fontWeight: 800,
    fontSize: '1.125rem',
    background: 'linear-gradient(90deg, #00a2ff, #fff)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
  title: {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: 'clamp(1.25rem, 3vw, 1.625rem)',
    fontWeight: 800,
    color: '#dceaff',
    lineHeight: 1.2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: '.9rem',
    color: '#8aa3bf',
    marginBottom: 28,
    lineHeight: 1.5,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 16,
  },
  label: {
    fontSize: '.875rem',
    fontWeight: 600,
    color: '#c8d8ee',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#8aa3bf',
    pointerEvents: 'none',
    display: 'flex',
  },
  input: {
    width: '100%',
    height: 48,
    padding: '0 14px 0 40px',
    borderRadius: 12,
    border: '1.5px solid rgba(0,162,255,.18)',
    fontSize: '.9375rem',
    color: '#dceaff',
    background: 'rgba(0,162,255,.05)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: '"Exo 2", sans-serif',
    transition: 'border-color 180ms ease',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#8aa3bf',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '.875rem',
    fontWeight: 500,
    marginBottom: 20,
    padding: 0,
    fontFamily: '"Exo 2", sans-serif',
  },
};