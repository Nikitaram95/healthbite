"use client";

import { useEffect, useState, useCallback } from 'react';
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

const API = process.env.NEXT_PUBLIC_API_URL || 'https://your-api-gateway-url';

export default function PostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, getToken } = useAuth();
  
  // Post state
  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  
  // Likes state
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  
  const userId = user?.id || 'anonymous';

  // Загрузка поста
  useEffect(() => {
    if (!id) return;
    loadPost();
    loadComments();
    loadLikeStatus();
  }, [id]);

  async function loadPost() {
    setLoadingPost(true);
    try {
      const res = await fetch(`${API}/posts/${id}`);
      if (!res.ok) {
        router.push('/posts');
        return;
      }
      const data = await res.json();
      setPost(data);
    } catch (e) {
      console.error('Load post error:', e);
    } finally {
      setLoadingPost(false);
    }
  }

  // Загрузка комментариев
  async function loadComments() {
    try {
      const res = await fetch(`${API}/posts/${id}/comments`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Load comments error:', e);
    }
  }

  // Загрузка статуса лайка
  async function loadLikeStatus() {
    try {
      const token = getToken();
      const res = await fetch(`${API}/posts/${id}/like?userId=${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      setLiked(data.isLiked || false);
      setLikesCount(data.likes || 0);
    } catch (e) {
      console.error('Load like status error:', e);
    }
  }

  // Toggle лайк
  async function handleLike() {
    try {
      const token = getToken();
      const res = await fetch(`${API}/posts/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId })
      });
      
      if (!res.ok) throw new Error('Like failed');
      
      const data = await res.json();
      setLiked(data.isLiked);
      setLikesCount(data.likes);
    } catch (e) {
      console.error('Like error:', e);
    }
  }

  // Отправка коммента
  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    setSendingComment(true);
    setCommentError('');
    
    try {
      const token = getToken();
      const res = await fetch(`${API}/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          text: commentText.trim(),
          author: user?.name || user?.phone || 'anonymous'
        })
      });
      
      if (!res.ok) throw new Error('Comment failed');
      
      setCommentText('');
      await loadComments(); // Перезагружаем список
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
      {/* Header */}
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

      {/* Main content */}
      <main style={styles.main}>
        <article style={styles.article}>
          {/* Media */}
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
              <iframe 
                src={post.mediaurl}
                style={styles.iframe}
                allowFullScreen
                title={post.title}
              />
            </div>
          )}

          {/* Content */}
          <div style={styles.content}>
            {/* Meta */}
            <div style={styles.meta}>
              <span style={styles.cat}>{post.categoryid}</span>
              <span style={styles.date}>{post.createdat}</span>
            </div>

            {/* Title */}
            <h1 style={styles.title}>{post.title}</h1>

            {/* Author + Like button */}
            <div style={styles.authorRow}>
              <div style={styles.authorInfo}>
                <div style={styles.authorAvatar}>
                  {post.author.slice(0, 1).toUpperCase()}
                </div>
                <span style={styles.authorName}>{post.author}</span>
              </div>
              
              {/* 🔥 ЛАЙК КНОПКА */}
              <button 
                style={{
                  ...styles.likeBtn,
                  ...(liked ? styles.likeBtnActive : {})
                }}
                onClick={handleLike}
                aria-label={liked ? 'Убрать лайк' : 'Поставить лайк'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>{liked ? 'Unlike' : 'Like'}</span>
                <span style={styles.likeCount}>{likesCount}</span>
              </button>
            </div>

            {/* Description */}
            <div style={styles.description}>{post.description}</div>
          </div>
        </article>

        {/* Comments */}
        <section style={styles.commentsSection}>
          <h2 style={styles.commentsTitle}>
            Комментарии {comments.length > 0 && `(${comments.length})`}
          </h2>

          {/* Comment form */}
          {user ? (
            <form onSubmit={handleComment} style={styles.commentForm}>
              <div style={styles.commentInputWrap}>
                <div style={styles.commentAvatar}>
                  {(user.name || user.phone || 'A').slice(0, 1).toUpperCase()}
                </div>
                <textarea
                  placeholder="Напиши комментарий..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={2}
                  maxLength={500}
                  style={styles.commentTextarea}
                  onKeyDown={(e) => {
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

          {/* Comments list */}
          {comments.length === 0 ? (
            <div style={styles.noComments}>Пока нет комментариев</div>
          ) : (
            <div style={styles.commentsList}>
              {comments.map((c) => (
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

// Стили (твои + новые для лайков)
const styles: Record<string, React.CSSProperties> = {
  page: { 
    minHeight: '100dvh', 
    background: '#f7f6f2', 
    fontFamily: 'system-ui, sans-serif' 
  },
  loadingPage: { 
    minHeight: '100dvh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: '#f7f6f2', 
    color: '#01696f' 
  },
  header: { 
    background: '#fff', 
    borderBottom: '1px solid #e8e6e1', 
    position: 'sticky', 
    top: 0, 
    zIndex: 100 
  },
  headerInner: { 
    maxWidth: '720px', 
    margin: '0 auto', 
    padding: '0 1rem', 
    height: '56px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  back: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '.25rem', 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer', 
    fontSize: '.875rem', 
    color: '#7a7974' 
  },
  logoLink: { textDecoration: 'none' },
  main: { 
    maxWidth: '720px', 
    margin: '0 auto', 
    padding: '0 0 4rem' 
  },
  article: { 
    background: '#fff', 
    borderRadius: '0 0 16px 16px', 
    overflow: 'hidden', 
    marginBottom: '1rem' 
  },
  heroImg: { 
    width: '100%', 
    maxHeight: '420px', 
    objectFit: 'cover', 
    display: 'block' 
  },
  videoWrap: { 
    position: 'relative', 
    paddingBottom: '56.25%', 
    height: 0 
  },
  iframe: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%', 
    border: 'none' 
  },
  content: { 
    padding: '1.5rem 1.25rem 1.25rem' 
  },
  meta: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '.75rem', 
    marginBottom: '.75rem' 
  },
  cat: { 
    fontSize: '.75rem', 
    fontWeight: 600, 
    color: '#01696f', 
    textTransform: 'uppercase' as const, 
    letterSpacing: '.05em' 
  },
  date: { 
    fontSize: '.75rem', 
    color: '#bab9b4' 
  },
  title: { 
    fontSize: 'clamp(1.375rem, 1rem + 1.5vw, 1.875rem)', 
    fontWeight: 800, 
    color: '#28251d', 
    lineHeight: 1.25, 
    marginBottom: '1rem' 
  },
  authorRow: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: '1.25rem' 
  },
  authorInfo: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '.5rem' 
  },
  authorAvatar: { 
    width: '32px', 
    height: '32px', 
    borderRadius: '50%', 
    background: '#e6f0f0', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '.875rem', 
    fontWeight: 700, 
    color: '#01696f' 
  },
  authorName: { 
    fontSize: '.875rem', 
    color: '#7a7974', 
    fontWeight: 500 
  },
  // 🔥 НОВЫЕ СТИЛИ ДЛЯ ЛАЙКОВ
  likeBtn: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '.375rem', 
    background: 'none', 
    border: '1.5px solid #d4d1ca', 
    borderRadius: '999px', 
    padding: '.375rem .875rem', 
    cursor: 'pointer', 
    fontSize: '.9375rem', 
    color: '#7a7974', 
    fontWeight: 600,
    transition: 'all 0.2s'
  },
  likeBtnActive: { 
    borderColor: '#e05c8a', 
    color: '#e05c8a', 
    background: '#fdf2f7' 
  },
  likeCount: { 
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 700,
    minWidth: '1.5ch'
  },
  description: { 
    fontSize: '1rem', 
    color: '#3d3a32', 
    lineHeight: 1.7, 
    whiteSpace: 'pre-wrap' as const 
  },
  // ... остальные твои стили для comments
};

export const dynamic = 'force-dynamic';