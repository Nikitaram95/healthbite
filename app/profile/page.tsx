'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

const API = process.env.NEXT_PUBLIC_API_URL || '';

// ─── Утилиты ──────────────────────────────────────────────────────────────────

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function getDisplayName(name?: string, phone?: string): string {
  if (name && name.trim()) return name.trim();
  const p = String(phone || '').replace(/\D/g, '');
  if (p.length >= 4) return 'Пользователь ' + p.slice(-4);
  return 'Пользователь';
}

function saveCookie(token: string) {
  document.cookie = `auth-token=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

// ─── Аватар ───────────────────────────────────────────────────────────────────

function AuthorAvatar({ name, src, size = 80 }: { name: string; src?: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const letter = (name || '?').slice(0, 1).toUpperCase();

  if (src && !imgError) {
    return (
      <img
        src={src} alt={name} width={size} height={size}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'rgba(0,162,255,.15)', border: '2px solid rgba(0,162,255,.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#7ecfff', fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

// ─── Скелетон ─────────────────────────────────────────────────────────────────

function SkeletonProfile() {
  return (
    <div style={{ ...s.card, padding: '40px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div className="sk" style={{ width: 88, height: 88, borderRadius: '50%' }} />
      <div className="sk" style={{ width: 140, height: '1.25em', borderRadius: 6 }} />
      <div className="sk" style={{ width: 100, height: '0.875em', borderRadius: 6 }} />
      <div className="sk" style={{ width: 160, height: 42, borderRadius: 999, marginTop: 8 }} />
    </div>
  );
}

// ─── Иконки ───────────────────────────────────────────────────────────────────

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

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CameraIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, getToken } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null);

  const [editMode, setEditMode]       = useState(false);
  const [name, setName]               = useState('');
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState('');
  const [uploadingAv, setUploadingAv] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const [localUser, setLocalUser] = useState(user);

  useEffect(() => { setLocalUser(user); }, [user]);
  useEffect(() => { if (!loading && !user) router.push('/login'); }, [loading, user, router]);
  useEffect(() => { if (user) setName(user.name || ''); }, [user]);

  // ─── Сохранить имя ────────────────────────────────────────────────────────

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaveError('');
    setSaving(true);

    try {
      const token = getToken();
      const res = await fetch(`${API}/auth/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name:      name.trim(),
          avatar_url: localUser?.avatar_url ?? '',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения');

      if (data.token) saveCookie(data.token);
      setLocalUser(prev => prev ? { ...prev, name: name.trim() } : prev);
      setEditMode(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  }

  // ─── Загрузить аватар ────────────────────────────────────────────────────

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { setAvatarError('Максимум 5 МБ'); return; }

    setAvatarError('');
    setUploadingAv(true);

    try {
      const token = getToken();
      const b64 = await toBase64(file);

      const uploadRes = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'uploadimage', imageBase64: b64, imageName: file.name, imageMime: file.type }),
      });

      if (!uploadRes.ok) throw new Error('Ошибка загрузки фото');
      const { publicUrl } = await uploadRes.json();

      const profileRes = await fetch(`${API}/auth/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name:      localUser?.name ?? '',
          avatar_url: publicUrl,
        }),
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error('Ошибка обновления профиля');

      if (profileData.token) saveCookie(profileData.token);
      setLocalUser(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploadingAv(false);
      if (avatarRef.current) avatarRef.current.value = '';
    }
  }

  // ─── Скелетон ─────────────────────────────────────────────────────────────

  if (loading || !localUser) {
    return (
      <div style={s.page}>
        <style>{globalStyles}</style>
        <div style={s.gridBg} />
        <header style={s.header}>
          <div style={s.headerInner}>
            <div style={{ width: 34 }} />
            <span style={s.logo}>Профиль</span>
            <div style={{ width: 34 }} />
          </div>
        </header>
        <main style={s.main}><SkeletonProfile /></main>
      </div>
    );
  }

  const displayName = getDisplayName(localUser.name, localUser.phone);

  // ─── Рендер ───────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      <style>{globalStyles}</style>
      <div style={s.gridBg} />

      <header style={s.header}>
        <div style={s.headerInner}>
          <button onClick={() => router.push('/feed')} style={s.backBtn} aria-label="В ленту">
            <ArrowIcon />
          </button>
          <span style={s.logo}>Профиль</span>
          <button onClick={() => { logout(); router.push('/'); }} style={s.logoutBtn} aria-label="Выйти">
            <LogOutIcon /> Выйти
          </button>
        </div>
      </header>

      <main style={s.main}>
        <section style={{ ...s.card, padding: '40px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

          {/* Аватар */}
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden', width: 88, height: 88, boxShadow: '0 0 0 3px rgba(0,162,255,.25), 0 0 20px rgba(0,162,255,.15)' }}>
              <AuthorAvatar name={displayName} src={localUser.avatar_url} size={88} />
            </div>
            <button
              onClick={() => avatarRef.current?.click()}
              disabled={uploadingAv}
              aria-label="Сменить фото"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(180deg, rgba(0,162,255,.3), rgba(0,162,255,.15))',
                border: '2px solid rgba(0,162,255,.5)', color: '#7ecfff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: uploadingAv ? 'wait' : 'pointer',
                opacity: uploadingAv ? 0.7 : 1, transition: 'opacity 180ms ease',
                boxShadow: '0 0 10px rgba(0,162,255,.3)',
              }}
            >
              {uploadingAv ? <Spinner size={14} /> : <CameraIcon size={14} />}
            </button>
            <input ref={avatarRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>

          {avatarError && (
            <p style={{ fontSize: '.75rem', color: '#ff8e8e', margin: '-8px 0 0' }}>{avatarError}</p>
          )}

          {/* Имя */}
          {!editMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'clamp(1.1rem, 3vw, 1.375rem)', fontWeight: 800, color: '#dceaff', lineHeight: 1.2, textAlign: 'center' }}>
                {displayName}
              </h1>
              {localUser.phone && (
                <p style={{ fontSize: '.875rem', color: '#8aa3bf' }}>{localUser.phone}</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <button onClick={() => setEditMode(true)} style={s.editBtn}>
                  Редактировать имя
                </button>

                {localUser.isAdmin && (
                  <button onClick={() => router.push('/upload')} style={s.adminBtn}>
                    <ShieldIcon /> Админ-панель
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveName} style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <input
                type="text" placeholder="Ваше имя"
                value={name} onChange={e => setName(e.target.value)}
                maxLength={60} autoFocus
                style={{ width: '100%', height: 46, padding: '0 14px', borderRadius: 12, border: '1.5px solid rgba(0,162,255,.45)', fontSize: '.9375rem', color: '#dceaff', background: 'rgba(0,162,255,.06)', outline: 'none', textAlign: 'center', fontFamily: '"Exo 2", sans-serif' }}
              />
              {saveError && <p style={{ fontSize: '.75rem', color: '#ff8e8e' }}>{saveError}</p>}
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button type="button"
                  onClick={() => { setEditMode(false); setName(localUser.name || ''); setSaveError(''); }}
                  style={{ ...s.cancelBtn, flex: 1 }}>
                  <XIcon /> Отмена
                </button>
                <button type="submit" disabled={saving || !name.trim()}
                  style={{ ...s.btnPrimary, flex: 1, opacity: saving || !name.trim() ? 0.45 : 1, cursor: saving || !name.trim() ? 'default' : 'pointer' }}>
                  {saving ? <Spinner size={15} /> : <><CheckIcon /> Сохранить</>}
                </button>
              </div>
            </form>
          )}

          <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,.06)' }} />

          <Link href="/feed" style={{ fontSize: '.875rem', color: '#00a2ff', fontWeight: 600, textDecoration: 'none' }}>
            ← Вернуться в ленту
          </Link>
        </section>
      </main>
    </div>
  );
}

// ─── Глобальные стили ─────────────────────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800&family=Exo+2:wght@400;500;600;700&display=swap');
  @keyframes spin    { to { transform: rotate(360deg) } }
  @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
  * { box-sizing: border-box; }
  body { background: #0d1623; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,162,255,.3); border-radius: 4px; }
  .sk {
    background: linear-gradient(90deg, rgba(255,255,255,.05) 25%, rgba(255,255,255,.09) 50%, rgba(255,255,255,.05) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 6px;
  }
`;

// ─── Стили ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:        { minHeight: '100dvh', background: 'radial-gradient(circle at 20% 0, rgba(0,162,255,.1) 0, transparent 35%), radial-gradient(circle at 80% 20%, rgba(0,229,255,.07) 0, transparent 30%), linear-gradient(180deg, #0a1220 0%, #0d1623 35%, #09111a 100%)', fontFamily: '"Exo 2", system-ui, sans-serif', color: '#f4f8ff', position: 'relative' },
  gridBg:      { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(0,162,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,162,255,.035) 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'linear-gradient(180deg, transparent, black 15%, black 80%, transparent)' },
  header:      { background: 'rgba(9,17,29,.82)', backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(0,162,255,.1)', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: 520, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' },
  logo:        { fontFamily: 'Orbitron, sans-serif', fontWeight: 800, fontSize: '1rem', background: 'linear-gradient(90deg, #00a2ff, #fff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', position: 'absolute', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' },
  backBtn:     { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, background: 'rgba(0,162,255,.08)', border: '1px solid rgba(0,162,255,.2)', color: '#7ecfff', cursor: 'pointer' },
  logoutBtn:   { display: 'flex', alignItems: 'center', gap: 6, color: '#ff8e8e', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.8125rem', fontWeight: 600, fontFamily: '"Exo 2", sans-serif' },
  main:        { maxWidth: 520, margin: '0 auto', padding: '24px 16px 48px', position: 'relative', zIndex: 1 },
  card:        { background: 'linear-gradient(180deg, rgba(16,33,59,.97), rgba(13,24,43,.99))', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.35)' },
  editBtn:     { padding: '9px 22px', borderRadius: 999, border: '1px solid rgba(0,162,255,.25)', background: 'rgba(0,162,255,.06)', color: '#7ecfff', fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: '"Exo 2", sans-serif', transition: 'all .18s ease' },
  adminBtn:    { padding: '9px 22px', borderRadius: 999, border: '1px solid rgba(255,180,0,.35)', background: 'rgba(255,180,0,.08)', color: '#ffd166', fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: '"Exo 2", sans-serif', display: 'flex', alignItems: 'center', gap: 7, transition: 'all .18s ease' },
  cancelBtn:   { height: 42, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#8aa3bf', fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: '"Exo 2", sans-serif' },
  btnPrimary:  { height: 42, borderRadius: 999, border: '1px solid rgba(0,162,255,.35)', background: 'linear-gradient(180deg, rgba(0,162,255,.25), rgba(0,162,255,.12))', color: '#fff', fontSize: '.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: '"Exo 2", sans-serif', boxShadow: '0 0 14px rgba(0,162,255,.2)' },
};