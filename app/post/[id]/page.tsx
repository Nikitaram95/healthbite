'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface Post {
  postid: string;
  title: string;
  description: string;
  mediaurl?: string;
  type: string;
  categoryid: string;
  author: string;
  createdat: string;
  likes: number;
  liked: boolean;
}

interface Comment {
  commentid: string;
  postid: string;
  author: string;
  text: string;
  createdat: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://d5d5nab6rsitmnq0gb0o.i99u1wfk.apigw.yandexcloud.net';

const CATEGORIES: Record<string, string> = {
  food:      'Питание',
  mental:    'Ментальное',
  sport:     'Спорт',
  health:    'Здоровье',
  lifestyle: 'Образ жизни',
};

const CAT_COLORS: Record<string, string> = {
  food:      'rgba(255,179,71,.18)',
  mental:    'rgba(239,68,68,.18)',
  sport:     'rgba(0,229,255,.18)',
  health:    'rgba(16,185,129,.18)',
  lifestyle: 'rgba(122,57,187,.18)',
};
const CAT_TEXT: Record<string, string> = {
  food:      '#ffd08f',
  mental:    '#ff8e8e',
  sport:     '#7beeff',
  health:    '#6ce9c1',
  lifestyle: '#c79df5',
};

function getCategoryLabel(key: string) { return CATEGORIES[key] ?? key; }

function getRelativeTime(createdat: string): string {
  if (!createdat) return '';
  const ms = Number(createdat);
  if (!ms || isNaN(ms)) return '';
  const diff = Date.now() - ms;
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

// ─── Аватар ───────────────────────────────────────────────────────────────────

function AuthorAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const letter = (name || '?').slice(0, 1).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'rgba(0,162,255,.15)',
      border: '1px solid rgba(0,162,255,.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#7ecfff', fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }} aria-label={name}>
      {letter}
    </div>
  );
}

// ─── Скелетоны ────────────────────────────────────────────────────────────────

function SkeletonBlock({ w = '100%', h = '1em' }: { w?: string; h?: string }) {
  return <div className="sk" style={{ width: w, height: h, borderRadius: 6, marginBottom: 6 }} />;
}

function SkeletonPost() {
  return (
    <div style={s.card}>
      <div className="sk" style={{ aspectRatio: '16/9', width: '100%' }} />
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div className="sk" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonBlock w="35%" h="0.85em" />
            <SkeletonBlock w="20%" h="0.7em" />
          </div>
        </div>
        <SkeletonBlock w="75%" h="1.5em" />
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock w="55%" />
      </div>
    </div>
  );
}

function SkeletonComments() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 10 }}>
          <div className="sk" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonBlock w="30%" />
            <SkeletonBlock />
            <SkeletonBlock w="70%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Основной компонент ───────────────────────────────────────────────────────

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [post,            setPost]            = useState<Post | null>(null);
  const [loadingPost,     setLoadingPost]     = useState(true);
  const [likePending,     setLikePending]     = useState(false);
  const [comments,        setComments]        = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText,     setCommentText]     = useState('');
  const [sendingComment,  setSendingComment]  = useState(false);
  const [commentError,    setCommentError]    = useState('');
  const [imgError,        setImgError]        = useState(false);

const loadPost = useCallback(async () => {
  if (!id) return;

  setLoadingPost(true);

  try {
    const qs = user?.phone ? `?userId=${encodeURIComponent(user.phone)}` : '';
    const res = await fetch(`${API}/posts/${id}${qs}`);

    if (res.status === 404) {
      router.push('/feed');
      return;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`loadPost ${res.status}: ${text}`);
    }

    const data = await res.json();
    setPost(data);
  } catch (e) {
    console.error('loadPost:', e);
  } finally {
    setLoadingPost(false);
  }
}, [id, user?.phone, router]);

 
const loadComments = useCallback(async () => {
  if (!id) return;

  setLoadingComments(true);

  try {
    const res = await fetch(`${API}/posts/${id}/comments`);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`loadComments ${res.status}: ${text}`);
    }

    const data = await res.json();
    setComments(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('loadComments:', e);
    setComments([]);
  } finally {
    setLoadingComments(false);
  }
}, [id]);

  useEffect(() => { loadPost(); loadComments(); }, [loadPost, loadComments]);

  const handleLike = useCallback(async () => {
    if (!post || !user?.phone || likePending) return;
    const wasLiked = post.liked;
    setPost((p) => p ? { ...p, liked: !wasLiked, likes: wasLiked ? p.likes - 1 : p.likes + 1 } : p);
    setLikePending(true);
    try {
      const res  = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: wasLiked ? 'unlikepost' : 'likepost', postId: post.postid, userId: user.phone }),
      });
      const data = await res.json();
      setPost((p) => p ? { ...p, likes: data.likes, liked: data.liked } : p);
    } catch {
      setPost((p) => p ? { ...p, liked: wasLiked, likes: wasLiked ? p.likes + 1 : p.likes - 1 } : p);
    } finally {
      setLikePending(false);
    }
  }, [post, user?.phone, likePending]);

const handleComment = useCallback(async (e: React.FormEvent) => {
  e.preventDefault();

  if (!commentText.trim() || !id) return;

  setSendingComment(true);
  setCommentError('');

  try {
    const res = await fetch(`${API}/posts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: commentText.trim() }),
    });

    if (!res.ok) {
      const raw = await res.text();
      throw new Error(`sendComment ${res.status}: ${raw}`);
    }

    await res.json();
    setCommentText('');
    await loadComments();
  } catch (e: unknown) {
    setCommentError(e instanceof Error ? e.message : 'Ошибка');
  } finally {
    setSendingComment(false);
  }
}, [commentText, id, loadComments]);

  // ─── Загрузка ──────────────────────────────────────────────────────────────

  if (loadingPost) {
    return (
      <div style={s.page}>
        <style>{globalStyles}</style>
        <div style={s.gridBg} />
        <header style={s.header}>
          <div style={s.headerInner}>
            <button onClick={() => router.back()} style={s.backBtn} aria-label="Назад">
              <ArrowIcon />
            </button>
            <Link href="/feed" style={s.logo}>HealthBite</Link>
            <div style={{ width: 34 }} />
          </div>
        </header>
        <main style={s.main}><SkeletonPost /></main>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{globalStyles}</style>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#8aa3bf', marginBottom: 12 }}>Пост не найден</p>
          <button onClick={() => router.push('/feed')} style={s.btnPrimary}>В ленту</button>
        </div>
      </div>
    );
  }

  const relTime  = getRelativeTime(post.createdat);
  const catLabel = getCategoryLabel(post.categoryid);
  const catBg    = CAT_COLORS[post.categoryid] ?? 'rgba(255,255,255,.06)';
  const catTxt   = CAT_TEXT[post.categoryid]   ?? '#8aa3bf';

  // ─── Рендер ────────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      <style>{globalStyles}</style>
      <div style={s.gridBg} />

      {/* Шапка */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <button onClick={() => router.back()} style={s.backBtn} aria-label="Назад">
            <ArrowIcon />
          </button>
          <Link href="/feed" style={s.logo}>HealthBite</Link>
          <button style={s.iconBtn} aria-label="Опции"><DotsIcon /></button>
        </div>
      </header>

      <main style={s.main}>

        {/* Пост */}
        <article style={{ ...s.card, marginBottom: 16 }}>
          {post.mediaurl && !imgError && (
            post.type === 'video'
              ? <video src={post.mediaurl} controls playsInline style={{ width: '100%', display: 'block', maxHeight: 440, objectFit: 'cover', background: '#000' }} />
              : <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                  <Image src={post.mediaurl} alt={post.title} fill style={{ objectFit: 'cover' }}
                    onError={() => setImgError(true)} sizes="(max-width:720px) 100vw,680px" priority />
                  <div style={s.mediaOverlay} />
                </div>
          )}

          <div style={{ padding: '20px 16px 16px' }}>
            {/* Автор */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <AuthorAvatar name={post.author} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#dceaff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{post.author}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ ...s.catBadge, background: catBg, color: catTxt }}>{catLabel}</span>
                  {relTime && (
                    <>
                      <span style={{ color: '#3a4f6a', fontSize: 12 }}>·</span>
                      <span style={{ fontSize: '.75rem', color: '#8aa3bf' }}>{relTime}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'clamp(1.1rem, 3vw, 1.375rem)', fontWeight: 800, color: '#dceaff', lineHeight: 1.3, marginBottom: 12 }}>
              {post.title}
            </h1>

            {post.description && (
              <p style={{ fontSize: '.9rem', color: '#8aa3bf', lineHeight: 1.75, marginBottom: 16, whiteSpace: 'pre-wrap', maxWidth: 'none' }}>
                {post.description}
              </p>
            )}

            {/* Действия */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)' }}>
              <button
                onClick={handleLike}
                disabled={likePending || !user}
                aria-label={post.liked ? 'Убрать лайк' : 'Поставить лайк'}
                style={{
                  ...s.actionBtn,
                  ...(post.liked ? s.actionBtnLiked : {}),
                  opacity: likePending ? 0.6 : 1,
                  cursor: user ? 'pointer' : 'default',
                }}
              >
                <HeartIcon filled={post.liked} />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{post.likes}</span>
              </button>

              <div style={{ ...s.actionBtn, cursor: 'default' }}>
                <CommentIcon />
                <span>
                  {comments.length > 0
                    ? `${comments.length} ${comments.length === 1 ? 'комментарий' : 'комментариев'}`
                    : 'Комментарии'}
                </span>
              </div>
            </div>
          </div>
        </article>

        {/* Комментарии */}
        <section id="comments" style={{ ...s.card, padding: '20px 16px' }}>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '.9375rem', fontWeight: 700, color: '#dceaff', marginBottom: 18 }}>
            Комментарии
            {comments.length > 0 && (
              <span style={{ fontSize: '.8125rem', fontWeight: 400, color: '#8aa3bf', marginLeft: 8 }}>{comments.length}</span>
            )}
          </h2>

          {/* Форма */}
          {user ? (
            <form onSubmit={handleComment} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <AuthorAvatar name={user.name || user.phone || 'A'} size={32} />
                <textarea
                  placeholder="Напиши комментарий..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={2}
                  maxLength={500}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment(e as unknown as React.FormEvent); }}
                  style={{
                    flex: 1, padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(0,162,255,.18)',
                    fontSize: '.875rem', resize: 'none',
                    fontFamily: '"Exo 2", sans-serif',
                    outline: 'none',
                    background: 'rgba(255,255,255,.04)',
                    color: '#dceaff',
                    lineHeight: 1.5,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(0,162,255,.45)')}
                  onBlur={(e)  => (e.target.style.borderColor = 'rgba(0,162,255,.18)')}
                />
              </div>
              {commentError && (
                <p style={{ fontSize: '.8125rem', color: '#ff8e8e', marginBottom: 6, paddingLeft: 42 }}>{commentError}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 42 }}>
                <span style={{ fontSize: '.75rem', color: '#3a4f6a' }}>Ctrl+Enter</span>
                <button
                  type="submit"
                  disabled={sendingComment || !commentText.trim()}
                  style={{ ...s.btnPrimary, opacity: sendingComment || !commentText.trim() ? 0.45 : 1, cursor: sendingComment || !commentText.trim() ? 'default' : 'pointer' }}
                >
                  {sendingComment ? '...' : 'Отправить'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
              <Link href="/login" style={{ color: '#00a2ff', fontWeight: 600, fontSize: '.875rem', textDecoration: 'none' }}>
                Войди, чтобы комментировать
              </Link>
            </div>
          )}

          {/* Список */}
          {loadingComments ? <SkeletonComments /> : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#8aa3bf' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <p style={{ fontWeight: 600, color: '#dceaff', marginBottom: 4 }}>Пока нет комментариев</p>
              <p style={{ fontSize: '.875rem' }}>Будь первым, кто оставит отзыв</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {comments.map((c) => (
                <div key={c.commentid} style={{ display: 'flex', gap: 10 }}>
                  <AuthorAvatar name={c.author} size={32} />
                  <div style={{ flex: 1, background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: '.875rem', fontWeight: 700, color: '#dceaff' }}>{c.author}</span>
                      {getRelativeTime(c.createdat) && (
                        <span style={{ fontSize: '.75rem', color: '#8aa3bf' }}>{getRelativeTime(c.createdat)}</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '.875rem', color: '#c8d8ee', lineHeight: 1.6, maxWidth: 'none' }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export const dynamic = 'force-dynamic';

// ─── Inline-иконки (без lucide-react) ────────────────────────────────────────

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
    </svg>
  );
}
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

// ─── Стили ────────────────────────────────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800&family=Exo+2:wght@400;500;600;700&display=swap');
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
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
    maxWidth: 720, margin: '0 auto', padding: '0 16px',
    height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: {
    fontFamily: 'Orbitron, sans-serif', fontWeight: 800, fontSize: '1.0625rem',
    background: 'linear-gradient(90deg, #00a2ff, #fff)',
    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
    textDecoration: 'none',
  },
  backBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 34, height: 34, borderRadius: 10,
    background: 'rgba(0,162,255,.08)', border: '1px solid rgba(0,162,255,.2)',
    color: '#7ecfff', cursor: 'pointer',
  },
  iconBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 34, height: 34, background: 'none', border: 'none',
    color: '#8aa3bf', cursor: 'pointer',
  },
  main: {
    maxWidth: 720, margin: '0 auto',
    padding: '16px 16px 48px',
    position: 'relative', zIndex: 1,
  },
  card: {
    background: 'linear-gradient(180deg, rgba(16,33,59,.97), rgba(13,24,43,.99))',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: 18, overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,.35)',
  },
  mediaOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
    background: 'linear-gradient(transparent, rgba(9,17,29,.9))',
    pointerEvents: 'none',
  },
  catBadge: {
    display: 'inline-block', padding: '.15rem .625rem',
    borderRadius: 999, fontSize: '.6875rem', fontWeight: 700,
    letterSpacing: '.04em', textTransform: 'uppercase',
  },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 999, padding: '.35rem .75rem',
    cursor: 'pointer', fontSize: '.8125rem', color: '#8aa3bf',
    fontFamily: '"Exo 2", sans-serif', fontWeight: 500,
    transition: 'all .18s ease',
  },
  actionBtnLiked: {
    borderColor: 'rgba(239,68,68,.4)', color: '#ff8e8e',
    background: 'rgba(239,68,68,.1)', boxShadow: '0 0 10px rgba(239,68,68,.2)',
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 18px',
    background: 'linear-gradient(180deg, rgba(0,162,255,.2), rgba(0,162,255,.1))',
    border: '1px solid rgba(0,162,255,.35)',
    color: '#fff', borderRadius: 999,
    fontSize: '.875rem', fontWeight: 700,
    fontFamily: '"Exo 2", sans-serif',
    boxShadow: '0 0 14px rgba(0,162,255,.2)',
    cursor: 'pointer',
  },
};