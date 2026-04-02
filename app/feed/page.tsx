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
}

const CATEGORIES = [
  { id: '',       label: 'Все' },
  { id: 'ai',     label: 'AI' },
  { id: 'health', label: 'Здоровье' },
  { id: 'food',   label: 'Питание' },
  { id: 'sport',  label: 'Спорт' },
  { id: 'mental', label: 'Ментальное' },
];

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function FeedPage() {
  const { user, loading, logout, getToken } = useAuth();
  const router = useRouter();

  const [posts, setPosts]       = useState<Post[]>([]);
  const [fetching, setFetching] = useState(false);
  const [category, setCategory] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Защита роута
  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  // Загрузка постов
  useEffect(() => {
    if (!loading && user) fetchPosts();
  }, [category, loading, user]);

  async function fetchPosts() {
    setFetching(true);
    try {
      const url = category ? `${API}/posts?category=${category}` : `${API}/posts`;
      const res  = await fetch(url);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setPosts([]);
    } finally {
      setFetching(false);
    }
  }

  async function handleLike(postId: string) {
    const token  = getToken();
    const userId = user?.id || 'anonymous';
    try {
      const res = await fetch(`${API}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setPosts(prev =>
        prev.map(p => p.postid === postId ? { ...p, likes: data.likes } : p)
      );
      setLikedIds(prev => {
        const next = new Set(prev);
        data.isLiked ? next.add(postId) : next.delete(postId);
        return next;
      });
    } catch {
      // silent fail
    }
  }

  function handleLogout() {
    logout();
    router.push('/');
  }

  // Auth загружается
  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.center}><Spinner /></div>
      </div>
    );
  }

  // Не авторизован — редирект уже запущен в useEffect
  if (!user) return null;

  return (
    <div style={s.page}>
      {/* Шапка */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <Link href="/" style={{ ...s.logo, textDecoration: 'none' }}>
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="#01696f"/>
              <path d="M18 8C13 8 9 12 9 17c0 6 9 11 9 11s9-5 9-11c0-5-4-9-9-9z" fill="white" opacity=".9"/>
              <path d="M14 17h8M18 13v8" stroke="#01696f" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={s.logoText}>HealthBite</span>
          </Link>

          <div style={s.headerRight}>
            <Link href="/upload" style={s.addBtn}>+ Добавить</Link>
            <Link href="/profile" style={s.avatar}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" width={32} height={32} style={s.avatarImg}/>
                : <span style={s.avatarFallback}>{(user.name || user.phone).slice(0,1).toUpperCase()}</span>
              }
            </Link>
            <button style={s.logoutBtn} onClick={handleLogout}>Выйти</button>
          </div>
        </div>
      </header>

      {/* Категории */}
      <div style={s.catsBar}>
        <div style={s.catsInner}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              style={{ ...s.catBtn, ...(category === c.id ? s.catBtnActive : {}) }}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Лента */}
      <main style={s.feed}>
        {fetching ? (
          <div style={s.center}><Spinner /></div>
        ) : posts.length === 0 ? (
          <div style={s.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4d1ca" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <p style={{ color: '#7a7974', fontSize: '.9375rem' }}>Постов пока нет</p>
            <Link href="/upload" style={s.addBtn}>Добавить первый</Link>
          </div>
        ) : (
          <div style={s.grid}>
            {posts.map(post => (
              <PostCard
                key={post.postid}
                post={post}
                liked={likedIds.has(post.postid)}
                onLike={handleLike}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function PostCard({ post, liked, onLike }: {
  post:   Post;
  liked:  boolean;
  onLike: (id: string) => void;
}) {
  const [pressing, setPressing] = useState(false);

  function handleClick() {
    setPressing(true);
    onLike(post.postid);
    setTimeout(() => setPressing(false), 280);
  }

  const dateStr = (() => {
    try {
      return new Date(post.createdat).toLocaleDateString('ru-RU', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return post.createdat; }
  })();

  return (
    <article style={s.card}>
      {post.mediaurl && post.type === 'image' && (
        <Link href={`/post/${post.postid}`}>
          <img
            src={post.mediaurl}
            alt={post.title}
            style={s.cardImg}
            loading="lazy"
            width={600}
            height={340}
          />
        </Link>
      )}
      {post.mediaurl && post.type === 'video' && (
        <div style={s.videoWrap}>
          <iframe
            src={post.mediaurl}
            style={s.iframe}
            allowFullScreen
            title={post.title}
          />
        </div>
      )}
      <div style={s.cardBody}>
        <div style={s.cardMeta}>
          <span style={s.cardCat}>{post.categoryid}</span>
          <span style={s.cardDate}>{dateStr}</span>
        </div>
        <Link href={`/post/${post.postid}`} style={s.cardTitle}>
          {post.title}
        </Link>
        {post.description && (
          <p style={s.cardDesc}>{post.description}</p>
        )}
        <div style={s.cardFooter}>
          <span style={s.cardAuthor}>@{post.author}</span>
          <button
            style={{
              ...s.likeBtn,
              ...(liked ? s.likeBtnActive : {}),
              transform: pressing ? 'scale(1.22)' : 'scale(1)',
              transition: 'transform .2s ease, color .2s ease, border-color .2s ease',
            }}
            onClick={handleClick}
            aria-label="Лайк"
          >
            <svg
              width="15" height="15" viewBox="0 0 24 24"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2"
            >
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
    <svg
      width="32" height="32" viewBox="0 0 24 24"
      fill="none" stroke="#01696f" strokeWidth="2"
      style={{ animation: 'spin .7s linear infinite' }}
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="10" strokeOpacity=".2"/>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:           { minHeight: '100dvh', background: '#f7f6f2', fontFamily: 'system-ui,sans-serif' },
  header:         { background: '#fff', borderBottom: '1px solid #e8e6e1', position: 'sticky', top: 0, zIndex: 100 },
  headerInner:    { maxWidth: 960, margin: '0 auto', padding: '0 1rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo:           { display: 'flex', alignItems: 'center', gap: '.5rem' },
  logoText:       { fontWeight: 700, fontSize: '1.0625rem', color: '#01696f', letterSpacing: '-.02em' },
  headerRight:    { display: 'flex', alignItems: 'center', gap: '.75rem' },
  addBtn:         { background: '#01696f', color: '#fff', padding: '.375rem .875rem', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, textDecoration: 'none' },
  logoutBtn:      { fontSize: '.8125rem', color: '#bab9b4', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: '.25rem .5rem' },
  avatar:         { width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e6f0f0', textDecoration: 'none', flexShrink: 0 },
  avatarImg:      { width: 32, height: 32, objectFit: 'cover' },
  avatarFallback: { fontSize: '.875rem', fontWeight: 700, color: '#01696f' },
  catsBar:        { background: '#fff', borderBottom: '1px solid #e8e6e1', overflowX: 'auto' },
  catsInner:      { maxWidth: 960, margin: '0 auto', padding: '0 1rem', display: 'flex', gap: '.375rem', height: 48, alignItems: 'center' },
  catBtn:         { padding: '.25rem .875rem', borderRadius: 999, border: '1.5px solid #d4d1ca', background: 'none', fontSize: '.875rem', color: '#7a7974', cursor: 'pointer', whiteSpace: 'nowrap' as const, fontWeight: 500, transition: 'all .18s ease' },
  catBtnActive:   { background: '#01696f', borderColor: '#01696f', color: '#fff' },
  feed:           { maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem' },
  grid:           { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap: '1rem' },
  center:         { display: 'flex', justifyContent: 'center', padding: '4rem 0' },
  empty:          { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '5rem 0' },
  card:           { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column' },
  cardImg:        { width: '100%', height: 200, objectFit: 'cover', display: 'block' },
  videoWrap:      { position: 'relative', paddingBottom: '56.25%', height: 0 },
  iframe:         { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
  cardBody:       { padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.5rem', flex: 1 },
  cardMeta:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardCat:        { fontSize: '.75rem', fontWeight: 600, color: '#01696f', textTransform: 'uppercase' as const, letterSpacing: '.05em' },
  cardDate:       { fontSize: '.75rem', color: '#bab9b4' },
  cardTitle:      { fontSize: '1rem', fontWeight: 700, color: '#28251d', textDecoration: 'none', lineHeight: 1.3 },
  cardDesc:       { fontSize: '.875rem', color: '#7a7974', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' },
  cardFooter:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '.5rem' },
  cardAuthor:     { fontSize: '.8125rem', color: '#bab9b4' },
  likeBtn:        { display: 'flex', alignItems: 'center', gap: '.25rem', background: 'none', border: '1.5px solid #d4d1ca', borderRadius: 999, padding: '.25rem .625rem', cursor: 'pointer', fontSize: '.875rem', color: '#7a7974' },
  likeBtnActive:  { borderColor: '#e05c8a', color: '#e05c8a' },
};