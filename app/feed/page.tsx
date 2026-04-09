'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface Post {
  postid:        string;
  author:        string;
  categoryid:    string;
  description:   string;
  mediaurl:      string;
  title:         string;
  type:          string;
  createdat:     string;
  likes:         number;
  liked:         boolean;
  commentsCount: number;
  views:         number; // 🔥 счётчик просмотров
}

// ─── Категории ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'all',       label: 'Все'         },
  { key: 'food',      label: 'Питание'     },
  { key: 'mental',    label: 'Ментальное'  },
  { key: 'sport',     label: 'Спорт'       },
  { key: 'health',    label: 'Здоровье'    },
  { key: 'lifestyle', label: 'Образ жизни' },
];

const CAT_COLORS: Record<string, string> = {
  food:      'rgba(255,179,71,.18)',
  mental:    'rgba(239,68,68,.18)',
  sport:     'rgba(0,229,255,.18)',
  health:    'rgba(16,185,129,.18)',
  lifestyle: 'rgba(122,57,187,.18)',
  '':        'rgba(255,255,255,.06)',
};

const CAT_TEXT: Record<string, string> = {
  food:      '#ffd08f',
  mental:    '#ff8e8e',
  sport:     '#7beeff',
  health:    '#6ce9c1',
  lifestyle: '#c79df5',
  '':        '#8aa3bf',
};

function getCatStyle(id: string) {
  return { bg: CAT_COLORS[id] ?? CAT_COLORS[''], text: CAT_TEXT[id] ?? CAT_TEXT[''] };
}

function getCategoryLabel(key: string) {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

// ─── Относительная дата ───────────────────────────────────────────────────────

function getRelativeTime(createdat: string): string {
  if (!createdat) return '';
  const ms = Number(createdat);
  if (!ms || isNaN(ms)) return '';
  const diff    = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1)  return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1)   return '1 д назад';
  if (days < 7)     return `${days} д назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5)    return `${weeks} нед назад`;
  const months = Math.floor(days / 30);
  if (months < 12)  return `${months} мес назад`;
  return `${Math.floor(months / 12)} г назад`;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

async function fetchPosts(category: string, userId: string): Promise<Post[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);
  if (userId) params.set('userId', userId);
  const url = `${API}/posts${params.toString() ? `?${params.toString()}` : ''}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status}`);
  return res.json();
}

async function toggleLike(
  postid: string,
  userId: string,
  isLiked: boolean,
): Promise<{ likes: number; liked: boolean }> {
  const res = await fetch(`${API}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: isLiked ? 'unlikepost' : 'likepost',
      postId: postid,
      userId,
    }),
  });
  if (!res.ok) throw new Error('Ошибка лайка');
  return res.json();
}

// 🔥 Отправить просмотр на бэкенд
async function sendView(postid: string): Promise<void> {
  try {
    await fetch(`${API}/post/${postid}/view`, { method: 'POST' });
  } catch {
    // тихо — не критично
  }
}

// ─── Аватар пользователя ─────────────────────────────────────────────────────

function UserAvatar({ user, size = 36 }: { user: any; size?: number }) {
  const letter    = (user.name || user.phone || '?').slice(0, 1).toUpperCase();
  const hasAvatar = user.avatar_url && user.avatar_url !== '';

  return (
    <div style={{ position: 'relative', width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
      {hasAvatar && (
        <img
          src={user.avatar_url}
          alt={user.name || user.phone}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            (e.currentTarget.nextSibling as HTMLElement)?.style.setProperty('display', 'flex');
          }}
        />
      )}
      <div style={{
        width: '100%', height: '100%',
        background: 'rgba(0,162,255,.15)', border: '1px solid rgba(0,162,255,.25)',
        display: hasAvatar ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#7ecfff', fontSize: size * 0.4, fontWeight: 700,
      }}>
        {letter}
      </div>
    </div>
  );
}

// ─── Скелетон ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={s.card}>
      <div style={{ aspectRatio: '16/9', width: '100%', background: 'rgba(255,255,255,.05)' }} />
      <div style={{ padding: '1rem 1.125rem' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.07)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: '0.85em', width: '40%', background: 'rgba(255,255,255,.07)', borderRadius: 4, marginBottom: 6 }} />
            <div style={{ height: '0.7em',  width: '25%', background: 'rgba(255,255,255,.05)', borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ height: '0.85em', width: '80%', background: 'rgba(255,255,255,.07)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: '0.75em', width: '100%', background: 'rgba(255,255,255,.05)', borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: '0.75em', width: '60%', background: 'rgba(255,255,255,.05)', borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ─── Карточка поста ───────────────────────────────────────────────────────────

interface PostCardProps {
  post:       Post;
  userId:     string;
  onLike:     (postid: string, liked: boolean) => void;
  onNavigate: (postid: string) => void;
  onComments: (postid: string) => void;
  onView:     (postid: string) => void; // 🔥
}

function PostCard({ post, userId, onLike, onNavigate, onComments, onView }: PostCardProps) {
  const [popping,  setPopping]  = useState(false);
  const [imgError, setImgError] = useState(false);
  const cardRef   = useRef<HTMLElement>(null);
  const viewedRef = useRef(false); // 🔥 не считать дважды

  const relTime  = getRelativeTime(post.createdat);
  const catLabel = getCategoryLabel(post.categoryid);
  const cat      = getCatStyle(post.categoryid);

  // 🔥 Intersection Observer — считаем просмотр когда 50% карточки видно
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          onView(post.postid);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [post.postid, onView]);

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    if (!userId) return;
    setPopping(true);
    onLike(post.postid, post.liked);
    setTimeout(() => setPopping(false), 300);
  }

  function handleComments(e: React.MouseEvent) {
    e.stopPropagation();
    onComments(post.postid);
  }

  return (
    <article ref={cardRef} style={{ ...s.card, cursor: 'pointer' }} onClick={() => onNavigate(post.postid)}>
      {post.mediaurl && !imgError && (
        <div style={s.mediaWrap}>
          {post.type === 'video' ? (
            <video
              src={post.mediaurl}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              muted playsInline controls
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={post.mediaurl}
              alt={post.title}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          <div style={s.mediaOverlay} />
        </div>
      )}

      <div style={s.cardBody}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={s.authorAvatar}>
            {(post.author || '?').slice(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.authorName}>@{post.author}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ ...s.catBadge, background: cat.bg, color: cat.text }}>{catLabel}</span>
              {relTime && (
                <>
                  <span style={{ color: '#3a4f6a', fontSize: 12 }}>·</span>
                  <span style={s.cardDate}>{relTime}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <p style={s.cardTitle}>{post.title}</p>
        {post.description && <p style={s.cardDesc}>{post.description}</p>}

        <div style={s.cardFooter}>
          {/* Лайк */}
          <button
            className={popping ? 'like-pop' : ''}
            style={{ ...s.likeBtn, ...(post.liked ? s.likeBtnActive : {}) }}
            onClick={handleLike}
            aria-label={post.liked ? 'Убрать лайк' : 'Поставить лайк'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{post.likes}</span>
          </button>

          {/* Комментарии */}
          <button onClick={handleComments} aria-label="Комментарии" style={s.commentBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {post.commentsCount > 0 ? post.commentsCount : ''}
            </span>
          </button>

          {/* 🔥 Просмотры */}
          <div style={s.viewsCount}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {post.views > 0 ? post.views : ''}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Главный экран ────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.phone ?? '';

  const [posts,          setPosts]          = useState<Post[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [likePending,    setLikePending]    = useState<Set<string>>(new Set());

  // 🔥 Set постов, которые уже были засчитаны в этой сессии
  const viewedPostsRef = useRef<Set<string>>(new Set());

  // ─── Загрузка ─────────────────────────────────────────────────────────────

  const loadPosts = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPosts(category, userId);
      data.sort((a, b) => (Number(b.createdat) || 0) - (Number(a.createdat) || 0));
      setPosts(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadPosts(activeCategory); }, [activeCategory, loadPosts]);

  // ─── Просмотр (Intersection Observer) ────────────────────────────────────

  const handleView = useCallback(async (postid: string) => {
    if (viewedPostsRef.current.has(postid)) return;
    viewedPostsRef.current.add(postid);

    // Оптимистично обновляем счётчик в UI
    setPosts((prev) =>
      prev.map((p) =>
        p.postid === postid ? { ...p, views: p.views + 1 } : p
      )
    );

    await sendView(postid);
  }, []);

  // ─── Лайк ─────────────────────────────────────────────────────────────────

  const handleLike = useCallback(async (postid: string, currentLiked: boolean) => {
    if (!userId) return;

    let locked = false;
    setLikePending((prev) => {
      if (prev.has(postid)) return prev;
      locked = true;
      const next = new Set(prev);
      next.add(postid);
      return next;
    });
    if (!locked) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.postid === postid
          ? { ...p, liked: !currentLiked, likes: currentLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );

    try {
      const result = await toggleLike(postid, userId, currentLiked);
      setPosts((prev) =>
        prev.map((p) =>
          p.postid === postid
            ? {
                ...p,
                likes: typeof result.likes === 'number' ? result.likes : p.likes,
                liked: typeof result.liked === 'boolean' ? result.liked : p.liked,
              }
            : p
        )
      );
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.postid === postid
            ? { ...p, liked: currentLiked, likes: currentLiked ? p.likes + 1 : p.likes - 1 }
            : p
        )
      );
    } finally {
      setLikePending((prev) => {
        const next = new Set(prev);
        next.delete(postid);
        return next;
      });
    }
  }, [userId]);

  // ─── Навигация ────────────────────────────────────────────────────────────

  function handleNavigate(postid: string) { router.push(`/post/${postid}`); }
  function handleComments(postid: string) { router.push(`/post/${postid}#comments`); }
  function handleProfile()               { if (user) router.push('/profile'); }

  // ─── Фильтрация ───────────────────────────────────────────────────────────

  const q = searchQuery.toLowerCase();
  const filteredPosts = searchQuery.trim()
    ? posts.filter((p) =>
        (p.title       || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.author      || '').toLowerCase().includes(q)
      )
    : posts;

  // ─── Рендер ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{globalStyles}</style>
      <div style={s.page}>
        <div style={s.gridBg} />

        <header style={s.header}>
          <div style={s.headerInner}>
            {user ? (
              <button onClick={handleProfile} style={s.profileBtn} aria-label="Профиль">
                <UserAvatar user={user} size={40} />
                <div style={s.profileInfo}>
                  <div style={s.profileName}>
                    {user.name || user.phone?.slice(-5) || 'Пользователь'}
                  </div>
                  <div style={s.profileStatus}>Мой профиль</div>
                </div>
              </button>
            ) : (
              <Link href="/login" style={s.loginLink}>Войти</Link>
            )}

            <div style={s.searchWrap}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8aa3bf" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Поиск по постам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={s.searchInput}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ color: '#8aa3bf', lineHeight: 1, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  aria-label="Очистить"
                >×</button>
              )}
            </div>
          </div>

          <div style={s.catsWrap}>
            <div style={s.catsInner}>
              {CATEGORIES.map(({ key, label }) => {
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveCategory(key)}
                    style={{ ...s.catChip, ...(isActive ? s.catChipActive : {}) }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <main style={s.main}>
          {loading && (
            <div style={s.grid}>
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && error && (
            <div style={s.center}>
              <p style={{ color: '#ff8e8e', marginBottom: 12 }}>{error}</p>
              <button onClick={() => loadPosts(activeCategory)} style={s.retryBtn}>
                Попробовать снова
              </button>
            </div>
          )}

          {!loading && !error && filteredPosts.length === 0 && (
            <div style={{ ...s.center, flexDirection: 'column', gap: '1rem' }}>
              <div style={s.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00a2ff" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9"  y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <p style={{ color: '#8aa3bf', fontSize: '.9375rem' }}>
                {searchQuery ? 'Ничего не найдено' : 'Постов пока нет'}
              </p>
            </div>
          )}

          {!loading && !error && filteredPosts.length > 0 && (
            <div style={s.grid}>
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.postid}
                  post={post}
                  userId={userId}
                  onLike={handleLike}
                  onNavigate={handleNavigate}
                  onComments={handleComments}
                  onView={handleView} // 🔥
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// ─── Глобальные стили ─────────────────────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800&family=Exo+2:wght@300;400;500;600;700&display=swap');
  @keyframes spin    { to { transform: rotate(360deg) } }
  @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
  @keyframes likepop { 0% { transform: scale(1) } 40% { transform: scale(1.35) } 100% { transform: scale(1) } }
  .like-pop { animation: likepop .28s ease; }
  * { box-sizing: border-box; }
  body { background: #0d1623; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,162,255,.3); border-radius: 4px; }
`;

// ─── Стили ────────────────────────────────────────────────────────────────────

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
    background: 'rgba(9,17,29,.82)', backdropFilter: 'blur(18px)',
    borderBottom: '1px solid rgba(0,162,255,.1)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  headerInner: {
    maxWidth: 700, margin: '0 auto', padding: '12px 16px 0',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  profileBtn: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '8px 0', width: '100%',
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: '.9375rem', fontWeight: 700, color: '#dceaff',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  profileStatus: { fontSize: '.75rem', color: '#8aa3bf', marginTop: 2 },
  loginLink: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 16px', background: 'rgba(0,162,255,.1)',
    border: '1px solid rgba(0,162,255,.25)',
    borderRadius: 12, color: '#7ecfff',
    textDecoration: 'none', fontWeight: 600, fontSize: '.875rem',
    cursor: 'pointer', transition: 'all .18s ease',
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(0,162,255,.12)',
    borderRadius: 999, padding: '8px 14px',
  },
  searchInput: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    fontSize: '.9rem', color: '#dceaff',
    fontFamily: '"Exo 2", sans-serif',
  },
  catsWrap: { overflowX: 'auto', scrollbarWidth: 'none' },
  catsInner: {
    maxWidth: 700, margin: '0 auto', padding: '0 16px',
    display: 'flex', gap: '.5rem', height: 48, alignItems: 'center',
  },
  catChip: {
    padding: '.3rem .875rem', borderRadius: 999,
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    fontSize: '.8125rem', color: '#8aa3bf', cursor: 'pointer',
    whiteSpace: 'nowrap', fontWeight: 600,
    fontFamily: '"Exo 2", sans-serif',
    transition: 'all .18s ease',
  },
  catChipActive: {
    background: 'rgba(0,162,255,.14)',
    borderColor: 'rgba(0,162,255,.4)',
    color: '#fff',
    boxShadow: '0 0 14px rgba(0,162,255,.15) inset',
  },
  main: {
    maxWidth: 700, margin: '0 auto',
    padding: '1.25rem 1rem 5rem',
    position: 'relative', zIndex: 1,
  },
  grid: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem 0' },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    background: 'rgba(0,162,255,.08)',
    border: '1px solid rgba(0,162,255,.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  retryBtn: {
    padding: '10px 20px', background: 'rgba(0,162,255,.15)',
    border: '1px solid rgba(0,162,255,.3)', color: '#7ecfff',
    borderRadius: 999, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer',
    fontFamily: '"Exo 2", sans-serif',
  },
  card: {
    background: 'linear-gradient(180deg, rgba(16,33,59,.97), rgba(13,24,43,.99))',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: 18, overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,.35)',
    transition: 'border-color .18s ease, box-shadow .18s ease',
  },
  mediaWrap: {
    position: 'relative', aspectRatio: '16/9',
    overflow: 'hidden', background: 'rgba(0,0,0,.3)',
  },
  mediaOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
    background: 'linear-gradient(transparent, rgba(9,17,29,.85))',
    pointerEvents: 'none',
  },
  cardBody: { padding: '1rem 1.125rem 1.125rem' },
  authorAvatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(0,162,255,.15)',
    border: '1px solid rgba(0,162,255,.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '.8125rem', fontWeight: 700, color: '#7ecfff', flexShrink: 0,
  },
  authorName: {
    fontSize: '.875rem', fontWeight: 600, color: '#dceaff',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  catBadge: {
    display: 'inline-block', padding: '.15rem .6rem',
    borderRadius: 999, fontSize: '.6875rem', fontWeight: 700,
    letterSpacing: '.04em', textTransform: 'uppercase' as const,
  },
  cardDate: { fontSize: '.75rem', color: '#8aa3bf' },
  cardTitle: {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '.9375rem', fontWeight: 700, color: '#dceaff',
    lineHeight: 1.35, marginBottom: 8, overflow: 'hidden',
    display: '-webkit-box' as unknown as React.CSSProperties['display'],
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
  },
  cardDesc: {
    fontSize: '.8125rem', color: '#8aa3bf',
    lineHeight: 1.6, marginBottom: 12, overflow: 'hidden',
    display: '-webkit-box' as unknown as React.CSSProperties['display'],
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
  },
  cardFooter: {
    display: 'flex', alignItems: 'center', gap: '.5rem',
    paddingTop: '.75rem',
    borderTop: '1px solid rgba(255,255,255,.06)',
  },
  likeBtn: {
    display: 'flex', alignItems: 'center', gap: '.3rem',
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 999, padding: '.3rem .7rem',
    cursor: 'pointer', fontSize: '.8125rem', color: '#8aa3bf',
    fontFamily: '"Exo 2", sans-serif',
    transition: 'all .18s ease',
  },
  likeBtnActive: {
    borderColor: 'rgba(239,68,68,.4)', color: '#ff8e8e',
    background: 'rgba(239,68,68,.1)', boxShadow: '0 0 10px rgba(239,68,68,.2)',
  },
  commentBtn: {
    display: 'flex', alignItems: 'center', gap: '.3rem',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '.8125rem', color: '#8aa3bf',
    fontFamily: '"Exo 2", sans-serif',
    padding: '.3rem .5rem',
    transition: 'color .18s ease',
  },
  // 🔥 Счётчик просмотров
  viewsCount: {
    display: 'flex', alignItems: 'center', gap: '.3rem',
    fontSize: '.8125rem', color: '#4a6a8a',
    marginLeft: 'auto', // прижимаем вправо
    padding: '.3rem .5rem',
    fontVariantNumeric: 'tabular-nums',
  },
};