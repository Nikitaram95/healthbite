'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface Post {
  postid:      string;
  title:       string;
  description: string;
  mediaurl:    string;
  type:        string;
  categoryid:  string;
  createdat:   string;
  likes:       number;
}

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, getToken } = useAuth();

  const [posts, setPosts]         = useState<Post[]>([]);
  const [loadingPosts, setLP]     = useState(true);
  const [editMode, setEditMode]   = useState(false);
  const [name, setName]           = useState('');
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploadingAvatar, setUA]  = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      fetchMyPosts();
    }
  }, [user]);

  async function fetchMyPosts() {
    setLP(true);
    try {
      const res  = await fetch(`${API}/posts`);
      const data = await res.json();
      const mine = (Array.isArray(data) ? data : []).filter(
        (p: Post & { author: string }) =>
          p.author === user?.name || p.author === user?.phone
      );
      setPosts(mine);
    } finally {
      setLP(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaveError('');
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), avatar_url: user?.avatar_url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения');
      setEditMode(false);
      // Перезагружаем страницу чтобы useAuth подтянул новое имя
      window.location.reload();
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Максимум 5 МБ'); return; }
    setUA(true);
    try {
      const b64 = await toBase64(file);
      const token = getToken();
      const res = await fetch(`${API}/auth/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageBase64: b64,
          imageName:   file.name,
          imageMime:   file.type,
        }),
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUA(false);
    }
  }

  if (loading || !user) {
    return (
      <div style={s.loadingPage}>
        <Spinner size={36} color="#01696f" />
      </div>
    );
  }

  const displayName = user.name || user.phone;
  const initials    = displayName.slice(0, 1).toUpperCase();

  return (
    <div style={s.page}>
      {/* Шапка */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <button style={s.back} onClick={() => router.push('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Лента
          </button>
          <h1 style={s.headerTitle}>Профиль</h1>
          <button style={s.logoutBtn} onClick={logout}>Выйти</button>
        </div>
      </header>

      <main style={s.main}>

        {/* Карточка профиля */}
        <section style={s.profileCard}>
          {/* Аватар */}
          <div style={s.avatarWrap}>
            <button
              style={s.avatarBtn}
              onClick={() => avatarRef.current?.click()}
              aria-label="Сменить аватар"
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Аватар" style={s.avatarImg} width={80} height={80}/>
              ) : (
                <div style={s.avatarFallback}>{initials}</div>
              )}
              {uploadingAvatar ? (
                <div style={s.avatarOverlay}><Spinner size={20} color="#fff"/></div>
              ) : (
                <div style={s.avatarOverlay}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              )}
            </button>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          {/* Имя / редактирование */}
          {!editMode ? (
            <div style={s.profileInfo}>
              <h2 style={s.profileName}>{displayName}</h2>
              <p style={s.profilePhone}>{user.phone}</p>
              <button style={s.editBtn} onClick={() => setEditMode(true)}>
                Редактировать имя
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} style={s.editForm}>
              <input
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={60}
                autoFocus
                style={s.editInput}
              />
              {saveError && <p style={s.saveError}>{saveError}</p>}
              <div style={s.editBtns}>
                <button
                  type="button"
                  style={s.cancelBtn}
                  onClick={() => { setEditMode(false); setName(user.name || ''); }}
                >
                  Отмена
                </button>
                <button type="submit" style={s.saveBtn} disabled={saving}>
                  {saving ? <Spinner size={16} color="#fff"/> : 'Сохранить'}
                </button>
              </div>
            </form>
          )}

          {/* Статистика */}
          <div style={s.stats}>
            <div style={s.statItem}>
              <span style={s.statValue}>{posts.length}</span>
              <span style={s.statLabel}>постов</span>
            </div>
            <div style={s.statDivider}/>
            <div style={s.statItem}>
              <span style={s.statValue}>
                {posts.reduce((sum, p) => sum + (p.likes || 0), 0)}
              </span>
              <span style={s.statLabel}>лайков</span>
            </div>
          </div>
        </section>

        {/* Мои посты */}
        <section style={s.postsSection}>
          <div style={s.postsSectionHeader}>
            <h2 style={s.postsTitle}>Мои посты</h2>
            <Link href="/upload" style={s.newPostBtn}>+ Новый</Link>
          </div>

          {loadingPosts ? (
            <div style={s.center}><Spinner size={28} color="#01696f"/></div>
          ) : posts.length === 0 ? (
            <div style={s.emptyPosts}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d4d1ca" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M8 12h8M12 8v8" strokeLinecap="round"/>
              </svg>
              <p>Вы ещё ничего не публиковали</p>
              <Link href="/upload" style={s.newPostBtn}>Создать первый пост</Link>
            </div>
          ) : (
            <div style={s.postsGrid}>
              {posts.map(post => (
                <Link key={post.postid} href={`/post/${post.postid}`} style={s.postCard}>
                  {post.mediaurl && post.type === 'image' ? (
                    <img
                      src={post.mediaurl}
                      alt={post.title}
                      style={s.postCardImg}
                      loading="lazy"
                      width={300}
                      height={180}
                    />
                  ) : (
                    <div style={s.postCardNoImg}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4d1ca" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                      </svg>
                    </div>
                  )}
                  <div style={s.postCardBody}>
                    <span style={s.postCardCat}>{post.categoryid}</span>
                    <p style={s.postCardTitle}>{post.title}</p>
                    <div style={s.postCardFooter}>
                      <span style={s.postCardDate}>{post.createdat}</span>
                      <span style={s.postCardLikes}>
                        ♥ {post.likes}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve((r.result as string).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function Spinner({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5"
      style={{ animation: 'spin .7s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="10" strokeOpacity=".25"/>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:              { minHeight: '100dvh', background: '#f7f6f2', fontFamily: 'system-ui,sans-serif' },
  loadingPage:       { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f2' },
  header:            { background: '#fff', borderBottom: '1px solid #e8e6e1', position: 'sticky', top: 0, zIndex: 100 },
  headerInner:       { maxWidth: 720, margin: '0 auto', padding: '0 1rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  back:              { display: 'flex', alignItems: 'center', gap: '.25rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.875rem', color: '#7a7974', width: 80 },
  headerTitle:       { fontSize: '1rem', fontWeight: 700, color: '#28251d' },
  logoutBtn:         { fontSize: '.875rem', color: '#a12c7b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, width: 80, textAlign: 'right' as const },
  main:              { maxWidth: 720, margin: '0 auto', padding: '1.25rem 1rem 4rem' },

  // Профиль
  profileCard:       { background: '#fff', borderRadius: 16, padding: '2rem 1.5rem 1.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  avatarWrap:        { position: 'relative' },
  avatarBtn:         { position: 'relative', width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: 'none', cursor: 'pointer', padding: 0, background: 'none' },
  avatarImg:         { width: 80, height: 80, objectFit: 'cover', display: 'block' },
  avatarFallback:    { width: 80, height: 80, borderRadius: '50%', background: '#e6f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#01696f' },
  avatarOverlay:     { position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .18s', borderRadius: '50%' },
  profileInfo:       { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.375rem' },
  profileName:       { fontSize: '1.25rem', fontWeight: 700, color: '#28251d' },
  profilePhone:      { fontSize: '.875rem', color: '#bab9b4' },
  editBtn:           { background: 'none', border: '1.5px solid #d4d1ca', borderRadius: 8, padding: '.375rem .875rem', fontSize: '.875rem', color: '#7a7974', cursor: 'pointer', fontWeight: 500, marginTop: '.25rem' },

  // Редактирование
  editForm:          { display: 'flex', flexDirection: 'column', gap: '.75rem', width: '100%', maxWidth: 320 },
  editInput:         { height: 44, padding: '0 .875rem', border: '1.5px solid #01696f', borderRadius: 8, fontSize: '1rem', color: '#28251d', outline: 'none', textAlign: 'center' as const },
  saveError:         { fontSize: '.8125rem', color: '#a12c7b' },
  editBtns:          { display: 'flex', gap: '.5rem' },
  cancelBtn:         { flex: 1, height: 40, background: 'none', border: '1.5px solid #d4d1ca', borderRadius: 8, fontSize: '.875rem', color: '#7a7974', cursor: 'pointer' },
  saveBtn:           { flex: 1, height: 40, background: '#01696f', border: 'none', borderRadius: 8, fontSize: '.875rem', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.375rem' },

  // Статистика
  stats:             { display: 'flex', alignItems: 'center', gap: '1.5rem', paddingTop: '.5rem', borderTop: '1px solid #f0f0ed', width: '100%', justifyContent: 'center' },
  statItem:          { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.125rem' },
  statValue:         { fontSize: '1.375rem', fontWeight: 800, color: '#28251d', fontVariantNumeric: 'tabular-nums' },
  statLabel:         { fontSize: '.75rem', color: '#bab9b4', fontWeight: 500 },
  statDivider:       { width: 1, height: 32, background: '#e8e6e1' },

  // Посты
  postsSection:      { background: '#fff', borderRadius: 16, padding: '1.25rem' },
  postsSectionHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  postsTitle:        { fontSize: '1.0625rem', fontWeight: 700, color: '#28251d' },
  newPostBtn:        { background: '#01696f', color: '#fff', padding: '.375rem .875rem', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, textDecoration: 'none' },
  center:            { display: 'flex', justifyContent: 'center', padding: '2.5rem 0' },
  emptyPosts:        { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem', padding: '2.5rem 0', color: '#bab9b4', fontSize: '.9375rem' },
  postsGrid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(260px,100%),1fr))', gap: '.875rem' },
  postCard:          { borderRadius: 12, overflow: 'hidden', border: '1px solid #e8e6e1', textDecoration: 'none', display: 'flex', flexDirection: 'column', background: '#fafaf8' },
  postCardImg:       { width: '100%', height: 160, objectFit: 'cover', display: 'block' },
  postCardNoImg:     { height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f0ec' },
  postCardBody:      { padding: '.75rem', display: 'flex', flexDirection: 'column', gap: '.375rem' },
  postCardCat:       { fontSize: '.6875rem', fontWeight: 600, color: '#01696f', textTransform: 'uppercase' as const, letterSpacing: '.05em' },
  postCardTitle:     { fontSize: '.9375rem', fontWeight: 600, color: '#28251d', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' },
  postCardFooter:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.25rem' },
  postCardDate:      { fontSize: '.75rem', color: '#bab9b4' },
  postCardLikes:     { fontSize: '.75rem', color: '#e05c8a', fontWeight: 600 },
};