// app/login/LoginClient.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Step = 'phone' | 'code';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/feed';

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL || '';

  function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    let result = '+7';
    if (digits.length > 1) result += ' (' + digits.slice(1, 4);
    if (digits.length > 4) result += ') ' + digits.slice(4, 7);
    if (digits.length > 7) result += '-' + digits.slice(7, 9);
    if (digits.length > 9) result += '-' + digits.slice(9, 11);
    return result;
  }

  function rawPhone(formatted: string) {
    const digits = formatted.replace(/\D/g, '');
    return '+7' + digits.slice(1);
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const normalized = rawPhone(phone);
    if (normalized.length < 12) {
      setError('Введите полный номер телефона');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка отправки');
      setStep('code');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (code.length !== 4) {
      setError('Введите 4-значный код');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone(phone), code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Неверный код');
      document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      router.push(from);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.root}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-label="HealthBite">
            <rect width="36" height="36" rx="10" fill="#01696f"/>
            <path d="M18 8C13 8 9 12 9 17c0 6 9 11 9 11s9-5 9-11c0-5-4-9-9-9z" fill="white" opacity=".9"/>
            <path d="M14 17h8M18 13v8" stroke="#01696f" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={styles.logoText}>HealthBite</span>
        </div>

        {step === 'phone' ? (
          <>
            <h1 style={styles.title}>Вход</h1>
            <p style={styles.subtitle}>Введите номер телефона — пришлём код</p>
            <form onSubmit={handleSendCode} noValidate>
              <div style={styles.field}>
                <label htmlFor="phone" style={styles.label}>Номер телефона</label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="+7 (999) 000-00-00"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  autoComplete="tel"
                  autoFocus
                  disabled={loading}
                  style={styles.input}
                />
              </div>
              {error && <p style={styles.error}>{error}</p>}
              <button type="submit" style={styles.btnPrimary} disabled={loading}>
                {loading ? <Spinner /> : 'Получить код'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Введите код</h1>
            <p style={styles.subtitle}>
              Код отправлен на <strong>{phone}</strong>
            </p>
            <form onSubmit={handleVerify} noValidate>
              <div style={styles.field}>
                <label htmlFor="code" style={styles.label}>Код из SMS</label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="· · · ·"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={loading}
                  style={{ ...styles.input, ...styles.codeInput }}
                />
              </div>
              {error && <p style={styles.error}>{error}</p>}
              <button type="submit" style={styles.btnPrimary} disabled={loading}>
                {loading ? <Spinner /> : 'Войти'}
              </button>
              <button
                type="button"
                style={styles.btnGhost}
                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                disabled={loading}
              >
                ← Изменить номер
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg
      width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin 0.7s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" strokeOpacity=".25"/>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f7f6f2',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: '#ffffff',
    borderRadius: 16,
    padding: '2.5rem 2rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    marginBottom: '2rem',
  },
  logoText: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#01696f',
    letterSpacing: '-0.02em',
  },
  title: {
    fontSize: 'clamp(1.5rem, 1.2rem + 1.25vw, 2rem)',
    fontWeight: 700,
    color: '#28251d',
    lineHeight: 1.15,
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '0.9375rem',
    color: '#7a7974',
    marginBottom: '1.75rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    marginBottom: '1.25rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#28251d',
  },
  input: {
    height: 48,
    padding: '0 0.875rem',
    border: '1.5px solid #d4d1ca',
    borderRadius: 8,
    fontSize: '1rem',
    color: '#28251d',
    background: '#fafaf8',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '0.5rem',
  },
  error: {
    fontSize: '0.875rem',
    color: '#a12c7b',
    marginBottom: '1rem',
    padding: '0.625rem 0.875rem',
    background: '#f9f2f6',
    borderRadius: 8,
  },
  btnPrimary: {
    width: '100%',
    height: 48,
    background: '#01696f',
    color: '#fff',
    fontSize: '0.9375rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.75rem',
    gap: '0.5rem',
  },
  btnGhost: {
    width: '100%',
    height: 40,
    background: 'none',
    border: 'none',
    color: '#7a7974',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
};