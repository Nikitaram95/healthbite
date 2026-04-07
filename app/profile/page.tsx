'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, LogOut, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const API = process.env.NEXT_PUBLIC_API_URL || '';

// ─── Утилиты ──────────────────────────────────────────────────────────────────

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve((r.result as string).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function getDisplayName(name?: string, phone?: string): string {
  if (name && name.trim()) return name.trim();
  const p = String(phone || '').replace(/\D/g, '');
  if (p.length >= 5) return 'Пользователь ' + p.slice(-5);
  return 'Пользователь';
}

// ─── Аватар ───────────────────────────────────────────────────────────────────

function AuthorAvatar({ name, src, size = 80 }: { name: string; src?: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();
  const colors = ['#01696f','#437a22','#006494','#7a39bb','#d19900','#da7101','#a12c7b','#a13544'];
  const color = colors[(name.charCodeAt(0) ?? 0) % colors.length];

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>
      {initials || '?'}
    </div>
  );
}

// ─── Скелетон ─────────────────────────────────────────────────────────────────

function SkeletonProfile() {
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: '40px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, border: '1px solid oklch(from var(--color-text) l c h / 0.08)' }}>
      <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
      <div className="skeleton skeleton-text" style={{ width: 140, height: '1.25em' }} />
      <div className="skeleton skeleton-text" style={{ width: 100, height: '0.875em' }} />
      <div className="skeleton" style={{ width: 160, height: 40, borderRadius: 'var(--radius-full)', marginTop: 8 }} />
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, getToken } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null);

  const [editMode,    setEditMode]    = useState(false);
  const [name,        setName]        = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [uploadingAv, setUploadingAv] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) setName(user.name || '');
  }, [user]);

  // ─── Сохранить имя ──────────────────────────────────────────────────────────

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaveError('');
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/auth/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), avatar_url: user?.avatar_url || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения');
      setEditMode(false);
      window.location.reload();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  }

  // ─── Загрузить аватар ────────────────────────────────────────────────────────

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setAvatarError('Максимум 5 МБ'); return; }
    setAvatarError('');
    setUploadingAv(true);
    try {
      const token = getToken();

      // 1. Загрузить изображение в S3
      const b64 = await toBase64(file);
      const uploadRes = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action:      'uploadimage',
          imageBase64: b64,
          imageName:   file.name,
          imageMime:   file.type,
        }),
      });
      if (!uploadRes.ok) throw new Error('Ошибка загрузки фото');
      const { publicUrl } = await uploadRes.json();

      // 2. Сохранить ссылку в профиле
      const profileRes = await fetch(`${API}/auth/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: user?.name || '', avatar_url: publicUrl }),
      });
      if (!profileRes.ok) throw new Error('Ошибка обновления профиля');

      window.location.reload();
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploadingAv(false);
      // Сбросить input чтобы можно было загрузить тот же файл повторно
      if (avatarRef.current) avatarRef.current.value = '';
    }
  }

  // ─── Рендер: загрузка ───────────────────────────────────────────────────────

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
        <header style={headerStyle}><div style={headerInner}><div style={{ width: 34 }} /><span style={logoStyle}>HealthBite</span><div style={{ width: 34 }} /></div></header>
        <main style={mainStyle}><SkeletonProfile /></main>
        <SkeletonStyles />
      </div>
    );
  }

  const displayName = getDisplayName(user.name, user.phone);

  // ─── Рендер: профиль ────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>

      {/* Шапка */}
      <header style={headerStyle}>
        <div style={headerInner}>
          <button onClick={() => router.push('/feed')} style={backBtnStyle} aria-label="В ленту">
            <ArrowLeft size={18} />
          </button>
          <span style={logoStyle}>Профиль</span>
          <button
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 500 }}
            aria-label="Выйти"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </header>

      <main style={mainStyle}>
        <section
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            padding: '40px 24px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            border: '1px solid oklch(from var(--color-text) l c h / 0.08)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Аватар с кнопкой смены */}
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden', width: 88, height: 88 }}>
              <AuthorAvatar name={displayName} src={user.avatar_url} size={88} />
            </div>

            {/* Кнопка смены фото */}
            <button
              onClick={() => avatarRef.current?.click()}
              disabled={uploadingAv}
              aria-label="Сменить фото"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: '#fff',
                border: '2.5px solid var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploadingAv ? 'wait' : 'pointer',
                opacity: uploadingAv ? 0.7 : 1,
                transition: 'opacity 180ms ease',
              }}
            >
              {uploadingAv
                ? <Spinner size={14} />
                : <Camera size={14} />
              }
            </button>

            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          {avatarError && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', margin: '-8px 0 0' }}>
              {avatarError}
            </p>
          )}

          {/* Имя и телефон */}
          {!editMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {displayName}
              </h1>
              {user.phone && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  {user.phone}
                </p>
              )}
              <button
                onClick={() => setEditMode(true)}
                style={{
                  marginTop: 12,
                  padding: '9px 22px',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--color-border)',
                  background: 'none',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'border-color 180ms ease, color 180ms ease',
                }}
              >
                Редактировать имя
              </button>
            </div>
          ) : (
            /* Форма редактирования */
            <form onSubmit={handleSaveName} style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <input
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                autoFocus
                style={{
                  width: '100%',
                  height: 46,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--color-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-text)',
                  background: 'var(--color-surface-offset)',
                  outline: 'none',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                }}
              />
              {saveError && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>{saveError}</p>
              )}
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button
                  type="button"
                  onClick={() => { setEditMode(false); setName(user.name || ''); setSaveError(''); }}
                  style={{ flex: 1, height: 42, borderRadius: 'var(--radius-full)', border: '1.5px solid var(--color-border)', background: 'none', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <X size={15} /> Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  style={{ flex: 1, height: 42, borderRadius: 'var(--radius-full)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving || !name.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {saving ? <Spinner size={15} /> : <><Check size={15} /> Сохранить</>}
                </button>
              </div>
            </form>
          )}

          {/* Ссылка на ленту */}
          <Link
            href="/feed"
            style={{ marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Вернуться в ленту →
          </Link>
        </section>
      </main>

      <SkeletonStyles />
    </div>
  );
}

// ─── Хелперы ──────────────────────────────────────────────────────────────────

function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin .7s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="10" strokeOpacity=".25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

const headerStyle: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 50,
  background: 'oklch(from var(--color-bg) l c h / 0.92)',
  backdropFilter: 'blur(12px)',
  borderBottom: '1px solid oklch(from var(--color-text) l c h / 0.07)',
};

const headerInner: React.CSSProperties = {
  maxWidth: 480, margin: '0 auto', padding: '0 16px',
  height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};

const backBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)',
  padding: 6, borderRadius: 'var(--radius-md)', background: 'none', border: 'none', cursor: 'pointer',
};

const logoStyle: React.CSSProperties = {
  fontWeight: 800, color: 'var(--color-text)', fontSize: 'var(--text-base)', letterSpacing: '-0.02em',
};

const mainStyle: React.CSSProperties = {
  maxWidth: 480, margin: '0 auto', padding: '24px 16px 48px',
};

function SkeletonStyles() {
  return (
    <style>{`
      @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      .skeleton { background: linear-gradient(90deg, var(--color-surface-offset) 25%, var(--color-surface-dynamic) 50%, var(--color-surface-offset) 75%); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; border-radius: var(--radius-sm); }
      .skeleton-text { height: 1em; margin-bottom: 6px; }
    `}</style>
  );
}