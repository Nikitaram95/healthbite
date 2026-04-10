'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'phone' | 'code';

const API = process.env.NEXT_PUBLIC_API_URL || '';
const IS_DEV = process.env.NODE_ENV === 'development'; // ← подсказка только в dev

// ─── Утилиты ──────────────────────────────────────────────────────────────────

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  let r = '+7';
  if (digits.length > 1) r += ' (' + digits.slice(1, 4);
  if (digits.length > 4) r += ') ' + digits.slice(4, 7);
  if (digits.length > 7) r += '-' + digits.slice(7, 9);
  if (digits.length > 9) r += '-' + digits.slice(9, 11);
  return r;
}

function rawPhone(f: string): string {
  const digits = f.replace(/\D/g, '');
  return '+7' + digits.slice(1);
}

// ─── Атомы UI ─────────────────────────────────────────────────────────────────

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

function ErrorBox({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: '.875rem', color: '#ff8e8e',
      background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.22)',
      borderRadius: 10, padding: '10px 14px', marginBottom: 14, lineHeight: 1.45,
    }}>
      {text}
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2l7 4v6c0 4.418-3.134 8.57-7 10C8.134 20.57 5 16.418 5 12V6l7-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ─── Кнопка ───────────────────────────────────────────────────────────────────

function PrimaryButton({
  disabled, loading, children,
}: { disabled?: boolean; loading?: boolean; children: React.ReactNode }) {
  const dis = disabled || loading;
  return (
    <button type="submit" disabled={dis} style={{
      width: '100%', height: 48,
      background: dis
        ? 'rgba(0,162,255,.08)'
        : 'linear-gradient(180deg, rgba(0,162,255,.32), rgba(0,162,255,.16))',
      color: dis ? '#3a5a7a' : '#fff',
      fontSize: '.9375rem', fontWeight: 700,
      border: '1px solid rgba(0,162,255,.35)',
      borderRadius: 999, cursor: dis ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'all .18s ease',
      fontFamily: '"Exo 2", sans-serif',
      boxShadow: dis ? 'none' : '0 0 20px rgba(0,162,255,.22)',
    }}>
      {loading ? <Spinner /> : children}
    </button>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────

export default function LoginClient() {
  const router = useRouter();

  const [step,    setStep]    = useState<Step>('phone');
  const [phone,   setPhone]   = useState('');
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Шаг 1: отправка кода ──────────────────────────────────────────────────

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
      if (!res.ok) throw new Error(data.error || 'Ошибка отправки кода');
      setStep('code');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  }

  // ── Шаг 2: проверка кода ──────────────────────────────────────────────────

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

      // Сохраняем токен (30 дней)
      document.cookie = [
        `auth-token=${encodeURIComponent(data.token)}`,
        'path=/',
        `max-age=${60 * 60 * 24 * 30}`,
        'SameSite=Lax',
      ].join('; ');

      router.push('/feed'); // ← router вместо window.location
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setStep('phone');
    setCode('');
    setError('');
  }

  return (
    <>
      <style>{globalStyles}</style>
      <main style={s.page}>
        <div style={s.gridBg} />

        <div style={s.card}>
          {/* Логотип */}

<div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
  <img
    src="https://storage.yandexcloud.net/healtbite/images/Group%20352%20(1).png"
    alt="HealthBite"
    width={54}
    height={54}
    style={{ borderRadius: 10, display: 'block', objectFit: 'contain' }}
  />
</div>

          {step === 'phone' ? (
            <>
              <h1 style={s.title}>Войти</h1>
              <p style={s.subtitle}>Введите номер — пришлём SMS с кодом</p>

              <form onSubmit={handleSendCode} noValidate>
                <div style={s.field}>
                  <label htmlFor="phone" style={s.label}>Номер телефона</label>
                  <div style={{ position: 'relative' }}>
                    <span style={s.inputIcon}><PhoneIcon /></span>
                    <input
                      id="phone" type="tel" inputMode="numeric"
                      placeholder="+7 (999) 000-00-00"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      autoComplete="tel" autoFocus disabled={loading}
                      style={s.input}
                      onFocus={e => (e.target.style.borderColor = 'rgba(0,162,255,.55)')}
                      onBlur={e  => (e.target.style.borderColor = 'rgba(0,162,255,.18)')}
                    />
                  </div>
                </div>

                {error && <ErrorBox text={error} />}

                <PrimaryButton disabled={loading} loading={loading}>
                  Получить код
                </PrimaryButton>
              </form>
            </>
          ) : (
            <>
              <button onClick={goBack} style={s.backBtn}>
                <ArrowLeftIcon /> Изменить номер
              </button>

              <h1 style={s.title}>Введите код</h1>
              <p style={s.subtitle}>
                Код отправлен на{' '}
                <strong style={{ color: '#7ecfff' }}>{phone}</strong>
              </p>

              <form onSubmit={handleVerify} noValidate>
                <div style={s.field}>
                  <label htmlFor="code" style={s.label}>
                    <span style={s.labelIcon}><ShieldIcon /></span>
                    Код из SMS
                  </label>
                  <input
                    id="code" type="text" inputMode="numeric"
                    maxLength={4} placeholder="· · · ·"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    autoComplete="one-time-code" autoFocus disabled={loading}
                    style={{ ...s.input, paddingLeft: 14, textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: '0.55rem', height: 64 }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,162,255,.55)')}
                    onBlur={e  => (e.target.style.borderColor = 'rgba(0,162,255,.18)')}
                  />
                </div>

                {/* Индикатор заполнения */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i < code.length ? 'rgba(0,162,255,.9)' : 'rgba(0,162,255,.18)',
                      transition: 'background .15s ease',
                    }} />
                  ))}
                </div>

                {/* Подсказка только в dev-режиме */}
   {IS_DEV && (
  <p style={{ fontSize: '.75rem', color: '#3a5270', textAlign: 'center', marginBottom: 16 }}>
    Код отправлен (dev: смотри логи функции в Yandex Cloud)
  </p>
)}

                {error && <ErrorBox text={error} />}

                <PrimaryButton disabled={code.length !== 4} loading={loading}>
                  Войти
                </PrimaryButton>
              </form>
            </>
          )}
        </div>
      </main>
    </>
  );
}

// ─── Стили ────────────────────────────────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800&family=Exo+2:wght@400;500;600;700&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  * { box-sizing: border-box; }
  body { background: #0d1623; margin: 0; }
`;

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: ['radial-gradient(circle at 28% 18%, rgba(0,162,255,.13) 0, transparent 38%)', 'radial-gradient(circle at 75% 78%, rgba(0,229,255,.08) 0, transparent 35%)', 'linear-gradient(180deg, #0a1220 0%, #0d1623 50%, #09111a 100%)'].join(', '),
    padding: '16px', fontFamily: '"Exo 2", system-ui, sans-serif', position: 'relative',
  },
  gridBg: {
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
    backgroundImage: ['linear-gradient(rgba(0,162,255,.03) 1px, transparent 1px)', 'linear-gradient(90deg, rgba(0,162,255,.03) 1px, transparent 1px)'].join(', '),
    backgroundSize: '56px 56px',
    maskImage: 'linear-gradient(180deg, transparent, black 15%, black 85%, transparent)',
  },
  card: {
    position: 'relative', zIndex: 1, width: '100%', maxWidth: 400,
    background: 'linear-gradient(180deg, rgba(16,33,59,.98), rgba(12,22,40,.99))',
    border: '1px solid rgba(0,162,255,.14)', borderRadius: 22, padding: '40px 32px 36px',
    boxShadow: ['0 8px 48px rgba(0,0,0,.55)', '0 0 0 1px rgba(0,162,255,.05) inset', '0 1px 0 rgba(255,255,255,.04) inset'].join(', '),
  },
  logoText: { fontFamily: 'Orbitron, sans-serif', fontWeight: 800, fontSize: '1.125rem', background: 'linear-gradient(90deg, #00a2ff, #e0f4ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' },
  title:    { fontFamily: 'Orbitron, sans-serif', fontSize: 'clamp(1.25rem, 3vw, 1.625rem)', fontWeight: 800, color: '#dceaff', lineHeight: 1.2, marginBottom: 8, marginTop: 0 },
  subtitle: { fontSize: '.9rem', color: '#8aa3bf', marginBottom: 28, lineHeight: 1.55, marginTop: 0 },
  field:    { display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 },
  label:    { fontSize: '.875rem', fontWeight: 600, color: '#c8d8ee', display: 'flex', alignItems: 'center', gap: 6 },
  labelIcon:{ color: '#5090c0', display: 'flex' },
  inputIcon:{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6a90b0', pointerEvents: 'none', display: 'flex' },
  input:    { width: '100%', height: 50, padding: '0 14px 0 42px', borderRadius: 12, border: '1.5px solid rgba(0,162,255,.18)', fontSize: '.9375rem', color: '#dceaff', background: 'rgba(0,162,255,.04)', outline: 'none', boxSizing: 'border-box', fontFamily: '"Exo 2", sans-serif', transition: 'border-color 160ms ease' },
  backBtn:  { display: 'flex', alignItems: 'center', gap: 6, color: '#6a90b0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.875rem', fontWeight: 500, marginBottom: 20, padding: 0, fontFamily: '"Exo 2", sans-serif', transition: 'color .15s ease' },
};