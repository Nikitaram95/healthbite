'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface Post {
  postid:      string;
  title:       string;
  description: string;
  mediaurl:    string;
  type:        string;
  categoryid:  string;
  author:      string;
  createdat:   string;
  likes:       number;
  liked:       boolean; // ← добавь это поле в API-ответ
}

const CATEGORIES = [
  { id: '',       label: 'Все' },
  { id: 'ai',     label: 'AI' },
  { id: 'health', label: 'Здоровье' },
  { id: 'food',   label: 'Питание' },
  { id: 'sport',  label: 'Спорт' },
  { id: 'mental', label: 'Ментальное' },
];

const CAT_COLORS: Record<string, string> = {
  ai:     'rgba(0,162,255,.18)',
  health: 'rgba(16,185,129,.18)',
  food:   'rgba(255,179,71,.18)',
  sport:  'rgba(0,229,255,.18)',
  mental: 'rgba(239,68,68,.18)',
  '':     'rgba(255,255,255,.06)',
};

const CAT_TEXT: Record<string, string> = {
  ai:     '#6bc6ff',
  health: '#6ce9c1',
  food:   '#ffd08f',
  sport:  '#7beeff',
  mental: '#ff8e8e',
  '':     '#8aa3bf',
};

const API = process.env.NEXT_PUBLIC_API_URL || '';

// Надёжный парсер даты — работает с ISO строками, Unix seconds/ms и числовыми строками
function parseDate(val: string | number | undefined | null): Date | null {
  if (!val) return null;
  const n = Number(val);
  if (!isNaN(n) && n > 1_000_000_000) {
    return new Date(n < 1e12 ? n * 1000 : n);
  }
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(val: string | number | undefined | null): string {
  const d = parseDate(val);
  if (!d) return '';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FeedPage() {
  const { user, loading, logout, getToken } = useAuth();
  const router = useRouter();

  const [posts, setPosts]       = useState<Post[]>([]);
  const [fetching, setFetching] = useState(false);
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user) fetchPosts();
  }, [category, loading, user]);

  async function fetchPosts() {
    setFetching(true);
    try {
      const token  = getToken();
      const userId = user?.id || '';
      const url = category
        ? `${API}/posts?category=${category}&userId=${userId}`
        : `${API}/posts?userId=${userId}`;
      const res  = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      const list: Post[] = Array.isArray(data) ? data : [];
      // Сортируем по дате — новые сверху
      list.sort((a, b) => {
        const da = parseDate(a.createdat)?.getTime() ?? 0;
        const db = parseDate(b.createdat)?.getTime() ?? 0;
        return db - da;
      });
      setPosts(list);
    } catch {
      setPosts([]);
    } finally {
      setFetching(false);
    }
  }

  async function handleLike(postId: string) {
    const token  = getToken();
    const userId = user?.id || '';
    if (!userId) return;

    const post    = posts.find(p => p.postid === postId);
    const isLiked = post?.liked ?? false;
    const action  = isLiked ? 'unlikepost' : 'likepost';

    // Оптимистичный апдейт
    setPosts(prev => prev.map(p =>
      p.postid === postId
        ? { ...p, liked: !isLiked, likes: isLiked ? p.likes - 1 : p.likes + 1 }
        : p
    ));

    try {
      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action, postId, userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setPosts(prev => prev.map(p =>
          p.postid === postId
            ? { ...p, liked: data.liked ?? !isLiked, likes: data.likes ?? p.likes }
            : p
        ));
      } else {
        // Откат при ошибке
        setPosts(prev => prev.map(p =>
          p.postid === postId
            ? { ...p, liked: isLiked, likes: post?.likes ?? p.likes }
            : p
        ));
      }
    } catch {
      setPosts(prev => prev.map(p =>
        p.postid === postId
          ? { ...p, liked: isLiked, likes: post?.likes ?? p.likes }
          : p
      ));
    }
  }

  if (loading) return (
    <div style={s.page}><div style={s.center}><Spinner /></div></div>
  );
  if (!user) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800&family=Exo+2:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes likepop { 0% { transform: scale(1) } 40% { transform: scale(1.35) } 100% { transform: scale(1) } }
        .like-pop { animation: likepop .28s ease; }
        * { box-sizing: border-box; }
        body { background: #0d1623; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,162,255,.3); border-radius: 4px; }
      `}</style>

      <div style={s.page}>
        <div style={s.gridBg} />

        {/* Шапка */}
        <header style={s.header}>
          <div style={s.headerInner}>
            <Link href="/" style={s.logo}>
              <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="url(#lg1)"/>
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
            </Link>

            <div style={s.headerRight}>
              <Link href="/upload" style={s.addBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Добавить
              </Link>
              <Link href="/profile" style={s.avatarWrap}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" width={32} height={32} style={s.avatarImg}/>
                  : <span style={s.avatarFb}>{(user.name || user.phone || '?').slice(0,1).toUpperCase()}</span>
                }
              </Link>
              <button style={s.logoutBtn} onClick={() => { logout(); router.push('/'); }}>Выйти</button>
            </div>
          </div>
        </header>

        {/* Категории */}
        <div style={s.catsWrap}>
          <div style={s.catsInner}>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                style={{
                  ...s.catChip,
                  ...(category === c.id ? {
                    background: 'rgba(0,162,255,.14)',
                    borderColor: 'rgba(0,162,255,.4)',
                    color: '#fff',
                    boxShadow: '0 0 14px rgba(0,162,255,.15) inset',
                  } : {}),
                }}
                onClick={() => setCategory(c.id)}
              >{c.label}</button>
            ))}
          </div>
        </div>

        {/* Лента */}
        <main style={s.main}>
          {fetching ? (
            <div style={s.center}><Spinner /></div>
          ) : posts.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00a2ff" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <p style={{ color: '#8aa3bf', fontSize: '.9375rem' }}>Постов пока нет</p>
              <Link href="/upload" style={s.addBtn}>Добавить первый</Link>
            </div>
          ) : (
            <div style={s.grid}>
              {posts.map(post => (
                <PostCard key={post.postid} post={post} onLike={handleLike} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const [popping, setPopping] = useState(false);

  function handleLike() {
    setPopping(true);
    onLike(post.postid);
    setTimeout(() => setPopping(false), 300);
  }

  const catColor = CAT_COLORS[post.categoryid] || CAT_COLORS[''];
  const catText  = CAT_TEXT[post.categoryid]   || CAT_TEXT[''];

  return (
    <article style={s.card}>
      {post.mediaurl && post.type === 'image' && (
        <Link href={`/post/${post.postid}`} style={{ display: 'block' }}>
          <div style={s.mediaWrap}>
            <img src={post.mediaurl} alt={post.title} style={s.cardImg} loading="lazy" width={600} height={340}/>
            <div style={s.mediaOverlay} />
          </div>
        </Link>
      )}
      {post.mediaurl && post.type === 'video' && (
        <div style={s.videoWrap}>
          <video src={post.mediaurl} style={s.videoEl} controls muted playsInline preload="metadata"/>
          <div style={s.mediaOverlay} />
        </div>
      )}

      <div style={s.cardBody}>
        <div style={s.cardTop}>
          <span style={{ ...s.catBadge, background: catColor, color: catText }}>
            {post.categoryid || 'общее'}
          </span>
          {formatDate(post.createdat) && (
            <span style={s.cardDate}>{formatDate(post.createdat)}</span>
          )}
        </div>

        <Link href={`/post/${post.postid}`} style={s.cardTitle}>{post.title}</Link>

        {post.description && <p style={s.cardDesc}>{post.description}</p>}

        <div style={s.cardFooter}>
          <div style={s.authorRow}>
            <div style={s.authorDot} />
            <span style={s.authorName}>@{post.author}</span>
          </div>
          <button
            className={popping ? 'like-pop' : ''}
            style={{ ...s.likeBtn, ...(post.liked ? s.likeBtnActive : {}) }}
            onClick={handleLike}
            aria-label="Лайк"
          >
            <svg width="14" height="14" viewBox="0 0 24 24"
              fill={post.liked ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>{post.likes}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function Spinner() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00a2ff" strokeWidth="2"
      style={{ animation: 'spin .7s linear infinite' }}>
      <circle cx="12" cy="12" r="10" strokeOpacity=".15"/>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: 'radial-gradient(circle at 20% 0, rgba(0,162,255,.1) 0, transparent 35%), radial-gradient(circle at 80% 20%, rgba(0,229,255,.07) 0, transparent 30%), linear-gradient(180deg, #0a1220 0%, #0d1623 35%, #09111a 100%)',
    fontFamily: '"Exo 2", system-ui, sans-serif',
    color: '#f4f8ff',
    position: 'relative',
  },
  gridBg: {
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
    backgroundImage: 'linear-gradient(rgba(0,162,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,162,255,.035) 1px, transparent 1px)',
    backgroundSize: '56px 56px',
    maskImage: 'linear-gradient(180deg, transparent, black 15%, black 80%, transparent)',
  },
  header: {
    background: 'rgba(9,17,29,.78)', backdropFilter: 'blur(18px)',
    borderBottom: '1px solid rgba(0,162,255,.12)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  headerInner: {
    maxWidth: 1100, margin: '0 auto', padding: '0 1.25rem',
    height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo:      { display: 'flex', alignItems: 'center', gap: '.625rem', textDecoration: 'none' },
  logoText:  { fontFamily: 'Orbitron, sans-serif', fontWeight: 800, fontSize: '1.125rem', background: 'linear-gradient(90deg, #00a2ff, #fff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '.75rem' },
  addBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '.375rem',
    padding: '.5rem 1.125rem', borderRadius: 12,
    border: '1px solid rgba(0,162,255,.35)',
    background: 'linear-gradient(180deg, rgba(0,162,255,.2), rgba(0,162,255,.1))',
    color: '#fff', fontWeight: 700, fontSize: '.875rem', textDecoration: 'none',
    boxShadow: '0 0 14px rgba(0,162,255,.2)', fontFamily: 'inherit', cursor: 'pointer',
  },
  avatarWrap: {
    width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,162,255,.12)', border: '1px solid rgba(0,162,255,.3)',
    textDecoration: 'none', flexShrink: 0,
  },
  avatarImg:  { width: 36, height: 36, objectFit: 'cover' as const },
  avatarFb:   { fontSize: '.875rem', fontWeight: 700, color: '#00e5ff' },
  logoutBtn:  { fontSize: '.8125rem', color: '#8aa3bf', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: '.25rem .5rem', fontFamily: 'inherit' },
  catsWrap: {
    background: 'rgba(9,17,29,.6)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,.06)',
    position: 'sticky', top: 68, zIndex: 90, overflowX: 'auto',
  },
  catsInner: {
    maxWidth: 1100, margin: '0 auto', padding: '0 1.25rem',
    display: 'flex', gap: '.5rem', height: 52, alignItems: 'center',
  },
  catChip: {
    padding: '.3rem .875rem', borderRadius: 999,
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    fontSize: '.8125rem', color: '#8aa3bf', cursor: 'pointer',
    whiteSpace: 'nowrap' as const, fontWeight: 600, fontFamily: 'inherit',
    transition: 'all .18s ease',
  },
  main: { maxWidth: 1100, margin: '0 auto', padding: '2rem 1.25rem 5rem', position: 'relative', zIndex: 1 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '1.125rem' },
  center:    { display: 'flex', justifyContent: 'center', padding: '5rem 0' },
  empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '6rem 0' },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, background: 'rgba(0,162,255,.08)', border: '1px solid rgba(0,162,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '.5rem' },
  card: {
    background: 'linear-gradient(180deg, rgba(16,33,59,.97), rgba(13,24,43,.99))',
    border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden',
    display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,.35)',
    transition: 'border-color .2s ease, box-shadow .2s ease',
  },
  mediaWrap:    { position: 'relative', overflow: 'hidden' },
  cardImg:      { width: '100%', height: 200, objectFit: 'cover' as const, display: 'block' },
  videoWrap:    { position: 'relative' },
  videoEl:      { width: '100%', maxHeight: 220, display: 'block', background: '#000' },
  mediaOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(transparent, rgba(9,17,29,.85))', pointerEvents: 'none' },
  cardBody:     { padding: '1rem 1.125rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '.625rem', flex: 1 },
  cardTop:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  catBadge:     { display: 'inline-block', padding: '.2rem .625rem', borderRadius: 999, fontSize: '.6875rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const },
  cardDate:     { fontSize: '.75rem', color: '#8aa3bf' },
  cardTitle:    { fontFamily: 'Orbitron, sans-serif', fontSize: '.9375rem', fontWeight: 700, color: '#dceaff', textDecoration: 'none', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' },
  cardDesc:     { fontSize: '.8125rem', color: '#8aa3bf', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' },
  cardFooter:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '.75rem', borderTop: '1px solid rgba(255,255,255,.06)' },
  authorRow:    { display: 'flex', alignItems: 'center', gap: '.375rem' },
  authorDot:    { width: 6, height: 6, borderRadius: '50%', background: '#00a2ff', boxShadow: '0 0 6px #00a2ff' },
  authorName:   { fontSize: '.8125rem', color: '#8aa3bf' },
  likeBtn: {
    display: 'flex', alignItems: 'center', gap: '.3rem',
    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 999, padding: '.3rem .7rem', cursor: 'pointer',
    fontSize: '.8125rem', color: '#8aa3bf', fontFamily: 'inherit', transition: 'all .18s ease',
  },
  likeBtnActive: {
    borderColor: 'rgba(239,68,68,.4)', color: '#ff8e8e',
    background: 'rgba(239,68,68,.1)', boxShadow: '0 0 10px rgba(239,68,68,.2)',
  },
};