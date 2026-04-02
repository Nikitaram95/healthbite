'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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

interface Comment {
  commentid: string;
  postid:    string;
  author:    string;
  text:      string;
  createdat: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function PostPage() {
  const { id }         = useParams<{ id: string }>();
  const router         = useRouter();
  const { user, getToken } = useAuth();

  const [post, setPost]         = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [liked, setLiked]       = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSending]  = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    if (!id) return;
    loadPost();
    loadComments();
    loadLikeStatus();
  }, [id]);

  async function loadPost() {
    setLoadingPost(true);
    try {
      const res  = await fetch(`${API}/posts/${id}`);
      const data = await res.json();
      if (!res.ok) { router.push('/'); return; }
      setPost(data);
      setLikesCount(data.likes || 0);
    } finally {
      setLoadingPost(false);
    }
  }

  async function loadComments() {
    const res  = await fetch(`${API}/posts/${id}/comments`);
    const data = await res.json();
    setComments(Array.isArray(data) ? data : []);
  }

  async function loadLikeStatus() {
    const token  = getToken();
    const userId = user?.id || 'anonymous';
    const res  = await fetch(`${API}/posts/${id}/like?userId=${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    setLiked(data.isLiked);
    setLikesCount(data.likes);
  }

  async function handleLike() {
    const token  = getToken();
    const userId = user?.id || 'anonymous';
    const res = await fetch(`${API}/posts/${id}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    setLiked(data.isLiked);
    setLikesCount(data.likes);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentError('');
    setSending(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text:   commentText.trim(),
          author: user?.name || user?.phone || 'Пользователь',
        }),
      });
      if (!res.ok) throw new Error('Ошибка при отправке');
      setCommentText('');
      await loadComments();
    } catch (e: any) {
      setCommentError(e.message);
    } finally {
      setSending(false);
    }
  }

  if (loadingPost) {
    return (
      <div style={s.loadingPage}>
        <Spinner size={36} />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div style={s.page}>
      {/* Шапка */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <button style={s.back} onClick={() => router.back()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Назад
          </button>
          <Link href="/" style={s.logoLink}>
            <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="#01696f"/>
              <path d="M18 8C13 8 9 12 9 17c0 6 9 11 9 11s9-5 9-11c0-5-4-9-9-9z" fill="white" opacity=".9"/>
              <path d="M14 17h8M18 13v8" stroke="#01696f" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </Link>
          <div style={{ width: 80 }} />
        </div>
      </header>

      <main style={s.main}>
        <article style={s.article}>

          {/* Медиа */}
          {post.mediaurl && post.type === 'image' && (
            <img
              src={post.mediaurl}
              alt={post.title}
              style={s.heroImg}
              loading="lazy"
              width={960}
              height={540}
            />
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

          {/* Контент */}
          <div style={s.content}>
            {/* Мета */}
            <div style={s.meta}>
              <span style={s.cat}>{post.categoryid}</span>
              <span style={s.date}>{post.createdat}</span>
            </div>

            {/* Заголовок */}
            <h1 style={s.title}>{post.title}</h1>

            {/* Автор + лайк */}
            <div style={s.authorRow}>
              <div style={s.authorInfo}>
                <div style={s.authorAvatar}>
                  {post.author.slice(0, 1).toUpperCase()}
                </div>
                <span style={s.authorName}>@{post.author}</span>
              </div>
              <button
                style={{ ...s.likeBtn, ...(liked ? s.likeBtnActive : {}) }}
                onClick={handleLike}
                aria-label="Лайк"
              >
                <svg width="18" height="18" viewBox="0 0 24 24"
                  fill={liked ? 'currentColor' : 'none'}
                  stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span style={s.likeCount}>{likesCount}</span>
              </button>
            </div>

            {/* Описание */}
            {post.description && (
              <p style={s.description}>{post.description}</p>
            )}
          </div>
        </article>

        {/* Комментарии */}
        <section style={s.commentsSection}>
          <h2 style={s.commentsTitle}>
            Комментарии
            {comments.length > 0 && (
              <span style={s.commentsBadge}>{comments.length}</span>
            )}
          </h2>

          {/* Форма */}
          {user ? (
            <form onSubmit={handleComment} style={s.commentForm}>
              <div style={s.commentInputWrap}>
                <div style={s.commentAvatar}>
                  {(user.name || user.phone).slice(0, 1).toUpperCase()}
                </div>
                <textarea
                  placeholder="Напишите комментарий..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={2}
                  maxLength={500}
                  style={s.commentTextarea}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleComment(e as any);
                    }
                  }}
                />
              </div>
              {commentError && <p style={s.commentError}>{commentError}</p>}
              <div style={s.commentFormFooter}>
                <span style={s.commentHint}>Ctrl+Enter для отправки</span>
                <button
                  type="submit"
                  style={s.commentSubmit}
                  disabled={sendingComment || !commentText.trim()}
                >
                  {sendingComment ? <Spinner size={16} /> : 'Отправить'}
                </button>
              </div>
            </form>
          ) : (
            <div style={s.loginPrompt}>
              <Link href="/login" style={s.loginPromptLink}>Войдите</Link>
              , чтобы оставить комментарий
            </div>
          )}

          {/* Список комментариев */}
          {comments.length === 0 ? (
            <div style={s.noComments}>
              Будьте первым — напишите комментарий
            </div>
          ) : (
            <div style={s.commentsList}>
              {comments.map(c => (
                <div key={c.commentid} style={s.commentItem}>
                  <div style={s.commentAvatar}>
                    {c.author.slice(0, 1).toUpperCase()}
                  </div>
                  <div style={s.commentBody}>
                    <div style={s.commentHeader}>
                      <span style={s.commentAuthor}>{c.author}</span>
                      <span style={s.commentDate}>{c.createdat}</span>
                    </div>
                    <p style={s.commentText}>{c.text}</p>
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

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin .7s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="10" strokeOpacity=".25"/>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:              { minHeight: '100dvh', background: '#f7f6f2', fontFamily: 'system-ui,sans-serif' },
  loadingPage:       { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f2', color: '#01696f' },
  header:            { background: '#fff', borderBottom: '1px solid #e8e6e1', position: 'sticky', top: 0, zIndex: 100 },
  headerInner:       { maxWidth: 720, margin: '0 auto', padding: '0 1rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  back:              { display: 'flex', alignItems: 'center', gap: '.25rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.875rem', color: '#7a7974', width: 80 },
  logoLink:          { textDecoration: 'none' },
  main:              { maxWidth: 720, margin: '0 auto', padding: '0 0 4rem' },
  article:           { background: '#fff', borderRadius: '0 0 16px 16px', overflow: 'hidden', marginBottom: '1rem' },
  heroImg:           { width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' },
  videoWrap:         { position: 'relative', paddingBottom: '56.25%', height: 0 },
  iframe:            { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
  content:           { padding: '1.5rem 1.25rem 1.25rem' },
  meta:              { display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' },
  cat:               { fontSize: '.75rem', fontWeight: 600, color: '#01696f', textTransform: 'uppercase' as const, letterSpacing: '.05em' },
  date:              { fontSize: '.75rem', color: '#bab9b4' },
  title:             { fontSize: 'clamp(1.375rem,1rem+1.5vw,1.875rem)', fontWeight: 800, color: '#28251d', lineHeight: 1.25, marginBottom: '1rem' },
  authorRow:         { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' },
  authorInfo:        { display: 'flex', alignItems: 'center', gap: '.5rem' },
  authorAvatar:      { width: 32, height: 32, borderRadius: '50%', background: '#e6f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.875rem', fontWeight: 700, color: '#01696f' },
  authorName:        { fontSize: '.875rem', color: '#7a7974', fontWeight: 500 },
  likeBtn:           { display: 'flex', alignItems: 'center', gap: '.375rem', background: 'none', border: '1.5px solid #d4d1ca', borderRadius: 999, padding: '.375rem .875rem', cursor: 'pointer', fontSize: '.9375rem', color: '#7a7974', fontWeight: 600 },
  likeBtnActive:     { borderColor: '#e05c8a', color: '#e05c8a', background: '#fdf2f7' },
  likeCount:         { fontVariantNumeric: 'tabular-nums' },
  description:       { fontSize: '1rem', color: '#3d3a32', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const },
  commentsSection:   { background: '#fff', borderRadius: 16, padding: '1.25rem', margin: '0 0 1rem' },
  commentsTitle:     { fontSize: '1.0625rem', fontWeight: 700, color: '#28251d', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.5rem' },
  commentsBadge:     { background: '#f0f0ed', borderRadius: 999, padding: '.125rem .5rem', fontSize: '.8125rem', fontWeight: 600, color: '#7a7974' },
  commentForm:       { marginBottom: '1.5rem' },
  commentInputWrap:  { display: 'flex', gap: '.75rem', alignItems: 'flex-start' },
  commentAvatar:     { width: 32, height: 32, borderRadius: '50%', background: '#e6f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8125rem', fontWeight: 700, color: '#01696f', flexShrink: 0 },
  commentTextarea:   { flex: 1, padding: '.625rem .875rem', border: '1.5px solid #d4d1ca', borderRadius: 10, fontSize: '.9375rem', color: '#28251d', background: '#fafaf8', outline: 'none', resize: 'none' as const, fontFamily: 'inherit', lineHeight: 1.55, boxSizing: 'border-box' as const, width: '100%' },
  commentError:      { fontSize: '.8125rem', color: '#a12c7b', marginTop: '.5rem' },
  commentFormFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.625rem', paddingLeft: 44 },
  commentHint:       { fontSize: '.75rem', color: '#bab9b4' },
  commentSubmit:     { background: '#01696f', color: '#fff', border: 'none', borderRadius: 8, padding: '.375rem .875rem', fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.375rem' },
  loginPrompt:       { fontSize: '.9375rem', color: '#7a7974', padding: '1rem 0', marginBottom: '1rem' },
  loginPromptLink:   { color: '#01696f', fontWeight: 600, textDecoration: 'none' },
  noComments:        { fontSize: '.9375rem', color: '#bab9b4', textAlign: 'center' as const, padding: '2rem 0' },
  commentsList:      { display: 'flex', flexDirection: 'column', gap: '1.125rem' },
  commentItem:       { display: 'flex', gap: '.75rem', alignItems: 'flex-start' },
  commentBody:       { flex: 1, background: '#f7f6f2', borderRadius: 10, padding: '.75rem 1rem' },
  commentHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.375rem' },
  commentAuthor:     { fontSize: '.875rem', fontWeight: 600, color: '#28251d' },
  commentDate:       { fontSize: '.75rem', color: '#bab9b4' },
  commentText:       { fontSize: '.9375rem', color: '#3d3a32', lineHeight: 1.55, whiteSpace: 'pre-wrap' as const, margin: 0 },
};