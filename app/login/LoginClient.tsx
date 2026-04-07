'use client';

import { useState } from 'react';
import { Phone, ArrowLeft } from 'lucide-react';

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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="10" strokeOpacity=".25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
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

  // ─── Отправить код ──────────────────────────────────────────────────────────

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

  // ─── Проверить код ──────────────────────────────────────────────────────────

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

  // ─── Рендер ─────────────────────────────────────────────────────────────────

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 32px 36px',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid oklch(from var(--color-text) l c h / 0.08)',
      }}>

        {/* Логотип */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-label="HealthBite">
            <rect width="36" height="36" rx="10" fill="var(--color-primary)" />
            <path d="M18 8C13 8 9 12 9 17c0 6 9 11 9 11s9-5 9-11c0-5-4-9-9-9z" fill="white" opacity=".9" />
            <path d="M14 17h8M18 13v8" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
            HealthBite
          </span>
        </div>

        {step === 'phone' ? (
          <>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 6 }}>
              Вход
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 28, lineHeight: 1.5 }}>
              Введите номер телефона — пришлём код
            </p>

            <form onSubmit={handleSendCode} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                <label htmlFor="phone" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>
                  Номер телефона
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                    <Phone size={16} />
                  </span>
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
                    style={{
                      width: '100%',
                      height: 48,
                      padding: '0 14px 0 40px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1.5px solid var(--color-border)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--color-text)',
                      background: 'var(--color-surface-offset)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      transition: 'border-color 180ms ease',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                    onBlur={(e)  => (e.target.style.borderColor = 'var(--color-border)')}
                  />
                </div>
              </div>

              {error && <ErrorBox text={error} />}

              <button
                type="submit"
                disabled={loading}
                style={primaryBtn(loading)}
              >
                {loading ? <Spinner /> : 'Получить код'}
              </button>
            </form>
          </>
        ) : (
          <>
            <button
              onClick={() => { setStep('phone'); setCode(''); setError(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', marginBottom: 20, padding: 0 }}
            >
              <ArrowLeft size={15} /> Изменить номер
            </button>

            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 6 }}>
              Введите код
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 28 }}>
              Код отправлен на <strong style={{ color: 'var(--color-text)' }}>{phone}</strong>
            </p>

            <form onSubmit={handleVerify} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                <label htmlFor="code" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>
                  Код из SMS
                </label>
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
                  style={{
                    width: '100%',
                    height: 56,
                    padding: '0 14px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1.5px solid var(--color-border)',
                    fontSize: 24,
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    background: 'var(--color-surface-offset)',
                    outline: 'none',
                    textAlign: 'center',
                    letterSpacing: '0.5rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    transition: 'border-color 180ms ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                  onBlur={(e)  => (e.target.style.borderColor = 'var(--color-border)')}
                />
              </div>

              {/* Подсказка: тестовый код */}
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginBottom: 16, textAlign: 'center' }}>
                Тестовый код: <strong style={{ color: 'var(--color-text-muted)' }}>1234</strong>
              </p>

              {error && <ErrorBox text={error} />}

              <button type="submit" disabled={loading || code.length !== 4} style={primaryBtn(loading || code.length !== 4)}>
                {loading ? <Spinner /> : 'Войти'}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme]) {
            --color-bg: #171614;
            --color-surface: #1c1b19;
            --color-surface-offset: #22211f;
            --color-surface-dynamic: #2d2c2a;
            --color-border: #393836;
            --color-text: #cdccca;
            --color-text-muted: #797876;
            --color-text-faint: #5a5957;
            --color-primary: #4f98a3;
            --color-primary-highlight: #313b3b;
          }
        }
      `}</style>
    </main>
  );
}

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function ErrorBox({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: 'var(--text-sm)',
      color: 'var(--color-error)',
      background: 'var(--color-error-highlight)',
      borderRadius: 'var(--radius-md)',
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
    background: 'var(--color-primary)',
    color: '#fff',
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    border: 'none',
    borderRadius: 'var(--radius-full)',
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: disabled ? 0.6 : 1,
    transition: 'opacity 180ms ease',
    fontFamily: 'inherit',
  };
}