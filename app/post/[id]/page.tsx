'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface Post {
  postid:        string;
  title:         string;
  description:   string;
  mediaurl?:     string;
  type:          string;
  categoryid:    string;
  author:        string;
  createdat:     string;
  likes:         number;
  liked:         boolean;
  views:         number;
  commentsCount: number;
}

interface Comment {
  commentid: string;
  postid:    string;
  author:    string;
  text:      string;
  createdat: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

// ─── Категории ────────────────────────────────────────────────────────────────

const CATEGORIES: Record<string, string> = {
  food:     'Питание',
  mental:   'Душевное состояние',
  health:   'Здоровье',
  answer:   'Ответы от тренера',
  question: 'Вопросы тренеру',
};

const CAT_COLORS: Record<string, string> = {
  food:     'rgba(255,179,71,.18)',
  mental:   'rgba(239,68,68,.18)',
  health:   'rgba(16,185,129,.18)',
  answer:   'rgba(0,162,255,.18)',
  question: 'rgba(122,57,187,.18)',
};

const CAT_TEXT: Record<string, string> = {
  food:     '#ffd08f',
  mental:   '#ff8e8e',
  health:   '#6ce9c1',
  answer:   '#7ecfff',
  question: '#c79df5',
};

function getCategoryLabel(key: string) { return CATEGORIES[key] ?? key; }

// ─── Авторы ───────────────────────────────────────────────────────────────────

const AUTHORS_MAP: Record<string, string> = {
  'healthbite': 'HealthBite',
  'HealthBite': 'HealthBite',
  'анна':       'Анна',
  'Анна':       'Анна',
  'anna':       'Анна',
  'валерия':    'Валерия',
  'Валерия':    'Валерия',
  'valeria':    'Валерия',
};

function resolveAuthorName(raw: string): string {
  if (!raw) return 'HealthBite';
  return AUTHORS_MAP[raw] ?? AUTHORS_MAP[raw.toLowerCase()] ?? raw;
}

const AUTHOR_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'HealthBite': { bg: 'rgba(0,162,255,.15)',  border: 'rgba(0,162,255,.3)',  text: '#7ecfff' },
  'Анна':       { bg: 'rgba(16,185,129,.15)', border: 'rgba(16,185,129,.3)', text: '#6ce9c1' },
  'Валерия':    { bg: 'rgba(239,68,68,.15)',  border: 'rgba(239,68,68,.3)',  text: '#ff8e8e' },
};

// ─── Утилиты времени ──────────────────────────────────────────────────────────

function parseTimestamp(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined || raw === '') return 0;
  const str = String(raw).trim();
  if (/^\d+$/.test(str)) {
    const n = Number(str);
    return n < 1_000_000_000_000 ? n * 1000 : n;
  }
  const ms = Date.parse(str);
  return isNaN(ms) ? 0 : ms;
}

function getRelativeTime(raw: string | number | null | undefined): string {
  const ms = parseTimestamp(raw);
  if (!ms) return '';
  const diff = Date.now() - ms;
  if (diff < 0) return 'только что';
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

// ─── Аватар автора ────────────────────────────────────────────────────────────

function AuthorAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const resolved = resolveAuthorName(name);
  const colors   = AUTHOR_COLORS[resolved] ?? AUTHOR_COLORS['HealthBite'];
  return (
    <div aria-label={resolved} style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: colors.bg, border: `1px solid ${colors.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: colors.text, fontSize: size * 0.38, fontWeight: 700,
    }}>
      {resolved.slice(0, 1).toUpperCase()}
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
        <SkeletonBlock /><SkeletonBlock /><SkeletonBlock w="55%" />
      </div>
    </div>
  );
}

function SkeletonComments() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2].map(i => (
        <div key={i} style={{ display: 'flex', gap: 10 }}>
          <div className="sk" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonBlock w="30%" /><SkeletonBlock /><SkeletonBlock w="70%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Лайтбокс ────────────────────────────────────────────────────────────────

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.93)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, animation: 'lbFadeIn .18s ease',
      }}
    >
      <style>{`
        @keyframes lbFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes lbZoom   { from { transform:scale(.9); opacity:0 } to { transform:scale(1); opacity:1 } }
      `}</style>
      <button
        onClick={onClose}
        aria-label="Закрыть"
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)',
          color: '#fff', fontSize: 22, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1, transition: 'background .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}
      >×</button>
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: 'rgba(255,255,255,.28)', pointerEvents: 'none' }}>
        ESC или тап на фон — закрыть
      </div>
      <div
        onClick={e => e.stopPropagation()}
        style={{ animation: 'lbZoom .2s ease', maxWidth: '100%', maxHeight: '100%', display: 'flex' }}
      >
        <img
          src={src} alt={alt}
          style={{ display: 'block', maxWidth: 'min(960px, 95vw)', maxHeight: '90dvh', borderRadius: 14, objectFit: 'contain', boxShadow: '0 0 80px rgba(0,0,0,.8)' }}
        />
      </div>
    </div>
  );
}

// ─── Основной компонент ───────────────────────────────────────────────────────

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, getToken } = useAuth();

  const [post,            setPost]            = useState<Post | null>(null);
  const [loadingPost,     setLoadingPost]     = useState(true);
  const [likePending,     setLikePending]     = useState(false);
  const [comments,        setComments]        = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText,     setCommentText]     = useState('');
  const [sendingComment,  setSendingComment]  = useState(false);
  const [commentError,    setCommentError]    = useState('');
  const [imgError,        setImgError]        = useState(false);
  const [imgOpen,         setImgOpen]         = useState(false);

  const loadPost = useCallback(async () => {
    if (!id) return;
    setLoadingPost(true);
    try {
      const qs  = user?.id ? `?userId=${encodeURIComponent(user.id)}` : '';
      const res = await fetch(`${API}/post/${id}${qs}`);
      if (res.status === 404) { router.push('/feed'); return; }
      if (!res.ok) throw new Error(`${res.status}`);
      setPost(await res.json());
    } catch (e) {
      console.error('loadPost:', e);
    } finally {
      setLoadingPost(false);
    }
  }, [id, user?.id, router]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    setLoadingComments(true);
    try {
      const res  = await fetch(`${API}/post/${id}/comments`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : Array.isArray(data?.comments) ? data.comments : []);
    } catch (e) {
      console.error('loadComments:', e);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [id]);

  useEffect(() => { loadPost(); loadComments(); }, [loadPost, loadComments]);

  const handleLike = useCallback(async () => {
    if (!post || !user?.id || likePending) return;
    const wasLiked = post.liked;
    setPost(p => p ? { ...p, liked: !wasLiked, likes: wasLiked ? p.likes - 1 : p.likes + 1 } : p);
    setLikePending(true);
    try {
      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: wasLiked ? 'unlikepost' : 'likepost',
          postId: post.postid,
          userId: user.id,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setPost(p => p ? {
        ...p,
        likes: typeof data.likes === 'number' ? data.likes : p.likes,
        liked: typeof data.liked === 'boolean' ? data.liked : p.liked,
      } : p);
    } catch (e) {
      console.error('like error:', e);
      setPost(p => p ? { ...p, liked: wasLiked, likes: wasLiked ? p.likes + 1 : p.likes - 1 } : p);
    } finally {
      setLikePending(false);
    }
  }, [post, user?.id, likePending]);

  const handleComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !id) return;
    setSendingComment(true);
    setCommentError('');
    try {
      const token = getToken();
      const res = await fetch(`${API}/post/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      setCommentText('');
      await loadComments();
    } catch (e: unknown) {
      setCommentError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSendingComment(false);
    }
  }, [commentText, id, loadComments, getToken]);

  if (loadingPost) {
    return (
      <div style={s.page}>
        <style>{globalStyles}</style>
        <div style={s.gridBg} />
        <header style={s.header}>
          <div style={s.headerInner}>
            <button onClick={() => router.back()} style={s.backBtn} aria-label="Назад"><ArrowIcon /></button>
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

  const relTime      = getRelativeTime(post.createdat);
  const catLabel     = getCategoryLabel(post.categoryid);
  const catBg        = CAT_COLORS[post.categoryid] ?? 'rgba(255,255,255,.06)';
  const catTxt       = CAT_TEXT[post.categoryid]   ?? '#8aa3bf';
  const authorName   = resolveAuthorName(post.author);
  const commenterName = user?.name || '';

  return (
    <div style={s.page}>
      <style>{globalStyles}</style>
      <div style={s.gridBg} />

      {imgOpen && post.mediaurl && post.type !== 'video' && (
        <ImageLightbox src={post.mediaurl} alt={post.title} onClose={() => setImgOpen(false)} />
      )}

      <header style={s.header}>
        <div style={s.headerInner}>
          <button onClick={() => router.back()} style={s.backBtn} aria-label="Назад"><ArrowIcon /></button>
          <Link href="/feed" style={s.logo}>HealthBite</Link>
          <div style={{ width: 34 }} />
        </div>
      </header>

      <main style={s.main}>
        <article style={{ ...s.card, marginBottom: 16 }}>

          {/* Медиа */}
          {post.mediaurl && !imgError && (
            post.type === 'video' ? (
              <div style={{ position: 'relative', background: '#000' }}>
                <video
                  src={post.mediaurl} controls playsInline muted
                  style={{ width: '100%', display: 'block', maxHeight: 440, objectFit: 'cover', background: '#000' }}
                />
                <div style={s.mediaOverlay} />
              </div>
            ) : (
              <div
                style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', cursor: 'zoom-in' }}
                onClick={() => setImgOpen(true)}
              >
                <img
                  src={post.mediaurl} alt={post.title}
                  onError={() => setImgError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .3s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
                <div style={s.mediaOverlay} />
                <div style={{
                  position: 'absolute', bottom: 12, right: 12,
                  background: 'rgba(0,0,0,.48)', borderRadius: 8, padding: '5px 8px',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, color: 'rgba(255,255,255,.55)', backdropFilter: 'blur(4px)',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                  открыть
                </div>
              </div>
            )
          )}

          <div style={{ padding: '20px 16px 16px' }}>
            {/* Автор */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <AuthorAvatar name={post.author} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#dceaff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {authorName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
            <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={handleLike}
                disabled={likePending || !user}
                aria-label={post.liked ? 'Убрать лайк' : 'Поставить лайк'}
                style={{ ...s.actionBtn, ...(post.liked ? s.actionBtnLiked : {}), opacity: likePending ? 0.6 : 1, cursor: user ? 'pointer' : 'default' }}
              >
                <HeartIcon filled={post.liked} />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{post.likes}</span>
              </button>

              <a href="#comments" style={{ ...s.actionBtn, textDecoration: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {post.commentsCount > 0 ? post.commentsCount : ''}
                </span>
              </a>

              <div style={s.viewsCount}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

        {/* Комментарии */}
        <section id="comments" style={{ ...s.card, padding: '20px 16px' }}>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '.9375rem', fontWeight: 700, color: '#dceaff', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            Комментарии
            {!loadingComments && comments.length > 0 && (
              <span style={{ fontSize: '.8125rem', fontWeight: 400, color: '#8aa3bf', background: 'rgba(255,255,255,.06)', padding: '1px 8px', borderRadius: 999 }}>
                {comments.length}
              </span>
            )}
          </h2>

          {/* Форма */}
          {user ? (
            <form onSubmit={handleComment} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <AuthorAvatar name={commenterName} size={32} />
                <textarea
                  placeholder="Напиши комментарий..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={2}
                  maxLength={500}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey))
                      handleComment(e as unknown as React.FormEvent);
                  }}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,162,255,.18)', fontSize: '.875rem', resize: 'none', fontFamily: '"Exo 2", sans-serif', outline: 'none', background: 'rgba(255,255,255,.04)', color: '#dceaff', lineHeight: 1.5 }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,162,255,.45)')}
                  onBlur={e  => (e.target.style.borderColor = 'rgba(0,162,255,.18)')}
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

          {/* Список комментариев */}
          {loadingComments ? <SkeletonComments /> : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#8aa3bf' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <p style={{ fontWeight: 600, color: '#dceaff', marginBottom: 4 }}>Пока нет комментариев</p>
              <p style={{ fontSize: '.875rem' }}>Будь первым, кто оставит отзыв</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {comments.map(c => (
                <div key={c.commentid} style={{ display: 'flex', gap: 10 }}>
                  <AuthorAvatar name={c.author} size={32} />
                  <div style={{ flex: 1, background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '.875rem', fontWeight: 700, color: '#dceaff' }}>
                        {resolveAuthorName(c.author)}
                      </span>
                      {getRelativeTime(c.createdat) && (
                        <span style={{ fontSize: '.75rem', color: '#8aa3bf' }}>{getRelativeTime(c.createdat)}</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '.875rem', color: '#c8d8ee', lineHeight: 1.6 }}>{c.text}</p>
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

// ─── Иконки ───────────────────────────────────────────────────────────────────

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
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
  page:         { minHeight: '100dvh', background: 'radial-gradient(circle at 20% 0, rgba(0,162,255,.1) 0, transparent 35%), radial-gradient(circle at 80% 20%, rgba(0,229,255,.07) 0, transparent 30%), linear-gradient(180deg, #0a1220 0%, #0d1623 35%, #09111a 100%)', fontFamily: '"Exo 2", system-ui, sans-serif', color: '#f4f8ff', position: 'relative' },
  gridBg:       { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(0,162,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,162,255,.035) 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'linear-gradient(180deg, transparent, black 15%, black 80%, transparent)' },
  header:       { background: 'rgba(9,17,29,.82)', backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(0,162,255,.1)', position: 'sticky', top: 0, zIndex: 100 },
  headerInner:  { maxWidth: 720, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo:         { fontFamily: 'Orbitron, sans-serif', fontWeight: 800, fontSize: '1.0625rem', background: 'linear-gradient(90deg, #00a2ff, #fff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', textDecoration: 'none' },
  backBtn:      { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, background: 'rgba(0,162,255,.08)', border: '1px solid rgba(0,162,255,.2)', color: '#7ecfff', cursor: 'pointer' },
  main:         { maxWidth: 720, margin: '0 auto', padding: '16px 16px 48px', position: 'relative', zIndex: 1 },
  card:         { background: 'linear-gradient(180deg, rgba(16,33,59,.97), rgba(13,24,43,.99))', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.35)' },
  mediaOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, rgba(9,17,29,.9))', pointerEvents: 'none' },
  catBadge:     { display: 'inline-block', padding: '.15rem .625rem', borderRadius: 999, fontSize: '.6875rem', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' as const },
  actionBtn:    { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 999, padding: '.35rem .75rem', cursor: 'pointer', fontSize: '.8125rem', color: '#8aa3bf', fontFamily: '"Exo 2", sans-serif', fontWeight: 500, transition: 'all .18s ease' },
  actionBtnLiked: { borderColor: 'rgba(239,68,68,.4)', color: '#ff8e8e', background: 'rgba(239,68,68,.1)', boxShadow: '0 0 10px rgba(239,68,68,.2)' },
  viewsCount:   { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '.8125rem', color: '#4a6a8a', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' },
  btnPrimary:   { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'linear-gradient(180deg, rgba(0,162,255,.2), rgba(0,162,255,.1))', border: '1px solid rgba(0,162,255,.35)', color: '#fff', borderRadius: 999, fontSize: '.875rem', fontWeight: 700, fontFamily: '"Exo 2", sans-serif', boxShadow: '0 0 14px rgba(0,162,255,.2)', cursor: 'pointer' },
};