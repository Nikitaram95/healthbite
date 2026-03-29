'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PostPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
    fetchComments();
    fetchLikes();
  }, [id]);

  async function fetchPost() {
    try {
      const res = await fetch(`${API_URL}/posts/${id}`);
      const data = await res.json();
      setPost(data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchComments() {
    try {
      const res = await fetch(`${API_URL}/comments?postid=${id}`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function fetchLikes() {
    try {
      const res = await fetch(`${API_URL}/likes?postid=${id}`);
      const data = await res.json();
      setLikes(data.count || 0);
    } catch {}
  }

  async function handleLike() {
    if (liked) return;
    setLiked(true);
    setLikes(l => l + 1);
    try {
      await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', postid: id }),
      });
    } catch {}
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    const text = commentText;
    setCommentText('');
    try {
      await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment', postid: id, text, author: 'Аноним' }),
      });
      fetchComments();
    } catch {}
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#7a7974' }}>Загрузка...</div>
  );

  if (!post) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#7a7974' }}>Пост не найден</div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'sans-serif' }}>
      {/* Шапка */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e2dc', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#7a7974' }}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#01696f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>Hb</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Healtbite</div>
            <div style={{ fontSize: 12, color: '#7a7974' }}>здоровые привычки и ИИ-поддержка</div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px' }}>
        {/* Пост */}
        <article style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e2dc', overflow: 'hidden', marginBottom: 24 }}>
          {post.mediaurl && post.type === 'image' && (
            <img src={post.mediaurl} alt={post.title} style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }} />
          )}
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#01696f', background: '#cedcd8', borderRadius: 4, padding: '2px 8px' }}>{post.categoryid}</span>
              <span style={{ fontSize: 12, color: '#bab9b4' }}>{post.createdat ? new Date(post.createdat).toLocaleDateString('ru-RU') : ''}</span>
            </div>
            {post.title && <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: 12, color: '#28251d', lineHeight: 1.3 }}>{post.title}</h1>}
            <p style={{ fontSize: 16, lineHeight: 1.7, color: '#28251d', margin: 0 }}>{post.description}</p>

            {/* Лайк */}
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleLike}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 20, border: '1px solid #e5e2dc',
                  background: liked ? '#fde8f0' : '#fff', cursor: liked ? 'default' : 'pointer',
                  color: liked ? '#a12c7b' : '#7a7974', fontWeight: 600, fontSize: 14,
                  transition: 'all 0.2s',
                }}
              >
                {liked ? '❤️' : '🤍'} {likes}
              </button>
              <span style={{ fontSize: 14, color: '#bab9b4' }}>
                {comments.length} комментариев
              </span>
            </div>
          </div>
        </article>

        {/* Форма комментария */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e2dc', padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#28251d' }}>Оставить комментарий</h2>
          <form onSubmit={handleComment}>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Напишите комментарий..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d4d1ca', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 10, fontFamily: 'inherit' }}
            />
            <button type="submit" style={{ background: '#01696f', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              Отправить
            </button>
          </form>
        </div>

        {/* Комментарии */}
        {comments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#28251d', margin: 0 }}>Комментарии</h2>
            {comments.map(c => (
              <div key={c.commentid} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e2dc', padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#28251d' }}>{c.author || 'Аноним'}</span>
                  <span style={{ fontSize: 12, color: '#bab9b4' }}>{c.createdat ? new Date(c.createdat).toLocaleDateString('ru-RU') : ''}</span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: '#7a7974', margin: 0 }}>{c.text}</p>
              </div>
            ))}
          </div>
        )}

        {comments.length === 0 && (
          <div style={{ textAlign: 'center', color: '#bab9b4', padding: '24px 0', fontSize: 14 }}>
            Будьте первым, кто оставит комментарий 💬
          </div>
        )}
      </div>
    </div>
  );
}