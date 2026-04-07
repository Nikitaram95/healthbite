'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
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

const API_BASE = 'https://d5d5nab6rsitmnq0gb0o.i99u1wfk.apigw.yandexcloud.net';

const CATEGORIES: Record<string, string> = {
  food:      'Питание',
  mental:    'Ментальное',
  sport:     'Спорт',
  health:    'Здоровье',
  lifestyle: 'Образ жизни',
};

function getCategoryLabel(key: string): string {
  return CATEGORIES[key] ?? key;
}

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

function AuthorAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();
  const colors = ['#01696f','#437a22','#006494','#7a39bb','#d19900','#da7101','#a12c7b','#a13544'];
  const color = colors[(name.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.38, fontWeight: 600, flexShrink: 0 }} aria-label={name}>
      {initials || '?'}
    </div>
  );
}

function SkeletonPost() {
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid oklch(from var(--color-text) l c h / 0.08)' }}>
      <div className="skeleton" style={{ aspectRatio: '16/9', width: '100%' }} />
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '35%', marginBottom: 6 }} />
            <div className="skeleton skeleton-text" style={{ width: '20%', height: '0.75em' }} />
          </div>
        </div>
        <div className="skeleton skeleton-text" style={{ width: '75%', height: '1.5em', marginBottom: 10 }} />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" style={{ width: '55%' }} />
      </div>
    </div>
  );
}

function SkeletonComments() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 10 }}>
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '30%', marginBottom: 6 }} />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text" style={{ width: '70%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonStyles() {
  return (
    <style>{`
      @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      .skeleton { background: linear-gradient(90deg, var(--color-surface-offset) 25%, var(--color-surface-dynamic) 50%, var(--color-surface-offset) 75%); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; border-radius: var(--radius-sm); }
      .skeleton-text { height: 1em; margin-bottom: 6px; }
    `}</style>
  );
}

const headerStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 50, background: 'oklch(from var(--color-bg) l c h / 0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid oklch(from var(--color-text) l c h / 0.07)' };
const headerInner: React.CSSProperties = { maxWidth: 680, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const backBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', padding: 6, borderRadius: 'var(--radius-md)', background: 'none', border: 'none', cursor: 'pointer' };
const logoStyle: React.CSSProperties = { textDecoration: 'none', fontWeight: 800, color: 'var(--color-primary)', fontSize: 'var(--text-base)', letterSpacing: '-0.02em' };
const primaryBtnStyle: React.CSSProperties = { padding: '8px 18px', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)', fontWeight: 600, border: 'none', cursor: 'pointer' };

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost]                       = useState<Post | null>(null);
  const [loadingPost, setLoadingPost]         = useState(true);
  const [likePending, setLikePending]         = useState(false);
  const [comments, setComments]               = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText]         = useState('');
  const [sendingComment, setSendingComment]   = useState(false);
  const [commentError, setCommentError]       = useState('');
  const [imgError, setImgError]               = useState(false);

  const loadPost = useCallback(async () => {
    if (!id) return;
    setLoadingPost(true);
    try {
      const qs = user?.phone ? `?userId=${encodeURIComponent(user.phone)}` : '';
      const res = await fetch(`${API_BASE}/posts/${id}${qs}`);
      if (res.status === 404) { router.push('/feed'); return; }
      if (!res.ok) throw new Error('Ошибка загрузки');
      setPost(await res.json());
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
      const res = await fetch(`${API_BASE}/posts/${id}/comments`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('loadComments:', e);
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
      const res = await fetch(`${API_BASE}/upload`, {
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
      const res = await fetch(`${API_BASE}/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setCommentText('');
      await loadComments();
    } catch (e: unknown) {
      setCommentError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSendingComment(false);
    }
  }, [commentText, id, loadComments]);

  if (loadingPost) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
        <header style={headerStyle}><div style={headerInner}><button onClick={() => router.back()} style={backBtnStyle}><ArrowLeft size={18} /></button><Link href="/" style={logoStyle}>HealthBite</Link><div style={{ width: 34 }} /></div></header>
        <main style={{ maxWidth: 680, margin: '0 auto', padding: 16 }}><SkeletonPost /></main>
        <SkeletonStyles />
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 12, color: 'var(--color-text-muted)' }}>Пост не найден</p>
          <button onClick={() => router.push('/feed')} style={primaryBtnStyle}>В ленту</button>
        </div>
      </div>
    );
  }

  const relTime  = getRelativeTime(post.createdat);
  const catLabel = getCategoryLabel(post.categoryid);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <header style={headerStyle}>
        <div style={headerInner}>
          <button onClick={() => router.back()} style={backBtnStyle} aria-label="Назад"><ArrowLeft size={18} /></button>
          <Link href="/" style={logoStyle}>HealthBite</Link>
          <button style={{ color: 'var(--color-text-muted)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Опции"><MoreHorizontal size={20} /></button>
        </div>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '16px', paddingBottom: 48 }}>

        {/* Пост */}
        <article style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid oklch(from var(--color-text) l c h / 0.08)', marginBottom: 16 }}>
          {post.mediaurl && !imgError && (
            post.type === 'video'
              ? <video src={post.mediaurl} controls playsInline style={{ width: '100%', display: 'block', maxHeight: 440, objectFit: 'cover', background: 'var(--color-surface-offset)' }} />
              : <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--color-surface-offset)' }}>
                  <Image src={post.mediaurl} alt={post.title} fill style={{ objectFit: 'cover' }} onError={() => setImgError(true)} sizes="(max-width:720px) 100vw,680px" priority />
                </div>
          )}

          <div style={{ padding: '20px 16px 16px' }}>
            {/* Автор */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <AuthorAvatar name={post.author} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 3 }}>{post.author}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600, background: 'var(--color-primary-highlight)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>{catLabel}</span>
                  {relTime && <><span style={{ color: 'var(--color-text-faint)', fontSize: 12 }}>·</span><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{relTime}</span></>}
                </div>
              </div>
            </div>

            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.25, marginBottom: 12 }}>{post.title}</h1>

            {post.description && (
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 16, whiteSpace: 'pre-wrap', maxWidth: 'none' }}>{post.description}</p>
            )}

            {/* Лайк */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 12, borderTop: '1px solid oklch(from var(--color-text) l c h / 0.07)' }}>
              <button onClick={handleLike} disabled={likePending || !user} aria-label={post.liked ? 'Убрать лайк' : 'Поставить лайк'}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: post.liked ? 'var(--color-notification)' : 'var(--color-text-muted)', fontSize: 'var(--text-sm)', fontWeight: 600, padding: '6px 0', opacity: likePending ? 0.6 : 1, transition: 'color 180ms ease', background: 'none', border: 'none', cursor: user ? 'pointer' : 'default' }}>
                <Heart size={20} fill={post.liked ? 'currentColor' : 'none'} strokeWidth={post.liked ? 0 : 2} />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{post.likes}</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                <MessageCircle size={20} />
                <span>{comments.length > 0 ? `${comments.length} ${comments.length === 1 ? 'комментарий' : 'комментариев'}` : 'Комментарии'}</span>
              </div>
            </div>
          </div>
        </article>

        {/* Комментарии */}
        <section style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: '20px 16px', border: '1px solid oklch(from var(--color-text) l c h / 0.08)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 16 }}>
            Комментарии{comments.length > 0 && <span style={{ fontSize: 'var(--text-sm)', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 6 }}>{comments.length}</span>}
          </h2>

          {user ? (
            <form onSubmit={handleComment} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <AuthorAvatar name={user.name || user.phone || 'A'} size={32} />
                <textarea placeholder="Напиши комментарий..." value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={2} maxLength={500}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment(e as unknown as React.FormEvent); }}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', resize: 'none', fontFamily: 'inherit', outline: 'none', background: 'var(--color-surface-offset)', color: 'var(--color-text)', lineHeight: 1.5 }} />
              </div>
              {commentError && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', marginBottom: 6 }}>{commentError}</p>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 42 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>Ctrl+Enter</span>
                <button type="submit" disabled={sendingComment || !commentText.trim()} style={{ ...primaryBtnStyle, opacity: sendingComment || !commentText.trim() ? 0.5 : 1, cursor: sendingComment || !commentText.trim() ? 'default' : 'pointer' }}>
                  {sendingComment ? '...' : 'Отправить'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
              <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--text-sm)', textDecoration: 'none' }}>Войди, чтобы комментировать</Link>
            </div>
          )}

          {loadingComments ? <SkeletonComments /> : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>Пока нет комментариев</p>
              <p style={{ fontSize: 'var(--text-sm)' }}>Будь первым, кто оставит отзыв</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {comments.map((c) => (
                <div key={c.commentid} style={{ display: 'flex', gap: 10 }}>
                  <AuthorAvatar name={c.author} size={32} />
                  <div style={{ flex: 1, background: 'var(--color-surface-offset)', borderRadius: 'var(--radius-lg)', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)' }}>{c.author}</span>
                      {getRelativeTime(c.createdat) && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{getRelativeTime(c.createdat)}</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.6, maxWidth: 'none' }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <SkeletonStyles />
    </div>
  );
}

export const dynamic = 'force-dynamic';