"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface Post {
  postid: string;
  title: string;
  description: string;
  mediaurl?: string;
  type: string;
  categoryid: string;
  author: string;
  createdat: string;
}

interface Comment {
  commentid: string;
  postid: string;
  author: string;
  text: string;
  createdat: string;
}

const API = 'https://d5d5nab6rsitmnq0gb0o.i99u1wfk.apigw.yandexcloud.net/upload';

export default function PostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    if (!id) return;
    loadPost();
    loadComments();
  }, [id]);

  async function loadPost() {
    setLoadingPost(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listposts' }),
      });
      const posts: Post[] = await res.json();
      const found = posts.find(p => p.postid === id);
      if (!found) {
        router.push('/feed');
        return;
      }
      setPost(found);
    } catch (e) {
      console.error('Load post error:', e);
    } finally {
      setLoadingPost(false);
    }
  }

  async function loadComments() {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listcomments', postId: id }),
      });
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Load comments error:', e);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSendingComment(true);
    setCommentError('');
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addcomment',
          postId: id,
          text: commentText.trim(),
          author: user?.name || user?.phone || 'anonymous',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setCommentText('');
      await loadComments();
    } catch (e: any) {
      setCommentError(e.message);
    } finally {
      setSendingComment(false);
    }
  }

  if (loadingPost) {
    return (
      <div style={styles.loadingPage}>
        <div>Загрузка поста...</div>
      </div>
    );
  }

  if (!post) {
    return <div>Пост не найден</div>;
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <button style={styles.back} onClick={() => router.back()}>
            ← Назад
          </button>
          <Link href="/" style={styles.logoLink}>
            HealthBite
          </Link>
        </div>
      </header>

      <main style={styles.main}>
        <article style={styles.article}>
          {post.mediaurl && post.type === 'image' && (
            <img
              src={post.mediaurl}
              alt={post.title}
              style={styles.heroImg}
              loading="lazy"
            />
          )}
          {post.mediaurl && post.type === 'video' && (
            <div style={styles.videoWrap}>
              <video
                src={post.mediaurl}
                controls
                style={styles.iframe}
                title={post.title}
              />
            </div>
          )}

          <div style={styles.content}>
            <div style={styles.meta}>
              <span style={styles.cat}>{post.categoryid}</span>
              <span style={styles.date}>{post.createdat}</span>
            </div>

            <h1 style={styles.title}>{post.title}</h1>

            <div style={styles.authorRow}>
              <div style={styles.authorInfo}>
                <div style={styles.authorAvatar}>
                  {post.author.slice(0, 1).toUpperCase()}
                </div>
                <span style={styles.authorName}>{post.author}</span>
              </div>

              <button
                style={{ ...styles.likeBtn, ...(liked ? styles.likeBtnActive : {}) }}
                onClick={() => {
                  setLiked(v => !v);
                  setLikesCount(v => liked ? v - 1 : v + 1);
                }}
                aria-label={liked ? 'Убрать лайк' : 'Поставить лайк'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>{liked ? 'Unlike' : 'Like'}</span>
                <span style={styles.likeCount}>{likesCount}</span>
              </button>
            </div>

            <div style={styles.description}>{post.description}</div>
          </div>
        </article>

        <section style={styles.commentsSection}>
          <h2 style={styles.commentsTitle}>
            Комментарии{comments.length > 0 && ` (${comments.length})`}
          </h2>

          {user ? (
            <form onSubmit={handleComment} style={styles.commentForm}>
              <div style={styles.commentInputWrap}>
                <div style={styles.commentAvatar}>
                  {(user.name || user.phone || 'A').slice(0, 1).toUpperCase()}
                </div>
                <textarea
                  placeholder="Напиши комментарий..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={2}
                  maxLength={500}
                  style={styles.commentTextarea}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleComment(e as any);
                    }
                  }}
                />
              </div>
              {commentError && <p style={styles.commentError}>{commentError}</p>}
              <div style={styles.commentFormFooter}>
                <span style={styles.commentHint}>Ctrl+Enter</span>
                <button
                  type="submit"
                  style={styles.commentSubmit}
                  disabled={sendingComment || !commentText.trim()}
                >
                  {sendingComment ? '...' : 'Отправить'}
                </button>
              </div>
            </form>
          ) : (
            <div style={styles.loginPrompt}>
              <Link href="/login" style={styles.loginPromptLink}>
                Войди чтобы комментировать
              </Link>
            </div>
          )}

          {comments.length === 0 ? (
            <div style={styles.noComments}>Пока нет комментариев</div>
          ) : (
            <div style={styles.commentsList}>
              {comments.map(c => (
                <div key={c.commentid} style={styles.commentItem}>
                  <div style={styles.commentAvatar}>
                    {c.author.slice(0, 1).toUpperCase()}
                  </div>
                  <div style={styles.commentBody}>
                    <div style={styles.commentHeader}>
                      <span style={styles.commentAuthor}>{c.author}</span>
                      <span style={styles.commentDate}>{c.createdat}</span>
                    </div>
                    <p style={styles.commentText}>{c.text}</p>
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

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: '#f7f6f2', fontFamily: 'system-ui, sans-serif' },
  loadingPage: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f2', color: '#01696f' },
  header: { background: '#fff', borderBottom: '1px solid #e8e6e1', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: '720px', margin: '0 auto', padding: '0 1rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  back: { display: 'flex', alignItems: 'center', gap: '.25rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.875rem', color: '#7a7974' },
  logoLink: { textDecoration: 'none', fontWeight: 700, color: '#01696f', fontSize: '1rem' },
  main: { maxWidth: '720px', margin: '0 auto', padding: '0 0 4rem' },
  article: { background: '#fff', borderRadius: '0 0 16px 16px', overflow: 'hidden', marginBottom: '1rem' },
  heroImg: { width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' },
  videoWrap: { position: 'relative', paddingBottom: '56.25%', height: 0 },
  iframe: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
  content: { padding: '1.5rem 1.25rem 1.25rem' },
  meta: { display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' },
  cat: { fontSize: '.75rem', fontWeight: 600, color: '#01696f', textTransform: 'uppercase', letterSpacing: '.05em' },
  date: { fontSize: '.75rem', color: '#bab9b4' },
  title: { fontSize: 'clamp(1.375rem, 1rem + 1.5vw, 1.875rem)', fontWeight: 800, color: '#28251d', lineHeight: 1.25, marginBottom: '1rem' },
  authorRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' },
  authorInfo: { display: 'flex', alignItems: 'center', gap: '.5rem' },
  authorAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#e6f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.875rem', fontWeight: 700, color: '#01696f' },
  authorName: { fontSize: '.875rem', color: '#7a7974', fontWeight: 500 },
  likeBtn: { display: 'flex', alignItems: 'center', gap: '.375rem', background: 'none', border: '1.5px solid #d4d1ca', borderRadius: '999px', padding: '.375rem .875rem', cursor: 'pointer', fontSize: '.9375rem', color: '#7a7974', fontWeight: 600, transition: 'all 0.2s' },
  likeBtnActive: { borderColor: '#e05c8a', color: '#e05c8a', background: '#fdf2f7' },
  likeCount: { fontVariantNumeric: 'tabular-nums', fontWeight: 700, minWidth: '1.5ch' },
  description: { fontSize: '1rem', color: '#3d3a32', lineHeight: 1.7, whiteSpace: 'pre-wrap' },
  commentsSection: { background: '#fff', borderRadius: '16px', padding: '1.25rem', margin: '0 0 1rem' },
  commentsTitle: { fontSize: '1rem', fontWeight: 700, color: '#28251d', marginBottom: '1rem' },
  commentForm: { marginBottom: '1.5rem' },
  commentInputWrap: { display: 'flex', gap: '.75rem', marginBottom: '.5rem' },
  commentAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#e6f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.875rem', fontWeight: 700, color: '#01696f', flexShrink: 0 },
  commentTextarea: { flex: 1, padding: '.625rem .875rem', borderRadius: '12px', border: '1px solid #dcd9d5', fontSize: '.9375rem', resize: 'none', fontFamily: 'inherit', outline: 'none' },
  commentError: { fontSize: '.8125rem', color: '#a12c7b', margin: '0 0 .5rem' },
  commentFormFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '44px' },
  commentHint: { fontSize: '.75rem', color: '#bab9b4' },
  commentSubmit: { padding: '.375rem 1rem', borderRadius: '999px', background: '#01696f', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600 },
  loginPrompt: { textAlign: 'center', padding: '1rem', marginBottom: '1rem' },
  loginPromptLink: { color: '#01696f', fontWeight: 600, textDecoration: 'none' },
  noComments: { textAlign: 'center', padding: '2rem 1rem', color: '#bab9b4', fontSize: '.9375rem' },
  commentsList: { display: 'flex', flexDirection: 'column', gap: '.75rem' },
  commentItem: { display: 'flex', gap: '.75rem' },
  commentBody: { flex: 1 },
  commentHeader: { display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem' },
  commentAuthor: { fontSize: '.875rem', fontWeight: 600, color: '#28251d' },
  commentDate: { fontSize: '.75rem', color: '#bab9b4' },
  commentText: { margin: 0, fontSize: '.9375rem', color: '#3d3a32', lineHeight: 1.6 },
};

export const dynamic = 'force-dynamic';